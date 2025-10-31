// @ts-check
/**
 * GridQueryOperations - Advanced grid query and search operations
 *
 * Provides methods for finding, filtering, and counting tiles.
 * Extracted from GridManager to reduce file size.
 */

import { GridIterator } from '../../utils/GridIterator.js';
import { isTileType } from '../../utils/TileUtils.js';

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
 * @callback TilePredicate
 * @param {Tile} tile - The tile to test
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if tile matches predicate
 */

export class GridQueryOperations {
    /**
     * @param {Grid} grid - Reference to the grid
     * @param {Function} getTile - Function to get tile at coordinates
     */
    constructor(grid, getTile) {
        this.grid = grid;
        this.getTile = getTile;
    }

    /**
     * Find all tiles matching a predicate
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @param {Object} [options] - GridIterator options
     * @returns {Array<TileWithPosition>} Array of matching tiles with coordinates
     */
    findTiles(predicate, options = {}) {
        return GridIterator.findTiles(this.grid, predicate, options);
    }

    /**
     * Find first tile matching a predicate
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @param {Object} [options] - GridIterator options
     * @returns {TileWithPosition|null} First matching tile or null
     */
    findFirst(predicate, options = {}) {
        return GridIterator.findFirst(this.grid, predicate, options);
    }

    /**
     * Find all tiles of a specific type
     * @param {number} tileType - TILE_TYPES value
     * @param {Object} [options] - GridIterator options
     * @returns {Array<TileWithPosition>} Array of matching tiles
     */
    findTilesOfType(tileType, options = {}) {
        return this.findTiles(tile => isTileType(tile, tileType), options);
    }

    /**
     * Count tiles matching a predicate
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @param {Object} [options] - GridIterator options
     * @returns {number} Count of matching tiles
     */
    count(predicate, options = {}) {
        return GridIterator.count(this.grid, predicate, options);
    }

    /**
     * Check if any tile matches a predicate
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @param {Object} [options] - GridIterator options
     * @returns {boolean} True if any tile matches
     */
    some(predicate, options = {}) {
        return GridIterator.some(this.grid, predicate, options);
    }

    /**
     * Check if all tiles match a predicate
     * @param {TilePredicate} predicate - Function(tile, x, y) => boolean
     * @param {Object} [options] - GridIterator options
     * @returns {boolean} True if all tiles match
     */
    every(predicate, options = {}) {
        return GridIterator.every(this.grid, predicate, options);
    }

    /**
     * Get all tiles in the grid as a flat array
     * @param {Object} [options] - GridIterator options
     * @returns {Array<TileWithPosition>} Flat array of tiles with coordinates
     */
    toArray(options = {}) {
        return GridIterator.toArray(this.grid, options);
    }

    /**
     * Get neighbors of a tile (4-directional: up, down, left, right)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} [includeDiagonals] - Include diagonal neighbors (default: false)
     * @returns {Array<NeighborTile>} Array of neighbor tiles
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
}
