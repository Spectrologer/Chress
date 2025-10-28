import { Sign } from '../ui/Sign.js';
import { TILE_TYPES, GRID_SIZE, SPAWN_PROBABILITIES } from '../core/constants/index.js';
import { GENERATOR_CONSTANTS } from '../core/constants/ui.js';
import { randomInt, findValidPlacement, isWithinBounds, getGridCenter } from './GeneratorUtils.js';
import { ZoneStateManager } from './ZoneStateManager.js';
import { logger } from '../core/logger.js';
import { isFloor, isWall } from '../utils/TypeChecks.js';

export class FeatureGenerator {
    constructor(gridManager, foodAssets, depth = 0) {
        this.gridManager = gridManager;
        this.foodAssets = foodAssets;
        this.depth = depth || 0;
        // depthMultiplier: +2% per underground depth beyond the first (depth 1 -> 1.0)
        this.depthMultiplier = 1 + Math.max(0, (this.depth - 1)) * GENERATOR_CONSTANTS.FEATURE_EXTRA_MULTIPLIER;
    }

    addRandomFeatures(zoneLevel, zoneX, zoneY, isUnderground = false) {

        // Underground: allow maze generation with higher probability, using rock walls
        if (isUnderground) {
            if (this.shouldGenerateMaze(zoneLevel, true)) {
                this.generateMaze();
                return;
            } else {
                this.addUndergroundFeatures(zoneLevel, zoneX, zoneY);
                return;
            }
        }

        // Surface: original maze logic
        if (this.shouldGenerateMaze(zoneLevel, false)) {
            this.generateMaze();
            return;
        }

        // Add some random rocks, dirt, grass, and shrubbery patches
        let featureCount = randomInt(10, 25); // Math.floor(Math.random() * 15) + 10

        // Reduce feature density in home area (zone level 1)
        if (zoneLevel === 1) {
            featureCount = Math.floor(featureCount * 0.7); // Reduce by 30%
        } else if (zoneLevel === 3) {
            featureCount += GENERATOR_CONSTANTS.FEATURE_EXTRA_DIVISOR;
        }
        featureCount += Math.floor(ZoneStateManager.zoneCounter / 10);

        let placedCount = 0;
        while (placedCount < featureCount) {
            const pos = findValidPlacement({
                validate: (x, y) => {
                    if (x === 1 && y === 1) return false;
                    if (this.gridManager.getTile(x, y) !== TILE_TYPES.FLOOR) return false;
                    return true;
                }
            });
            if (!pos) break;
            const { x, y } = pos;
            const featureType = Math.random();
            // Apply depthMultiplier to obstruction likelihoods (more obstructions deeper)
            let baseRockThresh = zoneLevel === 1 ? 0.25 : 0.35;
            let baseShrubThresh = zoneLevel === 1 ? 0.40 : GENERATOR_CONSTANTS.FEATURE_CHANCE_MULTIPLIER;
            const rockThreshold = Math.min(GENERATOR_CONSTANTS.MAX_THRESHOLD, baseRockThresh * this.depthMultiplier);
            const shrubThreshold = Math.min(GENERATOR_CONSTANTS.MAX_THRESHOLD, baseShrubThresh * this.depthMultiplier);
            if (featureType < rockThreshold) {
                this.gridManager.setTile(x, y, TILE_TYPES.ROCK);
            } else if (featureType < shrubThreshold) {
                this.gridManager.setTile(x, y, TILE_TYPES.SHRUBBERY);
            } else if (featureType >= 0.7) {
                this.gridManager.setTile(x, y, TILE_TYPES.GRASS);
            }
            placedCount++;
        }

        // Add chance tiles past the frontier (zone level 3)
        if (zoneLevel === 3 && Math.random() < SPAWN_PROBABILITIES.CHANCE_TILES.BASE_CHANCE * this.depthMultiplier) {
            this.addChanceTile(zoneX, zoneY);
        }


    }

    addChanceTile(zoneX, zoneY) {
        // Add a chance tile: could be an extra water, food, or sign
        const pos = findValidPlacement({
            maxAttempts: 20,
            validate: (x, y) => isFloor(this.gridManager.getTile(x, y))
        });
        if (!pos) return;
        const { x, y } = pos;
        const chanceType = Math.random();
        let tilePlaced = false;
        if (chanceType < SPAWN_PROBABILITIES.CHANCE_TILES.SIGN) {
            if (!this.checkSignExists()) {
                const message = Sign.getProceduralMessage(zoneX, zoneY);
                Sign.spawnedMessages.add(message);
                this.gridManager.setTile(x, y, { type: TILE_TYPES.SIGN, message: message });
                tilePlaced = true;
            }
        }
        if (!tilePlaced) {
            if (chanceType < SPAWN_PROBABILITIES.CHANCE_TILES.WATER) {
                this.gridManager.setTile(x, y, TILE_TYPES.WATER);
            } else {
                const zoneKey = `${zoneX},${zoneY}`;
                const seed = ZoneStateManager.hashCode(zoneKey) % this.foodAssets.length;
                const selectedFood = this.foodAssets[seed];
                this.gridManager.setTile(x, y, { type: TILE_TYPES.FOOD, foodType: selectedFood });
            }
        }
    }



    shouldGenerateMaze(zoneLevel, isUnderground = false) {
        // Home = 0%, Woods = 5%, Wilds = 8%, Frontier = 10%
        // Underground: much higher probability (40%)
        if (isUnderground) {
            return Math.random() < SPAWN_PROBABILITIES.MAZE.UNDERGROUND;
        }
        let probability = 0;
        switch (zoneLevel) {
            case 2: // Woods
                probability = SPAWN_PROBABILITIES.MAZE.WOODS;
                break;
            case 3: // Wilds
                probability = SPAWN_PROBABILITIES.MAZE.WILDS;
                break;
            case 4: // Frontier
                probability = SPAWN_PROBABILITIES.MAZE.FRONTIER;
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
                this.gridManager.setTile(x, y, TILE_TYPES.WALL);
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
        this.gridManager.setTile(x, y, TILE_TYPES.FLOOR);

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
                isWall(this.gridManager.getTile(nx, ny))) {
                // Carve the wall between current and neighbor
                this.gridManager.setTile(x + dir.dx / 2, y + dir.dy / 2, TILE_TYPES.FLOOR);
                this.carveMaze(nx, ny);
            }
        }
    }

    addMazeBlockages() {
        // Add some rocks and shrubbery to block alternative paths
        // Slightly increase number of blockages with depth
        const extra = Math.floor(Math.max(0, this.depth - 1) * GENERATOR_CONSTANTS.FEATURE_EXTRA_MULTIPLIER * GENERATOR_CONSTANTS.FEATURE_EXTRA_DIVISOR);
        const blockages = randomInt(3 + extra, 8 + extra); // Math.floor(Math.random() * 5) + 3
        for (let i = 0; i < blockages; i++) {
            const pos = findValidPlacement({
                maxAttempts: 20,
                validate: (x, y) => isFloor(this.gridManager.getTile(x, y))
            });
            if (pos) {
                const { x, y } = pos;
                // Increase chance of rock (hard obstruction) with depth
                this.gridManager.setTile(x, y, TILE_TYPES.ROCK);
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
            const rockChance = Math.min(GENERATOR_CONSTANTS.ROCK_CHANCE_MULTIPLIER, GENERATOR_CONSTANTS.FEATURE_CHANCE_MULTIPLIER * this.depthMultiplier);
            if (connections.north !== null && Math.random() < rockChance) {
                this.gridManager.setTile(connections.north, 0, TILE_TYPES.ROCK);
            }
            if (connections.south !== null && Math.random() < rockChance) {
                this.gridManager.setTile(connections.south, GRID_SIZE - 1, TILE_TYPES.ROCK);
            }
            if (connections.west !== null && Math.random() < rockChance) {
                this.gridManager.setTile(0, connections.west, TILE_TYPES.ROCK);
            }
            if (connections.east !== null && Math.random() < rockChance) {
                this.gridManager.setTile(GRID_SIZE - 1, connections.east, TILE_TYPES.ROCK);
            }
        } else if (zoneLevel === 4) {
            // Surface frontier zones (maintain existing behavior)
            const rockChance = 0.2;
            const shrubberyChance = 0.4;

            if (connections.north !== null) {
                if (Math.random() < rockChance) {
                    this.gridManager.setTile(connections.north, 0, TILE_TYPES.ROCK);
                } else if (Math.random() < shrubberyChance) {
                    this.gridManager.setTile(connections.north, 0, TILE_TYPES.SHRUBBERY);
                }
            }
            if (connections.south !== null) {
                if (Math.random() < rockChance) {
                    this.gridManager.setTile(connections.south, GRID_SIZE - 1, TILE_TYPES.ROCK);
                } else if (Math.random() < shrubberyChance) {
                    this.gridManager.setTile(connections.south, GRID_SIZE - 1, TILE_TYPES.SHRUBBERY);
                }
            }
            if (connections.west !== null) {
                if (Math.random() < rockChance) {
                    this.gridManager.setTile(0, connections.west, TILE_TYPES.ROCK);
                } else if (Math.random() < shrubberyChance) {
                    this.gridManager.setTile(0, connections.west, TILE_TYPES.SHRUBBERY);
                }
            }
            if (connections.east !== null) {
                if (Math.random() < rockChance) {
                    this.gridManager.setTile(GRID_SIZE - 1, connections.east, TILE_TYPES.ROCK);
                } else if (Math.random() < shrubberyChance) {
                    this.gridManager.setTile(GRID_SIZE - 1, connections.east, TILE_TYPES.SHRUBBERY);
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
                    if (this.gridManager.getTile(x, y) !== TILE_TYPES.FLOOR) return false;
                    return true;
                }
            });
            if (!pos) break;
            const { x, y } = pos;
            const featureType = Math.random();
            if (featureType < 0.7) {
                this.gridManager.setTile(x, y, TILE_TYPES.ROCK);
            } else if (featureType < 0.85) {
                this.gridManager.setTile(x, y, TILE_TYPES.WALL);
            } else {
                this.gridManager.setTile(x, y, TILE_TYPES.FLOOR);
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
                return this.gridManager.getTile(x, y) === TILE_TYPES.FLOOR;
            }
        });
        if (!pos) return;
        const { x, y } = pos;
        const chanceType = Math.random();
        if (chanceType < 0.7) {
            this.gridManager.setTile(x, y, TILE_TYPES.WATER);
        } else {
            const zoneKey = `${zoneX},${zoneY}`;
            const seed = ZoneStateManager.hashCode(zoneKey) % this.foodAssets.length;
            const selectedFood = this.foodAssets[seed];
            this.gridManager.setTile(x, y, { type: TILE_TYPES.FOOD, foodType: selectedFood });
        }
    }

    checkSignExists() {
        const gridSize = this.gridManager.getSize();
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const tile = this.gridManager.getTile(x, y);
                if (tile && tile.type === TILE_TYPES.SIGN) {
                    return true;
                }
            }
        }
        return false;
    }
}
