import { TILE_TYPES, GRID_SIZE } from './constants.js';
import { Enemy } from './Enemy.js';
import { Note } from './Note.js';

export class ZoneGenerator {
    static zoneCounter = 0;
    static enemyCounter = 0;
    static axeSpawned = false;
    static hammerSpawned = false;
    static noteSpawned = false;
    constructor() {
        this.grid = null;
        this.enemies = null;
        this.currentZoneX = null;
        this.currentZoneY = null;
    }

    generateZone(zoneX, zoneY, existingZones, zoneConnections, foodAssets) {
        this.currentZoneX = zoneX;
        this.currentZoneY = zoneY;

        // Check if this zone already exists
        const zoneKey = `${zoneX},${zoneY}`;
        if (existingZones.has(zoneKey)) {
            // Load existing zone
            return existingZones.get(zoneKey);
        }

        // Generate new zone structure
        this.initialize();
        
        // Special handling for the starting zone (0,0) - add house and second note
        if (zoneX === 0 && zoneY === 0) {
            this.addHouse();
            this.addSecondNote();
        }
        
        // Generate exits using pre-determined connections
        this.generateExits(zoneX, zoneY, zoneConnections);
        
        // Add random features (skip if this is the house zone to avoid cluttering)
        if (!(zoneX === 0 && zoneY === 0)) {
            this.addRandomFeatures();
            ZoneGenerator.zoneCounter++;
            if (ZoneGenerator.zoneCounter % 9 === 0) {
                this.addRandomItem(foodAssets);
            }
            // Add enemy with similar frequency as food/water (~10% chance per zone)
            if (Math.random() < 0.11) {
                this.addRandomEnemy();
            }
            // Spawn axe item once per world session in zones within 2x2 area around house (Math.abs(zoneX) <= 1 && Math.abs(zoneY) <= 1)
            if (!ZoneGenerator.axeSpawned && Math.abs(zoneX) <= 1 && Math.abs(zoneY) <= 1) {
                this.addAxeItem();
            }
            // Spawn hammer item once per world session in Frontier zones (zone level 3)
            if (!ZoneGenerator.hammerSpawned && this.getZoneLevel() === 3) {
                this.addHammerItem();
            }
        }
        // Try to spawn note once per world session in zones within 1 of home (including home)
        if (!ZoneGenerator.noteSpawned && Math.max(Math.abs(zoneX), Math.abs(zoneY)) <= 1 && Math.random() < 0.5) {
            this.addNote();
        }

        // Ensure exit accessibility
        this.ensureExitAccess();

        // Return the generated grid and enemies
        return { 
            grid: JSON.parse(JSON.stringify(this.grid)), 
            enemies: [...this.enemies] 
        };
    }

    initialize() {
        // Initialize grid with floor tiles
        this.grid = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                this.grid[y][x] = TILE_TYPES.FLOOR;
            }
        }
        this.enemies = [];
        this.addWallBorders();
    }

    addWallBorders() {
        // Add some walls around the borders
        for (let i = 0; i < GRID_SIZE; i++) {
            this.grid[0][i] = TILE_TYPES.WALL; // Top border
            this.grid[GRID_SIZE - 1][i] = TILE_TYPES.WALL; // Bottom border
            this.grid[i][0] = TILE_TYPES.WALL; // Left border
            this.grid[i][GRID_SIZE - 1] = TILE_TYPES.WALL; // Right border
        }
    }

    generateExits(zoneX, zoneY, zoneConnections) {
        // Apply the predetermined exits to current zone
        const zoneKey = `${zoneX},${zoneY}`;
        const connections = zoneConnections.get(zoneKey);

        if (connections) {
            // Apply exits based on pre-generated connections
            if (connections.north !== null) {
                this.grid[0][connections.north] = TILE_TYPES.EXIT;
            }
            if (connections.south !== null) {
                this.grid[GRID_SIZE - 1][connections.south] = TILE_TYPES.EXIT;
            }
            if (connections.west !== null) {
                this.grid[connections.west][0] = TILE_TYPES.EXIT;
            }
            if (connections.east !== null) {
                this.grid[connections.east][GRID_SIZE - 1] = TILE_TYPES.EXIT;
            }
        }

        // Block some exits with shrubbery in Frontier regions (zone level 3)
        this.blockExitsWithShrubbery(zoneX, zoneY, connections);
    }

    addRandomFeatures() {
        // Add some random rocks, dirt, grass, and shrubbery patches
        let featureCount = Math.floor(Math.random() * 15) + 10;

        // Increase feature density in Wilds (zone level 2)
        if (this.getZoneLevel() === 2) {
            featureCount += 5;
        }

        for (let i = 0; i < featureCount; i++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Skip if this would block the starting position
            if (x === 1 && y === 1) continue;

            const featureType = Math.random();
            let zoneLevel = this.getZoneLevel();
            if (featureType < 0.35) {
                this.grid[y][x] = TILE_TYPES.ROCK; // Use rock instead of wall for interior obstacles
            } else if (featureType < (zoneLevel === 2 ? 0.55 : 0.4)) {
                this.grid[y][x] = TILE_TYPES.SHRUBBERY; // More shrubbery in Wilds
            } else if (featureType < 0.7) {
                // Leave as dirt (TILE_TYPES.FLOOR) - this will use directional textures
                continue;
            } else {
                this.grid[y][x] = TILE_TYPES.GRASS;
            }
        }
    }

    addRandomItem(foodAssets) {
        // Add one water OR food item per zone (randomly choose which)
        const isWater = Math.random() < 0.5;
        let itemType;
        if (isWater) {
            itemType = TILE_TYPES.WATER;
        } else {
            // Use seeded random based on zone position to ensure consistency
            const zoneKey = this.getZoneKey();
            const seed = this.hashCode(zoneKey) % foodAssets.length;
            const selectedFood = foodAssets[seed];
            itemType = {
                type: TILE_TYPES.FOOD,
                foodType: selectedFood
            };
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

    addAxeItem() {
        // Add the rare axe item

        // Try to place the axe in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.AXE;
                ZoneGenerator.axeSpawned = true;
                break; // Successfully placed axe
            }
        }
    }

    addHammerItem() {
        // Add the rare hammer item

        // Try to place the hammer in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.HAMMER;
                ZoneGenerator.hammerSpawned = true;
                break; // Successfully placed hammer
            }
        }
    }

    addNote() {
        // Add the note with a specific message

        // Try to place the note in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = {
                    type: TILE_TYPES.NOTE,
                    note: new Note("Your axe should be around here somewhere. - Crayn", x, y)
                };
                ZoneGenerator.noteSpawned = true;
                break; // Successfully placed note
            }
        }
    }

    addSecondNote() {
        // Add the second note with a specific message, placed at a fixed location in the starting zone
        // Position must be clear of house and clearing areas
        const x = 1; // Left side, should be clear of house area
        const y = 8; // Further down but still within 2 tiles from start in some sense

        // Only place if it's in bounds and on a floor tile (should be after house placement)
        if (x >= 1 && x < GRID_SIZE - 1 && y >= 1 && y < GRID_SIZE - 1 && this.grid[y][x] === TILE_TYPES.FLOOR) {
            this.grid[y][x] = {
                type: TILE_TYPES.NOTE,
                note: new Note("Fighting's never worth it! Sometimes.", x, y)
            };
            console.log(`Added second note at (${x}, ${y})`);
        } else {
            console.log(`Could not add second note at (${x}, ${y}): bounds check failed or tile not floor. Current tile:`, this.grid[y][x]);
        }
    }

    addRandomEnemy() {
        // Add one enemy per zone (lizard for now)

        // Try to place the enemy in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                ZoneGenerator.enemyCounter++;
                this.enemies.push({ x, y, enemyType: 'lizard', id: ZoneGenerator.enemyCounter });
                break; // Successfully placed enemy
            }
        }
    }

    ensureExitAccess() {
        // Find all exit tiles and ensure they have clear paths
        const exits = [];
        
        // Collect all exits
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] === TILE_TYPES.EXIT) {
                    exits.push({ x, y });
                }
            }
        }
        
        // For each exit, ensure there's a clear path inward
        exits.forEach(exit => {
            this.clearPathToExit(exit.x, exit.y);
        });
    }

    clearPathToExit(exitX, exitY) {
        // Clear at least one adjacent tile inward from the exit
        let inwardX = exitX;
        let inwardY = exitY;
        
        // Determine inward direction based on exit position
        if (exitY === 0) {
            // Top edge - clear downward
            inwardY = 1;
        } else if (exitY === GRID_SIZE - 1) {
            // Bottom edge - clear upward
            inwardY = GRID_SIZE - 2;
        } else if (exitX === 0) {
            // Left edge - clear rightward
            inwardX = 1;
        } else if (exitX === GRID_SIZE - 1) {
            // Right edge - clear leftward
            inwardX = GRID_SIZE - 2;
        }
        
        // Clear the adjacent tile
        this.grid[inwardY][inwardX] = TILE_TYPES.FLOOR;
        
        // Also clear a path toward the center to ensure connectivity
        this.clearPathToCenter(inwardX, inwardY);
    }

    clearPathToCenter(startX, startY) {
        // Clear a simple path toward the center area
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);
        
        let currentX = startX;
        let currentY = startY;
        
        // Clear tiles along a path toward center (simplified pathfinding)
        while (Math.abs(currentX - centerX) > 1 || Math.abs(currentY - centerY) > 1) {
            // Move toward center one step at a time
            if (currentX < centerX) {
                currentX++;
            } else if (currentX > centerX) {
                currentX--;
            } else if (currentY < centerY) {
                currentY++;
            } else if (currentY > centerY) {
                currentY--;
            }
            
            // Clear this tile if it's not already floor or exit
            if (this.grid[currentY][currentX] === TILE_TYPES.WALL || this.grid[currentY][currentX] === TILE_TYPES.ROCK) {
                this.grid[currentY][currentX] = TILE_TYPES.FLOOR;
            }
            
            // Prevent infinite loops
            if (currentX === centerX && currentY === centerY) {
                break;
            }
        }
    }

    addHouse() {
        // Place a 3x3 house in the center-left area of zone (0,0)
        // Position it so the player can spawn in front of it (to the south)
        const houseStartX = 3; // Start at x=3
        const houseStartY = 3; // Start at y=3
        
        // Place the 3x3 house
        for (let y = houseStartY; y < houseStartY + 3; y++) {
            for (let x = houseStartX; x < houseStartX + 3; x++) {
                if (x >= 1 && x < GRID_SIZE - 1 && y >= 1 && y < GRID_SIZE - 1) {
                    this.grid[y][x] = TILE_TYPES.HOUSE;
                }
            }
        }
        
        // Clear the area in front of the house (south side) for player spawn
        for (let x = houseStartX; x < houseStartX + 3; x++) {
            const frontY = houseStartY + 3; // One row south of the house
            if (frontY < GRID_SIZE - 1) {
                this.grid[frontY][x] = TILE_TYPES.FLOOR;
            }
        }
        
        // Clear a bit more space around the house
        for (let y = houseStartY + 3; y < houseStartY + 5 && y < GRID_SIZE - 1; y++) {
            for (let x = houseStartX - 1; x < houseStartX + 4 && x >= 1 && x < GRID_SIZE - 1; x++) {
                this.grid[y][x] = TILE_TYPES.FLOOR;
            }
        }
    }

    getZoneKey() {
        return `${this.currentZoneX},${this.currentZoneY}`;
    }

    hashCode(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    getZoneLevel() {
        const dist = Math.max(Math.abs(this.currentZoneX), Math.abs(this.currentZoneY));
        if (dist <= 1) return 1; // Home: 3x3 zone area around house (zone 0,0)
        else if (dist <= 7) return 2; // Wilds: 4x4 to 7x7 zone areas
        else return 3; // Frontier: 8x8 onward
    }

    blockExitsWithShrubbery(zoneX, zoneY, connections) {
        if (this.getZoneLevel() !== 3 || !connections) {
            return;
        }

        // Block exits with either rock (20% chance) or shrubbery (20% chance) in Frontier
        if (connections.north !== null) {
            if (Math.random() < 0.2) {
                this.grid[0][connections.north] = TILE_TYPES.ROCK;
            } else if (Math.random() < 0.4) {
                this.grid[0][connections.north] = TILE_TYPES.SHRUBBERY;
            }
        }
        if (connections.south !== null) {
            if (Math.random() < 0.2) {
                this.grid[GRID_SIZE - 1][connections.south] = TILE_TYPES.ROCK;
            } else if (Math.random() < 0.4) {
                this.grid[GRID_SIZE - 1][connections.south] = TILE_TYPES.SHRUBBERY;
            }
        }
        if (connections.west !== null) {
            if (Math.random() < 0.2) {
                this.grid[connections.west][0] = TILE_TYPES.ROCK;
            } else if (Math.random() < 0.4) {
                this.grid[connections.west][0] = TILE_TYPES.SHRUBBERY;
            }
        }
        if (connections.east !== null) {
            if (Math.random() < 0.2) {
                this.grid[connections.east][GRID_SIZE - 1] = TILE_TYPES.ROCK;
            } else if (Math.random() < 0.4) {
                this.grid[connections.east][GRID_SIZE - 1] = TILE_TYPES.SHRUBBERY;
            }
        }
    }
}
