import { Sign } from '../ui/Sign.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';
import { randomInt, findValidPlacement, isWithinBounds, getGridCenter } from './GeneratorUtils.js';
import { ZoneStateManager } from './ZoneStateManager.js';
import logger from '../core/logger.js';

export class FeatureGenerator {
    constructor(grid, foodAssets, depth = 0) {
        this.grid = grid;
        this.foodAssets = foodAssets;
        this.depth = depth || 0;
        // depthMultiplier: +2% per underground depth beyond the first (depth 1 -> 1.0)
        this.depthMultiplier = 1 + Math.max(0, (this.depth - 1)) * 0.02;
    }

    addRandomFeatures(zoneLevel, zoneX, zoneY, isUnderground = false) {
        // Underground zones have fewer features and no mazes
        if (isUnderground) {
            this.addUndergroundFeatures(zoneLevel, zoneX, zoneY);
            return;
        }

        // Check for maze zone generation
        if (this.shouldGenerateMaze(zoneLevel)) {
            this.generateMaze();
            return;
        }

        // Add some random rocks, dirt, grass, and shrubbery patches
        let featureCount = randomInt(10, 25); // Math.floor(Math.random() * 15) + 10

        // Reduce feature density in home area (zone level 1)
        if (zoneLevel === 1) {
            featureCount = Math.floor(featureCount * 0.7); // Reduce by 30%
        } else if (zoneLevel === 3) {
            featureCount += 5;
        }
        featureCount += Math.floor(ZoneStateManager.zoneCounter / 10);

        let placedCount = 0;
        while (placedCount < featureCount) {
            const pos = findValidPlacement({
                validate: (x, y) => {
                    if (x === 1 && y === 1) return false;
                    if (this.grid[y][x] !== TILE_TYPES.FLOOR) return false;
                    return true;
                }
            });
            if (!pos) break;
            const { x, y } = pos;
            const featureType = Math.random();
            // Apply depthMultiplier to obstruction likelihoods (more obstructions deeper)
            let baseRockThresh = zoneLevel === 1 ? 0.25 : 0.35;
            let baseShrubThresh = zoneLevel === 1 ? 0.40 : 0.55;
            const rockThreshold = Math.min(0.95, baseRockThresh * this.depthMultiplier);
            const shrubThreshold = Math.min(0.95, baseShrubThresh * this.depthMultiplier);
            if (featureType < rockThreshold) {
                this.grid[y][x] = TILE_TYPES.ROCK;
            } else if (featureType < shrubThreshold) {
                this.grid[y][x] = TILE_TYPES.SHRUBBERY;
            } else if (featureType >= 0.7) {
                this.grid[y][x] = TILE_TYPES.GRASS;
            }
            placedCount++;
        }

        // Add chance tiles past the frontier (zone level 3)
        if (zoneLevel === 3 && Math.random() < 0.15 * this.depthMultiplier) { // 15% base chance scaled by depth
            this.addChanceTile(zoneX, zoneY);
        }


    }

    addChanceTile(zoneX, zoneY) {
        // Add a chance tile: could be an extra water, food, or note (5% chance)
        const pos = findValidPlacement({
            maxAttempts: 20,
            validate: (x, y) => this.grid[y][x] === TILE_TYPES.FLOOR
        });
        if (!pos) return;
        const { x, y } = pos;
        const chanceType = Math.random();
        let tilePlaced = false;
        if (chanceType < 0.05) {
            if (!this.checkSignExists()) {
                const message = Sign.getProceduralMessage(zoneX, zoneY);
                Sign.spawnedMessages.add(message);
                this.grid[y][x] = { type: TILE_TYPES.SIGN, message: message };
                tilePlaced = true;
            }
        }
        if (!tilePlaced) {
            if (chanceType < 0.35) {
                this.grid[y][x] = TILE_TYPES.WATER;
            } else {
                const zoneKey = `${zoneX},${zoneY}`;
                const seed = ZoneStateManager.hashCode(zoneKey) % this.foodAssets.length;
                const selectedFood = this.foodAssets[seed];
                this.grid[y][x] = { type: TILE_TYPES.FOOD, foodType: selectedFood };
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
        // Slightly increase number of blockages with depth
        const extra = Math.floor(Math.max(0, this.depth - 1) * 0.02 * 5);
        const blockages = randomInt(3 + extra, 8 + extra); // Math.floor(Math.random() * 5) + 3
        for (let i = 0; i < blockages; i++) {
            const pos = findValidPlacement({
                maxAttempts: 20,
                validate: (x, y) => this.grid[y][x] === TILE_TYPES.FLOOR
            });
            if (pos) {
                const { x, y } = pos;
                // Increase chance of rock (hard obstruction) with depth
                const rockProb = Math.min(0.95, 0.5 * this.depthMultiplier);
                this.grid[y][x] = Math.random() < rockProb ? TILE_TYPES.ROCK : TILE_TYPES.SHRUBBERY;
            }
        }
    }

    blockExitsWithShrubbery(zoneLevel, connections, isUnderground = false) {
        if (!connections) {
            return;
        }

        // Underground zones use only rocks for exit blocking (no shrubbery)
        if (isUnderground) {
            // Block exits with rocks in underground zones (base 55% chance), scaled by depth
            const rockChance = Math.min(0.98, 0.55 * this.depthMultiplier);
            if (connections.north !== null && Math.random() < rockChance) {
                this.grid[0][connections.north] = TILE_TYPES.ROCK;
            }
            if (connections.south !== null && Math.random() < rockChance) {
                this.grid[GRID_SIZE - 1][connections.south] = TILE_TYPES.ROCK;
            }
            if (connections.west !== null && Math.random() < rockChance) {
                this.grid[connections.west][0] = TILE_TYPES.ROCK;
            }
            if (connections.east !== null && Math.random() < rockChance) {
                this.grid[connections.east][GRID_SIZE - 1] = TILE_TYPES.ROCK;
            }
        } else if (zoneLevel === 4) {
            // Surface frontier zones (maintain existing behavior)
            const rockChance = 0.2;
            const shrubberyChance = 0.4;

            if (connections.north !== null) {
                if (Math.random() < rockChance) {
                    this.grid[0][connections.north] = TILE_TYPES.ROCK;
                } else if (Math.random() < shrubberyChance) {
                    this.grid[0][connections.north] = TILE_TYPES.SHRUBBERY;
                }
            }
            if (connections.south !== null) {
                if (Math.random() < rockChance) {
                    this.grid[GRID_SIZE - 1][connections.south] = TILE_TYPES.ROCK;
                } else if (Math.random() < shrubberyChance) {
                    this.grid[GRID_SIZE - 1][connections.south] = TILE_TYPES.SHRUBBERY;
                }
            }
            if (connections.west !== null) {
                if (Math.random() < rockChance) {
                    this.grid[connections.west][0] = TILE_TYPES.ROCK;
                } else if (Math.random() < shrubberyChance) {
                    this.grid[connections.west][0] = TILE_TYPES.SHRUBBERY;
                }
            }
            if (connections.east !== null) {
                if (Math.random() < rockChance) {
                    this.grid[connections.east][GRID_SIZE - 1] = TILE_TYPES.ROCK;
                } else if (Math.random() < shrubberyChance) {
                    this.grid[connections.east][GRID_SIZE - 1] = TILE_TYPES.SHRUBBERY;
                }
            }
        }
        // No blocking in other surface zones
    }

    addUndergroundFeatures(zoneLevel, zoneX, zoneY) {
        // Underground zones have simpler features - mostly rocks and some walls
        let featureCount = randomInt(8, 18); // Math.floor(Math.random() * 10) + 8
        let placedCount = 0;
        const { centerX, centerY } = getGridCenter();
        while (placedCount < featureCount) {
            const pos = findValidPlacement({
                validate: (x, y) => {
                    if (Math.abs(x - centerX) <= 2 && Math.abs(y - centerY) <= 2) return false;
                    if (this.grid[y][x] !== TILE_TYPES.FLOOR) return false;
                    return true;
                }
            });
            if (!pos) break;
            const { x, y } = pos;
            const featureType = Math.random();
            if (featureType < 0.7) {
                this.grid[y][x] = TILE_TYPES.ROCK;
            } else if (featureType < 0.85) {
                this.grid[y][x] = TILE_TYPES.WALL;
            } else {
                this.grid[y][x] = TILE_TYPES.FLOOR;
            }
            placedCount++;
        }

        // Add chance tiles underground (lower chance)
        if (Math.random() < 0.08) { // 8% chance vs 15% surface
            this.addUndergroundChanceTile(zoneX, zoneY);
        }
    }

    addUndergroundChanceTile(zoneX, zoneY) {
        // Underground chance tile: mostly water/food, rare special items
        const { centerX, centerY } = getGridCenter();
        const pos = findValidPlacement({
            maxAttempts: 20,
            minX: 2,
            minY: 2,
            maxX: GRID_SIZE - 2,
            maxY: GRID_SIZE - 2,
            validate: (x, y) => {
                if (Math.abs(x - centerX) <= 2 && Math.abs(y - centerY) <= 2) return false;
                return this.grid[y][x] === TILE_TYPES.FLOOR;
            }
        });
        if (!pos) return;
        const { x, y } = pos;
        const chanceType = Math.random();
        if (chanceType < 0.7) {
            this.grid[y][x] = TILE_TYPES.WATER;
        } else {
            const zoneKey = `${zoneX},${zoneY}`;
            const seed = ZoneStateManager.hashCode(zoneKey) % this.foodAssets.length;
            const selectedFood = this.foodAssets[seed];
            this.grid[y][x] = { type: TILE_TYPES.FOOD, foodType: selectedFood };
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
