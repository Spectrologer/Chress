// Console Commands for debugging and testing

import { TILE_TYPES, GRID_SIZE } from './constants.js';
import { Enemy } from '../entities/Enemy.js';
import logger from './logger.js';

const consoleCommands = {
  // Spawn commands
  spawnBomb: (game) => {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.BOMB;
      logger.log('Spawned bomb at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnHorseIcon: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.HORSE_ICON, uses: 3 };
      logger.log('Spawned horse icon at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnEnemy: function(game, enemyType = 'lizardy') {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.enemies.push(new Enemy({ x: pos.x, y: pos.y, enemyType: enemyType, id: Date.now() }));
      logger.log('Spawned enemy', enemyType, 'at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  // Item spawn commands
  spawnHammer: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.HAMMER;
      logger.log('Spawned hammer at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnBishopSpear: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 };
      logger.log('Spawned bishop spear at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnNote: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.NOTE;
      logger.log('Spawned note at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnHeart: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.HEART;
      logger.log('Spawned heart at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnBook: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 };
      logger.log('Spawned Book of Time Travel at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnBow: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.BOW, uses: 3 };
      logger.log('Spawned bow at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnWater: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.WATER;
      logger.log('Spawned water at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnFoodMeat: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.FOOD, foodType: 'food/meat/beaf.png' };
      logger.log('Spawned meat at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnFoodNut: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.FOOD, foodType: 'food/veg/nut.png' };
      logger.log('Spawned nut at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnPenne: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.PENNE;
      logger.log('Spawned Penne at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnSquig: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.SQUIG;
      logger.log('Spawned squig at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnRune: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.RUNE;
      logger.log('Spawned rune at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnNib: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.NIB;
      logger.log('Spawned nib at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnMark: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.MARK;
      logger.log('Spawned Mark at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnGouge: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = TILE_TYPES.GOUGE;
      logger.log('Spawned Gouge at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnShack: function(game) {
    // Find position and check if enough space for 3x3 shack + 1 front space
    const pos = findShackSpawnPosition(game);
    if (pos) {
      // Place the 3x3 shack
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          if (dy === 2 && dx === 1) { // Middle bottom tile
            game.grid[pos.y + dy][pos.x + dx] = TILE_TYPES.PORT; // Entrance
          } else {
            game.grid[pos.y + dy][pos.x + dx] = TILE_TYPES.SHACK;
          }
        }
      }
      logger.log('Spawned shack at', pos);
    } else {
      logger.log('No valid spawn position found for shack');
    }
  },

  spawnShovel: function(game) {
    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.SHOVEL, uses: 3 };
      logger.log('Spawned shovel at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  spawnCistern: function(game) {
    const pos = findCisternSpawnPosition(game);
    if (pos) {
      // Place the 1x2 cistern
      game.grid[pos.y][pos.x] = TILE_TYPES.PORT;    // Top part (entrance)
      game.grid[pos.y + 1][pos.x] = TILE_TYPES.CISTERN; // Bottom part

      logger.log('Spawned cistern at', pos);
    } else {
      logger.log('No valid spawn position found for cistern');
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
  hotkeyM: function(game) { this.spawnHammer(game); },
  hotkeyV: function(game) { this.spawnShovel(game); }, // V for shovel (vacuum? or V is unused)
  hotkeyS: function(game) { this.spawnBishopSpear(game); },
  hotkeyN: function(game) { this.spawnNote(game); },
  hotkeyR: function(game) { this.spawnHeart(game); },
  hotkeyK: function(game) { this.spawnBook(game); },
  hotkeyY: function(game) { this.spawnBow(game); }, // Y for bow
  hotkeyI: function(game) { this.spawnNib(game); },
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
  hotkeyL: function(game) { this.spawnPenne(game); },
  hotkeyG: function(game) { this.spawnSquig(game); }, // G for green squig

  hotkeyD: function(game) { this.spawnGouge(game); }, // D for Gouge
  hotkeyX: function(game) { this.spawnMark(game); }, // X for Mark
  hotkeyJ: function(game) { this.spawnShack(game); }, // J for shack
  hotkeyC: function(game) { this.spawnCistern(game); }, // C for cistern

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
      if (lowerKey === 'm') { this.hotkeyM(game); return true; }
      if (lowerKey === 'v') { this.hotkeyV(game); return true; }
      if (lowerKey === 's') { this.hotkeyS(game); return true; }
      if (lowerKey === 'n') { this.hotkeyN(game); return true; }
      if (lowerKey === 'r') { this.hotkeyR(game); return true; }
      if (lowerKey === 'k') { this.hotkeyK(game); return true; }
      if (lowerKey === 'y') { this.hotkeyY(game); return true; }
      if (lowerKey === 'i') { this.hotkeyI(game); return true; }
      if (lowerKey === 'e') { this.hotkeyE(game); return true; }
      if (lowerKey === 'w') { this.hotkeyW(game); return true; }
      if (lowerKey === 'f') { this.hotkeyF(game); return true; }
      if (lowerKey === 'u') { this.hotkeyU(game); return true; }
      if (lowerKey === 'l') { this.hotkeyL(game); return true; }
      if (lowerKey === 'g') { this.hotkeyG(game); return true; }
      if (lowerKey === 'd') { this.hotkeyD(game); return true; }
      if (lowerKey === 'x') { this.hotkeyX(game); return true; }
      if (lowerKey === 'j') { this.hotkeyJ(game); return true; }
      if (lowerKey === 'c') { this.hotkeyC(game); return true; }
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

// Helper function to find shack spawn position - finds position for 3x3 shack + front space
function findShackSpawnPosition(game) {
  const availablePositions = [];

  // Scan the entire grid for available 3x3 areas with front space
  for (let y = 1; y < GRID_SIZE - 4; y++) { // Leave space for shack (3) + front (1) + border
    for (let x = 1; x < GRID_SIZE - 3; x++) {
      if (isValidShackPosition(game, x, y)) {
        availablePositions.push({ x, y });
      }
    }
  }

  if (availablePositions.length === 0) {
    return undefined; // No valid positions
  }

  // Pick a random available position
  const randomIndex = Math.floor(Math.random() * availablePositions.length);
  return availablePositions[randomIndex];
}

function isValidShackPosition(game, x, y) {
  // Check 3x3 area
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      const tileX = x + dx;
      const tileY = y + dy;
      if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) {
        return false;
      }
      const tile = game.grid[tileY][tileX];
      if (tile !== TILE_TYPES.FLOOR) {
        return false;
      }
      // Check if any enemy is at this position
      if (game.enemies.some(enemy => enemy.x === tileX && enemy.y === tileY)) {
        return false;
      }
    }
  }

  // Check front space (south of shack, middle)
  const frontX = x + 1;
  const frontY = y + 3;
  if (frontY >= GRID_SIZE) return false;
  const frontTile = game.grid[frontY][frontX];
  if (frontTile !== TILE_TYPES.FLOOR) {
    return false;
  }
  if (game.enemies.some(enemy => enemy.x === frontX && enemy.y === frontY)) {
    return false;
  }

  return true;
}

function findCisternSpawnPosition(game) {
    const availablePositions = [];

    // Scan for available 1x2 vertical space
    for (let y = 1; y < GRID_SIZE - 2; y++) { // y from 1 to GRID_SIZE - 3
        for (let x = 1; x < GRID_SIZE - 1; x++) { // x from 1 to GRID_SIZE - 2
            if (isValidCisternPosition(game, x, y)) {
                availablePositions.push({ x, y });
            }
        }
    }

    if (availablePositions.length === 0) {
        return undefined;
    }

    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    return availablePositions[randomIndex];
}

function isValidCisternPosition(game, x, y) {
    // Check 1x2 vertical area
    for (let dy = 0; dy < 2; dy++) {
        const tileX = x;
        const tileY = y + dy;
        if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) {
            return false;
        }
        if (game.grid[tileY][tileX] !== TILE_TYPES.FLOOR) {
            return false;
        }
    }
    return true;
}

export default consoleCommands;
