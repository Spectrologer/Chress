// Console Commands for debugging and testing
// This file uses a registry pattern to reduce repetitive code

import { TILE_TYPES, GRID_SIZE } from './constants/index.js';
import { logger } from './logger.js';
import { customZoneLoader } from '../loaders/CustomZoneLoader.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import { PositionValidator } from './PositionValidator.js';
import {
  generateSpawnCommands,
  generateEnemyCommands,
  generateSpecialCommands,
  generateHotkeyMap,
  createHotkeyHandler
} from './consoleCommandsGenerator.js';

// Generate all spawn commands from registry
const spawnCommands = generateSpawnCommands();
const enemyCommands = generateEnemyCommands();
const specialCommands = generateSpecialCommands();

// Utility commands (teleport, zone management, etc.)
const utilityCommands = {
  // Teleport command
  tp: function(game, x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      logger.log('Usage: tp(x, y) - teleport player to position');
      return;
    }
    if (!PositionValidator.isInBounds({ x, y })) {
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
    game.gridManager.setTile(playerPos.x, playerPos.y, { type: TILE_TYPES.PORT, portKind: 'interior' });
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
            game.gridManager.setTile(col, row, terrainType !== undefined ? terrainType : TILE_TYPES.FLOOR);

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
              game.gridManager.setTile(col, row, { type: TILE_TYPES.PORT, portKind: portKind });
              logger.log(`Placed PORT with portKind="${portKind}" at [${col},${row}]`);
            } else {
              const featureType = TILE_TYPES[cellData.feature.toUpperCase()];

              if (featureType !== undefined) {
                game.gridManager.setTile(col, row, featureType);
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
    await utilityCommands.loadzone(game, zoneName);
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

    // Create a temporary GridManager for the zone data
    const tempGridManager = new (game.gridManager.constructor)(zoneData.grid);

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = tempGridManager.getTile(col, row);

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

  // Restart game
  restartGame: function(game) {
    if (confirm('Are you sure you want to restart the game? All progress will be lost.')) {
      game.resetGame();
    }
  }
};

// Combine all commands
const consoleCommands = {
  ...spawnCommands,
  ...enemyCommands,
  ...specialCommands,
  ...utilityCommands
};

// Generate hotkey map and handler
const hotkeyMap = generateHotkeyMap(consoleCommands);
consoleCommands.handleHotkey = createHotkeyHandler(consoleCommands, hotkeyMap);

export default consoleCommands;
