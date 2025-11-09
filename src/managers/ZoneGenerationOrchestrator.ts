/**
 * ZoneGenerationOrchestrator - Handles zone generation and loading logic
 *
 * Extracted from ZoneManager to reduce file size.
 * Manages the full zone lifecycle from generation to entity initialization.
 */

import { GRID_SIZE, TILE_TYPES } from '@core/constants/index';
import { logger } from '@core/logger';
import { boardLoader } from '@core/BoardLoader';
import { createZoneKey } from '@utils/ZoneKeyUtils';
import { isWithinGrid } from '@utils/GridUtils';
import { isTileObjectWithProperty, isPitfall } from '@utils/TypeChecks';
import { Position } from '@core/Position';
import type { Coordinates } from '@core/PositionTypes';
import type { Game } from '@core/game';
import type { ZoneTransitionCoordinator } from './ZoneTransitionCoordinator';
import type { Grid, Tile } from '@core/SharedTypes';
import type { Enemy } from '@entities/Enemy';

interface EnemyData extends Coordinates {
    enemyType: string;
    health: number;
    id: string;
}

interface ZoneInfo extends Coordinates {
    dimension: number;
    depth?: number;
}

interface ZoneData {
    grid: Grid;
    enemies: EnemyData[];
    playerSpawn: Position | null;
    terrainTextures?: Record<string, string>;
    overlayTextures?: Record<string, string>;
    rotations?: Record<string, number>;
    overlayRotations?: Record<string, number>;
    returnToSurface?: Position;
    returnToInterior?: Coordinates & { zoneX: number; zoneY: number };
    metadata?: {
        playerSpawn?: Position;
    };
    treasures?: Array<{ type: string; x: number; y: number }>;
}

interface PortTransitionData {
    from?: string;
    x?: number;
    y?: number;
    fromDimension?: number;
    returnToInterior?: boolean;
}

export class ZoneGenerationOrchestrator {
    private game: Game;
    private transitionCoordinator: ZoneTransitionCoordinator;

    constructor(game: Game, transitionCoordinator: ZoneTransitionCoordinator) {
        this.game = game;
        this.transitionCoordinator = transitionCoordinator;
    }

    /**
     * Generates or loads a zone at the player's current location.
     * Manages the full zone lifecycle from generation to entity initialization.
     */
    public generateZone(): void {
        if (!this.game.player || !this.game.playerFacade) {
            logger.warn('[ZoneGenerationOrchestrator] Cannot generate zone: player is null');
            return;
        }

        const currentZone = this.game.playerFacade.getCurrentZone();
        const depth = currentZone.depth || (this.game.playerFacade.getUndergroundDepth() || 1);
        const zoneKey = createZoneKey(currentZone.x, currentZone.y, currentZone.dimension, depth);

        // Generate chunk connections for current area
        if (this.game.connectionManager) {
            this.game.connectionManager.generateChunkConnections(currentZone.x, currentZone.y);
        }

        // Check if we already have this zone loaded from saved state
        let zoneData: ZoneData;
        const isPortTransition = this.game.lastExitSide === 'port';

        if (this.game.zoneRepository.hasByKey(zoneKey)) {
            zoneData = this.game.zoneRepository.getByKey(zoneKey) as ZoneData;
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
     */
    private _generateNewZone(currentZone: ZoneInfo, zoneKey: string): ZoneData {
        if (!this.game.zoneGenerator) {
            throw new Error('Zone generator not initialized');
        }

        const zoneData = this.game.zoneGenerator.generateZone(
            currentZone.x,
            currentZone.y,
            currentZone.dimension,
            this.game.world.zones,
            this.game.connectionManager?.zoneConnections || new Map(),
            this.game.availableFoodAssets || [],
            this.game.lastExitSide || null
        );

        // Defensive: ensure minimal zoneData structure
        if (!zoneData) {
            return {
                grid: this.game.grid || Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)) as Grid,
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
     */
    private _addPortTransitionMetadata(zoneData: ZoneData, currentZone: ZoneInfo): void {
        const transientState = this.game.transientGameState;
        const portData = transientState.getPortTransitionData() as PortTransitionData | undefined;

        if (currentZone.dimension === 1 && portData?.from === 'interior') {
            zoneData.returnToSurface = Position.from({ x: portData.x!, y: portData.y! });
        }

        if (currentZone.dimension === 2 && portData && (portData.from === 'hole' || portData.from === 'pitfall')) {
            if (!zoneData.returnToSurface) {
                zoneData.returnToSurface = Position.from({ x: portData.x!, y: portData.y! });
            }
        }

        if (currentZone.dimension === 2 && portData && portData.from === 'stairdown' && portData.fromDimension === 1) {
            zoneData.returnToInterior = { x: portData.x!, y: portData.y!, zoneX: currentZone.x, zoneY: currentZone.y };
        }
    }

    /**
     * Apply zone data to game state
     */
    private _applyZoneData(zoneData: ZoneData): void {
        this.game.grid = zoneData.grid;

        // Restore terrain textures, overlay textures, rotations, and overlay rotations to zone generator
        if (this.game.zoneGenerator) {
            this.game.zoneGenerator.terrainTextures = zoneData.terrainTextures || {};
            this.game.zoneGenerator.overlayTextures = zoneData.overlayTextures || {};
            this.game.zoneGenerator.rotations = zoneData.rotations || {};
            this.game.zoneGenerator.overlayRotations = zoneData.overlayRotations || {};
        }

        // Initialize gridManager
        if (!this.game.gridManager && this.game._services) {
            const gridManager = this.game._services.get('gridManager');
            if (gridManager && 'setGrid' in gridManager) {
                this.game.gridManager = gridManager;
            }
        }
        if (this.game.gridManager) {
            this.game.gridManager.setGrid(zoneData.grid);
        }

        // Always recreate enemyCollection to ensure it wraps the current array reference
        if (this.game._services) {
            // Force refresh of enemy collection by accessing internal instances
            const services = this.game._services;
            if (services && '_instances' in services) {
                const instances = (services as { _instances?: Map<string, unknown> })._instances;
                if (instances && typeof instances.delete === 'function') {
                    instances.delete('enemyCollection');
                }
            }
            this.game.enemyCollection = this.game._services.get('enemyCollection');
        }

        // Initialize NPC system
        if (!this.game.npcManager && this.game._services) {
            this.game.npcManager = this.game._services.get('npcManager');
        }
        if (!this.game.npcRenderer && this.game._services) {
            const npcRenderer = this.game._services.get('npcRenderer');
            if (npcRenderer && 'render' in npcRenderer) {
                this.game.npcRenderer = npcRenderer;
            }
        }
        if (this.game.npcManager) {
            this.game.npcManager.initializeFromGrid();
        }
    }

    /**
     * Handle new game spawn positioning
     */
    private _handleNewGameSpawn(zoneData: ZoneData): void {
        if (!this.game.player || !this.game.playerFacade) {
            return;
        }

        const lastExitSide = this.game.lastExitSide;
        const currentZone = this.game.playerFacade.getCurrentZone();
        const CUSTOM_BOARD_DIMENSION = 3;

        // Use playerSpawn if:
        // 1. This is a new game (no lastExitSide), OR
        // 2. We're entering a custom board (dimension 3)
        const shouldUsePlayerSpawn = (!lastExitSide || currentZone.dimension === CUSTOM_BOARD_DIMENSION) && zoneData.playerSpawn;

        if (shouldUsePlayerSpawn && zoneData.playerSpawn) {
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
     */
    private _patchEmergenceTiles(): void {
        const gridManager = this.game.gridManager;
        if (!gridManager) {
            return;
        }

        const transientState = this.game.transientGameState;
        const lastExitSide = this.game.lastExitSide;

        try {
            const portData = transientState.getPortTransitionData() as PortTransitionData | undefined;
            if (lastExitSide === 'port' && portData) {
                const px = portData.x;
                const py = portData.y;
                const from = portData.from;

                if (px !== undefined && py !== undefined && isWithinGrid(px, py)) {
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
                        if (belowTile !== undefined && belowTile !== TILE_TYPES.CISTERN && this.game.grid) {
                            this.transitionCoordinator.validateAndSetTile(this.game.grid, px, py + 1, TILE_TYPES.CISTERN);
                        }
                    } else if (from === 'hole' || from === 'pitfall') {
                        const isPrimitivePitfall = isPitfall(existing) || existing === TILE_TYPES.HOLE;
                        if (isPrimitivePitfall) {
                            gridManager.setTile(px, py, { type: TILE_TYPES.PORT, portKind: 'stairup' });
                            try { logger.debug && logger.debug(`Placed stairup at surface (${px},${py}) from ${from}`); } catch (e) {
                                logger.warn('[ZoneGenerationOrchestrator] Logger debug failed:', e);
                            }
                        } else {
                            try { logger.debug && logger.debug(`Did not place stairup at (${px},${py}) - existing tile prevents conversion.`); } catch (e) {
                                logger.warn('[ZoneGenerationOrchestrator] Logger debug failed:', e);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            logger.warn('[ZoneGenerationOrchestrator] Port transition patch error (non-fatal):', e);
        }
    }

    /**
     * Filter out defeated enemies when loading zones
     */
    private _filterDefeatedEnemies(zoneData: ZoneData): void {
        const enemyCollection = this.game.enemyCollection;
        if (!enemyCollection || !this.game.Enemy) {
            return;
        }

        const EnemyClass = this.game.Enemy;
        const defeatedEnemies = this.game.defeatedEnemies;

        const allEnemies = (zoneData.enemies || []).map((e: EnemyData) => new EnemyClass(e));
        const livingEnemies = allEnemies.filter((enemy: Enemy) => {
            if (!enemy.id) return true; // Include enemies without id
            const defeatedKey = `${enemy.id}`;
            return !defeatedEnemies.has(defeatedKey);
        });
        enemyCollection.replaceAll(livingEnemies, false);
    }

    /**
     * Ensure zoneGenerator.grid points to the game grid
     */
    private _syncZoneGeneratorGrid(): void {
        if (!this.game.grid || !this.game.zoneGenerator) {
            return;
        }

        this.game.zoneGenerator.grid = this.game.grid;
    }

    /**
     * Repair zone data for board-based zones that are missing terrain textures
     * This fixes saves created before the InteriorHandler fix
     */
    private _repairBoardZoneData(zoneData: ZoneData, currentZone: ZoneInfo, zoneKey: string): ZoneData {
        // Check if this zone should use a board and is missing terrain textures
        const hasBoard = boardLoader.hasBoard(currentZone.x, currentZone.y, currentZone.dimension);

        if (hasBoard && (!zoneData.terrainTextures || Object.keys(zoneData.terrainTextures).length === 0)) {
            // This zone uses a board but is missing terrain textures - regenerate them
            const boardData = boardLoader.getBoardSync(currentZone.x, currentZone.y, currentZone.dimension);
            if (boardData) {
                const result = boardLoader.convertBoardToGrid(boardData, this.game.availableFoodAssets || []);
                // Merge the terrain textures, overlays, rotations, and overlay rotations into the existing zone data
                zoneData.terrainTextures = result.terrainTextures;
                zoneData.overlayTextures = result.overlayTextures;
                zoneData.rotations = result.rotations;
                zoneData.overlayRotations = result.overlayRotations;
                // Update playerSpawn if it was missing
                if (!zoneData.playerSpawn && result.playerSpawn) {
                    zoneData.playerSpawn = Position.from(result.playerSpawn);
                }
                // Save the repaired zone data
                this.game.zoneRepository.setByKey(zoneKey, zoneData);
                logger.log(`[ZoneRepair] Fixed missing terrain textures for zone ${zoneKey}`);
            }
        }

        return zoneData;
    }
}
