/**
 * ZoneGenerationOrchestrator - Handles zone generation and loading logic
 *
 * Extracted from ZoneManager to reduce file size.
 * Manages the full zone lifecycle from generation to entity initialization.
 */

import { GRID_SIZE, TILE_TYPES } from '../core/constants/index';
import { logger } from '../core/logger';
import { boardLoader } from '../core/BoardLoader';
import { createZoneKey } from '../utils/ZoneKeyUtils';
import { isWithinGrid } from '../utils/GridUtils';
import { isTileObjectWithProperty, isPitfall } from '../utils/TypeChecks';
import type { Game } from '../core/Game';
import type { ZoneTransitionCoordinator } from './ZoneTransitionCoordinator';
import type { Position } from '../core/Position';
import type { Grid, Tile } from '../core/SharedTypes';

interface EnemyData {
    x: number;
    y: number;
    enemyType: string;
    health: number;
    id: string;
}

interface ZoneInfo {
    x: number;
    y: number;
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
    returnToInterior?: { x: number; y: number; zoneX: number; zoneY: number };
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
        const currentZone = (this.game.player as any).getCurrentZone() as ZoneInfo;
        const depth = currentZone.depth || ((this.game.player as any).undergroundDepth || 1);
        const zoneKey = createZoneKey(currentZone.x, currentZone.y, currentZone.dimension, depth);

        // Generate chunk connections for current area
        (this.game as any).connectionManager.generateChunkConnections(currentZone.x, currentZone.y);

        // Check if we already have this zone loaded from saved state
        let zoneData: ZoneData;
        const isPortTransition = (this.game as any).lastExitSide === 'port';

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
        const zoneGenerator = (this.game as any).zoneGenerator;
        const zones = (this.game as any).zones;
        const connectionManager = (this.game as any).connectionManager;
        const availableFoodAssets = (this.game as any).availableFoodAssets;
        const lastExitSide = (this.game as any).lastExitSide;

        const zoneData = zoneGenerator.generateZone(
            currentZone.x,
            currentZone.y,
            currentZone.dimension,
            zones,
            connectionManager.zoneConnections,
            availableFoodAssets,
            lastExitSide
        );

        // Defensive: ensure minimal zoneData structure
        if (!zoneData) {
            return {
                grid: this.game.grid || Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
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
            zoneData.returnToSurface = { x: portData.x!, y: portData.y! };
        }

        if (currentZone.dimension === 2 && portData && (portData.from === 'hole' || portData.from === 'pitfall')) {
            if (!zoneData.returnToSurface) {
                zoneData.returnToSurface = { x: portData.x!, y: portData.y! };
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
        const zoneGenerator = (this.game as any).zoneGenerator;
        if (zoneGenerator) {
            zoneGenerator.terrainTextures = zoneData.terrainTextures || {};
            zoneGenerator.overlayTextures = zoneData.overlayTextures || {};
            zoneGenerator.rotations = zoneData.rotations || {};
            zoneGenerator.overlayRotations = zoneData.overlayRotations || {};
        }

        // Initialize gridManager
        if (!(this.game as any).gridManager) {
            (this.game as any).gridManager = (this.game as any)._services.get('gridManager');
        } else {
            this.game.gridManager.setGrid(zoneData.grid);
        }

        // Always recreate enemyCollection to ensure it wraps the current array reference
        if ((this.game as any)._services) {
            (this.game as any)._services._instances.delete('enemyCollection');
        }
        (this.game as any).enemyCollection = (this.game as any)._services.get('enemyCollection');

        // Initialize NPC system
        if (!(this.game as any).npcManager) {
            (this.game as any).npcManager = (this.game as any)._services.get('npcManager');
        }
        if (!(this.game as any).npcRenderer) {
            (this.game as any).npcRenderer = (this.game as any)._services.get('npcRenderer');
        }
        (this.game as any).npcManager.initializeFromGrid();
    }

    /**
     * Handle new game spawn positioning
     */
    private _handleNewGameSpawn(zoneData: ZoneData): void {
        const lastExitSide = (this.game as any).lastExitSide;
        if (!lastExitSide && zoneData.playerSpawn) {
            (this.game as any)._newGameSpawnPosition = { ...zoneData.playerSpawn };

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
        const transientState = this.game.transientGameState;
        const lastExitSide = (this.game as any).lastExitSide;

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
     */
    private _filterDefeatedEnemies(zoneData: ZoneData): void {
        const enemyCollection = this.game.enemyCollection;
        const EnemyClass = (this.game as any).Enemy;
        const defeatedEnemies = (this.game as any).defeatedEnemies;

        const allEnemies = (zoneData.enemies || []).map((e: Enemy) => new EnemyClass(e));
        const livingEnemies = allEnemies.filter((enemy: Enemy) => {
            const defeatedKey = `${enemy.id}`;
            return !defeatedEnemies.has(defeatedKey);
        });
        enemyCollection.replaceAll(livingEnemies, false);
    }

    /**
     * Ensure zoneGenerator.grid points to the game grid
     */
    private _syncZoneGeneratorGrid(): void {
        const zoneGenerator = (this.game as any).zoneGenerator;
        zoneGenerator.grid = this.game.grid;
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
                const availableFoodAssets = (this.game as any).availableFoodAssets;
                const result = boardLoader.convertBoardToGrid(boardData, availableFoodAssets);
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
