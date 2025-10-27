# Type Checking Refactoring Script Guide

This document provides regex patterns and replacement strategies to assist in migrating from inconsistent type checking patterns to the standardized TypeChecks.js utilities.

## Automated Find & Replace Patterns

### Pattern 1: Verbose Object Type Checks

**Find:**
```regex
(\w+)\s*&&\s*typeof\s+\1\s*===\s*['"]object['"]\s*&&\s*\1\.type\s*===\s*TILE_TYPES\.(\w+)
```

**Replace with:**
```javascript
isTileObjectOfType($1, TILE_TYPES.$2)
```

**Example:**
```javascript
// BEFORE:
tapTile && typeof tapTile === 'object' && tapTile.type === TILE_TYPES.BOMB

// AFTER:
isTileObjectOfType(tapTile, TILE_TYPES.BOMB)
```

### Pattern 2: Object Null Check

**Find:**
```regex
typeof\s+(\w+)\s*===\s*['"]object['"]\s*&&\s*\1\s*!==\s*null
```

**Replace with:**
```javascript
isTileObject($1)
```

**Example:**
```javascript
// BEFORE:
typeof tile === 'object' && tile !== null

// AFTER:
isTileObject(tile)
```

### Pattern 3: Direct Type Comparisons

**Find:**
```regex
getTileType\((\w+)\)\s*===\s*TILE_TYPES\.(\w+)
```

**Replace with:**
```javascript
is$2($1)
```

**Example:**
```javascript
// BEFORE:
getTileType(tile) === TILE_TYPES.BOMB

// AFTER:
isBomb(tile)
```

### Pattern 4: isTileType Simplification

**Find:**
```regex
isTileType\((\w+),\s*TILE_TYPES\.(\w+)\)
```

**Replace with:**
```javascript
is$2($1)
```

**Example:**
```javascript
// BEFORE:
isTileType(tile, TILE_TYPES.FLOOR)

// AFTER:
isFloor(tile)
```

## Type-Specific Replacements

### Common Tile Types

| Old Pattern | New Pattern |
|------------|-------------|
| `tile === TILE_TYPES.FLOOR` | `isFloor(tile)` |
| `tile === TILE_TYPES.WALL` | `isWall(tile)` |
| `tile === TILE_TYPES.BOMB` | `isBomb(tile)` |
| `tile === TILE_TYPES.EXIT` | `isExit(tile)` |
| `tile === TILE_TYPES.PORT` | `isPort(tile)` |
| `tile === TILE_TYPES.SIGN` | `isSign(tile)` |
| `tile === TILE_TYPES.GRASS` | `isGrass(tile)` |
| `tile === TILE_TYPES.ROCK` | `isRock(tile)` |
| `tile === TILE_TYPES.WATER` | `isWater(tile)` |
| `tile === TILE_TYPES.FOOD` | `isFood(tile)` |
| `tile === TILE_TYPES.HEART` | `isHeart(tile)` |
| `tile === TILE_TYPES.AXE` | `isAxe(tile)` |
| `tile === TILE_TYPES.HAMMER` | `isHammer(tile)` |
| `tile === TILE_TYPES.SHOVEL` | `isShovel(tile)` |

## Manual Refactoring Checklist

For each file being refactored:

- [ ] Add imports from TypeChecks.js
- [ ] Replace verbose `typeof` checks with `isTileObject()`
- [ ] Replace direct type comparisons with specific checkers
- [ ] Replace `isTileType()` calls with specific checkers where appropriate
- [ ] Use category checkers (`isWalkable`, `isItem`, etc.) where multiple types are checked
- [ ] Use property helpers (`getTileProperty`, `hasTileProperty`) for safe property access
- [ ] Remove redundant null/undefined checks (handled by utilities)
- [ ] Update tests if necessary
- [ ] Verify functionality with existing tests

## Import Statement Templates

### Minimal Import
```javascript
import { getTileType, isTileObject } from '../utils/TypeChecks.js';
```

### Common Imports
```javascript
import {
    getTileType,
    isTileObject,
    isTileType,
    isBomb,
    isFloor,
    isWall,
    isExit,
    isPort
} from '../utils/TypeChecks.js';
```

### Category Imports
```javascript
import {
    isWalkable,
    isItem,
    isNPC,
    isStatue,
    isChoppable,
    isBreakable
} from '../utils/TypeChecks.js';
```

### Property Helper Imports
```javascript
import {
    getTileProperty,
    hasTileProperty,
    isTileObjectOfType,
    isTileObjectWithProperty
} from '../utils/TypeChecks.js';
```

## File-Specific Refactoring Priority

### High Impact Files (Start Here)

#### 1. managers/BombManager.js
**Patterns to Replace:**
- `tapTile && typeof tapTile === 'object' && tapTile.type === TILE_TYPES.BOMB`
- Access to `tapTile.actionsSincePlaced`

**Suggested Imports:**
```javascript
import { isTileObjectOfType, getTileProperty } from '../utils/TypeChecks.js';
```

#### 2. managers/ZoneManager.js
**Patterns to Replace:**
- Multiple `typeof existing === 'object' && existing.type === TILE_TYPES.PORT` checks
- Direct type comparisons for FLOOR, EXIT, PORT

**Suggested Imports:**
```javascript
import {
    isTileObject,
    isTileObjectOfType,
    isFloor,
    isExit,
    isPort
} from '../utils/TypeChecks.js';
```

#### 3. controllers/PathfindingController.js
**Patterns to Replace:**
- `typeof tile === 'object' && tile !== null` for position validation
- Direct comparisons with TILE_TYPES

**Suggested Imports:**
```javascript
import {
    isTileObject,
    getTileType,
    isWalkable
} from '../utils/TypeChecks.js';
```

#### 4. managers/EnvironmentalInteractionManager.js
**Patterns to Replace:**
- `signTile && typeof signTile === 'object' && signTile.type === TILE_TYPES.SIGN`

**Suggested Imports:**
```javascript
import { isTileObjectOfType, isSign } from '../utils/TypeChecks.js';
```

#### 5. entities/Player.js
**Patterns to Replace:**
- Multiple `isTileType()` calls that can use specific checkers

**Suggested Imports:**
```javascript
import {
    isExit,
    isFloor,
    isShrubbery,
    // ... other specific types
} from '../utils/TypeChecks.js';
```

## Verification Commands

### Find Remaining Verbose Patterns
```bash
# Find verbose object checks
grep -r "typeof.*===.*'object'.*!==.*null" --include="*.js" .

# Find direct TILE_TYPES comparisons
grep -r "===.*TILE_TYPES\." --include="*.js" .

# Find remaining isTileType calls that could be simplified
grep -r "isTileType.*TILE_TYPES\." --include="*.js" .
```

### Count Pattern Occurrences
```bash
# Count verbose patterns
grep -r "typeof.*===.*'object'" --include="*.js" . | wc -l

# Count direct comparisons
grep -r "===.*TILE_TYPES\." --include="*.js" . | wc -l
```

## Testing After Refactoring

After refactoring each file:

1. **Run unit tests:**
   ```bash
   npm test
   ```

2. **Manual smoke testing:**
   - Load the game
   - Test tile interactions
   - Verify bomb placement/explosion
   - Test pathfinding
   - Verify NPC interactions

3. **Check for common issues:**
   - Missing imports
   - Incorrect function names (check casing)
   - Missing tile type constants
   - Logic inversions (e.g., `!==` vs `===`)

## Common Pitfalls

### ⚠️ Pitfall 1: Negation Patterns

**WRONG:**
```javascript
// BEFORE:
if (tile !== TILE_TYPES.WALL) { ... }

// INCORRECT AFTER:
if (isWall(tile)) { ... }  // ❌ Logic inverted!
```

**CORRECT:**
```javascript
if (!isWall(tile)) { ... }  // ✅ Proper negation
```

### ⚠️ Pitfall 2: Type vs Object Checks

**WRONG:**
```javascript
// Need to check if it's an object AND specific type
if (isBomb(tile)) {
    return tile.actionsSincePlaced;  // ❌ Might be primitive!
}
```

**CORRECT:**
```javascript
// Use isTileObjectOfType when accessing object properties
if (isTileObjectOfType(tile, TILE_TYPES.BOMB)) {
    return tile.actionsSincePlaced;  // ✅ Safe!
}
```

### ⚠️ Pitfall 3: Multiple Conditions

**WRONG:**
```javascript
// BEFORE:
if (type === TILE_TYPES.AXE || type === TILE_TYPES.HAMMER) { ... }

// INCORRECT:
if (isAxe(type) || isHammer(type)) { ... }  // ❌ 'type' might be a number!
```

**CORRECT:**
```javascript
if (isAxe(tile) || isHammer(tile)) { ... }  // ✅ Pass the tile, not just type
```

## Progress Tracking

Create a checklist as you refactor:

```markdown
### Refactoring Progress

- [ ] managers/BombManager.js (4 patterns)
- [ ] managers/ZoneManager.js (12 patterns)
- [ ] managers/EnvironmentalInteractionManager.js (2 patterns)
- [ ] controllers/PathfindingController.js (6 patterns)
- [ ] controllers/GestureDetector.js (2 patterns)
- [ ] entities/Player.js (6 patterns)
- [ ] renderers/ItemTileRenderer.js (1 pattern)
- [ ] renderers/strategies/BombRenderStrategy.js (1 pattern)
- [ ] managers/InteractionManager.js (1 pattern)
- [ ] core/GameInitializer.js (1 pattern)
- [ ] core/Position.js (3 patterns)
- [ ] generators/StructureGenerator.js (5 patterns)
- [ ] generators/FeatureGenerator.js (5 patterns)
- [ ] core/handlers/interiorHandler.js (4 patterns)

**Total:** 0/111 patterns migrated
```

## Questions & Troubleshooting

**Q: Should I replace ALL instances at once?**
A: No. Migrate file-by-file and test incrementally.

**Q: What if a file uses both TileUtils and TypeChecks?**
A: That's fine during migration. They can coexist.

**Q: Can I use both `isTileType()` and specific checkers like `isBomb()`?**
A: Yes, but prefer specific checkers for better readability.

**Q: What about performance?**
A: The utilities add negligible overhead. They're simple wrapper functions.

**Q: Some tiles are primitive numbers, others are objects. How do I handle both?**
A: That's exactly what TypeChecks handles! All utilities work with both forms automatically.
