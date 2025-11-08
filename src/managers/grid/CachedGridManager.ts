/**
 * CachedGridManager - Grid operations with position caching
 *
 * Performance Optimization:
 * - Caches tile lookups by position (x,y)
 * - Reduces repeated grid access overhead
 * - Automatically invalidates cache on tile updates
 * - Configurable cache size limits
 *
 * Use Cases:
 * - Pathfinding algorithms (frequent getTile calls)
 * - Enemy AI line-of-sight calculations
 * - Rendering optimizations
 * - Multi-pass grid analysis
 *
 * @example
 * const cachedGrid = new CachedGridManager(grid);
 * const tile = cachedGrid.getTile(5, 10); // Cache miss - reads from grid
 * const tile2 = cachedGrid.getTile(5, 10); // Cache hit - instant return
 * cachedGrid.setTile(5, 10, newTile); // Auto-invalidates cache
 */

import type { Tile, Grid } from '@core/SharedTypes';
import { GridCoreOperations } from './GridCoreOperations';
import { logger } from '@core/logger';

export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}

export interface CachedGridOptions {
    /** Maximum number of cached positions (default: 1000) */
    maxCacheSize?: number;
    /** Enable cache statistics tracking (default: false) */
    enableStats?: boolean;
    /** Enable debug logging (default: false) */
    enableDebugLogging?: boolean;
}

/**
 * Position key format: "x,y"
 * Example: getTile(5, 10) -> key "5,10"
 */
type PositionKey = string;

export class CachedGridManager extends GridCoreOperations {
    private positionCache: Map<PositionKey, Tile>;
    private readonly maxCacheSize: number;
    private readonly enableStats: boolean;
    private readonly enableDebugLogging: boolean;

    // Statistics
    private cacheHits = 0;
    private cacheMisses = 0;

    constructor(grid: Grid, options: CachedGridOptions = {}) {
        super(grid);

        this.maxCacheSize = options.maxCacheSize ?? 1000;
        this.enableStats = options.enableStats ?? false;
        this.enableDebugLogging = options.enableDebugLogging ?? false;
        this.positionCache = new Map();

        if (this.enableDebugLogging) {
            logger.debug(`CachedGridManager initialized with maxCacheSize=${this.maxCacheSize}`);
        }
    }

    /**
     * Get tile at coordinates with caching
     * @override
     */
    override getTile(x: number, y: number): Tile | undefined {
        const key = this.getPositionKey(x, y);

        // Check cache first
        if (this.positionCache.has(key)) {
            if (this.enableStats) this.cacheHits++;
            return this.positionCache.get(key);
        }

        // Cache miss - fetch from grid
        if (this.enableStats) this.cacheMisses++;
        const tile = super.getTile(x, y);

        // Store in cache (with size limit)
        if (tile !== undefined) {
            this.addToCache(key, tile);
        }

        return tile;
    }

    /**
     * Set tile at coordinates and invalidate cache
     * @override
     */
    override setTile(x: number, y: number, tile: Tile): boolean {
        const success = super.setTile(x, y, tile);

        if (success) {
            // Invalidate cache for this position
            const key = this.getPositionKey(x, y);
            this.positionCache.delete(key);

            if (this.enableDebugLogging) {
                logger.debug(`Cache invalidated for position (${x}, ${y})`);
            }
        }

        return success;
    }

    /**
     * Replace entire grid and clear cache
     * @override
     */
    override setGrid(newGrid: Grid): void {
        super.setGrid(newGrid);
        this.clearCache();

        if (this.enableDebugLogging) {
            logger.debug('Grid replaced - cache cleared');
        }
    }

    /**
     * Clear tile and invalidate cache
     * @override
     */
    override clearTile(x: number, y: number, floorType = 0): boolean {
        const success = super.clearTile(x, y, floorType);

        if (success) {
            const key = this.getPositionKey(x, y);
            this.positionCache.delete(key);
        }

        return success;
    }

    // ========== Cache Management Methods ==========

    /**
     * Pre-warm cache with tiles in a rectangular region
     * Useful before pathfinding or area scans
     */
    preloadRegion(x: number, y: number, width: number, height: number): void {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tileX = x + dx;
                const tileY = y + dy;
                if (this.isWithinBounds(tileX, tileY)) {
                    this.getTile(tileX, tileY); // Populates cache
                }
            }
        }

        if (this.enableDebugLogging) {
            logger.debug(`Preloaded region (${x},${y}) size ${width}x${height}`);
        }
    }

    /**
     * Pre-warm cache with specific positions
     * Useful for pathfinding waypoints or enemy positions
     */
    preloadPositions(positions: Array<{ x: number; y: number }>): void {
        for (const pos of positions) {
            if (this.isWithinBounds(pos.x, pos.y)) {
                this.getTile(pos.x, pos.y); // Populates cache
            }
        }

        if (this.enableDebugLogging) {
            logger.debug(`Preloaded ${positions.length} positions`);
        }
    }

    /**
     * Invalidate cache entries in a rectangular region
     * Call after batch updates to a specific area
     */
    invalidateRegion(x: number, y: number, width: number, height: number): void {
        let invalidatedCount = 0;

        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tileX = x + dx;
                const tileY = y + dy;
                const key = this.getPositionKey(tileX, tileY);

                if (this.positionCache.delete(key)) {
                    invalidatedCount++;
                }
            }
        }

        if (this.enableDebugLogging) {
            logger.debug(`Invalidated ${invalidatedCount} cache entries in region`);
        }
    }

    /**
     * Invalidate specific positions
     */
    invalidatePositions(positions: Array<{ x: number; y: number }>): void {
        for (const pos of positions) {
            const key = this.getPositionKey(pos.x, pos.y);
            this.positionCache.delete(key);
        }
    }

    /**
     * Clear entire cache
     */
    clearCache(): void {
        const previousSize = this.positionCache.size;
        this.positionCache.clear();

        if (this.enableDebugLogging) {
            logger.debug(`Cache cleared (${previousSize} entries removed)`);
        }
    }

    /**
     * Get current cache statistics
     */
    getStats(): CacheStats {
        const total = this.cacheHits + this.cacheMisses;
        const hitRate = total > 0 ? this.cacheHits / total : 0;

        return {
            hits: this.cacheHits,
            misses: this.cacheMisses,
            size: this.positionCache.size,
            hitRate
        };
    }

    /**
     * Reset statistics counters
     */
    resetStats(): void {
        this.cacheHits = 0;
        this.cacheMisses = 0;

        if (this.enableDebugLogging) {
            logger.debug('Cache statistics reset');
        }
    }

    /**
     * Log current cache statistics
     */
    logStats(): void {
        const stats = this.getStats();
        logger.info('CachedGridManager Statistics:', {
            hits: stats.hits,
            misses: stats.misses,
            cacheSize: stats.size,
            hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
            maxSize: this.maxCacheSize
        });
    }

    // ========== Private Helper Methods ==========

    /**
     * Generate cache key from coordinates
     */
    private getPositionKey(x: number, y: number): PositionKey {
        return `${x},${y}`;
    }

    /**
     * Add tile to cache with size management
     * Uses LRU-like eviction when cache is full
     */
    private addToCache(key: PositionKey, tile: Tile): void {
        // If cache is full, remove oldest entry (first entry in Map)
        if (this.positionCache.size >= this.maxCacheSize) {
            const firstKey = this.positionCache.keys().next().value;
            if (firstKey !== undefined) {
                this.positionCache.delete(firstKey);

                if (this.enableDebugLogging) {
                    logger.debug(`Cache evicted entry: ${firstKey}`);
                }
            }
        }

        this.positionCache.set(key, tile);
    }
}

export default CachedGridManager;
