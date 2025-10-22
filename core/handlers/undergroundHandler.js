import { TILE_TYPES, GRID_SIZE } from '../constants.js';
import logger from '../logger.js';
import { ZoneStateManager } from '../../generators/ZoneStateManager.js';
import { FeatureGenerator } from '../../generators/FeatureGenerator.js';
import { ItemGenerator } from '../../generators/ItemGenerator.js';
import { StructureGenerator } from '../../generators/StructureGenerator.js';
import { EnemyGenerator } from '../../generators/EnemyGenerator.js';
import { PathGenerator } from '../../generators/PathGenerator.js';
import { findValidPlayerSpawn as _findValidPlayerSpawn } from '../zoneSpawnManager.js';
import { sanitizeGrid as _sanitizeGrid } from '../zoneSanitizer.js';

export function handleUnderground(zoneGen, zoneX, zoneY, zoneConnections, foodAssets, exitSide) {
    const zoneLevel = ZoneStateManager.getZoneLevel(zoneX, zoneY);
    const isHomeZone = (zoneX === 0 && zoneY === 0);

    logger.log(`[ZONE SPAWN DEBUG] Generating zone (${zoneX}, ${zoneY}) - Level: ${zoneLevel}, Dimension: 2, FirstWildsPlaced: ${ZoneStateManager.firstWildsZonePlaced}, hasExits: ${exitSide !== null}`);

    const structureGenerator = new StructureGenerator(zoneGen.grid);
    // Pass the current underground depth so generators can make depth-specific decisions
    const currentDepth = zoneGen.game?.player?.currentZone?.depth || zoneGen.game?.player?.undergroundDepth || 1;
    const featureGenerator = new FeatureGenerator(zoneGen.grid, foodAssets, currentDepth);
    const itemGenerator = new ItemGenerator(zoneGen.grid, foodAssets, zoneX, zoneY, 2, currentDepth);
    const enemyGenerator = new EnemyGenerator(zoneGen.enemies, currentDepth);
    const pathGenerator = new PathGenerator(zoneGen.grid);

    // Generate exits
    // Delegate to zoneGen.generateExits which will call the mutators (keeps behavior)
    zoneGen.generateExits(zoneX, zoneY, zoneConnections, featureGenerator, zoneLevel);

    ZoneStateManager.zoneCounter++;

    if (!isHomeZone) featureGenerator.addRandomFeatures(zoneLevel, zoneX, zoneY, true);

    if (zoneGen.game.portTransitionData) {
        const isFromHole = zoneGen.game.portTransitionData.from === 'hole';
        const isFromCistern = zoneGen.game.portTransitionData.from === 'cistern';
        const isFromPitfall = zoneGen.game.portTransitionData.from === 'pitfall';
        const isFromStairDown = zoneGen.game.portTransitionData.from === 'stairdown';
        const isFromStairUp = zoneGen.game.portTransitionData.from === 'stairup';

        if (isFromCistern) {
            structureGenerator.addCistern(zoneX, zoneY, true, zoneGen.game.portTransitionData.x, zoneGen.game.portTransitionData.y);
            zoneGen.grid[zoneGen.game.portTransitionData.y + 1][zoneGen.game.portTransitionData.x] = TILE_TYPES.CISTERN;
        } else if (isFromHole || isFromPitfall) {
            zoneGen.grid[zoneGen.game.portTransitionData.y][zoneGen.game.portTransitionData.x] = TILE_TYPES.PORT;
        } else if (isFromStairDown) {
            // Player descended using a stairdown: place a stairup at the emergence point
            zoneGen.grid[zoneGen.game.portTransitionData.y][zoneGen.game.portTransitionData.x] = { type: TILE_TYPES.PORT, portKind: 'stairup' };
        } else if (isFromStairUp) {
            // Player ascended using a stairup: place a stairdown at the emergence point
            zoneGen.grid[zoneGen.game.portTransitionData.y][zoneGen.game.portTransitionData.x] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };
        }
    }

    itemGenerator.addSpecialZoneItems();
    // Randomly spawn a stairdown in underground zones with 15% chance (not in home zone)
    try {
        if (!isHomeZone && Math.random() < 0.15) {
            // Try to place the stairdown on a random valid floor tile
            for (let attempts = 0; attempts < 50; attempts++) {
                const sx = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                const sy = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                const tile = zoneGen.grid[sy][sx];
                const isFloor = tile === TILE_TYPES.FLOOR || (tile && tile.type === TILE_TYPES.FLOOR);
                const isExit = tile === TILE_TYPES.EXIT;
                if (isFloor && !isExit) {
                    zoneGen.grid[sy][sx] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };
                    break;
                }
            }
        }
    } catch (e) {
        // Non-fatal if placement fails
    }
    const isFromPitfall = zoneGen.game.portTransitionData?.from === 'pitfall';

    const baseProbabilities = { 1: 0.15, 2: 0.20, 3: 0.22, 4: 0.27 };
    const baseEnemyProbability = baseProbabilities[zoneLevel] || 0.15;
    const enemyProbability = (baseEnemyProbability + Math.floor(ZoneStateManager.zoneCounter / 10) * 0.01) * (isFromPitfall ? 2.5 : 1);

    if (Math.random() < enemyProbability) {
        enemyGenerator.addRandomEnemyWithValidation(zoneLevel, zoneX, zoneY, zoneGen.grid, []);
    }

    pathGenerator.ensureExitAccess();

    zoneGen.playerSpawn = _findValidPlayerSpawn(zoneGen, isFromPitfall);
    _sanitizeGrid(zoneGen);

    const result = {
        grid: JSON.parse(JSON.stringify(zoneGen.grid)),
        enemies: [...zoneGen.enemies],
        playerSpawn: zoneGen.playerSpawn ? { ...zoneGen.playerSpawn } : null
    };

    // If we generated this underground zone as the result of falling through a hole/pitfall,
    // persist the surface port coordinates so we can return the player to the exact hole when
    // exiting back to the surface.
    if (zoneGen.game.portTransitionData && (zoneGen.game.portTransitionData.from === 'hole' || zoneGen.game.portTransitionData.from === 'pitfall')) {
        result.returnToSurface = {
            from: zoneGen.game.portTransitionData.from,
            x: zoneGen.game.portTransitionData.x,
            y: zoneGen.game.portTransitionData.y
        };
    }

    return result;
}
