# Command Registry Pattern

This directory contains the refactored console commands system using the Command Registry pattern.

## Structure

```
commands/
├── README.md                    # This file
├── CommandRegistry.js           # Central registry for managing commands
├── BaseCommand.js               # Abstract base class for all commands
├── SpawnPositionHelper.js       # Utilities for finding spawn positions
├── commandSetup.js              # Command registration and hotkey setup
├── spawn/
│   ├── BaseSpawnCommand.js      # Base class for spawn commands
│   ├── SpawnCommands.js         # Item spawn commands
│   └── EnemySpawnCommands.js    # Enemy spawn commands
└── utility/
    └── UtilityCommands.js       # Utility commands (restart, etc)
```

## Design Pattern

The Command Registry pattern replaces the previous "god object" with:

1. **CommandRegistry**: Central registry managing command registration and execution
2. **Command Classes**: Individual classes for each command, following Single Responsibility Principle
3. **Hotkey Mapping**: Centralized hotkey-to-command mapping
4. **Helper Utilities**: Extracted spawn position logic into separate utilities

## Benefits

- **Modularity**: Each command is a separate class
- **Testability**: Commands can be tested in isolation
- **Extensibility**: Easy to add new commands by creating new classes
- **Maintainability**: Clear separation of concerns
- **Type Safety**: Better structure for potential TypeScript migration

## Usage

### Registering a new command

```javascript
// 1. Create a command class
import { BaseCommand } from '../BaseCommand.js';

export class MyCommand extends BaseCommand {
    execute(game, ...args) {
        // Command logic here
    }
}

// 2. Register in commandSetup.js
import { MyCommand } from './MyCommand.js';

registry.register('myCommand', new MyCommand());

// 3. (Optional) Add hotkey mapping
registry.registerHotkey('q', 'myCommand');
```

### Executing commands

```javascript
// Via registry
registry.execute('spawnBomb', game);

// Via legacy interface (for backwards compatibility)
consoleCommands.spawnBomb(game);

// Via hotkey
registry.handleHotkey(game, 'b'); // spawns bomb
```

## Backwards Compatibility

The [consoleCommands.js](../consoleCommands.js) file maintains the old API surface as a facade over the new registry system. All existing code continues to work without changes.

## Adding New Spawn Commands

For simple spawn commands, extend `BaseSpawnCommand`:

```javascript
import { BaseSpawnCommand } from './BaseSpawnCommand.js';
import { TILE_TYPES } from '../../constants.js';

export class SpawnMyItemCommand extends BaseSpawnCommand {
    getTileToSpawn() {
        return TILE_TYPES.MY_ITEM;
    }

    getItemName() {
        return 'my item';
    }
}
```

For complex spawn logic, override the `execute` method:

```javascript
export class ComplexSpawnCommand extends BaseSpawnCommand {
    execute(game) {
        // Custom spawn logic
    }
}
```
