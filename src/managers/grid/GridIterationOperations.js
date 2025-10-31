// @ts-check
/**
 * GridIterationOperations - Grid iteration and transformation operations
 *
 * Provides methods for iterating, filling, and transforming grid regions.
 * Extracted from GridManager to reduce file size.
 */

import { GridIterator } from '../../utils/GridIterator.js';
import { logger } from '../../core/logger.js';

/**
 * @typedef {number|Object} Tile
 */

/**
 * @typedef {Array<Array<Tile>>} Grid
 */

/**
 * @callback TileCallback
 * @param {Tile} tile - The tile
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {void}
 */

/**
 * @callback TilePredicate
 * @param {Tile} tile - The tile to test
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if tile matches predicate
 */

export class GridIterationOperations {
    /**
     * @param {Grid} grid - Reference to the grid
     * @param {Function} isWithinBounds - Function to check bounds
     * @param {Function} getTile - Function to get tile
     */
    constructor(grid, isWithinBounds, getTile) {
        this.grid = grid;
        this.isWithinBounds = isWithinBounds;
        this.getTile = getTile;
    }

    /**
     * Iterate over each tile in the grid
     * @param {TileCallback} callback - Function(tile, x, y) => void
     * @param {Object} [options] - GridIterator options
     * @returns {void}
     */
    forEach(callback, options = {}) {
        GridIterator.forEach(this.grid, callback, /** @type {any} */ (options));
    }

    /**
     * Fill a rectangular region with a tile value
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Width of region
     * @param {number} height - Height of region
     * @param {Tile|Function} value - Tile value or Function(x, y) => tile
     * @returns {void}
     */
    fillRegion(x, y, width, height, value) {
        GridIterator.fillRegion(this.grid, x, y, width, height, value);
    }

    /**
     * Check if a rectangular region can be placed at coordinates
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
     * Swap tiles at two positions
     * @param {number} x1 - First X coordinate
     * @param {number} y1 - First Y coordinate
     * @param {number} x2 - Second X coordinate
     * @param {number} y2 - Second Y coordinate
     * @returns {boolean} True if swap was successful
     */
    swapTiles(x1, y1, x2, y2) {
        if (!this.isWithinBounds(x1, y1) || !this.isWithinBounds(x2, y2)) {
            logger.warn(`GridIterationOperations.swapTiles: coordinates out of bounds`);
            return false;
        }

        const temp = this.grid[y1][x1];
        this.grid[y1][x1] = this.grid[y2][x2];
        this.grid[y2][x2] = temp;
        return true;
    }

    /**
     * Create a deep copy of the current grid
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
}
