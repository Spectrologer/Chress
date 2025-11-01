// @ts-check
/**
 * ZoneGenerationOrchestrator - Handles zone generation and loading logic
 *
 * Extracted from ZoneManager to reduce file size.
 * Manages the full zone lifecycle from generation to entity initialization.
 */

import { GRID_SIZE, TILE_TYPES } from '../core/constants/index.js';
import { logger } from '../core/logger.ts';
import { boardLoader } from '../core/BoardLoader.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { isTileObjectWithProperty, isPitfall } from '../utils/TypeChecks.js';

export class ZoneGenerationOrchestrator {
    /**
     * @param {any} game - The main game instance
     * @param {any} transitionCoordinator - Zone transition coordinator
     */
    constructor(game, transitionCoordinator) {
        this.game = game;
        this.transitionCoordinator = transitionCoordinator;
    }

    /**
     * Generates or loads a zone at the player's current location.
     * Manages the full zone lifecycle from generation to entity initialization.
     *
     * @returns {void}
     */
    generateZone() {
        const currentZone = this.game.player.getCurrentZone();
        const depth = currentZone.depth || (this.game.player.undergroundDepth || 1);
        const zoneKey = createZoneKey(currentZone.x, currentZone.y, currentZone.dimension, depth);

        // Generate chunk connections for current area
        this.game.connectionManager.generateChunkConnections(currentZone.x, currentZone.y);

        // Check if we already have this zone loaded from saved state
        let zoneData;
        const isPortTransition = this.game.lastExitSide === 'port';

        if (this.game.zoneRepository.hasByKey(zoneKey)) {
            zoneData = this.game.zoneRepository.getByKey(zoneKey);
            // Repair zone data if it's missing terrain textures for board-based zones
            zoneData = this._repairBoardZoneData(zoneData, currentZone, zoneKey);
        } else {
            zoneData = this._generateNewZone(currentZone, zoneKey);
        }

        this._applyZoneData(zoneData);
        this._handleNewGameSpawn(zoneData);
        this._patchEmergenceTiles();
        this._filterDefeatedEnemies(zoneData);
        this._syncZoneGeneratorGrid();
    }

    /**
     * Generate a new zone
     * @param {any} currentZone - Current zone coordinates
     * @param {string} zoneKey - Zone key for storage
     * @returns {any} Generated zone data
     * @private
     */
    _generateNewZone(currentZone, zoneKey) {
        const zoneData = this.game.zoneGenerator.generateZone(
            currentZone.x,
            currentZone.y,
            currentZone.dimension,
            this.game.zones,
            this.game.connectionManager.zoneConnections,
            this.game.availableFoodAssets,
            this.game.lastExitSide
        );

        // Defensive: ensure minimal zoneData structure
        if (!zoneData) {
            return {
                grid: this.game.grid || Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
                enemies: [],
                playerSpawn: null
            };
        }

        this._addPortTransitionMetadata(zoneData, currentZone);
        this.game.zoneRepository.setByKey(zoneKey, zoneData);

        return zoneData;
    }

    /**
     * Add port transition metadata to zone data
     * @param {any} zoneData - Zone data to modify
     * @param {any} currentZone - Current zone coordinates
     * @private
     */
    _addPortTransitionMetadata(zoneData, currentZone) {
        const transientState = this.game.transientGameState;
        const portData = transientState.getPortTransitionData();

        if (currentZone.dimension === 1 && portData?.from === 'interior') {
            zoneData.returnToSurface = { x: portData.x, y: portData.y };
        }

        if (currentZone.dimension === 2 && portData && (portData.from === 'hole' || portData.from === 'pitfall')) {
            if (!zoneData.returnToSurface) {
                zoneData.returnToSurface = { x: portData.x, y: portData.y };
            }
        }

        if (currentZone.dimension === 2 && portData && portData.from === 'stairdown' && portData.fromDimension === 1) {
            zoneData.returnToInterior = { x: portData.x, y: portData.y, zoneX: currentZone.x, zoneY: currentZone.y };
        }
    }

    /**
     * Apply zone data to game state
     * @param {any} zoneData - Zone data to apply
     * @private
     */
    _applyZoneData(zoneData) {
        this.game.grid = zoneData.grid;

        // Restore terrain textures, overlay textures, rotations, and overlay rotations to zone generator
        if (this.game.zoneGenerator) {
            this.game.zoneGenerator.terrainTextures = zoneData.terrainTextures || {};
            this.game.zoneGenerator.overlayTextures = zoneData.overlayTextures || {};
            this.game.zoneGenerator.rotations = zoneData.rotations || {};
            this.game.zoneGenerator.overlayRotations = zoneData.overlayRotations || {};
        }

        // Initialize gridManager
        if (!this.game.gridManager) {
            this.game.gridManager = this.game._services.get('gridManager');
        } else {
            this.game.gridManager.setGrid(zoneData.grid);
        }

        // Always recreate enemyCollection to ensure it wraps the current array reference
        if (this.game._services) {
            this.game._services._instances.delete('enemyCollection');
        }
        this.game.enemyCollection = this.game._services.get('enemyCollection');

        // Initialize NPC system
        if (!this.game.npcManager) {
            this.game.npcManager = this.game._services.get('npcManager');
        }
        if (!this.game.npcRenderer) {
            this.game.npcRenderer = this.game._services.get('npcRenderer');
        }
        this.game.npcManager.initializeFromGrid();
    }

    /**
     * Handle new game spawn positioning
     * @param {any} zoneData - Zone data
     * @private
     */
    _handleNewGameSpawn(zoneData) {
        if (!this.game.lastExitSide && zoneData.playerSpawn) {
            this.game._newGameSpawnPosition = { ...zoneData.playerSpawn };

            let offScreenX = zoneData.playerSpawn.x;
            let offScreenY = zoneData.playerSpawn.y;

            if (zoneData.playerSpawn.y === 0) {
                offScreenY = -1;
            } else if (zoneData.playerSpawn.y === GRID_SIZE - 1) {
                offScreenY = GRID_SIZE;
            } else if (zoneData.playerSpawn.x === 0) {
                offScreenX = -1;
            } else if (zoneData.playerSpawn.x === GRID_SIZE - 1) {
                offScreenX = GRID_SIZE;
            }

            this.game.playerFacade.setPosition(offScreenX, offScreenY);
        }
    }

    /**
     * Patch emergence tiles for port transitions
     * @private
     */
    _patchEmergenceTiles() {
        const gridManager = this.game.gridManager;
        const transientState = this.game.transientGameState;

        try {
            const portData = transientState.getPortTransitionData();
            if (this.game.lastExitSide === 'port' && portData) {
                const px = portData.x;
                const py = portData.y;
                const from = portData.from;

                if (isWithinGrid(px, py)) {
                    const existing = gridManager.getTile(px, py);

                    if (from === 'stairdown') {
                        if (!isTileObjectWithProperty(existing, TILE_TYPES.PORT, 'portKind', 'stairup')) {
                            gridManager.setTile(px, py, { type: TILE_TYPES.PORT, portKind: 'stairup' });
                        }
                    } else if (from === 'stairup') {
                        if (!isTileObjectWithProperty(existing, TILE_TYPES.PORT, 'portKind', 'stairdown')) {
                            gridManager.setTile(px, py, { type: TILE_TYPES.PORT, portKind: 'stairdown' });
                        }
                    } else if (from === 'cistern') {
                        const belowTile = gridManager.getTile(px, py + 1);
                        if (belowTile !== undefined && belowTile !== TILE_TYPES.CISTERN) {
                            this.transitionCoordinator.validateAndSetTile(this.game.grid, px, py + 1, TILE_TYPES.CISTERN);
                        }
                    } else if (from === 'hole' || from === 'pitfall') {
                        const isPrimitivePitfall = isPitfall(existing) || existing === TILE_TYPES.HOLE;
                        if (isPrimitivePitfall) {
                            gridManager.setTile(px, py, { type: TILE_TYPES.PORT, portKind: 'stairup' });
                            try { logger.debug && logger.debug(`Placed stairup at surface (${px},${py}) from ${from}`); } catch (e) {}
                        } else {
                            try { logger.debug && logger.debug(`Did not place stairup at (${px},${py}) - existing tile prevents conversion.`); } catch (e) {}
                        }
                    }
                }
            }
        } catch (e) { /* non-fatal */ }
    }

    /**
     * Filter out defeated enemies when loading zones
     * @param {any} zoneData - Zone data with enemies
     * @private
     */
    _filterDefeatedEnemies(zoneData) {
        const enemyCollection = this.game.enemyCollection;
        const allEnemies = (zoneData.enemies || []).map(e => new this.game.Enemy(e));
        const livingEnemies = allEnemies.filter(enemy => {
            const defeatedKey = `${enemy.id}`;
            return !this.game.defeatedEnemies.has(defeatedKey);
        });
        enemyCollection.replaceAll(livingEnemies, false);
    }

    /**
     * Ensure zoneGenerator.grid points to the game grid
     * @private
     */
    _syncZoneGeneratorGrid() {
        this.game.zoneGenerator.grid = this.game.grid;
    }

    /**
     * Repair zone data for board-based zones that are missing terrain textures
     * This fixes saves created before the InteriorHandler fix
     * @param {any} zoneData - Zone data to check/repair
     * @param {any} currentZone - Current zone coordinates
     * @param {string} zoneKey - Zone key for storage
     * @returns {any} Repaired zone data
     * @private
     */
    _repairBoardZoneData(zoneData, currentZone, zoneKey) {
        // Check if this zone should use a board and is missing terrain textures
        const hasBoard = boardLoader.hasBoard(currentZone.x, currentZone.y, currentZone.dimension);

        if (hasBoard && (!zoneData.terrainTextures || Object.keys(zoneData.terrainTextures).length === 0)) {
            // This zone uses a board but is missing terrain textures - regenerate them
            const boardData = boardLoader.getBoardSync(currentZone.x, currentZone.y, currentZone.dimension);
            if (boardData) {
                const result = boardLoader.convertBoardToGrid(boardData, this.game.availableFoodAssets);
                // Merge the terrain textures, overlays, rotations, and overlay rotations into the existing zone data
                zoneData.terrainTextures = result.terrainTextures;
                zoneData.overlayTextures = result.overlayTextures;
                zoneData.rotations = result.rotations;
                zoneData.overlayRotations = result.overlayRotations;
                // Update playerSpawn if it was missing
                if (!zoneData.playerSpawn && result.playerSpawn) {
                    zoneData.playerSpawn = result.playerSpawn;
                }
                // Save the repaired zone data
                this.game.zoneRepository.setByKey(zoneKey, zoneData);
                console.log(`[ZoneRepair] Fixed missing terrain textures for zone ${zoneKey}`);
            }
        }

        return zoneData;
    }
}
