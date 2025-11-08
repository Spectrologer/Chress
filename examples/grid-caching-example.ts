/**
 * Grid Caching Optimization - Usage Examples
 *
 * This file demonstrates how to use the grid caching feature
 * to improve performance for tile lookup-heavy operations.
 */

import { GridManager } from '@managers/GridManager';
import type { Grid, Tile } from '@core/SharedTypes';
import { TILE_TYPES } from '@core/constants';

// ============================================================================
// Example 1: Basic Caching Setup
// ============================================================================

function example1_BasicCaching() {
    const grid: Grid = Array(20).fill(null).map(() => Array(20).fill(0));

    // Create a cached grid manager
    const gridManager = new GridManager(grid, {
        enableCaching: true,
        cacheOptions: {
            maxCacheSize: 1000,
            enableStats: true
        }
    });

    // First access - cache miss
    const tile1 = gridManager.getTile(5, 10);

    // Second access - cache hit (much faster)
    const tile2 = gridManager.getTile(5, 10);

    // Check cache statistics
    const stats = gridManager.getCacheStats();
    console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
}

// ============================================================================
// Example 2: Pathfinding Optimization
// ============================================================================

interface PathNode {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic to goal
    f: number; // Total cost
    parent: PathNode | null;
}

function example2_PathfindingWithCache(
    grid: Grid,
    startX: number,
    startY: number,
    goalX: number,
    goalY: number
) {
    // Enable caching for pathfinding
    const gridManager = new GridManager(grid, {
        enableCaching: true,
        cacheOptions: {
            maxCacheSize: 500, // Enough for typical paths
            enableStats: true
        }
    });

    // Preload the area around start and goal
    const preloadRadius = 10;
    gridManager.preloadRegion(
        startX - preloadRadius,
        startY - preloadRadius,
        preloadRadius * 2,
        preloadRadius * 2
    );
    gridManager.preloadRegion(
        goalX - preloadRadius,
        goalY - preloadRadius,
        preloadRadius * 2,
        preloadRadius * 2
    );

    // Simplified A* pathfinding
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();

    const startNode: PathNode = {
        x: startX,
        y: startY,
        g: 0,
        h: manhattan(startX, startY, goalX, goalY),
        f: 0,
        parent: null
    };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    while (openSet.length > 0) {
        // Get node with lowest f score
        const current = openSet.reduce((min, node) =>
            node.f < min.f ? node : min
        );

        // Goal reached
        if (current.x === goalX && current.y === goalY) {
            const path = reconstructPath(current);
            const stats = gridManager.getCacheStats();
            console.log(`Path found! Cache hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
            return path;
        }

        // Move current from open to closed
        openSet.splice(openSet.indexOf(current), 1);
        closedSet.add(`${current.x},${current.y}`);

        // Check neighbors - benefits from cache!
        const neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
        ];

        for (const neighbor of neighbors) {
            const key = `${neighbor.x},${neighbor.y}`;

            if (closedSet.has(key)) continue;

            // getTile() benefits from cache here
            const tile = gridManager.getTile(neighbor.x, neighbor.y);
            if (!tile || !gridManager.isWalkable(neighbor.x, neighbor.y)) {
                continue;
            }

            const g = current.g + 1;
            const h = manhattan(neighbor.x, neighbor.y, goalX, goalY);
            const f = g + h;

            const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

            if (!existingNode) {
                openSet.push({
                    x: neighbor.x,
                    y: neighbor.y,
                    g,
                    h,
                    f,
                    parent: current
                });
            } else if (g < existingNode.g) {
                existingNode.g = g;
                existingNode.f = f;
                existingNode.parent = current;
            }
        }
    }

    return null; // No path found
}

function manhattan(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function reconstructPath(node: PathNode): Array<{ x: number; y: number }> {
    const path: Array<{ x: number; y: number }> = [];
    let current: PathNode | null = node;

    while (current) {
        path.unshift({ x: current.x, y: current.y });
        current = current.parent;
    }

    return path;
}

// ============================================================================
// Example 3: Enemy AI with Line-of-Sight
// ============================================================================

class EnemyAI {
    private gridManager: GridManager;
    private x: number;
    private y: number;
    private visionRange = 5;

    constructor(grid: Grid, x: number, y: number) {
        this.x = x;
        this.y = y;

        // Enable caching for AI operations
        this.gridManager = new GridManager(grid, {
            enableCaching: true,
            cacheOptions: {
                maxCacheSize: 200,
                enableStats: true
            }
        });
    }

    canSeePlayer(playerX: number, playerY: number): boolean {
        // Preload vision cone
        this.gridManager.preloadRegion(
            this.x - this.visionRange,
            this.y - this.visionRange,
            this.visionRange * 2,
            this.visionRange * 2
        );

        // Check if player is in range
        const distance = Math.sqrt(
            Math.pow(playerX - this.x, 2) +
            Math.pow(playerY - this.y, 2)
        );

        if (distance > this.visionRange) {
            return false;
        }

        // Bresenham line algorithm to check line of sight
        return this.hasLineOfSight(this.x, this.y, playerX, playerY);
    }

    private hasLineOfSight(x0: number, y0: number, x1: number, y1: number): boolean {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        let x = x0;
        let y = y0;

        while (true) {
            // Check current tile - benefits from cache
            if (!this.gridManager.isWalkable(x, y)) {
                return false; // Line blocked
            }

            if (x === x1 && y === y1) {
                return true; // Reached target
            }

            const e2 = 2 * err;

            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }

            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    logPerformance(): void {
        const stats = this.gridManager.getCacheStats();
        console.log(`Enemy AI Cache Performance:`, {
            hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
            cacheSize: stats.size,
            totalAccesses: stats.hits + stats.misses
        });
    }
}

// ============================================================================
// Example 4: Multi-Enemy AI Update Loop
// ============================================================================

function example4_MultiEnemyUpdate(grid: Grid, enemies: EnemyAI[], playerX: number, playerY: number) {
    // All enemies share the same grid, so cache benefits multiply
    const cachedGrid = new GridManager(grid, {
        enableCaching: true,
        cacheOptions: {
            maxCacheSize: 1000,
            enableStats: true
        }
    });

    // Preload area around player
    const preloadRadius = 15;
    cachedGrid.preloadRegion(
        playerX - preloadRadius,
        playerY - preloadRadius,
        preloadRadius * 2,
        preloadRadius * 2
    );

    // Update all enemies
    for (const enemy of enemies) {
        // Each enemy's checks benefit from shared cache
        // ... enemy AI logic ...
    }

    // Check cache effectiveness
    const stats = cachedGrid.getCacheStats();
    if (stats.hitRate > 0.8) {
        console.log('High cache efficiency! Caching is very effective.');
    }
}

// ============================================================================
// Example 5: Batch Grid Updates with Invalidation
// ============================================================================

function example5_BatchUpdates(grid: Grid) {
    const gridManager = new GridManager(grid, {
        enableCaching: true
    });

    // Populate cache with some reads
    for (let i = 0; i < 10; i++) {
        gridManager.getTile(i, i);
    }

    console.log(`Cache size before updates: ${gridManager.getCacheStats()?.size}`);

    // Perform batch updates - individual invalidations
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            gridManager.setTile(x, y, TILE_TYPES.WATER);
            // Cache automatically invalidated for (x, y)
        }
    }

    // More efficient: invalidate entire region at once
    gridManager.invalidateRegion(5, 5, 10, 10);

    console.log(`Cache size after updates: ${gridManager.getCacheStats()?.size}`);
}

// ============================================================================
// Example 6: Performance Comparison
// ============================================================================

function example6_PerformanceComparison(grid: Grid) {
    const iterations = 10000;
    const positions = [
        { x: 5, y: 5 },
        { x: 10, y: 10 },
        { x: 15, y: 15 }
    ];

    // Test without caching
    const normalGrid = new GridManager(grid);
    const start1 = performance.now();
    for (let i = 0; i < iterations; i++) {
        for (const pos of positions) {
            normalGrid.getTile(pos.x, pos.y);
        }
    }
    const timeNormal = performance.now() - start1;

    // Test with caching
    const cachedGrid = new GridManager(grid, {
        enableCaching: true,
        cacheOptions: { enableStats: true }
    });
    const start2 = performance.now();
    for (let i = 0; i < iterations; i++) {
        for (const pos of positions) {
            cachedGrid.getTile(pos.x, pos.y);
        }
    }
    const timeCached = performance.now() - start2;

    const stats = cachedGrid.getCacheStats();

    console.log('Performance Comparison:', {
        normalTime: `${timeNormal.toFixed(2)}ms`,
        cachedTime: `${timeCached.toFixed(2)}ms`,
        speedup: `${(timeNormal / timeCached).toFixed(2)}x`,
        cacheHitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
        cacheSize: stats.size
    });
}

// ============================================================================
// Example 7: Zone Transition with Cache Management
// ============================================================================

function example7_ZoneTransition(oldGrid: Grid, newGrid: Grid) {
    const gridManager = new GridManager(oldGrid, {
        enableCaching: true,
        cacheOptions: { maxCacheSize: 1000 }
    });

    // Use grid in zone 1
    // ... gameplay logic ...

    console.log(`Zone 1 cache size: ${gridManager.getCacheStats()?.size}`);

    // Transition to new zone
    gridManager.setGrid(newGrid); // Automatically clears cache

    console.log(`Zone 2 cache size: ${gridManager.getCacheStats()?.size}`); // 0

    // Preload common areas in new zone
    gridManager.preloadRegion(0, 0, 20, 20);
}

// ============================================================================
// Main Demo Runner
// ============================================================================

export function runGridCachingExamples() {
    console.log('=== Grid Caching Examples ===\n');

    const testGrid: Grid = Array(20).fill(null).map(() =>
        Array(20).fill(TILE_TYPES.FLOOR)
    );

    console.log('Running Example 1: Basic Caching...');
    example1_BasicCaching();

    console.log('\nRunning Example 2: Pathfinding...');
    const path = example2_PathfindingWithCache(testGrid, 0, 0, 15, 15);
    console.log(`Path length: ${path?.length || 0}`);

    console.log('\nRunning Example 3: Enemy AI...');
    const enemy = new EnemyAI(testGrid, 10, 10);
    const canSee = enemy.canSeePlayer(15, 15);
    console.log(`Enemy can see player: ${canSee}`);
    enemy.logPerformance();

    console.log('\nRunning Example 5: Batch Updates...');
    example5_BatchUpdates(testGrid);

    console.log('\nRunning Example 6: Performance Comparison...');
    example6_PerformanceComparison(testGrid);

    console.log('\n=== Examples Complete ===');
}

// Uncomment to run examples:
// runGridCachingExamples();
