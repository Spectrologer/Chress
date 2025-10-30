# ADR-0003: Implement Position Class Abstraction

## Status

Accepted

## Date

2024-10-20

## Context

Position data was represented inconsistently throughout the codebase:

- **Plain Objects**: `{x: 5, y: 10}` scattered everywhere
- **Repeated Calculations**: Distance, adjacency, and direction logic duplicated across files
- **Error-Prone Math**: Manhattan vs Chebyshev distance calculated differently in different places
- **No Validation**: Invalid positions (out of bounds, negative) not caught
- **Poor Testability**: Position logic spread across 20+ files made it hard to test comprehensively

Specific pain points:
- 15+ files had duplicate distance calculation implementations
- Adjacency checking logic varied (some used Chebyshev, some Manhattan)
- Bresenham line drawing implemented 3 different ways
- Direction calculations had subtle bugs due to copy-paste errors

Alternatives considered:
1. **Keep Plain Objects**: Continue with `{x, y}` (too error-prone)
2. **Utility Functions**: Create position utility functions (better but still scattered)
3. **Position Class**: Centralized class with all position operations (chosen)

## Decision

We will implement a rich `Position` class that:

- Provides a single source of truth for all position operations
- Maintains backward compatibility with `{x, y}` object pattern
- Offers immutable operations (returns new Position instances)
- Includes comprehensive distance, direction, and geometric utilities
- Has 99 unit tests ensuring correctness

Key features:
- **Distance Metrics**: Chebyshev, Manhattan, Euclidean
- **Direction Operations**: Movement, direction calculation, delta
- **Geometric Utilities**: Line drawing (Bresenham), rectangles, circles, neighbors
- **Validation**: Grid bounds checking, adjacency verification
- **Serialization**: Event-safe serialization to plain objects

Implementation: [src/core/Position.js](../../src/core/Position.js)

## Consequences

### Positive

- **99/99 Tests Passing**: Comprehensive test coverage ensures correctness
- **Eliminated Duplication**: Position logic now in one place instead of 20+ files
- **Consistent Behavior**: All distance calculations use same algorithms
- **Better Readability**: `position.chebyshevDistance(target)` vs manual `Math.max(Math.abs(x1-x2), Math.abs(y1-y2))`
- **Immutability**: Operations return new instances, preventing accidental mutations
- **Rich API**: 40+ methods for common operations (neighbors, rectangles, line drawing)
- **Type Safety**: Clear Position instances vs plain objects
- **Backward Compatible**: Existing `{x, y}` patterns still work via `.x` and `.y` properties

### Negative

- **Migration Effort**: Required migrating 100+ files (completed)
- **Memory Overhead**: Position objects slightly larger than plain `{x, y}` objects
- **Learning Curve**: Developers need to learn the Position API
- **Object Creation**: Immutable operations create new instances (minor GC pressure)

### Neutral

- New position-related code should use Position class methods
- Plain `{x, y}` objects still acceptable for serialization/storage
- Position instances can be freely mixed with `{x, y}` objects

## Implementation Notes

### Creating Positions

```javascript
// Factory methods
const pos = new Position(5, 10);
const pos = Position.from({x: 5, y: 10});
const pos = Position.of(5, 10);
const pos = Position.center(); // Grid center
const pos = Position.zero();   // Origin
```

### Distance Calculations

```javascript
// Before (duplicated across files)
const distance = Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));

// After (centralized)
const distance = pos1.chebyshevDistance(pos2);
const distance = pos1.distanceTo(pos2); // Alias
```

### Direction and Movement

```javascript
// Direction to target
const direction = currentPos.directionTo(targetPos);

// Move in direction
const newPos = currentPos.move('arrowright', 2); // 2 tiles right

// Check adjacency
if (pos1.isAdjacentTo(pos2)) { /* ... */ }
```

### Neighbor Generation

```javascript
// Get all 8 neighbors (Chebyshev)
const neighbors = position.neighbors();

// Get only orthogonal neighbors (Manhattan)
const orthogonal = position.orthogonalNeighbors();

// Get diagonal neighbors
const diagonals = position.diagonalNeighbors();
```

### Line Drawing (Bresenham)

```javascript
// Before (3 different implementations across files)
// ... complex manual Bresenham code ...

// After
const points = start.lineTo(end);
```

### Backward Compatibility

```javascript
// Old code still works
const pos = new Position(5, 10);
console.log(pos.x); // 5
console.log(pos.y); // 10

// Can be used in plain object contexts
const serialized = { x: pos.x, y: pos.y };
```

## Migration Checklist

- [x] Implement Position class with comprehensive API
- [x] Write 99 unit tests covering all operations
- [x] Migrate core systems (Player, Enemy, Grid)
- [x] Migrate managers and generators
- [x] Migrate renderers and UI
- [x] Update all tests to use Position
- [x] Document migration in MIGRATION_COMPLETE.md

## Related Decisions

- Complements ADR-0001: Position accessed through game systems using ServiceContainer

## References

- [Value Object Pattern](https://martinfowler.com/bliki/ValueObject.html) by Martin Fowler
- Implementation: [src/core/Position.js](../../src/core/Position.js)
- Tests: [tests/Position.test.js](../../tests/Position.test.js)
- Migration Guide: [docs/MIGRATION_COMPLETE.md](../MIGRATION_COMPLETE.md)
