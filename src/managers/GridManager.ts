/**
 * GridManager - Centralized abstraction layer for grid operations
 *
 * Refactored Architecture:
 * - GridCoreOperations: Basic get/set/check operations
 * - GridQueryOperations: Finding, filtering, counting tiles
 * - GridIterationOperations: Iterating, filling, transforming regions
 */
import { GRID_SIZE } from '@core/constants/index';
import { getTileType } from '@utils/TileUtils';
import type { Tile, Grid } from '@core/SharedTypes';
import { logger } from '@core/logger';
import { GridCoreOperations } from './grid/GridCoreOperations';
import { CachedGridManager, type CachedGridOptions, type CacheStats } from './grid/CachedGridManager';
import { GridQueryOperations, type TileWithPosition, type NeighborTile } from './grid/GridQueryOperations';
import { GridIterationOperations } from './grid/GridIterationOperations';

export type { Tile, Grid, TileWithPosition, NeighborTile, CachedGridOptions, CacheStats };

export interface GridIteratorOptions {
    startX?: number;
    endX?: number;
    startY?: number;
    endY?: number;
    skipBorders?: boolean;
}

export interface GridManagerOptions {
    /** Enable position caching for improved performance (default: false) */
    enableCaching?: boolean;
    /** Cache configuration options (only used if enableCaching is true) */
    cacheOptions?: CachedGridOptions;
}

export type TilePredicate = (tile: Tile, x: number, y: number) => boolean;
export type TileCallback = (tile: Tile, x: number, y: number) => void;

export class GridManager {
    private coreOps: GridCoreOperations;
    private queryOps: GridQueryOperations;
    private iterationOps: GridIterationOperations;
    public grid: Grid;
    private readonly isCachingEnabled: boolean;

    constructor(grid: Grid, options: GridManagerOptions = {}) {
        this.isCachingEnabled = options.enableCaching ?? false;

        // Initialize core operations (with or without caching)
        this.coreOps = this.isCachingEnabled
            ? new CachedGridManager(grid, options.cacheOptions)
            : new GridCoreOperations(grid);

        // Initialize query operations
        this.queryOps = new GridQueryOperations(
            this.coreOps.getRawGrid(),
            this.coreOps.getTile.bind(this.coreOps)
        );

        // Initialize iteration operations
        this.iterationOps = new GridIterationOperations(
            this.coreOps.getRawGrid(),
            this.coreOps.isWithinBounds.bind(this.coreOps),
            this.coreOps.getTile.bind(this.coreOps)
        );

        // Expose grid reference for compatibility
        this.grid = this.coreOps.getRawGrid();
    }

    // ========== Core Operations ==========

    getTile(x: number, y: number): Tile | null {
        return this.coreOps.getTile(x, y) ?? null;
    }

    setTile(x: number, y: number, tile: Tile): void {
        this.coreOps.setTile(x, y, tile);
    }

    isWithinBounds(x: number, y: number): boolean {
        return this.coreOps.isWithinBounds(x, y);
    }

    isWalkable(x: number, y: number): boolean {
        return this.coreOps.isWalkable(x, y);
    }

    isTileType(x: number, y: number, tileType: number): boolean {
        return this.coreOps.isTileType(x, y, tileType);
    }

    getTileType(x: number, y: number): number | null {
        return this.coreOps.getTileType(x, y) ?? null;
    }

    cloneTile(x: number, y: number): Tile | null {
        return this.coreOps.cloneTile(x, y) ?? null;
    }

    clearTile(x: number, y: number, floorType = 0): void {
        this.coreOps.clearTile(x, y, floorType);
    }

    setGrid(newGrid: Grid): void {
        this.coreOps.setGrid(newGrid);
        this.queryOps.setGrid(newGrid);
        this.iterationOps.setGrid(newGrid);
        this.grid = newGrid;
    }

    /**
     * Get the raw grid reference
     * @internal Prefer using GridManager's abstraction methods (getTile, isWalkable, etc.)
     * instead of direct grid manipulation.
     */
    getRawGrid(): Grid {
        return this.coreOps.getRawGrid();
    }

    // ========== Query Operations ==========

    findTiles(predicate: TilePredicate, options: GridIteratorOptions = {}): TileWithPosition[] {
        return this.queryOps.findTiles(predicate, options);
    }

    findFirst(predicate: TilePredicate, options: GridIteratorOptions = {}): TileWithPosition | null {
        return this.queryOps.findFirst(predicate, options);
    }

    findTilesOfType(tileType: number, options: GridIteratorOptions = {}): TileWithPosition[] {
        return this.queryOps.findTilesOfType(tileType, options);
    }

    count(predicate: TilePredicate, options: GridIteratorOptions = {}): number {
        return this.queryOps.count(predicate, options);
    }

    some(predicate: TilePredicate, options: GridIteratorOptions = {}): boolean {
        return this.queryOps.some(predicate, options);
    }

    every(predicate: TilePredicate, options: GridIteratorOptions = {}): boolean {
        return this.queryOps.every(predicate, options);
    }

    toArray(options: GridIteratorOptions = {}): TileWithPosition[] {
        return this.queryOps.toArray(options);
    }

    getNeighbors(x: number, y: number, includeDiagonals = false): NeighborTile[] {
        return this.queryOps.getNeighbors(x, y, includeDiagonals);
    }

    // ========== Iteration Operations ==========

    forEach(callback: TileCallback, options: GridIteratorOptions = {}): void {
        this.iterationOps.forEach(callback, options);
    }

    fillRegion(x: number, y: number, width: number, height: number, value: Tile): void {
        this.iterationOps.fillRegion(x, y, width, height, value);
    }

    canPlaceRegion(x: number, y: number, width: number, height: number, predicate: TilePredicate): boolean {
        return this.iterationOps.canPlaceRegion(x, y, width, height, predicate);
    }

    forEachInRegion(centerX: number, centerY: number, width: number, height: number, callback: TileCallback): void {
        this.iterationOps.forEachInRegion(centerX, centerY, width, height, callback);
    }

    swapTiles(x1: number, y1: number, x2: number, y2: number): void {
        this.iterationOps.swapTiles(x1, y1, x2, y2);
    }

    cloneGrid(): Grid {
        return this.iterationOps.cloneGrid();
    }

    // ========== Cache Management Methods (only available when caching is enabled) ==========

    /**
     * Check if caching is enabled for this GridManager instance
     */
    isCached(): boolean {
        return this.isCachingEnabled;
    }

    /**
     * Pre-warm cache with tiles in a rectangular region
     * Only works if caching is enabled
     */
    preloadRegion(x: number, y: number, width: number, height: number): void {
        if (this.coreOps instanceof CachedGridManager) {
            this.coreOps.preloadRegion(x, y, width, height);
        }
    }

    /**
     * Pre-warm cache with specific positions
     * Only works if caching is enabled
     */
    preloadPositions(positions: Array<{ x: number; y: number }>): void {
        if (this.coreOps instanceof CachedGridManager) {
            this.coreOps.preloadPositions(positions);
        }
    }

    /**
     * Invalidate cache entries in a rectangular region
     * Only works if caching is enabled
     */
    invalidateRegion(x: number, y: number, width: number, height: number): void {
        if (this.coreOps instanceof CachedGridManager) {
            this.coreOps.invalidateRegion(x, y, width, height);
        }
    }

    /**
     * Invalidate specific positions
     * Only works if caching is enabled
     */
    invalidatePositions(positions: Array<{ x: number; y: number }>): void {
        if (this.coreOps instanceof CachedGridManager) {
            this.coreOps.invalidatePositions(positions);
        }
    }

    /**
     * Clear entire cache
     * Only works if caching is enabled
     */
    clearCache(): void {
        if (this.coreOps instanceof CachedGridManager) {
            this.coreOps.clearCache();
        }
    }

    /**
     * Get cache statistics
     * Returns null if caching is not enabled
     */
    getCacheStats(): CacheStats | null {
        if (this.coreOps instanceof CachedGridManager) {
            return this.coreOps.getStats();
        }
        return null;
    }

    /**
     * Reset cache statistics counters
     * Only works if caching is enabled
     */
    resetCacheStats(): void {
        if (this.coreOps instanceof CachedGridManager) {
            this.coreOps.resetStats();
        }
    }

    /**
     * Log cache statistics
     * Only works if caching is enabled
     */
    logCacheStats(): void {
        if (this.coreOps instanceof CachedGridManager) {
            this.coreOps.logStats();
        }
    }

    // ========== Utility Methods ==========

    getSize(): number {
        return GRID_SIZE;
    }

    debugLog(label = 'Grid State'): void {
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
