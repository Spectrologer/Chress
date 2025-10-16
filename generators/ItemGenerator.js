import { Sign } from '../ui/Sign.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';
import { randomInt, findValidPlacement, getGridCenter, isWithinBounds } from './GeneratorUtils.js';
import { ZoneStateManager } from './ZoneStateManager.js';
import { PathGenerator } from './PathGenerator.js';
import logger from '../core/logger.js';

export class ItemGenerator {
    constructor(grid, foodAssets, zoneX, zoneY, dimension) {
        this.grid = grid;
        this.foodAssets = foodAssets;
        this.zoneX = zoneX;
        this.zoneY = zoneY;
        this.dimension = dimension || 0;
        this.zoneLevel = ZoneStateManager.getZoneLevel(zoneX, zoneY);
    }

    addLevelBasedFoodAndWater() {
        let spawnChance = 0;

        switch (this.zoneLevel) {
            case 1: // Home
                spawnChance = 0.40;
                break;
            case 2: // Woods
                spawnChance = 0.25;
                break;
            case 3: // Wilds
                spawnChance = 0.15;
                break;
            case 4: // Frontier
                spawnChance = 0.05;
                break;
        }

        // Add the item if the random chance succeeds
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
        // Add enemy with native level-based probability plus flat increase per zones discovered (1% per 10 zones)
        const baseProbabilities = {
            1: 0.11, // Home
            2: 0.15, // Woods
            3: 0.17, // Wilds
            4: 0.22  // Frontier
        };
        const baseEnemyProbability = baseProbabilities[this.zoneLevel] || 0.11; // Default to home probability
        const enemyProbability = baseEnemyProbability + Math.floor(ZoneStateManager.zoneCounter / 10) * 0.01;
        // This will be handled by the main generator

        // Hammer is now an ability obtained through trading with Gouge
        // Remove hammer spawning logic

        const undergroundMultiplier = this.dimension === 2 ? 1.5 : 1.0;

        const specialItems = [
            { name: 'Lion', tile: TILE_TYPES.LION, chance: 0.02, dimension: 0 },
            { name: 'Squig', tile: TILE_TYPES.SQUIG, chance: 0.02, dimension: 0 },
            { name: 'Nib', tile: TILE_TYPES.NIB, chance: 0.02, dimension: 2 },
            { name: 'Mark', tile: TILE_TYPES.MARK, chance: 0.02, dimension: 0 },
            { name: 'Rune', tile: TILE_TYPES.RUNE, chance: 0.02, dimension: 2 },
            { name: 'Note', tile: TILE_TYPES.NOTE, chance: 0.04, dimension: 'any' },
            { name: 'Bishop Spear', tile: { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 }, chance: 0.04, minLevel: 2, maxLevel: 4 },
            { name: 'Horse Icon', tile: { type: TILE_TYPES.HORSE_ICON, uses: 3 }, chance: 0.04, minLevel: 2, maxLevel: 4 },
            { name: 'Bomb', tile: TILE_TYPES.BOMB, chance: 0.04, minLevel: 2, maxLevel: 4 },
            { name: 'Heart', tile: TILE_TYPES.HEART, chance: 0.025, minLevel: 2, maxLevel: 4 },
            { name: 'Bow', tile: { type: TILE_TYPES.BOW, uses: 3 }, chance: 0.04, minLevel: 2, maxLevel: 4 },
        ];

        specialItems.forEach(item => {
            const dimensionMatch = item.dimension === 'any' || item.dimension === this.dimension;
            const levelMatch = (!item.minLevel || this.zoneLevel >= item.minLevel) &&
                               (!item.maxLevel || this.zoneLevel <= item.maxLevel);

            if (dimensionMatch && levelMatch) {
                const multiplier = item.noMultiplier ? 1.0 : undergroundMultiplier;
                if (Math.random() < item.chance * multiplier) {
                    this._placeItem(item);
                }
            }
        });

        // Add Axe-O-Lot'l with 100% chance in underground 0,0
        if (this.dimension === 2 && this.zoneX === 0 && this.zoneY === 0) {
            this.addAxelotlItem();
        }
    }

    _placeItem(item) {
        const loggableItems = ['Lion', 'Squig', 'Nib', 'Mark', 'Rune'];
        let onPlacedCallback = null;

        if (loggableItems.includes(item.name)) {
            onPlacedCallback = (x, y) => logger.log(`${item.name} spawned at zone (${this.zoneX}, ${this.zoneY}) at (${x}, ${y})`);
        }

        this._placeItemRandomly(item.tile, onPlacedCallback);
    }

    _placeItemRandomly(itemData, onPlacedCallback = null) {
        const pos = findValidPlacement({
            maxAttempts: 50,
            validate: (x, y) => this.grid[y][x] === TILE_TYPES.FLOOR
        });
        if (pos) {
            const { x, y } = pos;
            this.grid[y][x] = itemData;
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
        const { centerX, centerY } = getGridCenter();
        for (let r = 0; r < 5; r++) { // Radius around center
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    if (isWithinBounds(x, y) && this.grid[y][x] === TILE_TYPES.FLOOR && !(Math.abs(dx) < 2 && Math.abs(dy) < 2)) {
                        this.grid[y][x] = TILE_TYPES.AXELOTL;
                        logger.log(`Axe-O-Lot'l spawned at zone (${this.zoneX}, ${this.zoneY}) at (${x}, ${y})`);
                        return;
                    }
                }
            }
        }
    }

    clearPathToCenter(x, y) {
        const pathGenerator = new PathGenerator(this.grid);
        pathGenerator.clearPathToCenterForItem(x, y, this.zoneX, this.zoneY);
    }
}
