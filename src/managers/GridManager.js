// @ts-check
import { GRID_SIZE } from '../core/constants/index.js';
import { GridIterator } from '../utils/GridIterator.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { getTileType, isTileType, isWalkable as isWalkableTile } from '../utils/TileUtils.js';
import { logger } from '../core/logger.js';

/**
 * @typedef {number|Object} Tile
 */

/**
 * @typedef {Array<Array<Tile>>} Grid
 */

/**
 * @typedef {Object} TileWithPosition
 * @property {Tile} tile - The tile value
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} NeighborTile
 * @property {Tile} tile - The tile value
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {string} direction - Direction name (e.g., 'up', 'down', 'left', 'right')
 */

/**
 * @typedef {Object} GridIteratorOptions
 * @property {number} [startX] - Start X coordinate
 * @property {number} [endX] - End X coordinate
 * @property {number} [startY] - Start Y coordinate
 * @property {number} [endY] - End Y coordinate
 * @property {boolean} [skipBorders] - Skip border tiles
 */

/**
 * @callback TilePredicate
 * @param {Tile} tile - The tile to test
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if tile matches predicate
 */

/**
 * @callback TileCallback
 * @param {Tile} tile - The tile
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {void}
 */

/**
 * GridManager - Centralized abstraction layer for grid operations
 *
 * Eliminates direct grid[y][x] access patterns scattered across the codebase.
 * Provides a controlled interface for reading, writing, and querying grid state.
 *
 * Benefits:
 * - Single responsibility: All grid operations in one place
 * - Testability: Grid logic can be tested independently
 * - Validation: Boundary checks and error handling in one place
 * - Refactoring: Grid structure changes only affect this class
 * - Type safety: Consistent tile handling and normalization
 *
 * @example
 * // Before: this.game.grid[y][x] = TILE_TYPES.FLOOR;
 * // After:  gridManager.setTile(x, y, TILE_TYPES.FLOOR);
 *
 * @example
 * // Before: const tile = this.game.grid[playerY][playerX];
 * // After:  const tile = gridManager.getTile(playerX, playerY);
 */
export class GridManager {
    /**
     * @param {Grid} grid - The 2D grid array (9x9)
     */
    constructor(grid) {
        if (!grid || !Array.isArray(grid)) {
            throw new Error('GridManager requires a valid grid array');
        }

        /** @type {Grid} */
        this.grid = grid;
    }

    /**
     * Get tile at coordinates (safe access with bounds checking)
     *
     * @param {number} x - X coordinate (column)
     * @param {number} y - Y coordinate (row)
     * @returns {Tile|undefined} The tile at the coordinates, or undefined if out of bounds
     */
    getTile(x, y) {
        if (!isWithinGrid(x, y)) {
            logger.warn(`GridManager.getTile: coordinates out of bounds (${x}, ${y})`);
            return undefined;
        }
        return this.grid[y][x];
    }

    /**
     * Set tile at coordinates (safe write with bounds checking)
     *
     * @param {number} x - X coordinate (column)
     * @param {number} y - Y coordinate (row)
     * @param {Tile} tile - The tile value or object to set
     * @returns {boolean} True if tile was set successfully
     */
    setTile(x, y, tile) {
        if (!isWithinGrid(x, y)) {
            logger.warn(`GridManager.setTile: coordinates out of bounds (${x}, ${y})`);
            return false;
        }
        this.grid[y][x] = tile;
        return true;
    }

    /**
     * Check if coordinates are within grid boundaries
     *
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if coordinates are valid
     */
    isWithinBounds(x, y) {
        return isWithinGrid(x, y);
    }

    /**
     * Check if tile at coordinates is walkable
     *
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
     *
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
     *
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
     *
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
     * Find all tiles matching a predicate
     *
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @param {GridIteratorOptions} [options] - GridIterator options (startX, endX, startY, endY, skipBorders)
     * @returns {Array<TileWithPosition>} Array of matching tiles with coordinates
     *
     * @example
     * // Find all bombs on the grid
     * const bombs = gridManager.findTiles(isBomb);
     */
    findTiles(predicate, options = {}) {
        return GridIterator.findTiles(this.grid, predicate, options);
    }

    /**
     * Find first tile matching a predicate
     *
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @param {GridIteratorOptions} [options] - GridIterator options
     * @returns {TileWithPosition|null} First matching tile or null
     */
    findFirst(predicate, options = {}) {
        return GridIterator.findFirst(this.grid, predicate, options);
    }

    /**
     * Find all tiles of a specific type
     *
     * @param {number} tileType - TILE_TYPES value
     * @param {GridIteratorOptions} [options] - GridIterator options
     * @returns {Array<TileWithPosition>} Array of matching tiles
     *
     * @example
     * // Find all exits
     * const exits = gridManager.findTilesOfType(TILE_TYPES.EXIT);
     */
    findTilesOfType(tileType, options = {}) {
        return this.findTiles(tile => isTileType(tile, tileType), options);
    }

    /**
     * Count tiles matching a predicate
     *
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @param {GridIteratorOptions} [options] - GridIterator options
     * @returns {number} Count of matching tiles
     */
    count(predicate, options = {}) {
        return GridIterator.count(this.grid, predicate, options);
    }

    /**
     * Iterate over each tile in the grid
     *
     * @param {TileCallback} callback - Function(tile, x, y) => void
     * @param {GridIteratorOptions} [options] - GridIterator options
     * @returns {void}
     *
     * @example
     * gridManager.forEach((tile, x, y) => {
     *   if (isBomb(tile)) explode(x, y);
     * });
     */
    forEach(callback, options = {}) {
        GridIterator.forEach(this.grid, callback, /** @type {any} */ (options));
    }

    /**
     * Check if any tile matches a predicate
     *
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @param {GridIteratorOptions} [options] - GridIterator options
     * @returns {boolean} True if any tile matches
     */
    some(predicate, options = {}) {
        return GridIterator.some(this.grid, predicate, options);
    }

    /**
     * Check if all tiles match a predicate
     *
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @param {GridIteratorOptions} [options] - GridIterator options
     * @returns {boolean} True if all tiles match
     */
    every(predicate, options = {}) {
        return GridIterator.every(this.grid, predicate, options);
    }

    /**
     * Fill a rectangular region with a tile value
     *
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Width of region
     * @param {number} height - Height of region
     * @param {Tile|Function} value - Tile value or Function(x, y) => tile
     * @returns {void}
     *
     * @example
     * // Fill 3x3 area with floor tiles
     * gridManager.fillRegion(3, 3, 3, 3, TILE_TYPES.FLOOR);
     */
    fillRegion(x, y, width, height, value) {
        GridIterator.fillRegion(this.grid, x, y, width, height, value);
    }

    /**
     * Check if a rectangular region can be placed at coordinates
     *
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Width of region
     * @param {number} height - Height of region
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @returns {boolean} True if region fits and all tiles match predicate
     */
    canPlaceRegion(x, y, width, height, predicate) {
        return GridIterator.canPlaceRegion(this.grid, x, y, width, height, predicate);
    }

    /**
     * Iterate over tiles in a rectangular region around a center point
     *
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Width of region
     * @param {number} height - Height of region
     * @param {TileCallback} callback - Function(tile, x, y) => void
     * @returns {boolean} True if all tiles were within bounds
     */
    forEachInRegion(centerX, centerY, width, height, callback) {
        return GridIterator.forEachInRegion(this.grid, centerX, centerY, width, height, callback);
    }

    /**
     * Get all tiles in the grid as a flat array
     *
     * @param {GridIteratorOptions} [options] - GridIterator options
     * @returns {Array<TileWithPosition>} Flat array of tiles with coordinates
     */
    toArray(options = {}) {
        return GridIterator.toArray(this.grid, options);
    }

    /**
     * Get neighbors of a tile (4-directional: up, down, left, right)
     *
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} [includeDiagonals] - Include diagonal neighbors (default: false)
     * @returns {Array<NeighborTile>} Array of neighbor tiles
     *
     * @example
     * const neighbors = gridManager.getNeighbors(4, 4);
     * // Returns: [{tile, x: 4, y: 3, direction: 'up'}, ...]
     */
    getNeighbors(x, y, includeDiagonals = false) {
        const neighbors = [];

        // Cardinal directions
        const directions = [
            { dx: 0, dy: -1, name: 'up' },
            { dx: 0, dy: 1, name: 'down' },
            { dx: -1, dy: 0, name: 'left' },
            { dx: 1, dy: 0, name: 'right' }
        ];

        // Add diagonals if requested
        if (includeDiagonals) {
            directions.push(
                { dx: -1, dy: -1, name: 'up-left' },
                { dx: 1, dy: -1, name: 'up-right' },
                { dx: -1, dy: 1, name: 'down-left' },
                { dx: 1, dy: 1, name: 'down-right' }
            );
        }

        for (const { dx, dy, name } of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const tile = this.getTile(nx, ny);

            if (tile !== undefined) {
                neighbors.push({ tile, x: nx, y: ny, direction: name });
            }
        }

        return neighbors;
    }

    /**
     * Swap tiles at two positions
     *
     * @param {number} x1 - First X coordinate
     * @param {number} y1 - First Y coordinate
     * @param {number} x2 - Second X coordinate
     * @param {number} y2 - Second Y coordinate
     * @returns {boolean} True if swap was successful
     */
    swapTiles(x1, y1, x2, y2) {
        if (!this.isWithinBounds(x1, y1) || !this.isWithinBounds(x2, y2)) {
            logger.warn(`GridManager.swapTiles: coordinates out of bounds`);
            return false;
        }

        const temp = this.grid[y1][x1];
        this.grid[y1][x1] = this.grid[y2][x2];
        this.grid[y2][x2] = temp;
        return true;
    }

    /**
     * Clear a tile (set to floor)
     *
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} floorType - Floor tile type (default: 0)
     * @returns {boolean} True if tile was cleared
     */
    clearTile(x, y, floorType = 0) {
        return this.setTile(x, y, floorType);
    }

    /**
     * Get the raw grid reference (use sparingly, prefer abstraction methods)
     *
     * @returns {Grid} The underlying grid array
     * @deprecated Use GridManager methods instead of direct grid access
     */
    getRawGrid() {
        logger.warn('GridManager.getRawGrid: Direct grid access detected. Consider using GridManager methods instead.');
        return this.grid;
    }

    /**
     * Replace the entire grid reference (useful for zone transitions)
     *
     * @param {Grid} newGrid - The new grid to use
     * @returns {void}
     */
    setGrid(newGrid) {
        if (!newGrid || !Array.isArray(newGrid)) {
            throw new Error('GridManager.setGrid: Invalid grid provided');
        }
        this.grid = newGrid;
    }

    /**
     * Create a deep copy of the current grid
     *
     * @returns {Grid} Deep copy of the grid
     */
    cloneGrid() {
        return this.grid.map(row =>
            row.map(tile => {
                if (typeof tile === 'object' && tile !== null) {
                    return { ...tile };
                }
                return tile;
            })
        );
    }

    /**
     * Get grid size
     *
     * @returns {number} Grid size (9)
     */
    getSize() {
        return GRID_SIZE;
    }

    /**
     * Debug: Log grid state to console
     *
     * @param {string} [label] - Optional label for the log
     * @returns {void}
     */
    debugLog(label = 'Grid State') {
        logger.debug(`${label}:`);
        this.grid.forEach((row, y) => {
            const rowStr = row.map(tile => {
                const type = getTileType(tile);
                return type !== undefined ? type.toString().padStart(2, '0') : '??';
            }).join(' ');
            logger.debug(`  Row ${y}: ${rowStr}`);
        });
    }
}

export default GridManager;
