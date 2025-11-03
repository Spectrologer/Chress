import { Sign } from '../ui/Sign.js';
import { TILE_TYPES, GRID_SIZE, SPAWN_PROBABILITIES } from '../core/constants/index.ts';
import { randomInt, findValidPlacement, getGridCenter, isWithinBounds } from './GeneratorUtils.js';
import { ZoneStateManager } from './ZoneStateManager.js';
import { PathGenerator } from './PathGenerator.js';
import { ContentRegistry } from '../core/ContentRegistry.js';
import { logger } from '../core/logger.ts';

export class ItemGenerator {
    constructor(gridManager, foodAssets, zoneX, zoneY, dimension, depth) {
        this.gridManager = gridManager;
        this.foodAssets = foodAssets;
        this.zoneX = zoneX;
        this.zoneY = zoneY;
        this.dimension = dimension || 0;
        this.depth = depth || 1;
        this.zoneLevel = ZoneStateManager.getZoneLevel(zoneX, zoneY);
        this.depthMultiplier = 1 + Math.max(0, (this.depth - 1)) * 0.02; // +2% per extra depth
    }

    addLevelBasedFoodAndWater() {
        if (this.dimension === 2) {
            // Underground: Only aguamelin
            if (Math.random() < SPAWN_PROBABILITIES.FOOD_WATER.UNDERGROUND_AGUAMELIN) {
                this._placeItemRandomly({ type: TILE_TYPES.FOOD, foodType: 'items/consumables/aguamelin.png' });
            }
            return;
        }
        // Surface/other: normal logic
        let spawnChance = 0;
        switch (this.zoneLevel) {
            case 1: spawnChance = SPAWN_PROBABILITIES.FOOD_WATER.HOME; break;
            case 2: spawnChance = SPAWN_PROBABILITIES.FOOD_WATER.WOODS; break;
            case 3: spawnChance = SPAWN_PROBABILITIES.FOOD_WATER.WILDS; break;
            case 4: spawnChance = SPAWN_PROBABILITIES.FOOD_WATER.FRONTIER; break;
        }
        if (Math.random() < spawnChance) {
            this.addRandomItem();
        }
    }

    addRandomItem() {
        // Add one water OR food item per zone (randomly choose which)
        const isWater = Math.random() < 0.5;
        let itemType;
        if (isWater) {
            itemType = TILE_TYPES.WATER;
        } else {
            // Ensure there are food assets available before trying to select one
            if (!this.foodAssets || this.foodAssets.length === 0) {
                // Fallback to water if no food is available
                itemType = TILE_TYPES.WATER;
            } else {
                // Use seeded random based on zone position to ensure consistency
                const zoneKey = `${this.zoneX},${this.zoneY}`;
                const seed = ZoneStateManager.hashCode(zoneKey);
                const selectedFood = this.foodAssets[Math.abs(seed) % this.foodAssets.length];
                itemType = {
                    type: TILE_TYPES.FOOD,
                    foodType: selectedFood
                };
            }
        }

        // Use the centralized placement method
        this._placeItemRandomly(itemType);
    }

    addSpecialZoneItems() {
        // Hammer is now an ability obtained through trading with Gouge
        // Remove hammer spawning logic

        const undergroundMultiplier = this.dimension === 2 ? 1.5 : 1.0;

        // Get spawnable items from ContentRegistry
        const spawnableItems = ContentRegistry.getSpawnableItems(this.zoneLevel, this.dimension, this.depth);

        spawnableItems.forEach(itemConfig => {
            // Apply underground multiplier and depth multiplier
            const effectiveMultiplier = undergroundMultiplier * this.depthMultiplier;

            if (Math.random() < itemConfig.spawnWeight * effectiveMultiplier) {
                // Determine tile data to place
                let tileData;

                // Handle items with default uses (weapons/tools)
                if (itemConfig.metadata && itemConfig.metadata.defaultUses) {
                    tileData = { type: itemConfig.tileType, uses: itemConfig.metadata.defaultUses };
                } else {
                    tileData = itemConfig.tileType;
                }

                // Log special NPCs and pitfalls
                const loggableItems = ['squig', 'penne', 'nib', 'mark', 'rune', 'pitfall'];
                let onPlacedCallback = null;

                if (loggableItems.includes(itemConfig.id)) {
                    const displayName = itemConfig.id.charAt(0).toUpperCase() + itemConfig.id.slice(1);
                    onPlacedCallback = (x, y) => logger.log(`${displayName} spawned at zone (${this.zoneX}, ${this.zoneY}) at (${x}, ${y})`);
                }

                this._placeItemRandomly(tileData, onPlacedCallback);
            }
        });

        // Add Axe-O-Lot'l only in the first underground depth (depth === 1) for zone 0,0
        if (this.dimension === 2 && this.zoneX === 0 && this.zoneY === 0 && this.depth === 1) {
            this.addAxelotlItem();
        }
    }

    _placeItemRandomly(itemData, onPlacedCallback = null) {
        const pos = findValidPlacement({
            maxAttempts: 50,
            validate: (x, y) => this.gridManager.getTile(x, y) === TILE_TYPES.FLOOR
        });
        if (pos) {
            const { x, y } = pos;
            this.gridManager.setTile(x, y, itemData);
            if (onPlacedCallback) {
                onPlacedCallback(x, y);
            }
            return true;
        }
        return false;
    }

    // Hammer is now an ability - no longer spawns as item
    // Keeping method for potential future use or console commands

    addCisternItem(force = false) {
        // Cistern generation disabled
    }

    addAxelotlItem() {
        // Try to place the axelotl near the cistern (around center area)
        const center = getGridCenter();
        const centerX = center.x;
        const centerY = center.y;
        for (let r = 0; r < 5; r++) { // Radius around center
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    if (isWithinBounds(x, y) && this.gridManager.getTile(x, y) === TILE_TYPES.FLOOR && !(Math.abs(dx) < 2 && Math.abs(dy) < 2)) {
                        this.gridManager.setTile(x, y, TILE_TYPES.AXELOTL);
                        logger.log(`Axe-O-Lot'l spawned at zone (${this.zoneX}, ${this.zoneY}) at (${x}, ${y})`);
                        return;
                    }
                }
            }
        }
    }

    clearPathToCenter(x, y) {
        const pathGenerator = new PathGenerator(this.gridManager);
        pathGenerator.clearPathToCenterForItem(x, y, this.zoneX, this.zoneY);
    }
}
