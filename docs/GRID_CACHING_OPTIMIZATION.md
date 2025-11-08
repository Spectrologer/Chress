# Grid Caching Optimization

## Overview

The grid caching optimization improves performance for operations that repeatedly access the same tile positions by caching `getTile()` results. This is particularly beneficial for:

- **Pathfinding algorithms** - Repeatedly check the same tiles during A* or dijkstra calculations
- **Enemy AI** - Line-of-sight calculations scan the same regions multiple times
- **Rendering optimizations** - Repeated lookups during multi-pass rendering
- **Grid analysis** - Operations that scan the same areas repeatedly

## Implementation

### CachedGridManager

The `CachedGridManager` extends `GridCoreOperations` to add position-based caching:

```typescript
import { GridManager } from '@managers/GridManager';

// Create a cached grid manager
const gridManager = new GridManager(grid, {
    enableCaching: true,
    cacheOptions: {
        maxCacheSize: 1000,        // Maximum cached positions
        enableStats: true,         // Track cache performance
        enableDebugLogging: false  // Log cache operations
    }
});
```

### Architecture

```
GridManager
  └── GridCoreOperations (default, no caching)
      └── CachedGridManager (opt-in caching)
```

The implementation uses polymorphism - when caching is enabled, a `CachedGridManager` instance is used instead of `GridCoreOperations`.

## Usage Examples

### Basic Usage

```typescript
import { GridManager } from '@managers/GridManager';

// Non-cached (default behavior)
const normalGrid = new GridManager(grid);

// Cached grid with default options
const cachedGrid = new GridManager(grid, {
    enableCaching: true
});

// Both use the same API
const tile1 = normalGrid.getTile(5, 10);
const tile2 = cachedGrid.getTile(5, 10); // Cached on second access
```

### Pathfinding Optimization

```typescript
// Enable caching for pathfinding
const gridManager = new GridManager(grid, {
    enableCaching: true,
    cacheOptions: { maxCacheSize: 500 }
});

// Preload the path area before pathfinding
gridManager.preloadRegion(
    startX - 10,
    startY - 10,
    20,
    20
);

// Run pathfinding - benefits from cached tile lookups
const path = findPath(start, goal, gridManager);

// Clear cache when done
gridManager.clearCache();
```

### Enemy Line-of-Sight

```typescript
class Enemy {
    private gridManager: GridManager;

    constructor(grid: Grid) {
        this.gridManager = new GridManager(grid, {
            enableCaching: true,
            cacheOptions: {
                maxCacheSize: 200,
                enableStats: true
            }
        });
    }

    checkLineOfSight(playerX: number, playerY: number): boolean {
        // Preload vision cone area
        const visionRange = 5;
        this.gridManager.preloadRegion(
            this.x - visionRange,
            this.y - visionRange,
            visionRange * 2,
            visionRange * 2
        );

        // Perform line-of-sight check
        // Subsequent getTile() calls hit cache
        return this.lineOfSightAlgorithm(playerX, playerY);
    }

    logPerformance() {
        // Check cache performance
        const stats = this.gridManager.getCacheStats();
        console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
    }
}
```

### Batch Updates with Invalidation

```typescript
const gridManager = new GridManager(grid, {
    enableCaching: true
});

// Perform batch updates
for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
        gridManager.setTile(x, y, TILE_TYPES.WATER);
    }
}

// Each setTile() automatically invalidates that position's cache

// For more efficient batch invalidation:
gridManager.invalidateRegion(0, 0, 10, 10);
```

## Cache Management API

### Preloading

```typescript
// Preload rectangular region
gridManager.preloadRegion(x, y, width, height);

// Preload specific positions (e.g., waypoints)
gridManager.preloadPositions([
    { x: 10, y: 10 },
    { x: 15, y: 15 },
    { x: 20, y: 20 }
]);
```

### Invalidation

```typescript
// Automatically invalidated on tile modification
gridManager.setTile(5, 5, newTile); // Cache for (5,5) invalidated
gridManager.clearTile(5, 5);        // Cache for (5,5) invalidated

// Manual invalidation
gridManager.invalidateRegion(x, y, width, height);
gridManager.invalidatePositions([{ x: 5, y: 5 }]);
gridManager.clearCache(); // Clear entire cache
```

### Statistics

```typescript
// Get cache statistics
const stats = gridManager.getCacheStats();
console.log({
    hits: stats.hits,           // Number of cache hits
    misses: stats.misses,       // Number of cache misses
    size: stats.size,           // Current cache size
    hitRate: stats.hitRate      // Hit rate (0-1)
});

// Reset statistics (keeps cached data)
gridManager.resetCacheStats();

// Log statistics
gridManager.logCacheStats();
```

## Performance Characteristics

### Cache Behavior

| Operation | Complexity | Cache Impact |
|-----------|------------|--------------|
| `getTile()` (cache hit) | O(1) | Returns cached value |
| `getTile()` (cache miss) | O(1) + cache overhead | Populates cache |
| `setTile()` | O(1) | Invalidates position |
| `preloadRegion()` | O(width × height) | Populates cache |
| `clearCache()` | O(1) | Clears all entries |

### Memory Usage

- **Per cached tile**: ~50-100 bytes (Map entry + key string)
- **Default max cache**: 1000 entries ≈ 50-100 KB
- **Cache eviction**: LRU-like (oldest entry removed when full)

### When to Use Caching

✅ **Good use cases:**
- Pathfinding algorithms
- Repeated area scans (enemy AI, fog of war)
- Multi-pass grid processing
- High read-to-write ratio scenarios

❌ **Avoid caching when:**
- Grid changes frequently (high write ratio)
- Each tile accessed only once
- Memory is constrained
- Simple linear scans (no repeated access)

## Configuration Guidelines

### Cache Size

```typescript
// Small cache for local operations
{ maxCacheSize: 100 }  // ~5-10 KB

// Medium cache for pathfinding
{ maxCacheSize: 500 }  // ~25-50 KB

// Large cache for extensive operations
{ maxCacheSize: 2000 } // ~100-200 KB
```

### Enable Statistics

```typescript
// Development: Track performance
{
    enableStats: true,
    enableDebugLogging: true
}

// Production: Minimal overhead
{
    enableStats: false,
    enableDebugLogging: false
}
```

## Performance Testing

### Measuring Cache Effectiveness

```typescript
const gridManager = new GridManager(grid, {
    enableCaching: true,
    cacheOptions: { enableStats: true }
});

// Perform operations
performPathfinding(gridManager);

// Analyze results
const stats = gridManager.getCacheStats();
if (stats.hitRate < 0.5) {
    console.warn('Low cache hit rate - caching may not be beneficial');
}
```

### Benchmark Example

```typescript
import { GridManager } from '@managers/GridManager';

function benchmarkGridOperations(grid: Grid) {
    // Test without caching
    const normalGrid = new GridManager(grid);
    const start1 = performance.now();
    for (let i = 0; i < 1000; i++) {
        normalGrid.getTile(5, 5);
        normalGrid.getTile(10, 10);
    }
    const time1 = performance.now() - start1;

    // Test with caching
    const cachedGrid = new GridManager(grid, {
        enableCaching: true,
        cacheOptions: { enableStats: true }
    });
    const start2 = performance.now();
    for (let i = 0; i < 1000; i++) {
        cachedGrid.getTile(5, 5);
        cachedGrid.getTile(10, 10);
    }
    const time2 = performance.now() - start2;

    const stats = cachedGrid.getCacheStats();
    console.log({
        normalTime: time1,
        cachedTime: time2,
        speedup: (time1 / time2).toFixed(2) + 'x',
        hitRate: (stats.hitRate * 100).toFixed(2) + '%'
    });
}
```

## Migration Guide

### Converting Existing Code

**Before:**
```typescript
const gridManager = new GridManager(grid);
```

**After (with caching):**
```typescript
const gridManager = new GridManager(grid, {
    enableCaching: true,
    cacheOptions: {
        maxCacheSize: 500,
        enableStats: process.env.NODE_ENV === 'development'
    }
});
```

### Backward Compatibility

The caching feature is **100% backward compatible**:

- Default behavior (no caching) is unchanged
- All existing code continues to work without modification
- Caching is opt-in via constructor options
- Cache methods are no-ops when caching is disabled

```typescript
// Works identically whether cached or not
gridManager.getTile(x, y);
gridManager.setTile(x, y, tile);
gridManager.findTiles(predicate);
```

## Implementation Details

### Cache Key Format

Positions are cached using string keys: `"x,y"`

```typescript
// Examples:
// Position (5, 10) → key "5,10"
// Position (15, 3) → key "15,3"
```

### Cache Eviction Strategy

When cache reaches `maxCacheSize`:
1. Oldest entry (first in Map) is removed
2. New entry is added
3. Approximates LRU (Least Recently Used) behavior

### Automatic Invalidation

Cache entries are automatically invalidated on:
- `setTile(x, y, tile)` - Invalidates (x, y)
- `clearTile(x, y)` - Invalidates (x, y)
- `setGrid(newGrid)` - Clears entire cache

## Best Practices

1. **Preload before intensive operations**
   ```typescript
   gridManager.preloadRegion(startX, startY, width, height);
   const path = findPath(...);
   ```

2. **Clear cache after major grid changes**
   ```typescript
   generateNewZone(gridManager);
   gridManager.clearCache();
   ```

3. **Monitor cache performance in development**
   ```typescript
   if (process.env.NODE_ENV === 'development') {
       gridManager.logCacheStats();
   }
   ```

4. **Use appropriate cache sizes**
   - Pathfinding: 500-1000
   - Enemy AI: 200-500
   - Rendering: 1000-2000

5. **Invalidate regions for batch updates**
   ```typescript
   // Instead of individual invalidations
   gridManager.invalidateRegion(x, y, width, height);
   ```

## Troubleshooting

### Low Cache Hit Rate

If `hitRate < 0.5`:
- Verify repeated access patterns
- Check if cache size is too small
- Consider if caching is appropriate for your use case

### High Memory Usage

If memory is a concern:
- Reduce `maxCacheSize`
- Clear cache more frequently
- Disable caching for infrequently-used grids

### Stale Data Issues

If getting outdated tile values:
- Ensure cache is being invalidated on updates
- Check for direct grid mutations (bypass GridManager)
- Use `clearCache()` after major changes

## Future Enhancements

Potential improvements for future versions:

- [ ] True LRU cache with access time tracking
- [ ] Cache warming strategies (predictive preloading)
- [ ] Per-region cache policies
- [ ] Cache serialization for save/load
- [ ] Performance profiling integration
- [ ] Adaptive cache sizing based on hit rate

## Related Documentation

- [GridManager API](./PROJECT_OVERVIEW.md#gridmanager)
- [Performance Optimization Guide](./PERFORMANCE.md)
- [TypeScript Migration](./TYPESCRIPT_STRICT_MODE_MIGRATION.md)

## Summary

Grid caching is a powerful optimization for read-heavy grid operations. Key takeaways:

- ✅ Opt-in feature, backward compatible
- ✅ Automatic cache invalidation on writes
- ✅ Simple API for preloading and management
- ✅ Built-in statistics for performance monitoring
- ✅ Configurable cache sizes and behavior

Use caching when you have repeated tile lookups in pathfinding, AI, or rendering. Monitor cache hit rates to ensure effectiveness.
