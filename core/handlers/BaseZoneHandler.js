import { TILE_TYPES, GRID_SIZE } from '../constants/index.js';
import { logger } from '../logger.js';
import { ZoneStateManager } from '../../generators/ZoneStateManager.js';
import { FeatureGenerator } from '../../generators/FeatureGenerator.js';
import { ItemGenerator } from '../../generators/ItemGenerator.js';
import { StructureGenerator } from '../../generators/StructureGenerator.js';
import { EnemyGenerator } from '../../generators/EnemyGenerator.js';
import { PathGenerator } from '../../generators/PathGenerator.js';

/**
 * Base class for zone handlers, providing shared initialization and common patterns
 */
export class BaseZoneHandler {
    constructor(zoneGen, zoneX, zoneY, foodAssets, dimension = 0, depth = 0) {
        this.zoneGen = zoneGen;
        this.zoneX = zoneX;
        this.zoneY = zoneY;
        this.foodAssets = foodAssets;
        this.dimension = dimension;
        this.depth = depth;

        this.zoneLevel = ZoneStateManager.getZoneLevel(zoneX, zoneY);
        this.isHomeZone = (zoneX === 0 && zoneY === 0);

        // Initialize generators
        this.initializeGenerators();
    }

    /**
     * Initialize all generator instances with appropriate parameters
     */
    initializeGenerators() {
        this.structureGenerator = new StructureGenerator(this.zoneGen.gridManager);
        this.featureGenerator = new FeatureGenerator(this.zoneGen.gridManager, this.foodAssets, this.depth);
        this.itemGenerator = new ItemGenerator(
            this.zoneGen.gridManager,
            this.foodAssets,
            this.zoneX,
            this.zoneY,
            this.dimension,
            this.depth
        );
        this.enemyGenerator = new EnemyGenerator(this.zoneGen.enemies, this.depth);
        this.pathGenerator = new PathGenerator(this.zoneGen.gridManager);
    }

    /**
     * Generate zone exits based on connections
     */
    generateExits(zoneConnections) {
        this.zoneGen.generateExits(
            this.zoneX,
            this.zoneY,
            zoneConnections,
            this.featureGenerator,
            this.zoneLevel
        );
    }

    /**
     * Ensure all exits are accessible via pathfinding
     */
    ensureExitAccess() {
        this.pathGenerator.ensureExitAccess();
    }

    /**
     * Find a valid spawn point for the player
     * Subclasses can override to provide custom spawn logic
     */
    findPlayerSpawn(isFromPitfall = false) {
        return this.zoneGen.findValidPlayerSpawn();
    }

    /**
     * Build the standard return object with grid, enemies, and spawn
     */
    buildResult() {
        return {
            grid: JSON.parse(JSON.stringify(this.zoneGen.grid)),
            enemies: [...this.zoneGen.enemies],
            playerSpawn: this.zoneGen.playerSpawn ? { ...this.zoneGen.playerSpawn } : null
        };
    }

    /**
     * Add random features to the zone based on level
     */
    addRandomFeatures(isUnderground = false) {
        if (!this.isHomeZone) {
            this.featureGenerator.addRandomFeatures(this.zoneLevel, this.zoneX, this.zoneY, isUnderground);
        }
    }

    /**
     * Add special zone-specific items
     */
    addSpecialZoneItems() {
        this.itemGenerator.addSpecialZoneItems();
    }

    /**
     * Add level-based food and water
     */
    addLevelBasedFoodAndWater() {
        this.itemGenerator.addLevelBasedFoodAndWater();
    }

    /**
     * Calculate enemy probability based on zone level and counter
     */
    calculateEnemyProbability(baseProbabilities, multiplier = 1) {
        const baseEnemyProbability = baseProbabilities[this.zoneLevel] || baseProbabilities[1];
        return (baseEnemyProbability + Math.floor(ZoneStateManager.zoneCounter / 10) * 0.01) * multiplier;
    }

    /**
     * Attempt to spawn an enemy based on probability
     */
    spawnEnemyIfProbable(probability) {
        if (Math.random() < probability) {
            this.enemyGenerator.addRandomEnemyWithValidation(
                this.zoneLevel,
                this.zoneX,
                this.zoneY,
                this.zoneGen.gridManager,
                []
            );
        }
    }

    /**
     * Increment the zone counter (typically called for non-home zones)
     */
    incrementZoneCounter() {
        ZoneStateManager.zoneCounter++;
    }

    /**
     * Main generation method - to be implemented by subclasses
     * @returns {Object} Zone data with grid, enemies, and playerSpawn
     */
    generate() {
        throw new Error('generate() must be implemented by subclass');
    }
}
