# Type Checking Migration Guide

## Overview

This guide documents the migration from inconsistent type checking patterns to the standardized [TypeChecks.js](../utils/TypeChecks.js) utility module.

## Problem Statement

The codebase had **111 instances** of inconsistent type checking patterns:

1. **29 instances** of verbose defensive checks:

   ```javascript
   typeof tile === "object" && tile !== null && tile.type === TILE_TYPES.BOMB;
   ```

2. **102 instances** of direct comparisons (unsafe for object tiles):

   ```javascript
   tile === TILE_TYPES.BOMB;
   ```

3. **123 instances** already using the proper pattern:
   ```javascript
   isTileType(tile, TILE_TYPES.BOMB);
   ```

## Solution

Created [utils/TypeChecks.js](../utils/TypeChecks.js) with standardized utilities that handle both primitive and object tiles seamlessly.

## Migration Patterns

### Pattern 1: Verbose Object Checks

**❌ BEFORE:**

```javascript
if (
  tapTile &&
  typeof tapTile === "object" &&
  tapTile !== null &&
  tapTile.type === TILE_TYPES.BOMB
) {
  return tapTile.actionsSincePlaced > 0;
}
```

**✅ AFTER:**

```javascript
import { isTileObjectOfType } from "../utils/TypeChecks.js";

if (isTileObjectOfType(tapTile, TILE_TYPES.BOMB)) {
  return tapTile.actionsSincePlaced > 0;
}
```

### Pattern 2: Direct Type Comparisons

**❌ BEFORE:**

```javascript
if (
  clickedTileType === TILE_TYPES.EXIT ||
  clickedTileType === TILE_TYPES.PORT
) {
  // Handle navigation
}
```

**✅ AFTER:**

```javascript
import { isExit, isPort } from "../utils/TypeChecks.js";

if (isExit(clickedTile) || isPort(clickedTile)) {
  // Handle navigation
}
```

### Pattern 3: Object Validation Before Property Access

**❌ BEFORE:**

```javascript
if (typeof tile === "object" && tile !== null) {
  const metadata = tile.metadata;
}
```

**✅ AFTER:**

```javascript
import { isTileObject } from "../utils/TypeChecks.js";

if (isTileObject(tile)) {
  const metadata = tile.metadata;
}
```

### Pattern 4: Safe Property Access

**❌ BEFORE:**

```javascript
const actionsSincePlaced =
  tile && typeof tile === "object" ? tile.actionsSincePlaced : 0;
```

**✅ AFTER:**

```javascript
import { getTileProperty } from "../utils/TypeChecks.js";

const actionsSincePlaced = getTileProperty(tile, "actionsSincePlaced") ?? 0;
```

### Pattern 5: Multiple Type Checks

**❌ BEFORE:**

```javascript
if (
  type === TILE_TYPES.AXE ||
  type === TILE_TYPES.HAMMER ||
  type === TILE_TYPES.BISHOP_SPEAR
) {
  return true;
}
```

**✅ AFTER:**

```javascript
import { isAxe, isHammer, isBishopSpear } from "../utils/TypeChecks.js";

if (isAxe(tile) || isHammer(tile) || isBishopSpear(tile)) {
  return true;
}
```

### Pattern 6: Category Checks

**❌ BEFORE:**

```javascript
const isWalkable =
  type !== TILE_TYPES.WALL &&
  type !== TILE_TYPES.ROCK &&
  type !== TILE_TYPES.HOUSE &&
  type !== TILE_TYPES.SHACK;
```

**✅ AFTER:**

```javascript
import { isWalkable } from "../utils/TypeChecks.js";

if (isWalkable(tile)) {
  // Tile allows movement
}
```

## Available Utilities

### Core Functions

| Function                 | Purpose                              | Example                              |
| ------------------------ | ------------------------------------ | ------------------------------------ |
| `getTileType(tile)`      | Normalizes tile to type number       | `getTileType({ type: 24 })` → `24`   |
| `isTileObject(tile)`     | Checks if tile is an object          | `isTileObject({ type: 0 })` → `true` |
| `isTileType(tile, type)` | Checks tile type                     | `isTileType(tile, TILE_TYPES.BOMB)`  |
| `isValidTile(tile)`      | Validates tile is not null/undefined | `isValidTile(null)` → `false`        |

### Specific Type Checkers

All tile types have dedicated checker functions:

```javascript
// Basic terrain
isFloor(tile), isWall(tile), isGrass(tile), isExit(tile), isRock(tile);

// Buildings
isHouse(tile), isShack(tile);

// Environmental
isWater(tile), isFood(tile), isShrubbery(tile), isWell(tile), isDeadTree(tile);

// Tools & Equipment
isAxe(tile), isHammer(tile), isBishopSpear(tile), isBow(tile), isShovel(tile);

// Special items
isBomb(tile),
  isHeart(tile),
  isNote(tile),
  isBookOfTimeTravel(tile),
  isHorseIcon(tile);

// Interactive
isSign(tile), isPort(tile), isGrate(tile), isPitfall(tile), isTable(tile);

// NPCs
isPenne(tile),
  isSquig(tile),
  isNib(tile),
  isRune(tile),
  isCrayn(tile),
  isFelt(tile),
  isForge(tile),
  isMark(tile),
  isAxolotl(tile),
  isGouge(tile);

// Statues
isLizardyStatue(tile),
  isLizardoStatue(tile),
  isLizardeauxStatue(tile),
  isZardStatue(tile),
  isLazerdStatue(tile),
  isLizordStatue(tile),
  isBombStatue(tile),
  isSpearStatue(tile),
  isBowStatue(tile),
  isHorseStatue(tile),
  isBookStatue(tile),
  isShovelStatue(tile);
```

### Category Checkers

```javascript
isStatue(tile); // Any statue type
isWalkable(tile); // Tile allows movement
isItem(tile); // Collectible item
isNPC(tile); // Interactive NPC
isChoppable(tile); // Requires axe
isBreakable(tile); // Requires hammer
```

### Property Helpers

```javascript
getTileProperty(tile, "actionsSincePlaced"); // Safe property access
hasTileProperty(tile, "justPlaced"); // Check property existence
```

### Combined Condition Helpers

```javascript
isTileObjectOfType(tile, TILE_TYPES.BOMB); // Object + type check
isTileObjectWithProperty(tile, type, prop, val); // Object + type + property
```

## Files to Migrate

### High Priority (Most Instances)

1. **controllers/PathfindingController.js** - 6 instances
2. **managers/ZoneManager.js** - 12 instances
3. **managers/BombManager.js** - 4 instances
4. **managers/EnvironmentalInteractionManager.js** - 2 instances
5. **controllers/GestureDetector.js** - 2 instances
6. **renderers/ItemTileRenderer.js** - 1 instance
7. **renderers/strategies/BombRenderStrategy.js** - 1 instance

### Medium Priority

8. **entities/Player.js** - 6 instances
9. **managers/InteractionManager.js** - 1 instance
10. **core/GameInitializer.js** - 1 instance
11. **core/Position.js** - 3 instances
12. **generators/StructureGenerator.js** - 5 instances
13. **generators/FeatureGenerator.js** - 5 instances
14. **core/handlers/interiorHandler.js** - 4 instances

### Files Already Using Good Patterns

These files primarily use `isTileType()` and need minimal changes:

- utils/TileUtils.js (foundational - can re-export from TypeChecks.js)
- managers/inventory/ItemPickupManager.js
- generators/PathGenerator.js
- core/zoneSpawnManager.js

## Migration Steps

### Step 1: Import Utilities

```javascript
// Add at the top of the file
import {
  getTileType,
  isTileObject,
  isTileType,
  isBomb,
  isExit,
  isPort,
  // ... other needed utilities
} from "../utils/TypeChecks.js";
```

### Step 2: Replace Verbose Patterns

Search for: `typeof.*===\s*['"]object['"].*!==\s*null`

Replace with appropriate helper from TypeChecks.js

### Step 3: Replace Direct Comparisons

Search for: `===\s*TILE_TYPES\.(\w+)`

Replace with: `is${$1}(tile)` (use the specific checker function)

### Step 4: Test

Run existing tests to ensure no regressions:

```bash
npm test
```

## Backward Compatibility

The existing [utils/TileUtils.js](../utils/TileUtils.js) will remain functional during migration. You can:

1. **Gradual migration**: Migrate files one at a time
2. **Coexistence**: Both TileUtils.js and TypeChecks.js can be used simultaneously
3. **Eventual consolidation**: After migration, TileUtils.js can re-export from TypeChecks.js

## Benefits

✅ **Consistency**: Single source of truth for type checking
✅ **Readability**: Semantic function names (`isBomb(tile)` vs `tile === TILE_TYPES.BOMB`)
✅ **Safety**: Handles both primitive and object tiles automatically
✅ **Maintainability**: Changes to type checking logic in one place
✅ **Developer Experience**: Clear, documented API with examples
✅ **Error Prevention**: Reduces risk of `undefined is not an object` errors

## Examples from Real Code

### Example 1: BombManager.js

**BEFORE:**

```javascript
if (
  !(tapTile && typeof tapTile === "object" && tapTile.type === TILE_TYPES.BOMB)
) {
  return false;
}
```

**AFTER:**

```javascript
import { isTileObjectOfType } from "../utils/TypeChecks.js";

if (!isTileObjectOfType(tapTile, TILE_TYPES.BOMB)) {
  return false;
}
```

### Example 2: ZoneManager.js

**BEFORE:**

```javascript
if (
  existing &&
  typeof existing === "object" &&
  existing.type === TILE_TYPES.PORT
) {
  portTile = existing;
}
```

**AFTER:**

```javascript
import { isTileObjectOfType } from "../utils/TypeChecks.js";

if (isTileObjectOfType(existing, TILE_TYPES.PORT)) {
  portTile = existing;
}
```

### Example 3: InputCoordinator.js

**BEFORE:**

```javascript
if (
  clickedTileType === TILE_TYPES.EXIT ||
  clickedTileType === TILE_TYPES.PORT
) {
  this.handleNavigationTile(clickedPos);
}
```

**AFTER:**

```javascript
import { isExit, isPort } from "../utils/TypeChecks.js";

if (isExit(clickedTile) || isPort(clickedTile)) {
  this.handleNavigationTile(clickedPos);
}
```

## Testing Strategy

1. **Unit tests**: Each utility function has clear behavior
2. **Integration tests**: Verify type checking in real scenarios
3. **Regression tests**: Ensure existing functionality preserved
4. **Performance**: Verify no performance degradation

## Related Files

- [utils/TypeChecks.js](../utils/TypeChecks.js) - Main utility module
- [utils/TileUtils.js](../utils/TileUtils.js) - Original tile utilities (to be consolidated)
- [core/TileRegistry.js](../core/TileRegistry.js) - Tile metadata and categories
- [core/constants/tiles.js](../core/constants/tiles.js) - TILE_TYPES constants

## Questions?

For questions or issues during migration:

1. Check the examples in this guide
2. Review the TypeChecks.js JSDoc comments
3. Look at migrated files as reference
4. File an issue if you encounter edge cases
