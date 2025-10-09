import { Sign } from '../Sign.js';
import { TILE_TYPES, GRID_SIZE } from '../constants.js';
import { ZoneStateManager } from './ZoneStateManager.js';
import logger from '../logger.js';

export class FeatureGenerator {
    constructor(grid, foodAssets) {
        this.grid = grid;
        this.foodAssets = foodAssets;
    }

    addRandomFeatures(zoneLevel, zoneX, zoneY) {
        // Check for maze zone generation
        if (this.shouldGenerateMaze(zoneLevel)) {
            this.generateMaze();
            return;
        }

        // Add some random rocks, dirt, grass, and shrubbery patches
        let featureCount = Math.floor(Math.random() * 15) + 10;

        // Reduce feature density in home area (zone level 1)
        if (zoneLevel === 1) {
            featureCount = Math.floor(featureCount * 0.7); // Reduce by 30%
        }
        // Increase feature density in Wilds (zone level 3)
        else if (zoneLevel === 3) {
            featureCount += 5;
        }

        // Flat increase per zones discovered (1 per 10 zones)
        featureCount += Math.floor(ZoneStateManager.zoneCounter / 10);

        for (let i = 0; i < featureCount; i++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Skip if this would block the starting position
            if (x === 1 && y === 1) continue;

            const featureType = Math.random();
            let rockThreshold = zoneLevel === 1 ? 0.25 : 0.35;
            if (featureType < rockThreshold) {
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

        // Add chance tiles past the frontier (zone level 3)
        if (zoneLevel === 3 && Math.random() < 0.15) { // 15% chance
            this.addChanceTile(zoneX, zoneY);
        }

        // Special tinted dirt easter egg zone - very rare chance in the Wilds (zone level 3)
        if (zoneLevel === 3 && !ZoneStateManager.puzzleZoneSpawned && Math.random() < 0.01) { // 1% chance
            this.addSpecialTintZone();
            ZoneStateManager.puzzleZoneSpawned = true;
            logger.log(`Special puzzle zone spawned at (${zoneX}, ${zoneY})`);
        }
    }

    addChanceTile(zoneX, zoneY) {
        // Add a chance tile: could be an extra water, food, or note (5% chance)

        // Try to place a chance tile in a valid location (max 20 attempts)
        for (let attempts = 0; attempts < 20; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                const chanceType = Math.random();
                if (chanceType < 0.05) {
                    // 5% chance for a sign
                    if (!this.checkSignExists()) {
                        const message = Sign.getProceduralMessage(zoneX, zoneY);
                        Sign.spawnedMessages.add(message);
                        this.grid[y][x] = {
                            type: TILE_TYPES.SIGN,
                            message: message
                        };
                    }
                } else if (chanceType < 0.35) {
                    // 30% chance for water
                    this.grid[y][x] = TILE_TYPES.WATER;
                } else {
                    // 65% chance for food
                    // Use seeded random for consistency
                    const zoneKey = `${zoneX},${zoneY}`;
                    const seed = ZoneStateManager.hashCode(zoneKey) % this.foodAssets.length;
                    const selectedFood = this.foodAssets[seed];
                    this.grid[y][x] = {
                        type: TILE_TYPES.FOOD,
                        foodType: selectedFood
                    };
                }
                break; // Successfully placed chance tile
            }
        }
    }

    addSpecialTintZone() {
        // Generate the special tinted dirt zone with colors and effects - fill entire zone

        const tintTypes = [TILE_TYPES.PINK_FLOOR, TILE_TYPES.RED_FLOOR, TILE_TYPES.ORANGE_FLOOR,
                           TILE_TYPES.PURPLE_FLOOR, TILE_TYPES.BLUE_FLOOR, TILE_TYPES.GREEN_FLOOR,
                           TILE_TYPES.YELLOW_FLOOR];

        // Replace ALL interior floor tiles with randomly tinted versions
        for (let y = 1; y < GRID_SIZE - 1; y++) {
            for (let x = 1; x < GRID_SIZE - 1; x++) {
                if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                    const randomTint = tintTypes[Math.floor(Math.random() * tintTypes.length)];
                    this.grid[y][x] = randomTint;
                }
            }
        }

        // Process yellow tile effects: electrify nearby water and paralyze nearby crocodiles
        for (let y = 1; y < GRID_SIZE - 1; y++) {
            for (let x = 1; x < GRID_SIZE - 1; x++) {
                if (this.grid[y][x] === TILE_TYPES.YELLOW_FLOOR) {
                    // Check adjacent tiles (all 8 directions)
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue; // Skip center
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 1 && nx < GRID_SIZE - 1 && ny >= 1 && ny < GRID_SIZE - 1) {
                                if (this.grid[ny][nx] === TILE_TYPES.BLUE_FLOOR) {
                                    // Electrify water - make impassable (orange tile for puzzle room consistency)
                                    this.grid[ny][nx] = TILE_TYPES.ORANGE_FLOOR;
                                } else if (this.grid[ny][nx] === TILE_TYPES.GREEN_FLOOR) {
                                    // Paralyze crocodiles - make safe to walk on
                                    this.grid[ny][nx] = TILE_TYPES.PINK_FLOOR;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    shouldGenerateMaze(zoneLevel) {
        // Home = 0%, Woods = 5%, Wilds = 8%, Frontier = 10%
        let probability = 0;
        switch (zoneLevel) {
            case 2: // Woods
                probability = 0.05;
                break;
            case 3: // Wilds
                probability = 0.08;
                break;
            case 4: // Frontier
                probability = 0.10;
                break;
            default:
                return false; // No mazes in home zones
        }
        return Math.random() < probability;
    }

    generateMaze() {
        // Fill interior with walls first
        for (let y = 1; y < GRID_SIZE - 1; y++) {
            for (let x = 1; x < GRID_SIZE - 1; x++) {
                this.grid[y][x] = TILE_TYPES.WALL;
            }
        }

        // Generate maze using recursive backtracking
        // Start from a random interior position
        const startX = Math.floor(Math.random() * ((GRID_SIZE - 3) / 2)) * 2 + 1;
        const startY = Math.floor(Math.random() * ((GRID_SIZE - 3) / 2)) * 2 + 1;

        this.carveMaze(startX, startY);

        // Add some random blockages with rocks or shrubbery to make it more challenging
        this.addMazeBlockages();
    }

    carveMaze(x, y) {
        this.grid[y][x] = TILE_TYPES.FLOOR;

        // Directions: up, right, down, left
        const directions = [
            { dx: 0, dy: -2 }, // up
            { dx: 2, dy: 0 },  // right
            { dx: 0, dy: 2 },  // down
            { dx: -2, dy: 0 }  // left
        ];

        // Shuffle directions for random maze generation
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        // Try each direction
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (nx > 0 && nx < GRID_SIZE - 1 && ny > 0 && ny < GRID_SIZE - 1 &&
                this.grid[ny][nx] === TILE_TYPES.WALL) {
                // Carve the wall between current and neighbor
                this.grid[y + dir.dy / 2][x + dir.dx / 2] = TILE_TYPES.FLOOR;
                this.carveMaze(nx, ny);
            }
        }
    }

    addMazeBlockages() {
        // Add some rocks and shrubbery to block alternative paths
        const blockages = Math.floor(Math.random() * 5) + 3; // 3-7 blockages

        for (let i = 0; i < blockages; i++) {
            for (let attempts = 0; attempts < 20; attempts++) {
                const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

                if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                    // Randomly choose rock or shrubbery
                    this.grid[y][x] = Math.random() < 0.5 ? TILE_TYPES.ROCK : TILE_TYPES.SHRUBBERY;
                    break;
                }
            }
        }
    }

    blockExitsWithShrubbery(zoneLevel, connections) {
        if (zoneLevel !== 4 || !connections) {
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

    checkSignExists() {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x].type === TILE_TYPES.SIGN) {
                    return true;
                }
            }
        }
        return false;
    }
}
