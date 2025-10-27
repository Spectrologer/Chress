import { TILE_TYPES, GRID_SIZE } from './constants/index.js';
import { logger } from './logger.js';
import { ZoneStateManager } from '../generators/ZoneStateManager.js';
import { FeatureGenerator } from '../generators/FeatureGenerator.js';
import { ItemGenerator } from '../generators/ItemGenerator.js';
import { StructureGenerator } from '../generators/StructureGenerator.js';
import { EnemyGenerator } from '../generators/EnemyGenerator.js';
import { PathGenerator } from '../generators/PathGenerator.js';
import { initializeGrid, validateAndSetTile } from '../generators/GeneratorUtils.js';
import { findValidPlayerSpawn as _findValidPlayerSpawn, isTileFree as _isTileFree, findOpenNpcSpawn as _findOpenNpcSpawn } from './zoneSpawnManager.js';
import { generateExits as _generateExits, clearPathToExit as _clearPathToExit, clearPathToCenter as _clearPathToCenter, clearZoneForShackOnly as _clearZoneForShackOnly, forcePlaceShackInCenter as _forcePlaceShackInCenter } from './zoneMutators.js';
import { addRegionNotes as _addRegionNotes } from './regionNotes.js';
import { handleInterior } from './handlers/interiorHandler.js';
import { handleUnderground } from './handlers/undergroundHandler.js';
import { handleSurface } from './handlers/surfaceHandler.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';

export class ZoneGenerator {

    constructor(game) {
        this.game = game;
        this.grid = null;
        this.enemies = null;
        this.currentZoneX = null;
        this.currentZoneY = null;
        this.playerSpawn = null; // {x, y}
        // Initialize item locations if they haven't been set for this session
        ZoneStateManager.initializeItemLocations();
    }
    /**
     * Find a valid spawn tile for the player that is not occupied by an enemy, item, or impassable tile.
     * Returns {x, y} or null if none found.
     */
    findValidPlayerSpawn() {
        return _findValidPlayerSpawn(this);
    }

    /**
     * Checks if a tile is free for player spawn (not occupied, not impassable)
     */
    isTileFree(x, y) {
        return _isTileFree(this, x, y);
    }

    generateZone(zoneX, zoneY, dimension, existingZones, zoneConnections, foodAssets, exitSide) {
        this.foodAssets = foodAssets || [];
        this.currentZoneX = zoneX;
        this.currentZoneY = zoneY;
        this.currentDimension = dimension;

        // Check if this zone already exists (include dimension and depth for underground)
        const depth = this.game.player.currentZone.depth || (this.game.player.undergroundDepth || 1);
        const zoneKey = createZoneKey(zoneX, zoneY, dimension, depth);
        if (existingZones.has(zoneKey)) {
            return existingZones.get(zoneKey);
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
    findValidPlayerSpawn(avoidEntrance = false) {
        return _findValidPlayerSpawn(this, avoidEntrance);
    }

    initialize() {
        // Initialize grid with floor tiles using safe initialization
        this.grid = initializeGrid();
        this.enemies = [];
        this.addWallBorders();
    }

    addWallBorders() {
        // Add some walls around the borders
        for (let i = 0; i < GRID_SIZE; i++) {
            this.grid[0][i] = TILE_TYPES.WALL; // Top border
            this.grid[GRID_SIZE - 1][i] = TILE_TYPES.WALL; // Bottom border
            this.grid[i][0] = TILE_TYPES.WALL; // Left border
            this.grid[i][GRID_SIZE - 1] = TILE_TYPES.WALL; // Right border
        }
    }

    addRegionNotes(zoneKey, structureGenerator) {
        return _addRegionNotes(zoneKey, structureGenerator, this.currentZoneX, this.currentZoneY);
    }

    generateExits(zoneX, zoneY, zoneConnections, featureGenerator, zoneLevel) {
        return _generateExits(this, zoneX, zoneY, zoneConnections, featureGenerator, zoneLevel);
    }

    clearPathToExit(exitX, exitY) {
        return _clearPathToExit(this, exitX, exitY);
    }

    clearPathToCenter(startX, startY) {
        return _clearPathToCenter(this, startX, startY);
    }

    /**
     * Finds a walkable tile with a minimum number of adjacent walkable tiles.
     * @param {number} requiredNeighbors - The minimum number of walkable neighbors.
     * @returns {{x, y}|null}
     */
    findOpenNpcSpawn(requiredNeighbors) {
        return _findOpenNpcSpawn(this, requiredNeighbors);
    }

    /**
     * Clears all features from the zone except exits, leaving only floor tiles.
     * Used for the first wilds zone to ensure the shack spawns reliably.
     */
    clearZoneForShackOnly() {
        return _clearZoneForShackOnly(this);
    }

    /**
     * Forces the placement of a 3x3 shack structure near the center of the grid.
     * This is used for the special first Wilds zone.
     * @param {number} zoneX - The x-coordinate of the zone.
     * @param {number} zoneY - The y-coordinate of the zone.
     * @returns {boolean} - True if the shack was placed successfully.
     */
    forcePlaceShackInCenter(zoneX, zoneY) {
        // Since the zone is cleared, we can place it near the center.
        // Center is (4,4). A 3x3 shack would be from (3,3) to (5,5).
        const startX = 3;
        const startY = 3;

        return _forcePlaceShackInCenter(this, zoneX, zoneY);
    }
}
