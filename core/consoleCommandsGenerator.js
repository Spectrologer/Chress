// Console Commands Generator - Creates command functions from registry
import { SPAWN_REGISTRY, ENEMY_REGISTRY, SPECIAL_COMMANDS } from './consoleCommandsRegistry.js';
import { Enemy } from '../entities/Enemy.js';
import { logger } from './logger.js';
import { TILE_TYPES, GRID_SIZE } from './constants/index.js';
import { SharedStructureSpawner } from '../utils/SharedStructureSpawner.js';

/**
 * Generic spawn utility that reduces code duplication
 * @param {Object} game - Game instance
 * @param {*} tileValue - Tile type or object to spawn
 * @param {string} itemName - Display name for logging
 */
function spawnAtPosition(game, tileValue, itemName) {
  const pos = findSpawnPosition(game);
  if (pos) {
    game.gridManager.setTile(pos.x, pos.y, tileValue);
    logger.log(`Spawned ${itemName} at`, pos);
  } else {
    logger.log('No valid spawn position found');
  }
}

/**
 * Helper function to find spawn position - finds any random available passable tile
 */
function findSpawnPosition(game) {
  const availablePositions = [];

  // Scan the entire grid for available passable tiles
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (isValidSpawnPosition(game, x, y)) {
        availablePositions.push({ x, y });
      }
    }
  }

  if (availablePositions.length === 0) {
    return undefined; // No available positions
  }

  // Pick a random available position
  const randomIndex = Math.floor(Math.random() * availablePositions.length);
  return availablePositions[randomIndex];
}

/**
 * Check if position is valid for spawning
 */
function isValidSpawnPosition(game, x, y) {
  if (!game.gridManager.isWithinBounds(x, y)) {
    return false;
  }

  const tile = game.gridManager.getTile(x, y);
  const walkable = game.player.isWalkable(x, y, game.grid);

  // Check if any enemy is at position
  const enemyHere = game.enemyCollection.hasEnemyAt(x, y);

  return walkable && !enemyHere;
}

/**
 * Generates spawn commands from registry
 * @returns {Object} Object with generated command functions
 */
export function generateSpawnCommands() {
  const commands = {};

  // Generate item spawn commands
  for (const config of SPAWN_REGISTRY) {
    commands[config.commandName] = (game) => {
      spawnAtPosition(game, config.tileValue, config.displayName);
    };
  }

  return commands;
}

/**
 * Generates enemy spawn commands from registry
 * @returns {Object} Object with generated enemy spawn functions
 */
export function generateEnemyCommands() {
  const commands = {};

  // Generic enemy spawner
  commands.spawnEnemy = function(game, enemyType = 'lizardy') {
    const pos = findSpawnPosition(game);
    if (pos) {
      const enemy = new Enemy({ x: pos.x, y: pos.y, enemyType: enemyType, id: Date.now() });
      game.enemyCollection.add(enemy);
      logger.log('Spawned enemy', enemyType, 'at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  };

  // Generate specific enemy spawn commands
  for (const config of ENEMY_REGISTRY) {
    commands[config.commandName] = function(game) {
      commands.spawnEnemy(game, config.enemyType);
    };
  }

  return commands;
}

/**
 * Generates special commands that require custom logic
 * @returns {Object} Object with special command functions
 */
export function generateSpecialCommands() {
  const commands = {};

  commands.spawnShack = function(game) {
    SharedStructureSpawner.spawnShack(game);
  };

  commands.spawnCistern = function(game) {
    SharedStructureSpawner.spawnCistern(game);
  };

  commands.spawnStairdown = function(game) {
    // Try to place stairdown at player's position if valid, otherwise find random valid spawn
    const playerPos = game.player.getPosition();
    const tileAtPlayer = game.gridManager.getTile(playerPos.x, playerPos.y);
    const canPlaceAtPlayer = tileAtPlayer === TILE_TYPES.FLOOR || (tileAtPlayer && tileAtPlayer.type === TILE_TYPES.FLOOR);
    if (canPlaceAtPlayer) {
      game.gridManager.setTile(playerPos.x, playerPos.y, { type: TILE_TYPES.PORT, portKind: 'stairdown' });
      logger.log('Placed stairdown at player position', playerPos);
      return;
    }

    const pos = findSpawnPosition(game);
    if (pos) {
      game.gridManager.setTile(pos.x, pos.y, { type: TILE_TYPES.PORT, portKind: 'stairdown' });
      logger.log('Spawned stairdown at', pos);
    } else {
      logger.log('No valid spawn position found for stairdown');
    }
  };

  // Random food spawner
  commands.spawnFoodRandom = function(game) {
    if (Math.random() < 0.5) {
      spawnAtPosition(game, { type: TILE_TYPES.FOOD, foodType: 'food/meat/beaf.png' }, 'meat');
    } else {
      spawnAtPosition(game, { type: TILE_TYPES.FOOD, foodType: 'food/veg/nut.png' }, 'nut');
    }
  };

  return commands;
}

/**
 * Generates hotkey mappings from registry
 * @param {Object} allCommands - Object containing all command functions
 * @returns {Map<string, string>} Map of hotkey to command name
 */
export function generateHotkeyMap(allCommands) {
  const hotkeyMap = new Map();

  // Add item spawn hotkeys
  for (const config of SPAWN_REGISTRY) {
    if (config.hotkey) {
      hotkeyMap.set(config.hotkey, config.commandName);
    }
  }

  // Add enemy spawn hotkeys
  for (const config of ENEMY_REGISTRY) {
    if (config.hotkey) {
      hotkeyMap.set(config.hotkey, config.commandName);
    }
  }

  // Add special command hotkeys
  for (const config of SPECIAL_COMMANDS) {
    if (config.hotkey) {
      hotkeyMap.set(config.hotkey, config.commandName);
    }
  }

  return hotkeyMap;
}

/**
 * Creates a hotkey handler function
 * @param {Object} commands - Object containing all command functions
 * @param {Map<string, string>} hotkeyMap - Map of hotkeys to command names
 * @returns {Function} Hotkey handler function
 */
export function createHotkeyHandler(commands, hotkeyMap) {
  return function handleHotkey(game, key, shiftKey = false) {
    const lowerKey = key.toLowerCase();

    // Special case: restart game
    if (lowerKey === 'escape') {
      if (confirm('Are you sure you want to restart the game? All progress will be lost.')) {
        game.resetGame();
      }
      return true;
    }

    // Check if key has a mapped command
    if (hotkeyMap.has(lowerKey)) {
      const commandName = hotkeyMap.get(lowerKey);
      if (commands[commandName]) {
        commands[commandName](game);
        return true;
      }
    }

    return false; // Not a hotkey
  };
}
