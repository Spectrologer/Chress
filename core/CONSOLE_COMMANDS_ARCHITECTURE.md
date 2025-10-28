# Console Commands Architecture

## Overview

The console commands system has been refactored from 482 lines of repetitive code to a clean registry-based pattern with code generation. This reduces duplication, improves maintainability, and makes it easy to add new commands.

## File Structure

### 1. `consoleCommandsRegistry.js`
**Purpose:** Declarative configuration for all spawn commands

Contains three registries:
- `SPAWN_REGISTRY` - Item spawn commands with tile configurations
- `ENEMY_REGISTRY` - Enemy spawn commands
- `SPECIAL_COMMANDS` - Commands requiring custom logic (structures, special spawns)

**Example entry:**
```javascript
{
  commandName: 'spawnBomb',
  displayName: 'bomb',
  tileValue: TILE_TYPES.BOMB,
  hotkey: 'b'
}
```

### 2. `consoleCommandsGenerator.js`
**Purpose:** Code generation utilities

Provides generator functions:
- `generateSpawnCommands()` - Creates spawn functions from SPAWN_REGISTRY
- `generateEnemyCommands()` - Creates enemy spawn functions from ENEMY_REGISTRY
- `generateSpecialCommands()` - Creates special command functions
- `generateHotkeyMap()` - Creates hotkey-to-command mappings
- `createHotkeyHandler()` - Creates the hotkey event handler

### 3. `consoleCommands.js`
**Purpose:** Main entry point (reduced from 482 to ~300 lines)

- Imports and uses generators to create all commands
- Contains utility commands (tp, loadzone, exportzone, etc.)
- Combines all commands into single export object

## Adding New Commands

### Adding a Simple Item Spawn

Edit `consoleCommandsRegistry.js`:

```javascript
export const SPAWN_REGISTRY = [
  // ... existing entries
  {
    commandName: 'spawnSword',
    displayName: 'sword',
    tileValue: TILE_TYPES.SWORD,
    hotkey: 'q'  // Optional
  }
];
```

That's it! The command `spawnSword()` and hotkey 'q' will be automatically generated.

### Adding an Item with Properties

```javascript
{
  commandName: 'spawnMagicWand',
  displayName: 'magic wand',
  tileValue: { type: TILE_TYPES.WAND, charges: 5, element: 'fire' },
  hotkey: 'w'
}
```

### Adding a New Enemy

Edit `ENEMY_REGISTRY`:

```javascript
export const ENEMY_REGISTRY = [
  // ... existing entries
  { commandName: 'spawnDragon', enemyType: 'dragon', hotkey: '7' }
];
```

### Adding a Special Command

For commands requiring custom logic, add to `SPECIAL_COMMANDS` registry and implement in `consoleCommandsGenerator.js`:

1. Add to registry:
```javascript
export const SPECIAL_COMMANDS = [
  // ... existing
  { commandName: 'spawnDungeon', hotkey: 'o' }
];
```

2. Implement in `generateSpecialCommands()`:
```javascript
export function generateSpecialCommands() {
  const commands = {};

  // ... existing commands

  commands.spawnDungeon = function(game) {
    // Custom logic here
    DungeonGenerator.generateDungeon(game);
    logger.log('Generated dungeon!');
  };

  return commands;
}
```

## Benefits

### Before (Old Pattern)
```javascript
// 40+ repetitive functions like:
spawnBomb: (game) => spawnAtPosition(game, TILE_TYPES.BOMB, 'bomb'),
spawnHammer: (game) => spawnAtPosition(game, TILE_TYPES.HAMMER, 'hammer'),
spawnNote: (game) => spawnAtPosition(game, TILE_TYPES.NOTE, 'note'),
// ... 37 more similar lines

// Plus 30+ hotkey mappings:
hotkeyB: function(game) { this.spawnBomb(game); },
hotkeyH: function(game) { this.spawnHorseIcon(game); },
// ... 28 more similar lines

// Plus 40+ case statements in handleHotkey:
if (lowerKey === 'b') { this.hotkeyB(game); return true; }
if (lowerKey === 'h') { this.hotkeyH(game); return true; }
// ... 38 more similar lines
```

### After (Registry Pattern)
```javascript
// Single registry entry:
{ commandName: 'spawnBomb', displayName: 'bomb', tileValue: TILE_TYPES.BOMB, hotkey: 'b' }

// Everything else is auto-generated!
```

## Metrics

- **Lines of code:** 482 → ~300 in main file (38% reduction)
- **Repetitive patterns:** Eliminated ~110 repetitive lines
- **New command complexity:** 1 line in registry vs 3+ lines of boilerplate
- **Hotkey management:** Automatic from registry (no manual mapping needed)
- **Type safety:** Centralized configuration reduces errors

## Future Enhancements

Potential improvements:
1. TypeScript interfaces for registry entries
2. Runtime validation of registry entries
3. Auto-generated command documentation
4. Command aliasing (multiple names for same command)
5. Command categories/grouping for better organization
