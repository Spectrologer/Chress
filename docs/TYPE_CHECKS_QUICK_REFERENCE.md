# TypeChecks.js Quick Reference

One-page cheat sheet for using standardized type checking utilities.

## Import

```javascript
import {
  // Core utilities
  getTileType,
  isTileObject,
  isTileType,
  isValidTile,

  // Specific checkers (60+)
  isBomb,
  isFloor,
  isWall,
  isExit,
  isPort,
  isAxe,
  isHammer,
  isShovel,
  isSign,
  // ... many more

  // Category checkers
  isWalkable,
  isItem,
  isNPC,
  isStatue,
  isChoppable,
  isBreakable,

  // Advanced helpers
  isTileObjectOfType,
  getTileProperty,
  hasTileProperty,
} from "../utils/TypeChecks.js";
```

## Common Patterns

### ✅ Check if tile is a specific type

```javascript
// OLD
if (getTileType(tile) === TILE_TYPES.BOMB) { ... }
if (tile === TILE_TYPES.FLOOR) { ... }

// NEW
if (isBomb(tile)) { ... }
if (isFloor(tile)) { ... }
```

### ✅ Validate tile is an object before property access

```javascript
// OLD
if (tapTile && typeof tapTile === "object" && tapTile !== null) {
  return tapTile.actionsSincePlaced;
}

// NEW
if (isTileObject(tapTile)) {
  return tapTile.actionsSincePlaced;
}
```

### ✅ Check object tile has specific type

```javascript
// OLD
if (
  !(tapTile && typeof tapTile === "object" && tapTile.type === TILE_TYPES.BOMB)
) {
  return false;
}

// NEW
if (!isTileObjectOfType(tapTile, TILE_TYPES.BOMB)) {
  return false;
}
```

### ✅ Safe property access

```javascript
// OLD
const actions = tile && typeof tile === "object" ? tile.actionsSincePlaced : 0;

// NEW
const actions = getTileProperty(tile, "actionsSincePlaced") ?? 0;
```

### ✅ Multiple type checks

```javascript
// OLD
if (
  type === TILE_TYPES.AXE ||
  type === TILE_TYPES.HAMMER ||
  type === TILE_TYPES.SHOVEL
) {
  return true;
}

// NEW
if (isAxe(tile) || isHammer(tile) || isShovel(tile)) {
  return true;
}
```

### ✅ Category checks

```javascript
// OLD
const walkable =
  type !== TILE_TYPES.WALL &&
  type !== TILE_TYPES.ROCK &&
  type !== TILE_TYPES.HOUSE &&
  type !== TILE_TYPES.SHACK;

// NEW
const walkable = isWalkable(tile);
```

## All Specific Type Checkers

### Terrain

`isFloor()` `isWall()` `isGrass()` `isRock()` `isShrubbery()` `isDeadTree()`

### Buildings

`isHouse()` `isShack()`

### Environmental

`isWater()` `isFood()` `isWell()` `isGrate()` `isPitfall()`

### Tools & Equipment

`isAxe()` `isHammer()` `isBishopSpear()` `isBow()` `isShovel()`

### Special Items

`isBomb()` `isHeart()` `isNote()` `isBookOfTimeTravel()` `isHorseIcon()`

### Interactive

`isSign()` `isPort()` `isExit()` `isTable()`

### NPCs

`isPenne()` `isSquig()` `isNib()` `isRune()` `isCrayn()` `isFelt()` `isForge()` `isMark()` `isAxolotl()` `isGouge()`

### Enemy Statues

`isLizardyStatue()` `isLizardoStatue()` `isLizardeauxStatue()` `isZardStatue()` `isLazerdStatue()` `isLizordStatue()`

### Item Statues

`isBombStatue()` `isSpearStatue()` `isBowStatue()` `isHorseStatue()` `isBookStatue()` `isShovelStatue()`

## Category Checkers

| Function            | Description                          |
| ------------------- | ------------------------------------ |
| `isWalkable(tile)`  | Checks if tile allows movement       |
| `isItem(tile)`      | Checks if tile is a collectible item |
| `isNPC(tile)`       | Checks if tile is an interactive NPC |
| `isStatue(tile)`    | Checks if tile is any statue type    |
| `isChoppable(tile)` | Checks if tile requires axe          |
| `isBreakable(tile)` | Checks if tile requires hammer       |

## Core Utilities

| Function                 | Purpose                  | Example                             |
| ------------------------ | ------------------------ | ----------------------------------- |
| `getTileType(tile)`      | Get type number          | `getTileType({type:24})` → `24`     |
| `isTileObject(tile)`     | Check if object          | `isTileObject({type:0})` → `true`   |
| `isTileType(tile, type)` | Check specific type      | `isTileType(tile, TILE_TYPES.BOMB)` |
| `isValidTile(tile)`      | Check not null/undefined | `isValidTile(null)` → `false`       |

## Advanced Helpers

| Function                         | Purpose               | Example                                     |
| -------------------------------- | --------------------- | ------------------------------------------- |
| `isTileObjectOfType(tile, type)` | Object + type check   | `isTileObjectOfType(tile, TILE_TYPES.BOMB)` |
| `getTileProperty(tile, prop)`    | Safe property access  | `getTileProperty(tile, 'message')`          |
| `hasTileProperty(tile, prop)`    | Check property exists | `hasTileProperty(tile, 'justPlaced')`       |

## Common Mistakes

### ❌ WRONG: Negating without !

```javascript
// BEFORE:
if (tile !== TILE_TYPES.WALL) { ... }

// INCORRECT:
if (isWall(tile)) { ... }  // Logic inverted!
```

### ✅ CORRECT: Proper negation

```javascript
if (!isWall(tile)) { ... }
```

### ❌ WRONG: Assuming primitive when checking object type

```javascript
if (isBomb(tile)) {
  return tile.actionsSincePlaced; // Might be primitive!
}
```

### ✅ CORRECT: Use isTileObjectOfType

```javascript
if (isTileObjectOfType(tile, TILE_TYPES.BOMB)) {
  return tile.actionsSincePlaced; // Safe!
}
```

## Testing

Run tests to verify behavior:

```bash
node tests/TypeChecks.test.js
```

## Documentation

- **Full Guide**: [docs/TYPE_CHECKING_MIGRATION_GUIDE.md](TYPE_CHECKING_MIGRATION_GUIDE.md)
- **Refactoring Help**: [scripts/refactor-type-checks.md](../scripts/refactor-type-checks.md)
- **Summary**: [TYPE_CHECKING_REFACTORING_SUMMARY.md](../TYPE_CHECKING_REFACTORING_SUMMARY.md)
- **Source Code**: [utils/TypeChecks.js](../utils/TypeChecks.js)
