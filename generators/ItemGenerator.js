import { Sign } from '../ui/Sign.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';
import { ZoneStateManager } from './ZoneStateManager.js';
import { PathGenerator } from './PathGenerator.js';
import logger from '../core/logger.js';

export class ItemGenerator {
    constructor(grid, foodAssets, zoneX, zoneY) {
        this.grid = grid;
        this.foodAssets = foodAssets;
        this.zoneX = zoneX;
        this.zoneY = zoneY;
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

        // Try to place the item in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = itemType;
                break; // Successfully placed item
            }
        }
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

        // Check if the current zone is the designated spawn zone for an item
        if (ZoneStateManager.axeSpawnZone && this.zoneX === ZoneStateManager.axeSpawnZone.x && this.zoneY === ZoneStateManager.axeSpawnZone.y && !ZoneStateManager.axeSpawned) {
            this.addAxeItem();
        }
        if (ZoneStateManager.hammerSpawnZone && this.zoneX === ZoneStateManager.hammerSpawnZone.x && this.zoneY === ZoneStateManager.hammerSpawnZone.y && !ZoneStateManager.hammerSpawned) {
            this.addHammerItem();
        }

        // Add a rare lion with 2% chance per zone
        if (Math.random() < 0.02) { // 2% chance
            this.addLionItem();
        }

        // Add a rare squig with 2% chance per zone
        if (Math.random() < 0.02) { // 2% chance
            this.addSquigItem();
        }

        // Add a rare nib with 2% chance per zone
        if (Math.random() < 0.02) { // 2% chance
            this.addNibItem();
        }

        // Add a rare Mark with 2% chance per zone
        if (Math.random() < 0.02) { // 2% chance
            this.addMarkItem();
        }

        // Add a rare rune with 2% chance per zone
        // if (Math.random() < 0.02) { // 2% chance
        //     this.addRuneItem();
        // }

        // Add a rare note with 4% chance per zone
        if (Math.random() < 0.04) { // 4% chance (reduced slightly)
            this.addNoteItem();
        }

        // Add a bishop spear with a 4% chance in zones level 2-4
        if (this.zoneLevel >= 2 && this.zoneLevel <= 4 && Math.random() < 0.04) {
            this.addSpearItem();
        }

        // Add a horse icon with a 4% chance in zones level 2-4
        if (this.zoneLevel >= 2 && this.zoneLevel <= 4 && Math.random() < 0.04) {
            this.addHorseIconItem();
        }

        // Add a bomb with a 4% chance in zones level 2-4
        if (this.zoneLevel >= 2 && this.zoneLevel <= 4 && Math.random() < 0.04) {
            this.addBombItem();
        }

        // Add a heart with a 2.5% chance in zones level 2-4 (slightly rarer than bombs)
        if (this.zoneLevel >= 2 && this.zoneLevel <= 4 && Math.random() < 0.025) {
            this.addHeartItem();
        }

        // Add a bow with a 4% chance in zones level 2-4
        if (this.zoneLevel >= 2 && this.zoneLevel <= 4 && Math.random() < 0.04) {
            this.addBowItem();
        }
    }

    addAxeItem() {
        // Try to place the axe in a valid location (max 50 attempts)
        let axeX = null;
        let axeY = null;
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.AXE;
                axeX = x;
                axeY = y;
                ZoneStateManager.axeSpawned = true;
                break; // Successfully placed axe
            }
        }

        // Ensure a clear path to the axe from the center
        if (axeX !== null && axeY !== null) {
            this.clearPathToCenter(axeX, axeY);
        }
    }

    addHammerItem() {
        // Try to place the hammer in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.HAMMER;
                ZoneStateManager.hammerSpawned = true;
                break; // Successfully placed hammer
            }
        }
    }

    addSpearItem() {
        // Try to place the bishop spear in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 };
                break; // Successfully placed bishop spear
            }
        }
    }

    addHorseIconItem() {
        // Try to place the horse icon in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = { type: TILE_TYPES.HORSE_ICON, uses: 3 };
                break; // Successfully placed horse icon
            }
        }
    }

    addBombItem() {
        // Try to place the bomb in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.BOMB;
                break; // Successfully placed bomb
            }
        }
    }

    addNoteItem() {
        // Try to place the note in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.NOTE;
                break; // Successfully placed note
            }
        }
    }

    addLionItem() {
        // Try to place the lion in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.LION;
                logger.log(`Lion spawned at zone (${this.zoneX}, ${this.zoneY}) at (${x}, ${y})`);
                break; // Successfully placed lion
            }
        }
    }

    addSquigItem() {
        // Try to place the squig in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.SQUIG;
                logger.log(`Squig spawned at zone (${this.zoneX}, ${this.zoneY}) at (${x}, ${y})`);
                break; // Successfully placed squig
            }
        }
    }

    addNibItem() {
        // Try to place the nib in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.NIB;
                logger.log(`Nib spawned at zone (${this.zoneX}, ${this.zoneY}) at (${x}, ${y})`);
                break; // Successfully placed nib
            }
        }
    }

    addMarkItem() {
        // Try to place the mark in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.MARK;
                logger.log(`Mark spawned at zone (${this.zoneX}, ${this.zoneY}) at (${x}, ${y})`);
                break; // Successfully placed mark
            }
        }
    }

    addRuneItem() {
        // Try to place the rune in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.RUNE;
                logger.log(`Rune spawned at zone (${this.zoneX}, ${this.zoneY}) at (${x}, ${y})`);
                break; // Successfully placed rune
            }
        }
    }

    addHeartItem() {
        // Try to place the heart in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.HEART;
                break; // Successfully placed heart
            }
        }
    }

    addBowItem() {
        // Try to place the bow in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = { type: TILE_TYPES.BOW, uses: 3 };
                break; // Successfully placed bow
            }
        }
    }

    addCisternItem(force = false) {
        // Add a cistern with a 4% chance, or if forced
        if (force || Math.random() < 0.04) {
            // Try to place the cistern in a valid location (max 50 attempts)
            for (let attempts = 0; attempts < 50; attempts++) {
                // Place away from borders, need 1x2 space
                const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1; // x from 1 to GRID_SIZE-2
                const y = Math.floor(Math.random() * (GRID_SIZE - 3)) + 1; // y from 1 to GRID_SIZE-3

                // Check if the 1x2 vertical space is free floor
                if (this.grid[y][x] === TILE_TYPES.FLOOR && this.grid[y + 1][x] === TILE_TYPES.FLOOR) {
                    // Place the 1x2 cistern
                    this.grid[y][x] = TILE_TYPES.PORT;   // Top part (entrance)
                    this.grid[y + 1][x] = TILE_TYPES.CISTERN; // Bottom part
                    logger.log(`Cistern spawned at zone (${this.zoneX}, ${this.zoneY}) at (${x}, ${y})`);
                    break; // Successfully placed cistern
                }
            }
        }
    }

    clearPathToCenter(x, y) {
        const pathGenerator = new PathGenerator(this.grid);
        pathGenerator.clearPathToCenterForItem(x, y, this.zoneX, this.zoneY);
    }
}
