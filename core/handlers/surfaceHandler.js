import { TILE_TYPES, GRID_SIZE } from '../constants.js';
import logger from '../logger.js';
import { ZoneStateManager } from '../../generators/ZoneStateManager.js';
import { FeatureGenerator } from '../../generators/FeatureGenerator.js';
import { ItemGenerator } from '../../generators/ItemGenerator.js';
import { StructureGenerator } from '../../generators/StructureGenerator.js';
import { EnemyGenerator } from '../../generators/EnemyGenerator.js';
import { PathGenerator } from '../../generators/PathGenerator.js';

export function handleSurface(zoneGen, zoneX, zoneY, zoneConnections, foodAssets) {
    const zoneLevel = ZoneStateManager.getZoneLevel(zoneX, zoneY);
    const isHomeZone = (zoneX === 0 && zoneY === 0);

    const structureGenerator = new StructureGenerator(zoneGen.grid);
    const featureGenerator = new FeatureGenerator(zoneGen.grid, foodAssets, 0);
    const itemGenerator = new ItemGenerator(zoneGen.grid, foodAssets, zoneX, zoneY, 0, 0);
    const enemyGenerator = new EnemyGenerator(zoneGen.enemies, 0);
    const pathGenerator = new PathGenerator(zoneGen.grid);

    zoneGen.addRegionNotes(`${zoneX},${zoneY}`, structureGenerator);

    if (isHomeZone) {
        structureGenerator.addHouse(zoneX, zoneY);
        structureGenerator.addSign("WOODCUTTERS<br>CLUB", zoneX, zoneY);
    }

    zoneGen.generateExits(zoneX, zoneY, zoneConnections, featureGenerator, zoneLevel);
    if (zoneLevel === 4 && !ZoneStateManager.firstFrontierSignPlaced) {
        structureGenerator.addSign("TURN BACK");
        ZoneStateManager.firstFrontierSignPlaced = true;
    }

    if (!isHomeZone) {
        ZoneStateManager.zoneCounter++;
        featureGenerator.addRandomFeatures(zoneLevel, zoneX, zoneY);

        if (zoneLevel === 4 && !ZoneStateManager.wellSpawned) structureGenerator.addWell(zoneX, zoneY);
        if (zoneLevel === 3 && !ZoneStateManager.wildsShackSpawned && !ZoneStateManager.firstWildsZonePlaced) {
            zoneGen.clearZoneForShackOnly();
            if (zoneGen.forcePlaceShackInCenter(zoneX, zoneY)) {
                ZoneStateManager.wildsShackSpawned = true;
                ZoneStateManager.wildsShackSpawnZone = { x: zoneX, y: zoneY };
                ZoneStateManager.firstWildsZonePlaced = true;
                logger.log(`FIRST WILDS ZONE: Shack placed in zone (${zoneX}, ${zoneY}) - no other features`);
            }
        } else if (zoneLevel === 3 && !ZoneStateManager.wildsShackSpawned) {
            if (structureGenerator.addShack(zoneX, zoneY)) {
                ZoneStateManager.wildsShackSpawned = true;
                ZoneStateManager.wildsShackSpawnZone = { x: zoneX, y: zoneY };
            }
        }
        if (zoneLevel === 2 && !ZoneStateManager.deadTreeSpawned) structureGenerator.addDeadTree(zoneX, zoneY);

        if (zoneLevel === 2 && !ZoneStateManager.hammerWarningSignPlaced) {
            structureGenerator.addSign("FIND THE HAMMER<br>IN THE WOODS");
            ZoneStateManager.hammerWarningSignPlaced = true;
        }

        if (Math.random() < 0.07) structureGenerator.addCistern(zoneX, zoneY, false);

        itemGenerator.addLevelBasedFoodAndWater();

        const baseProbabilities = { 1: 0.11, 2: 0.15, 3: 0.17, 4: 0.22 };
        const baseEnemyProbability = baseProbabilities[zoneLevel] || 0.11;
        const enemyProbability = baseEnemyProbability + Math.floor(ZoneStateManager.zoneCounter / 10) * 0.01;

        if (Math.random() < enemyProbability) {
            enemyGenerator.addRandomEnemyWithValidation(zoneLevel, zoneX, zoneY, zoneGen.grid, []);
        }

        itemGenerator.addSpecialZoneItems();
    }

    pathGenerator.ensureExitAccess();
    zoneGen.playerSpawn = zoneGen.findValidPlayerSpawn();

    return {
        grid: JSON.parse(JSON.stringify(zoneGen.grid)),
        enemies: [...zoneGen.enemies],
        playerSpawn: zoneGen.playerSpawn ? { ...zoneGen.playerSpawn } : null
    };
}
