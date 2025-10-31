// @ts-check
/**
 * GridManager - Centralized abstraction layer for grid operations
 *
 * Refactored Architecture:
 * - GridCoreOperations: Basic get/set/check operations
 * - GridQueryOperations: Finding, filtering, counting tiles
 * - GridIterationOperations: Iterating, filling, transforming regions
 */
import { GRID_SIZE } from '../core/constants/index.js';
import { getTileType } from '../utils/TileUtils.js';
import { logger } from '../core/logger.js';
import { GridCoreOperations } from './grid/GridCoreOperations.js';
import { GridQueryOperations } from './grid/GridQueryOperations.js';
import { GridIterationOperations } from './grid/GridIterationOperations.js';

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

export class GridManager {
    /**
     * @param {any} grid - The 2D grid array (9x9)
     */
    constructor(grid) {
        // Initialize core operations
        this.coreOps = new GridCoreOperations(grid);

        // Initialize query operations
        this.queryOps = new GridQueryOperations(
            this.coreOps.grid,
            this.coreOps.getTile.bind(this.coreOps)
        );

        // Initialize iteration operations
        this.iterationOps = new GridIterationOperations(
            this.coreOps.grid,
            this.coreOps.isWithinBounds.bind(this.coreOps),
            this.coreOps.getTile.bind(this.coreOps)
        );

        // Expose grid reference for compatibility
        this.grid = this.coreOps.grid;
    }

    // ========== Core Operations ==========

    getTile(x, y) {
        return this.coreOps.getTile(x, y);
    }

    setTile(x, y, tile) {
        return this.coreOps.setTile(x, y, tile);
    }

    isWithinBounds(x, y) {
        return this.coreOps.isWithinBounds(x, y);
    }

    isWalkable(x, y) {
        return this.coreOps.isWalkable(x, y);
    }

    isTileType(x, y, tileType) {
        return this.coreOps.isTileType(x, y, tileType);
    }

    getTileType(x, y) {
        return this.coreOps.getTileType(x, y);
    }

    cloneTile(x, y) {
        return this.coreOps.cloneTile(x, y);
    }

    clearTile(x, y, floorType = 0) {
        return this.coreOps.clearTile(x, y, floorType);
    }

    setGrid(newGrid) {
        this.coreOps.setGrid(newGrid);
        this.queryOps.grid = newGrid;
        this.iterationOps.grid = newGrid;
        this.grid = newGrid;
    }

    getRawGrid() {
        return this.coreOps.getRawGrid();
    }

    // ========== Query Operations ==========

    findTiles(predicate, options = {}) {
        return this.queryOps.findTiles(predicate, options);
    }

    findFirst(predicate, options = {}) {
        return this.queryOps.findFirst(predicate, options);
    }

    findTilesOfType(tileType, options = {}) {
        return this.queryOps.findTilesOfType(tileType, options);
    }

    count(predicate, options = {}) {
        return this.queryOps.count(predicate, options);
    }

    some(predicate, options = {}) {
        return this.queryOps.some(predicate, options);
    }

    every(predicate, options = {}) {
        return this.queryOps.every(predicate, options);
    }

    toArray(options = {}) {
        return this.queryOps.toArray(options);
    }

    getNeighbors(x, y, includeDiagonals = false) {
        return this.queryOps.getNeighbors(x, y, includeDiagonals);
    }

    // ========== Iteration Operations ==========

    forEach(callback, options = {}) {
        this.iterationOps.forEach(callback, options);
    }

    fillRegion(x, y, width, height, value) {
        this.iterationOps.fillRegion(x, y, width, height, value);
    }

    canPlaceRegion(x, y, width, height, predicate) {
        return this.iterationOps.canPlaceRegion(x, y, width, height, predicate);
    }

    forEachInRegion(centerX, centerY, width, height, callback) {
        return this.iterationOps.forEachInRegion(centerX, centerY, width, height, callback);
    }

    swapTiles(x1, y1, x2, y2) {
        return this.iterationOps.swapTiles(x1, y1, x2, y2);
    }

    cloneGrid() {
        return this.iterationOps.cloneGrid();
    }

    // ========== Utility Methods ==========

    getSize() {
        return GRID_SIZE;
    }

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
