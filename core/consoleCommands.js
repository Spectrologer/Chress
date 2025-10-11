// Console Commands for debugging and testing

import { TILE_TYPES, GRID_SIZE } from './constants.js';
import { Enemy } from '../entities/Enemy.js';

const consoleCommands = {
  // Spawn commands
  spawnBomb: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.BOMB;
      console.log('Spawned bomb at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnHorseIcon: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.HORSE_ICON, uses: 3 };
      console.log('Spawned horse icon at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnEnemy: function(game, enemyType = 'lizardy') {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.enemies.push(new Enemy({ x: pos.x, y: pos.y, enemyType: enemyType, id: Date.now() }));
      console.log('Spawned enemy', enemyType, 'at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  // Item spawn commands
  spawnAxe: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.AXE;
      console.log('Spawned axe at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnHammer: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.HAMMER;
      console.log('Spawned hammer at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnBishopSpear: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 };
      console.log('Spawned bishop spear at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnNote: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.NOTE;
      console.log('Spawned note at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnHeart: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.HEART;
      console.log('Spawned heart at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnBook: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 };
      console.log('Spawned Book of Time Travel at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnBow: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.BOW, uses: 3 };
      console.log('Spawned bow at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnWater: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.WATER;
      console.log('Spawned water at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnFoodMeat: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.FOOD, foodType: 'food/meat/beaf.png' };
      console.log('Spawned meat at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnFoodNut: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.FOOD, foodType: 'food/veg/nut.png' };
      console.log('Spawned nut at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnLion: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.LION;
      console.log('Spawned lion at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnSquig: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.SQUIG;
      console.log('Spawned squig at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  spawnRune: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.RUNE;
      console.log('Spawned rune at', pos);
    } else {
      console.log('No valid spawn position found');
    }
  },

  // Enemy spawn commands (additional)
  spawnLizardeaux: function(game) {
    this.spawnEnemy(game, 'lizardeaux');
  },

  spawnLizord: function(game) {
    this.spawnEnemy(game, 'lizord');
  },

  spawnLazerd: function(game) {
    this.spawnEnemy(game, 'lazerd');
  },

  spawnZard: function(game) {
    this.spawnEnemy(game, 'zard');
  },

  // Hotkey commands
  restartGame: function(game) {
    if (confirm('Are you sure you want to restart the game? All progress will be lost.')) {
      game.resetGame();
    }
  },

  hotkeyB: function(game) { this.spawnBomb(game); },
  hotkeyH: function(game) { this.spawnHorseIcon(game); },
  hotkeyA: function(game) { this.spawnAxe(game); },
  hotkeyM: function(game) { this.spawnHammer(game); },
  hotkeyS: function(game) { this.spawnBishopSpear(game); },
  hotkeyN: function(game) { this.spawnNote(game); },
  hotkeyR: function(game) { this.spawnHeart(game); },
  hotkeyK: function(game) { this.spawnBook(game); },
  hotkeyY: function(game) { this.spawnBow(game); }, // Y for bow
  hotkeyE: function(game) { this.spawnRune(game); },
  hotkeyW: function(game) { this.spawnWater(game); },

  hotkeyF: function(game) {
    if (Math.random() < 0.5) {
      this.spawnFoodMeat(game);
    } else {
      this.spawnFoodNut(game);
    }
  },
  hotkeyU: function(game) { this.spawnFoodNut(game); }, // U for nut
  hotkeyL: function(game) { this.spawnLion(game); },
  hotkeyG: function(game) { this.spawnSquig(game); }, // G for green squig

  hotkeyShift1: function(game) { this.spawnEnemy(game, 'lizardy'); },
  hotkeyShift2: function(game) { this.spawnEnemy(game, 'lizardo'); },
  hotkeyShift3: function(game) { this.spawnEnemy(game, 'lizardeaux'); },
  hotkeyShift4: function(game) { this.spawnEnemy(game, 'lizord'); },
  hotkeyShift5: function(game) { this.spawnEnemy(game, 'lazerd'); },
  hotkeyShift6: function(game) { this.spawnEnemy(game, 'zard'); },

  // Handle hotkey events (for external calling from InputManager)
  handleHotkey: function(game, key, shiftKey = false) {
    const lowerKey = key.toLowerCase();
    if (!shiftKey) {
      // Restart game hotkey
      if (lowerKey === 'escape') { this.restartGame(game); return true; }

      // Items
      if (lowerKey === 'b') { this.hotkeyB(game); return true; }
      if (lowerKey === 'h') { this.hotkeyH(game); return true; }
      if (lowerKey === 'a') { this.hotkeyA(game); return true; }
      if (lowerKey === 'm') { this.hotkeyM(game); return true; }
      if (lowerKey === 's') { this.hotkeyS(game); return true; }
      if (lowerKey === 'n') { this.hotkeyN(game); return true; }
      if (lowerKey === 'r') { this.hotkeyR(game); return true; }
      if (lowerKey === 'k') { this.hotkeyK(game); return true; }
      if (lowerKey === 'y') { this.hotkeyY(game); return true; }
      if (lowerKey === 'e') { this.hotkeyE(game); return true; }
      if (lowerKey === 'w') { this.hotkeyW(game); return true; }
      if (lowerKey === 'f') { this.hotkeyF(game); return true; }
      if (lowerKey === 'u') { this.hotkeyU(game); return true; }
      if (lowerKey === 'l') { this.hotkeyL(game); return true; }
      if (lowerKey === 'g') { this.hotkeyG(game); return true; }
      // Enemies (numbers without shift)
      if (lowerKey === '1') { this.hotkeyShift1(game); return true; }
      if (lowerKey === '2') { this.hotkeyShift2(game); return true; }
      if (lowerKey === '3') { this.hotkeyShift3(game); return true; }
      if (lowerKey === '4') { this.hotkeyShift4(game); return true; }
      if (lowerKey === '5') { this.hotkeyShift5(game); return true; }
      if (lowerKey === '6') { this.hotkeyShift6(game); return true; }
    }
    return false; // Not a hotkey
  }
};

// Helper function to find spawn position - finds any random available passable tile
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

function isValidSpawnPosition(game, x, y) {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
    return false;
  }

  const tile = game.grid[y][x];
  const walkable = game.player.isWalkable(x, y, game.grid);

  // Check if any enemy is at position
  const enemyHere = game.enemies.some(enemy => enemy.x === x && enemy.y === y);

  return walkable && !enemyHere;
}

export default consoleCommands;
