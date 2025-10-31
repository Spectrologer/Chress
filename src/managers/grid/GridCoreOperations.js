// @ts-check
/**
 * GridCoreOperations - Core grid access and validation
 *
 * Provides basic get/set/check operations for grid tiles.
 * Extracted from GridManager to reduce file size.
 */

import { isWithinGrid } from '../../utils/GridUtils.js';
import { getTileType, isTileType, isWalkable as isWalkableTile } from '../../utils/TileUtils.js';
import { logger } from '../../core/logger.js';

/**
 * @typedef {number|Object} Tile
 */

/**
 * @typedef {Array<Array<Tile>>} Grid
 */

export class GridCoreOperations {
    /**
     * @param {Grid} grid - The 2D grid array
     */
    constructor(grid) {
        if (!grid || !Array.isArray(grid)) {
            throw new Error('GridCoreOperations requires a valid grid array');
        }

        /** @type {Grid} */
        this.grid = grid;
    }

    /**
     * Get tile at coordinates (safe access with bounds checking)
     * @param {number} x - X coordinate (column)
     * @param {number} y - Y coordinate (row)
     * @returns {Tile|undefined} The tile at the coordinates, or undefined if out of bounds
     */
    getTile(x, y) {
        if (!isWithinGrid(x, y)) {
            logger.warn(`GridCoreOperations.getTile: coordinates out of bounds (${x}, ${y})`);
            return undefined;
        }
        return this.grid[y][x];
    }

    /**
     * Set tile at coordinates (safe write with bounds checking)
     * @param {number} x - X coordinate (column)
     * @param {number} y - Y coordinate (row)
     * @param {Tile} tile - The tile value or object to set
     * @returns {boolean} True if tile was set successfully
     */
    setTile(x, y, tile) {
        if (!isWithinGrid(x, y)) {
            logger.warn(`GridCoreOperations.setTile: coordinates out of bounds (${x}, ${y})`);
            return false;
        }
        this.grid[y][x] = tile;
        return true;
    }

    /**
     * Check if coordinates are within grid boundaries
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if coordinates are valid
     */
    isWithinBounds(x, y) {
        return isWithinGrid(x, y);
    }

    /**
     * Check if tile at coordinates is walkable
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if tile allows movement
     */
    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        return tile !== undefined && isWalkableTile(tile);
    }

    /**
     * Check if tile at coordinates matches a specific type
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} tileType - TILE_TYPES value to check
     * @returns {boolean} True if tile matches the type
     */
    isTileType(x, y, tileType) {
        const tile = this.getTile(x, y);
        return tile !== undefined && isTileType(tile, tileType);
    }

    /**
     * Get the type of tile at coordinates (normalized)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number|undefined} The tile type number
     */
    getTileType(x, y) {
        const tile = this.getTile(x, y);
        return getTileType(tile);
    }

    /**
     * Clone a tile at coordinates (creates a shallow copy if object)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Tile|undefined} Copy of the tile
     */
    cloneTile(x, y) {
        const tile = this.getTile(x, y);
        if (tile === undefined) return undefined;

        // If tile is an object, create shallow copy
        if (typeof tile === 'object' && tile !== null) {
            return { ...tile };
        }

        return tile;
    }

    /**
     * Clear a tile (set to floor)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} floorType - Floor tile type (default: 0)
     * @returns {boolean} True if tile was cleared
     */
    clearTile(x, y, floorType = 0) {
        return this.setTile(x, y, floorType);
    }

    /**
     * Replace the entire grid reference (useful for zone transitions)
     * @param {Grid} newGrid - The new grid to use
     * @returns {void}
     */
    setGrid(newGrid) {
        if (!newGrid || !Array.isArray(newGrid)) {
            throw new Error('GridCoreOperations.setGrid: Invalid grid provided');
        }
        this.grid = newGrid;
    }

    /**
     * Get the raw grid reference (use sparingly, prefer abstraction methods)
     * @returns {Grid} The underlying grid array
     * @deprecated Use GridManager methods instead of direct grid access
     */
    getRawGrid() {
        logger.warn('GridCoreOperations.getRawGrid: Direct grid access detected. Consider using GridManager methods instead.');
        return this.grid;
    }
}
