import { TILE_TYPES, GRID_SIZE } from './constants/index';
import { logger } from './logger';
import type { Coordinates } from './PositionTypes';
import { ZoneStateManager } from '@generators/ZoneStateManager';
import { FeatureGenerator } from '@generators/FeatureGenerator';
import { ItemGenerator } from '@generators/ItemGenerator';
import { StructureGenerator } from '@generators/StructureGenerator';
import { EnemyGenerator } from '@generators/EnemyGenerator';
import { PathGenerator } from '@generators/PathGenerator';
import { initializeGrid, validateAndSetTile } from '@generators/GeneratorUtils';
import { findValidPlayerSpawn as _findValidPlayerSpawn, isTileFree as _isTileFree, findOpenNpcSpawn as _findOpenNpcSpawn } from './zoneSpawnManager';
import { generateExits as _generateExits, clearPathToExit as _clearPathToExit, clearPathToCenter as _clearPathToCenter, clearZoneForShackOnly as _clearZoneForShackOnly, forcePlaceShackInCenter as _forcePlaceShackInCenter } from './zoneMutators';
import { addRegionNotes as _addRegionNotes } from './regionNotes';
import { handleInterior } from './handlers/InteriorHandler';
import { handleUnderground } from './handlers/UndergroundHandler';
import { handleSurface } from './handlers/SurfaceHandler';
import { createZoneKey } from '@utils/ZoneKeyUtils';
import { boardLoader } from './BoardLoader';
import { GridManager } from '@managers/GridManager';

interface ZoneGeneratorGame {
    player?: { x: number; y: number; currentZone?: { depth?: number }; undergroundDepth?: number; [key: string]: unknown };
    zoneGenState?: { initializeItemLocations: () => void; [key: string]: unknown };
    chessMode?: boolean;
    [key: string]: unknown;
}

export class ZoneGenerator {
    public game: ZoneGeneratorGame;
    public grid: (number | any)[][];
    public gridManager: GridManager | null;
    public enemies: unknown[];
    private currentZoneX: number | null;
    private currentZoneY: number | null;
    private playerSpawn: Coordinates | null;
    public terrainTextures: Record<string, string>;
    public overlayTextures: Record<string, string>;
    public rotations: Record<string, number>;
    public overlayRotations: Record<string, number>;
    public zLayers: Record<string, string>;
    private foodAssets: string[];
    public currentDimension: number;

    constructor(game: ZoneGeneratorGame) {
        this.game = game;
        this.grid = [];
        this.gridManager = null;
        this.enemies = [];
        this.currentZoneX = null;
        this.currentZoneY = null;
        this.playerSpawn = null; // {x, y}
        this.terrainTextures = {}; // Store terrain texture names (e.g., 'clubwall5', 'housetile')
        this.overlayTextures = {}; // Store overlay texture names (e.g., 'trim/bordertrim')
        this.rotations = {}; // Store rotation data for terrain tiles
        this.overlayRotations = {}; // Store rotation data for overlay tiles
        this.zLayers = {}; // Store z-layer data for tiles (e.g., 'above', 'below')
        this.foodAssets = [];
        this.currentDimension = 0;
        // Initialize item locations if they haven't been set for this session
        this.game.zoneGenState?.initializeItemLocations();
    }

    /**
     * Checks if a tile is free for player spawn (not occupied, not impassable)
     */
    isTileFree(x: number, y: number): boolean {
        return _isTileFree(this, x, y);
    }

    generateZone(zoneX: number, zoneY: number, dimension: number, existingZones: Map<string, any>, zoneConnections: any, foodAssets: string[], exitSide?: string): any {
        this.foodAssets = foodAssets || [];
        this.currentZoneX = zoneX;
        this.currentZoneY = zoneY;
        this.currentDimension = dimension;

        // Check if this zone already exists (include dimension and depth for underground)
        const depth = this.game.player?.currentZone?.depth || (this.game.player?.undergroundDepth || 1);
        const zoneKey = createZoneKey(zoneX, zoneY, dimension, depth);
        if (existingZones.has(zoneKey)) {
            return existingZones.get(zoneKey);
        }

        // Check for custom board first (synchronous - boards must be pre-loaded)
        if (boardLoader.hasBoard(zoneX, zoneY, dimension)) {
            // logger.log(`Loading custom board for zone (${zoneX},${zoneY}) dimension ${dimension}`);
            const boardData = boardLoader.getBoardSync(zoneX, zoneY, dimension);
            if (boardData) {
                const result = boardLoader.convertBoardToGrid(boardData, this.foodAssets, this.game.chessMode || false);

                // Store terrain textures, overlay textures, rotations, overlay rotations, and zLayers in the zone generator
                this.terrainTextures = result.terrainTextures || {};
                this.overlayTextures = result.overlayTextures || {};
                this.rotations = result.rotations || {};
                this.overlayRotations = result.overlayRotations || {};
                this.zLayers = result.zLayers || {};

                // logger.log(`Custom board loaded successfully for zone (${zoneX},${zoneY})`);
                return result;
            } else {
                logger.warn(`Custom board not pre-loaded, falling back to procedural generation`);
            }
        }

        // Generate new zone structure
        this.initialize();

        // Handle interior dimension specially
        if (dimension === 1) {
            return handleInterior(this, zoneX, zoneY, this.foodAssets);
        }

        // Handle underground dimension specially
        if (dimension === 2) {
            return handleUnderground(this, zoneX, zoneY, zoneConnections, this.foodAssets, exitSide);
        }

        const zoneLevel = ZoneStateManager.getZoneLevel(zoneX, zoneY);
        const isHomeZone = (zoneX === 0 && zoneY === 0);

        // Surface / default handler
        return handleSurface(this, zoneX, zoneY, zoneConnections, this.foodAssets);
    }

    // Find a valid spawn tile for the player that is not occupied by an enemy, item, or impassable tile.
    // Returns {x, y} or null if none found.
    findValidPlayerSpawn(avoidEntrance: boolean = false): Coordinates | null {
        return _findValidPlayerSpawn(this, avoidEntrance);
    }

    initialize(): void {
        // Initialize grid with floor tiles using safe initialization
        this.grid = initializeGrid();
        this.gridManager = new GridManager(this.grid);
        this.enemies = [];
        this.terrainTextures = {}; // Reset for procedural zones
        this.overlayTextures = {}; // Reset for procedural zones
        this.zLayers = {}; // Reset for procedural zones
        this.rotations = {}; // Reset for procedural zones
        this.overlayRotations = {}; // Reset for procedural zones
        this.addWallBorders();
    }

    addWallBorders(): void {
        if (!this.gridManager) return;
        // Add some walls around the borders
        for (let i = 0; i < GRID_SIZE; i++) {
            this.gridManager.setTile(i, 0, TILE_TYPES.WALL); // Top border
            this.gridManager.setTile(i, GRID_SIZE - 1, TILE_TYPES.WALL); // Bottom border
            this.gridManager.setTile(0, i, TILE_TYPES.WALL); // Left border
            this.gridManager.setTile(GRID_SIZE - 1, i, TILE_TYPES.WALL); // Right border
        }
    }

    addRegionNotes(zoneKey: string, structureGenerator: StructureGenerator): void {
        return _addRegionNotes(zoneKey, structureGenerator, this.currentZoneX!, this.currentZoneY!);
    }

    generateExits(zoneX: number, zoneY: number, zoneConnections: any, featureGenerator: FeatureGenerator, zoneLevel: number): void {
        return _generateExits(this as any, zoneX, zoneY, zoneConnections, featureGenerator, zoneLevel);
    }

    clearPathToExit(exitX: number, exitY: number): void {
        return _clearPathToExit(this as any, exitX, exitY);
    }

    clearPathToCenter(startX: number, startY: number): void {
        return _clearPathToCenter(this as any, startX, startY);
    }

    /**
     * Finds a walkable tile with a minimum number of adjacent walkable tiles.
     * @param {number} requiredNeighbors - The minimum number of walkable neighbors.
     * @returns {{x, y}|null}
     */
    findOpenNpcSpawn(requiredNeighbors: number): Coordinates | null {
        return _findOpenNpcSpawn(this as any, requiredNeighbors);
    }

    /**
     * Clears all features from the zone except exits, leaving only floor tiles.
     * Used for the first wilds zone to ensure the shack spawns reliably.
     */
    clearZoneForShackOnly(): void {
        return _clearZoneForShackOnly(this as any);
    }

    /**
     * Forces the placement of a 3x3 shack structure near the center of the grid.
     * This is used for the special first Wilds zone.
     * @param {number} zoneX - The x-coordinate of the zone.
     * @param {number} zoneY - The y-coordinate of the zone.
     * @returns {boolean} - True if the shack was placed successfully.
     */
    forcePlaceShackInCenter(zoneX: number, zoneY: number): boolean {
        // Since the zone is cleared, we can place it near the center.
        // Center is (4,4). A 3x3 shack would be from (3,3) to (5,5).
        const startX = 3;
        const startY = 3;

        return _forcePlaceShackInCenter(this as any, zoneX, zoneY);
    }
}
