import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';
import { logger } from '@core/logger';
import { ZoneStateManager } from '@generators/ZoneStateManager';
import { FeatureGenerator } from '@generators/FeatureGenerator';
import { ItemGenerator } from '@generators/ItemGenerator';
import { StructureGenerator } from '@generators/StructureGenerator';
import { EnemyGenerator } from '@generators/EnemyGenerator';
import { PathGenerator } from '@generators/PathGenerator';
import { ContentRegistry } from '../ContentRegistry';
import { findValidPlacement } from '@generators/GeneratorUtils';

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
    generateExits(zoneConnections: Record<string, unknown>): void {
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
    calculateEnemyProbability(baseProbabilities: Record<number, number>, multiplier = 1): number {
        const baseEnemyProbability = baseProbabilities[this.zoneLevel] || baseProbabilities[1];
        const zoneCounter = this.game.zoneGenState.getZoneCounter();
        return (baseEnemyProbability + Math.floor(zoneCounter / 10) * 0.01) * multiplier;
    }

    /**
     * Attempt to spawn an enemy based on probability
     */
    spawnEnemyIfProbable(probability: number): void {
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
     * Handle gossip NPC spawning based on dimension and level from JSON files
     */
    handleGossipNPCSpawning() {
        // Get all gossip NPCs from ContentRegistry
        const allNPCs = ContentRegistry.getAllNPCs();
        const gossipNPCs = allNPCs.filter(npc => {
            // Check if it's a gossip NPC with required metadata
            if (!npc.metadata ||
                !(npc.metadata as any).characterData ||
                !(npc.metadata as any).characterData.metadata ||
                (npc.metadata as any).characterData.metadata.category !== 'gossip') {
                return false;
            }

            // Check if it has placement data
            if (!npc.placement || npc.placement.spawnWeight === undefined) {
                return false;
            }

            // Get the NPC's dimension and level from placement data
            const npcDimension = npc.placement.dimension ?? 0;
            const npcLevel = npc.placement.level ?? 1;

            // Filter by matching dimension and level
            return npcDimension === this.dimension && npcLevel === this.zoneLevel;
        });

        if (gossipNPCs.length === 0) {
            return;
        }

        // Check each eligible gossip NPC's spawn weight
        for (const npc of gossipNPCs) {
            if (Math.random() < npc.placement.spawnWeight!) {
                // Find a valid placement for the NPC
                const pos = findValidPlacement({
                    maxAttempts: 50,
                    validate: (x, y) => {
                        return this.zoneGen.gridManager.getTile(x, y) === TILE_TYPES.FLOOR;
                    }
                });

                if (pos) {
                    const { x, y } = pos;
                    this.zoneGen.gridManager.setTile(x, y, npc.tileType);
                    logger.log(`Gossip NPC ${(npc.metadata as any).characterData?.name || (npc.metadata as any).name} spawned at zone (${this.zoneX}, ${this.zoneY}) dimension ${this.dimension} level ${this.zoneLevel} at (${x}, ${y})`);
                    // Only spawn one gossip NPC per zone
                    break;
                }
            }
        }
    }

    /**
     * Main generation method - to be implemented by subclasses
     * @returns {Object} Zone data with grid, enemies, and playerSpawn
     */
    generate() {
        throw new Error('generate() must be implemented by subclass');
    }
}
