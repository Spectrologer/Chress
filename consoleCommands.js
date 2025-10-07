// Console Commands for debugging and testing
// These functions can be called directly from the browser console
// e.g., consoleCommands.spawnBishopSpear(game)

import { TILE_TYPES, GRID_SIZE } from './constants.js';
import { Enemy } from './Enemy.js';

const consoleCommands = {
  spawnLizardy: (game) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    const spawnPos = game.player.getValidSpawnPosition();
    if (spawnPos) {
      game.enemies.push(new Enemy(spawnPos.x, spawnPos.y, 'lizardy'));
      console.log(`Spawned lizardy enemy at (${spawnPos.x}, ${spawnPos.y})`);
    } else {
      console.log('No available tiles to spawn enemy');
    }
  },

  spawnLizardeaux: (game) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    const spawnPos = game.player.getValidSpawnPosition();
    if (spawnPos) {
      game.enemies.push(new Enemy(spawnPos.x, spawnPos.y, 'lizardeaux', null, true));
      console.log(`Spawned lizardeaux enemy at (${spawnPos.x}, ${spawnPos.y})`);
    } else {
      console.log('No available tiles to spawn lizardeaux enemy');
    }
  },

  spawnLizardea: (game) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    const spawnPos = game.player.getValidSpawnPosition();
    if (spawnPos) {
      game.enemies.push(new Enemy(spawnPos.x, spawnPos.y, 'lizardea'));
      console.log(`Spawned lizardeaux enemy at (${spawnPos.x}, ${spawnPos.y})`);
    } else {
      console.log('No available tiles to spawn enemy');
    }
  },

  spawnLizardo: (game) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    const spawnPos = game.player.getValidSpawnPosition();
    if (spawnPos) {
      game.enemies.push(new Enemy(spawnPos.x, spawnPos.y, 'lizardo'));
      console.log(`Spawned lizardeaux enemy at (${spawnPos.x}, ${spawnPos.y})`);
    } else {
      console.log('No available tiles to spawn enemy');
    }
  },

  spawnLizalad: (game) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    const spawnPos = game.player.getValidSpawnPosition();
    if (spawnPos) {
      game.enemies.push(new Enemy(spawnPos.x, spawnPos.y, 'lizalad'));
      console.log(`Spawned lizardeaux enemy at (${spawnPos.x}, ${spawnPos.y})`);
    } else {
      console.log('No available tiles to spawn enemy');
    }
  },

  spawnAxe: (game) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    const spawnPos = game.player.getValidSpawnPosition();
    if (spawnPos) {
      game.grid[spawnPos.y][spawnPos.x] = TILE_TYPES.AXE;
      console.log(`Debug: Axe spawned at (${spawnPos.x}, ${spawnPos.y})`);
    } else {
      console.log('No available tiles to spawn axe');
    }
  },

  spawnHammer: (game) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    const spawnPos = game.player.getValidSpawnPosition();
    if (spawnPos) {
      game.grid[spawnPos.y][spawnPos.x] = TILE_TYPES.HAMMER;
      console.log(`Debug: Hammer spawned at (${spawnPos.x}, ${spawnPos.y})`);
    } else {
      console.log('No available tiles to spawn hammer');
    }
  },

  spawnBishopSpear: (game) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    const spawnPos = game.player.getValidSpawnPosition();
    if (spawnPos) {
      game.grid[spawnPos.y][spawnPos.x] = { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 };
      console.log('Spawned bishop spear at (' + spawnPos.x + ',' + spawnPos.y + ')');
    } else {
      console.log('No available tiles to spawn bishop spear');
    }
  },

  forceCanyon: (game) => {
    if (!game || !game.zoneGenerator) {
      console.log('Game not initialized');
      return;
    }
    game.zoneGenerator.constructor.forceCanyonSpawn = true;
    game.player.updateStats();
    console.log('Forcing whispering canyon generation...');
    console.log('Teleported to canyon zone. If canyon generated, it will be forced. If not, try again.');
  },

  puzzleZoneMessage: (game) => {
    console.log("The puzzle zone is now a rare random encounter and cannot be teleported to directly.");
  },

  gotoFoodRoom: (game) => {
    if (!game || !game.zoneGenerator) {
      console.log('Game not initialized');
      return;
    }
    const room = game.zoneGenerator.constructor.foodWaterRoomZone;
    if (room) {
      game.player.setPosition(room.x, room.y);
      game.player.updateStats();
      console.log(`Teleported to food/water room at (${room.x}, ${room.y})`);
    } else {
      game.zoneGenerator.constructor.forceFoodWaterRoom = true;
      game.player.updateStats();
      console.log('Food/water room not spawned yet. Forcing spawn at zone (10, 10)...');
      console.log('Food/water room forced at (10, 10). You can now use "j" again to return.');
    }
  },

  spawnTwoHandedSword: (game) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    const currentPos = game.player.getPosition();
    const enemyAtTarget = game.getEnemyAt(currentPos.x, currentPos.y);
    if (enemyAtTarget) {
      game.player.startBump(enemyAtTarget.x - currentPos.x, enemyAtTarget.y - currentPos.y);
      console.log('Player attacks enemy!');
      enemyAtTarget.startBump(currentPos.x - enemyAtTarget.x, currentPos.y - enemyAtTarget.y);
      enemyAtTarget.takeDamage(999); // Ensure enemy is dead
      console.log('Player defeated enemy!');
    } else {
      console.log('No enemy at player position to attack');
    }
  },

  spawnGiantAxe: (game) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    const targetX = game.player.x;
    const targetY = game.player.y;
    const playerPos = game.player.getPosition();

    // Find Bishop Spear direction
    const bishopSpear = game.player.inventory.find(item => item.type === 'bishop_spear');
    const direction = bishopSpear ? game.player.getDirectionFromItem(bishopSpear) : null;

    if (direction) {
      switch (direction) {
        case 'north':
          targetY -= 1;
          break;
        case 'south':
          targetY += 1;
          break;
        case 'west':
          targetX -= 1;
          break;
        case 'east':
          targetX += 1;
          break;
      }
      game.player.setPosition(targetX, targetY);
      console.log('Bishop Spear charge to (' + targetX + ',' + targetY + ')');

      const enemyAtTarget = game.getEnemyAt(targetX, targetY);
      if (enemyAtTarget) {
        enemyAtTarget.takeDamage(999); // Guaranteed kill
        console.log('Bishop Spear charge attack! Enemy defeated.');
      } else {
        console.log('No enemy at charge location');
      }
    } else {
      console.log('No Bishop Spear in inventory for charge');
    }
  },

  clearEnemies: (game) => {
    if (!game) {
      console.log('Game not initialized');
      return;
    }
    game.enemies = [];
    console.log('Cleared all enemies');
  },

  tp: (game, x, y) => {
    if (!game || !game.player) {
      console.log('Game not initialized');
      return;
    }
    x = parseInt(x);
    y = parseInt(y);
    if (isNaN(x) || isNaN(y)) {
      console.log('Usage: tp(x, y) - coordinates must be numbers');
      return;
    }
    // Set player's zone and transition
    game.player.setCurrentZone(x, y);
    // Transition to zone without exit information (use defaults)
    game.transitionToZone(x, y, 'teleport', Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
    console.log(`Teleported to zone (${x}, ${y})`);
  }

};

export default consoleCommands;
