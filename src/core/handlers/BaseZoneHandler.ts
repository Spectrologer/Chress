import { TILE_TYPES, GRID_SIZE } from '../constants/index';
import { logger } from '../logger';
import { ZoneStateManager } from '../../generators/ZoneStateManager';
import { FeatureGenerator } from '../../generators/FeatureGenerator';
import { ItemGenerator } from '../../generators/ItemGenerator';
import { StructureGenerator } from '../../generators/StructureGenerator';
import { EnemyGenerator } from '../../generators/EnemyGenerator';
import { PathGenerator } from '../../generators/PathGenerator';

/**
 * Base class for zone handlers, providing shared initialization and common patterns
 */
export class BaseZoneHandler {
    protected zoneGen: any;
    protected game: any;
    protected zoneX: number;
    protected zoneY: number;
    protected foodAssets: string[];
    protected dimension: number;
    protected depth: number;
    protected zoneLevel: number;
    protected isHomeZone: boolean;
    protected structureGenerator: StructureGenerator;
    protected featureGenerator: FeatureGenerator;
    protected itemGenerator: ItemGenerator;
    protected enemyGenerator: EnemyGenerator;
    protected pathGenerator: PathGenerator;

    constructor(zoneGen: any, zoneX: number, zoneY: number, foodAssets: string[], dimension = 0, depth = 0) {
        this.zoneGen = zoneGen;
        this.game = zoneGen.game; // Store game reference for state access
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
        this.structureGenerator = new StructureGenerator(this.zoneGen.gridManager, this.game);
        this.featureGenerator = new FeatureGenerator(this.zoneGen.gridManager, this.foodAssets, this.depth, this.game);
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
        const zoneCounter = this.game.zoneGenState.getZoneCounter();
        return (baseEnemyProbability + Math.floor(zoneCounter / 10) * 0.01) * multiplier;
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
        this.game.zoneGenState.incrementZoneCounter();
    }

    /**
     * Main generation method - to be implemented by subclasses
     * @returns {Object} Zone data with grid, enemies, and playerSpawn
     */
    generate() {
        throw new Error('generate() must be implemented by subclass');
    }
}
