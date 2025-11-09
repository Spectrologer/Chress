import { TILE_TYPES, GRID_SIZE, SPAWN_PROBABILITIES } from '@core/constants/index';
import { GENERATOR_CONSTANTS } from '@core/constants/ui';
import { randomInt, findValidPlacement, isWithinBounds, getGridCenter } from './GeneratorUtils';
import { ZoneStateManager } from './ZoneStateManager';
import { logger } from '@core/logger';
import { isFloor, isWall, isExit } from '@utils/TypeChecks';
import type { GridManager } from '../types/game';
import type { ZoneGenerationState } from '../state/ZoneGenerationState';

interface ZoneConnections {
    north: number | null;
    south: number | null;
    west: number | null;
    east: number | null;
}

interface GameWithZoneState {
    zoneGenState: ZoneGenerationState;
}

export class FeatureGenerator {
    private gridManager: GridManager;
    private foodAssets: string[];
    private depth: number;
    private game: GameWithZoneState | null;
    private depthMultiplier: number;

    constructor(gridManager: GridManager, foodAssets: string[], depth = 0, game: GameWithZoneState | null = null) {
        this.gridManager = gridManager;
        this.foodAssets = foodAssets;
        this.depth = depth || 0;
        this.game = game; // For accessing zoneGenState
        // depthMultiplier: +2% per underground depth beyond the first (depth 1 -> 1.0)
        this.depthMultiplier = 1 + Math.max(0, (this.depth - 1)) * GENERATOR_CONSTANTS.FEATURE_EXTRA_MULTIPLIER;
    }

    addRandomFeatures(zoneLevel: number, zoneX: number, zoneY: number, isUnderground = false): void {

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
        const zoneCounter = this.game ? this.game.zoneGenState.getZoneCounter() : 0;
        featureCount += Math.floor(zoneCounter / 10);

        let placedCount = 0;
        while (placedCount < featureCount) {
            const pos = findValidPlacement({
                validate: (x: number, y: number): boolean => {
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

    addChanceTile(zoneX: number, zoneY: number): void {
        // Add a chance tile: could be an extra water or food
        const pos = findValidPlacement({
            maxAttempts: 20,
            validate: (x: number, y: number): boolean => isFloor(this.gridManager.getTile(x, y))
        });
        if (!pos) return;
        const { x, y } = pos;
        const chanceType = Math.random();

        // 35% water, 65% food
        if (chanceType < SPAWN_PROBABILITIES.CHANCE_TILES.WATER) {
            this.gridManager.setTile(x, y, TILE_TYPES.WATER);
        } else {
            const zoneKey = `${zoneX},${zoneY}`;
            const seed = ZoneStateManager.hashCode(zoneKey) % this.foodAssets.length;
            const selectedFood = this.foodAssets[seed];
            this.gridManager.setTile(x, y, { type: TILE_TYPES.FOOD, foodType: selectedFood });
        }
    }



    shouldGenerateMaze(zoneLevel: number, isUnderground = false): boolean {
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

    /**
     * Generates a maze using recursive backtracking algorithm.
     *
     * Algorithm Overview:
     * 1. Fill entire interior with walls
     * 2. Pick random starting position (on odd coordinates)
     * 3. Recursively carve passages through walls
     * 4. Add blockages to increase difficulty
     *
     * Why Odd Coordinates:
     * The algorithm works on a grid with 2-tile spacing to ensure proper
     * wall placement between passages. Starting at odd coordinates (1, 3, 5...)
     * ensures the maze has walls between all passages.
     *
     * Maze Structure:
     * - Passages: Floor tiles at odd coordinates (1,1), (1,3), (3,1), etc.
     * - Walls: Between passages, creating a perfect maze
     * - Border: Outer edge remains walls
     */
    generateMaze(): void {
        // Step 1: Fill interior with walls (leaves border intact)
        for (let y = 1; y < GRID_SIZE - 1; y++) {
            for (let x = 1; x < GRID_SIZE - 1; x++) {
                this.gridManager.setTile(x, y, TILE_TYPES.WALL);
            }
        }

        // Step 2: Clear entry corridors from all exits to prevent blocking
        // This ensures exits have at least a 3-tile corridor leading inward
        this.clearExitCorridors();

        // Step 3: Pick random starting position on odd coordinates
        // Formula: random(0 to maxCells/2) * 2 + 1 gives odd numbers
        // Example: GRID_SIZE=20 -> picks from {1, 3, 5, 7, 9, 11, 13, 15, 17}
        const startX = Math.floor(Math.random() * ((GRID_SIZE - 3) / 2)) * 2 + 1;
        const startY = Math.floor(Math.random() * ((GRID_SIZE - 3) / 2)) * 2 + 1;

        // Step 4: Carve maze passages recursively
        this.carveMaze(startX, startY);

        // Step 5: Add strategic blockages for increased difficulty
        this.addMazeBlockages();

        // Step 6: Re-clear exit corridors as a final safety measure
        // This ensures no maze carving inadvertently blocked exits
        this.clearExitCorridors();
    }

    /**
     * Recursively carves maze passages using depth-first backtracking.
     *
     * Algorithm (Recursive Backtracking):
     * 1. Mark current cell as passage (floor)
     * 2. Shuffle directions randomly
     * 3. For each direction:
     *    a. Check if neighbor 2 tiles away is unvisited (still a wall)
     *    b. If yes, carve the wall between current and neighbor
     *    c. Recursively carve from neighbor
     * 4. Backtrack when all directions explored
     *
     * Why Distance = 2:
     * Moving 2 tiles at a time (dx/dy = ±2) ensures there's always a wall
     * between passages. This creates proper maze structure:
     *
     * Example: From (5,5), moving right with dx=2:
     * - Current: (5,5) -> Becomes FLOOR
     * - Wall: (6,5) -> Becomes FLOOR (carved via dx/2)
     * - Next: (7,5) -> Recursively processed
     *
     * Why Divide by 2:
     * `x + dir.dx / 2` carves the wall tile between current and neighbor.
     * - dir.dx = 2 -> wall at +1
     * - dir.dx = -2 -> wall at -1
     *
     * Direction Shuffling:
     * Randomizing direction order creates varied maze patterns. Without
     * shuffling, mazes would have predictable structure.
     */
    carveMaze(x: number, y: number): void {
        // Mark current position as passage
        this.gridManager.setTile(x, y, TILE_TYPES.FLOOR);

        // Define 4 directions with 2-tile spacing (orthogonal only)
        const directions = [
            { dx: 0, dy: -2 }, // North (up)
            { dx: 2, dy: 0 },  // East (right)
            { dx: 0, dy: 2 },  // South (down)
            { dx: -2, dy: 0 }  // West (left)
        ];

        // Fisher-Yates shuffle for random maze generation
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        // Try each direction in random order
        for (const dir of directions) {
            const nx = x + dir.dx;  // Neighbor 2 tiles away
            const ny = y + dir.dy;

            // Check if neighbor is within bounds and unvisited (still a wall)
            if (nx > 0 && nx < GRID_SIZE - 1 &&
                ny > 0 && ny < GRID_SIZE - 1 &&
                isWall(this.gridManager.getTile(nx, ny))) {

                // Carve the wall between current and neighbor
                // dir.dx/2 gives the wall position (1 tile away)
                this.gridManager.setTile(x + dir.dx / 2, y + dir.dy / 2, TILE_TYPES.FLOOR);

                // Recursively carve from neighbor
                this.carveMaze(nx, ny);
            }
        }
        // When all directions exhausted, backtrack (function returns)
    }

    /**
     * Clears entry corridors from all exits to prevent maze walls from blocking them.
     * Creates a 3-tile deep corridor from each exit leading into the maze interior.
     *
     * This is critical for mazes because:
     * - generateMaze() fills the entire interior with walls first
     * - Without clearing, exits would have walls immediately in front of them
     * - Players would spawn on exit tiles with no way to enter the zone
     */
    clearExitCorridors(): void {
        // Find all exit tiles
        const exits = this.gridManager.findTiles((tile: unknown) => isExit(tile));

        exits.forEach(({ x, y }) => {
            // For each exit, clear a wider area to ensure connectivity
            // This prevents the maze from blocking the entrance entirely
            if (y === 0) {
                // North exit - clear downward with width
                for (let dy = 1; dy <= 4 && dy < GRID_SIZE - 1; dy++) {
                    // Clear center line
                    this.gridManager.setTile(x, dy, TILE_TYPES.FLOOR);
                    // Clear adjacent tiles for first 2 rows to create wider entry
                    if (dy <= 2) {
                        if (x > 0) this.gridManager.setTile(x - 1, dy, TILE_TYPES.FLOOR);
                        if (x < GRID_SIZE - 1) this.gridManager.setTile(x + 1, dy, TILE_TYPES.FLOOR);
                    }
                }
            } else if (y === GRID_SIZE - 1) {
                // South exit - clear upward with width
                for (let dy = 1; dy <= 4 && GRID_SIZE - 1 - dy > 0; dy++) {
                    this.gridManager.setTile(x, GRID_SIZE - 1 - dy, TILE_TYPES.FLOOR);
                    if (dy <= 2) {
                        if (x > 0) this.gridManager.setTile(x - 1, GRID_SIZE - 1 - dy, TILE_TYPES.FLOOR);
                        if (x < GRID_SIZE - 1) this.gridManager.setTile(x + 1, GRID_SIZE - 1 - dy, TILE_TYPES.FLOOR);
                    }
                }
            } else if (x === 0) {
                // West exit - clear rightward with width
                for (let dx = 1; dx <= 4 && dx < GRID_SIZE - 1; dx++) {
                    this.gridManager.setTile(dx, y, TILE_TYPES.FLOOR);
                    if (dx <= 2) {
                        if (y > 0) this.gridManager.setTile(dx, y - 1, TILE_TYPES.FLOOR);
                        if (y < GRID_SIZE - 1) this.gridManager.setTile(dx, y + 1, TILE_TYPES.FLOOR);
                    }
                }
            } else if (x === GRID_SIZE - 1) {
                // East exit - clear leftward with width
                for (let dx = 1; dx <= 4 && GRID_SIZE - 1 - dx > 0; dx++) {
                    this.gridManager.setTile(GRID_SIZE - 1 - dx, y, TILE_TYPES.FLOOR);
                    if (dx <= 2) {
                        if (y > 0) this.gridManager.setTile(GRID_SIZE - 1 - dx, y - 1, TILE_TYPES.FLOOR);
                        if (y < GRID_SIZE - 1) this.gridManager.setTile(GRID_SIZE - 1 - dx, y + 1, TILE_TYPES.FLOOR);
                    }
                }
            }
        });
    }

    addMazeBlockages(): void {
        // Add some rocks and shrubbery to block alternative paths
        // Slightly increase number of blockages with depth
        const extra = Math.floor(Math.max(0, this.depth - 1) * GENERATOR_CONSTANTS.FEATURE_EXTRA_MULTIPLIER * GENERATOR_CONSTANTS.FEATURE_EXTRA_DIVISOR);
        const blockages = randomInt(3 + extra, 8 + extra); // Math.floor(Math.random() * 5) + 3
        for (let i = 0; i < blockages; i++) {
            const pos = findValidPlacement({
                maxAttempts: 20,
                validate: (x: number, y: number): boolean => {
                    // Only place on floor tiles
                    if (!isFloor(this.gridManager.getTile(x, y))) return false;

                    // Don't place blockages in the entry corridors (within 3 tiles of border)
                    if (x <= 3 || x >= GRID_SIZE - 4 || y <= 3 || y >= GRID_SIZE - 4) return false;

                    return true;
                }
            });
            if (pos) {
                const { x, y } = pos;
                // Increase chance of rock (hard obstruction) with depth
                this.gridManager.setTile(x, y, TILE_TYPES.ROCK);
            }
        }
    }

    /**
     * Probabilistically blocks zone exits with obstacles to increase difficulty.
     * Uses different blocking strategies based on zone type and difficulty level.
     *
     * Blocking Strategy by Zone Type:
     *
     * 1. Underground Zones:
     *    - Only rocks (permanent obstacles requiring tools)
     *    - Base 55% chance, scaled by depth multiplier
     *    - Deeper levels = more blocked exits
     *    - Thematic: caves have rockfalls blocking passages
     *
     * 2. Surface Frontier Zones (Level 4):
     *    - 20% chance of rock (permanent)
     *    - 40% chance of shrubbery (destructible)
     *    - Provides varied difficulty
     *    - Player can clear shrubbery with tools
     *
     * 3. Other Surface Zones:
     *    - No exit blocking (easier navigation)
     *
     * Connection Format:
     * connections = { north: x, south: x, east: y, west: y }
     * - null means no exit in that direction
     * - number means exit at that coordinate on the edge
     */
    blockExitsWithShrubbery(zoneLevel: number, connections: ZoneConnections | null, isUnderground = false): void {
        if (!connections) {
            return;
        }

        // Underground Strategy: Use only rocks, scaled by depth
        // Place rocks ADJACENT to exits (one tile inward), not ON the exit tiles
        if (isUnderground) {
            // Calculate rock chance with depth scaling
            // Base: 55% (FEATURE_CHANCE_MULTIPLIER)
            // Increases with depth via depthMultiplier
            // Capped at 80% (ROCK_CHANCE_MULTIPLIER) to keep some exits open
            const rockChance = Math.min(
                GENERATOR_CONSTANTS.ROCK_CHANCE_MULTIPLIER,
                GENERATOR_CONSTANTS.FEATURE_CHANCE_MULTIPLIER * this.depthMultiplier
            );

            // Apply to each exit direction if it exists
            // Place rocks one tile inward from the exit (not on the exit itself)
            if (connections.north !== null && Math.random() < rockChance) {
                this.gridManager.setTile(connections.north, 1, TILE_TYPES.ROCK);
            }
            if (connections.south !== null && Math.random() < rockChance) {
                this.gridManager.setTile(connections.south, GRID_SIZE - 2, TILE_TYPES.ROCK);
            }
            if (connections.west !== null && Math.random() < rockChance) {
                this.gridManager.setTile(1, connections.west, TILE_TYPES.ROCK);
            }
            if (connections.east !== null && Math.random() < rockChance) {
                this.gridManager.setTile(GRID_SIZE - 2, connections.east, TILE_TYPES.ROCK);
            }
        }
        // Surface Frontier Strategy: Mix of rocks and shrubbery
        else if (zoneLevel === 4) {
            const rockChance = 0.2;        // 20% permanent obstacle
            const shrubberyChance = 0.4;   // 40% destructible obstacle

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

    addUndergroundFeatures(zoneLevel: number, zoneX: number, zoneY: number): void {
        // Underground zones have simpler features - mostly rocks and some walls
        let featureCount = randomInt(8, 18); // Math.floor(Math.random() * 10) + 8
        let placedCount = 0;
        const center = getGridCenter();
        const centerX = center.x;
        const centerY = center.y;
        while (placedCount < featureCount) {
            const pos = findValidPlacement({
                validate: (x: number, y: number): boolean => {
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

    addUndergroundChanceTile(zoneX: number, zoneY: number): void {
        // Underground chance tile: mostly water/food, rare special items
        const center = getGridCenter();
        const centerX = center.x;
        const centerY = center.y;
        const pos = findValidPlacement({
            maxAttempts: 20,
            minX: 2,
            minY: 2,
            maxX: GRID_SIZE - 2,
            maxY: GRID_SIZE - 2,
            validate: (x: number, y: number): boolean => {
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

}
