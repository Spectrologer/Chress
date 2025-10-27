// Console Commands for debugging and testing

import { TILE_TYPES, GRID_SIZE } from './constants/index.js';
import { Enemy } from '../entities/Enemy.js';
import { logger } from './logger.js';
import { customZoneLoader } from '../loaders/CustomZoneLoader.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';

// Generic spawn utility that reduces code duplication
function spawnAtPosition(game, tileValue, itemName) {
  const pos = findSpawnPosition(game);
  if (pos) {
    game.grid[pos.y][pos.x] = tileValue;
    logger.log(`Spawned ${itemName} at`, pos);
  } else {
    logger.log('No valid spawn position found');
  }
}

const consoleCommands = {
  // Spawn commands - now using generic utility
  spawnBomb: (game) => spawnAtPosition(game, TILE_TYPES.BOMB, 'bomb'),  // Spawns pickup item
  spawnTimedBomb: (game) => spawnAtPosition(game, { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true }, 'timed bomb'),  // Spawns active bomb
  spawnHorseIcon: (game) => spawnAtPosition(game, { type: TILE_TYPES.HORSE_ICON, uses: 3 }, 'horse icon'),

  spawnEnemy: function(game, enemyType = 'lizardy') {
    const pos = findSpawnPosition(game);
    if (pos) {
      const enemy = new Enemy({ x: pos.x, y: pos.y, enemyType: enemyType, id: Date.now() });
      game.enemyCollection.add(enemy);
      logger.log('Spawned enemy', enemyType, 'at', pos);
    } else {
      logger.log('No valid spawn position found');
    }
  },

  // Item spawn commands
  spawnHammer: (game) => spawnAtPosition(game, TILE_TYPES.HAMMER, 'hammer'),
  spawnBishopSpear: (game) => spawnAtPosition(game, { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 }, 'bishop spear'),
  spawnNote: (game) => spawnAtPosition(game, TILE_TYPES.NOTE, 'note'),
  spawnHeart: (game) => spawnAtPosition(game, TILE_TYPES.HEART, 'heart'),
  spawnBook: (game) => spawnAtPosition(game, { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 }, 'Book of Time Travel'),
  spawnBow: (game) => spawnAtPosition(game, { type: TILE_TYPES.BOW, uses: 3 }, 'bow'),
  spawnWater: (game) => spawnAtPosition(game, TILE_TYPES.WATER, 'water'),
  spawnFoodMeat: (game) => spawnAtPosition(game, { type: TILE_TYPES.FOOD, foodType: 'food/meat/beaf.png' }, 'meat'),
  spawnFoodNut: (game) => spawnAtPosition(game, { type: TILE_TYPES.FOOD, foodType: 'food/veg/nut.png' }, 'nut'),
  spawnPenne: (game) => spawnAtPosition(game, TILE_TYPES.PENNE, 'Penne'),
  spawnSquig: (game) => spawnAtPosition(game, TILE_TYPES.SQUIG, 'squig'),
  spawnRune: (game) => spawnAtPosition(game, TILE_TYPES.RUNE, 'rune'),
  spawnNib: (game) => spawnAtPosition(game, TILE_TYPES.NIB, 'nib'),
  spawnMark: (game) => spawnAtPosition(game, TILE_TYPES.MARK, 'Mark'),
  spawnGouge: (game) => spawnAtPosition(game, TILE_TYPES.GOUGE, 'Gouge'),

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

  spawnShovel: (game) => spawnAtPosition(game, { type: TILE_TYPES.SHOVEL, uses: 3 }, 'shovel'),

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

  spawnPitfall: (game) => spawnAtPosition(game, TILE_TYPES.PITFALL, 'pitfall'),

  spawnStairdown: function(game) {
    // Try to place stairdown at player's position if valid, otherwise find random valid spawn
    const playerPos = game.player.getPosition();
    const tileAtPlayer = game.grid[playerPos.y]?.[playerPos.x];
    const canPlaceAtPlayer = tileAtPlayer === TILE_TYPES.FLOOR || (tileAtPlayer && tileAtPlayer.type === TILE_TYPES.FLOOR);
    if (canPlaceAtPlayer) {
      game.grid[playerPos.y][playerPos.x] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };
      logger.log('Placed stairdown at player position', playerPos);
      return;
    }

    const pos = findSpawnPosition(game);
    if (pos) {
      game.grid[pos.y][pos.x] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };
      logger.log('Spawned stairdown at', pos);
    } else {
      logger.log('No valid spawn position found for stairdown');
    }
  },

  // Teleport command
  tp: function(game, x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      logger.log('Usage: tp(x, y) - teleport player to position');
      return;
    }
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      logger.log('Position out of bounds. Valid range: 0 to', GRID_SIZE - 1);
      return;
    }
    game.player.x = x;
    game.player.y = y;
    logger.log('Teleported player to', { x, y });
    game.uiManager.updatePlayerPosition();
  },

  // Go to interior dimension
  gotoInterior: function(game) {
    const currentZone = game.player.getCurrentZone();
    if (currentZone.dimension !== 0) {
      logger.log('Already in a non-surface dimension:', currentZone.dimension);
      return;
    }
    // Find an interior port or create one
    const playerPos = game.player.getPosition();
    game.grid[playerPos.y][playerPos.x] = { type: TILE_TYPES.PORT, portKind: 'interior' };
    logger.log('Created interior port at player position. Use it to enter.');
  },

  // Return to world surface
  gotoWorld: function(game) {
    const currentZone = game.player.getCurrentZone();
    if (currentZone.dimension === 0) {
      logger.log('Already on surface world');
      return;
    }
    // Transition back to surface
    game.zoneTransitionController.transitionToZone(
      currentZone.x,
      currentZone.y,
      'center',
      Math.floor(GRID_SIZE / 2),
      Math.floor(GRID_SIZE / 2),
      0 // dimension 0 = surface
    );
    logger.log('Returned to surface world');
  },

  // Load custom zone
  loadzone: async function(game, zoneName) {
    if (!zoneName || typeof zoneName !== 'string') {
      logger.log('Usage: loadzone("zone_name") - load a custom zone from zones/custom/');
      logger.log('Available zones:', customZoneLoader.getLoadedZones().join(', ') || 'none loaded yet');
      return;
    }

    logger.log(`Loading custom zone: ${zoneName}...`);

    try {
      const zoneData = await customZoneLoader.loadAndConvert(zoneName);

      if (!zoneData) {
        logger.log(`Failed to load zone "${zoneName}". Make sure the file exists in zones/custom/${zoneName}.json`);
        return;
      }

      // Apply the custom zone to the current grid
      const width = Math.min(zoneData.width, GRID_SIZE);
      const height = Math.min(zoneData.height, GRID_SIZE);

      logger.log(`Applying ${width}x${height} custom zone: ${zoneData.name}`);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const cellData = zoneData.grid[row][col];

          // Set terrain
          if (cellData.terrain) {
            const terrainType = TILE_TYPES[cellData.terrain.toUpperCase()];
            game.grid[row][col] = terrainType !== undefined ? terrainType : TILE_TYPES.FLOOR;

            // Log if terrain type not recognized
            if (terrainType === undefined) {
              logger.log(`Warning: Unknown terrain type "${cellData.terrain}" at [${col},${row}], using FLOOR`);
            }
          }

          // Apply feature (overlay on terrain)
          if (cellData.feature) {
            // Handle special port_* format (port_stairup, port_stairdown, etc.)
            if (cellData.feature.startsWith('port_')) {
              const portKind = cellData.feature.substring(5); // Remove 'port_' prefix
              game.grid[row][col] = { type: TILE_TYPES.PORT, portKind: portKind };
              logger.log(`Placed PORT with portKind="${portKind}" at [${col},${row}]`);
            } else {
              const featureType = TILE_TYPES[cellData.feature.toUpperCase()];

              if (featureType !== undefined) {
                game.grid[row][col] = featureType;
              } else {
                // For unrecognized features, log them but don't replace terrain
                logger.log(`Warning: Unknown feature "${cellData.feature}" at [${col},${row}], feature not applied`);
              }
            }
          }
        }
      }

      // Clear enemies in the zone (optional, can be removed if you want to keep them)
      game.enemyCollection.clear(false);

      logger.log(`Custom zone "${zoneData.name}" loaded successfully!`);
      if (zoneData.metadata?.description) {
        logger.log(`Description: ${zoneData.metadata.description}`);
      }

      // Force render update
      if (game.uiManager) {
        game.uiManager.render();
      }

    } catch (error) {
      logger.log(`Error loading custom zone: ${error.message}`);
    }
  },

  // Reload a custom zone (bypass cache)
  reloadzone: async function(game, zoneName) {
    if (!zoneName || typeof zoneName !== 'string') {
      logger.log('Usage: reloadzone("zone_name") - reload a custom zone from disk');
      return;
    }

    logger.log(`Reloading custom zone: ${zoneName}...`);
    await customZoneLoader.reloadZone(zoneName);
    await this.loadzone(game, zoneName);
  },

  // Export current zone or zone at specific coordinates
  exportzone: function(game, x, y, dimension, depth) {
    let zoneData, zoneName, zoneKey;

    // If no parameters, export current zone
    if (x === undefined) {
      const playerZone = game.player.getCurrentZone();
      const currentDepth = game.player.currentZone?.depth || 1;

      zoneKey = createZoneKey(playerZone.x, playerZone.y, playerZone.dimension, currentDepth);
      zoneData = game.zoneRepository.getByKey(zoneKey);
      zoneName = `zone_${playerZone.x}_${playerZone.y}_dim${playerZone.dimension}`;

      if (playerZone.dimension === 2) {
        zoneName += `_depth${currentDepth}`;
      }
    } else {
      // Export specific coordinates
      const useDepth = dimension === 2 ? (depth || 1) : undefined;
      zoneKey = createZoneKey(x, y, dimension, useDepth);
      zoneData = game.zoneRepository.getByKey(zoneKey);
      zoneName = `zone_${x}_${y}_dim${dimension}`;

      if (dimension === 2) {
        zoneName += `_depth${useDepth}`;
      }
    }

    if (!zoneData) {
      logger.log(`Zone not found: ${zoneKey}`);
      logger.log('Usage: exportzone() - export current zone');
      logger.log('       exportzone(x, y, dimension) - export specific zone');
      logger.log('       exportzone(x, y, 2, depth) - export underground zone at depth');
      return;
    }

    logger.log(`Exporting zone: ${zoneKey}`);

    // Convert grid to terrain/features format
    const terrain = [];
    const features = {};

    // Reverse lookup for TILE_TYPES
    const TILE_NAMES = {};
    Object.keys(TILE_TYPES).forEach(key => {
      TILE_NAMES[TILE_TYPES[key]] = key.toLowerCase();
    });

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = zoneData.grid[row][col];

        // Handle tile as number or object
        let tileType, tileName;

        if (typeof tile === 'number') {
          tileType = tile;
          tileName = TILE_NAMES[tile] || 'floor';
        } else if (tile && typeof tile === 'object') {
          tileType = tile.type;
          tileName = TILE_NAMES[tile.type] || 'floor';

          // Special handling for PORT with portKind
          if (tileType === TILE_TYPES.PORT && tile.portKind) {
            tileName = `port_${tile.portKind}`;
          }
        } else {
          tileName = 'floor';
        }

        // Determine if this is terrain or feature
        const isTerrainType = [
          TILE_TYPES.FLOOR,
          TILE_TYPES.GRASS,
          TILE_TYPES.WATER,
          TILE_TYPES.WALL
        ].includes(tileType);

        if (isTerrainType || !tile) {
          terrain.push(tileName);
        } else {
          // Feature on top of floor terrain
          terrain.push('floor');
          features[`${col},${row}`] = tileName;
        }
      }
    }

    const exportData = {
      name: zoneName,
      size: [GRID_SIZE, GRID_SIZE],
      terrain: terrain,
      features: features,
      metadata: {
        description: `Exported from game zone ${zoneKey}`,
        originalZone: zoneKey,
        exported: new Date().toISOString()
      }
    };

    // Download as JSON
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${zoneName}.json`;
    a.click();

    URL.revokeObjectURL(url);

    logger.log(`Zone exported as ${zoneName}.json`);
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
  hotkeyP: function(game) { this.spawnPitfall(game); }, // P for pitfall
  hotkeyT: function(game) { this.spawnStairdown(game); }, // T for stairdown

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
  if (lowerKey === 'z') { this.hotkeyS(game); return true; }
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
      if (lowerKey === 'p') { this.hotkeyP(game); return true; }
  if (lowerKey === 't') { this.hotkeyT(game); return true; }
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
  const enemyHere = game.enemyCollection.hasEnemyAt(x, y);

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
      if (game.enemyCollection.hasEnemyAt(tileX, tileY)) {
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
  if (game.enemyCollection.hasEnemyAt(frontX, frontY)) {
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
