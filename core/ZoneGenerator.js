import { TILE_TYPES, GRID_SIZE } from './constants.js';
import logger from './logger.js';
import { ZoneStateManager } from '../generators/ZoneStateManager.js';
import { FeatureGenerator } from '../generators/FeatureGenerator.js';
import { ItemGenerator } from '../generators/ItemGenerator.js';
import { StructureGenerator } from '../generators/StructureGenerator.js';
import { EnemyGenerator } from '../generators/EnemyGenerator.js';
import { PathGenerator } from '../generators/PathGenerator.js';
import { initializeGrid, validateAndSetTile } from '../generators/GeneratorUtils.js';

export class ZoneGenerator {

    constructor() {
        this.grid = null;
        this.enemies = null;
        this.currentZoneX = null;
        this.currentZoneY = null;
        this.playerSpawn = null; // {x, y}
        // Initialize item locations if they haven't been set for this session
        ZoneStateManager.initializeItemLocations();
    }
    /**
     * Find a valid spawn tile for the player that is not occupied by an enemy, item, or impassable tile.
     * Returns {x, y} or null if none found.
     */
    findValidPlayerSpawn() {
        // Prefer spawning in front of house in home zone
        if (this.currentZoneX === 0 && this.currentZoneY === 0) {
            const houseStartX = 3;
            const houseStartY = 3;
            const frontY = houseStartY + 3; // Row in front of the 3-tile high club
            for (let x = houseStartX; x < houseStartX + 4; x++) { // Club is 4 tiles wide
                if (this.isTileFree(x, frontY)) {
                    return { x, y: frontY };
                }
            }
        }
        // Otherwise, pick a random free floor tile
        let candidates = [];
        for (let y = 1; y < GRID_SIZE - 1; y++) {
            for (let x = 1; x < GRID_SIZE - 1; x++) {
                if (this.isTileFree(x, y)) {
                    candidates.push({ x, y });
                }
            }
        }
        if (candidates.length > 0) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }
        return null;
    }

    /**
     * Checks if a tile is free for player spawn (not occupied, not impassable)
     */
    isTileFree(x, y) {
        const tile = this.grid[y][x];
        // Check for impassable tiles
        if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY || tile === TILE_TYPES.HOUSE || tile === TILE_TYPES.DEADTREE || tile === TILE_TYPES.WELL || tile === TILE_TYPES.SHACK || tile === TILE_TYPES.SIGN || (tile && tile.type === TILE_TYPES.SIGN)) return false;
        // Check for enemy
        if (this.enemies && this.enemies.some(e => e.x === x && e.y === y)) return false;
        // Check for items (axe, hammer, bishop spear, etc.)
        if (tile === TILE_TYPES.AXE || tile === TILE_TYPES.HAMMER ||
            (tile && tile.type === TILE_TYPES.BISHOP_SPEAR) || tile === TILE_TYPES.NOTE) return false;
        return true;
    }

    generateZone(zoneX, zoneY, dimension, existingZones, zoneConnections, foodAssets, exitSide) {
        this.foodAssets = foodAssets || [];
        this.currentZoneX = zoneX;
        this.currentZoneY = zoneY;
        this.currentDimension = dimension;

        // Check if this zone already exists (include dimension in key)
        const zoneKey = `${zoneX},${zoneY}:${dimension}`;
        if (existingZones.has(zoneKey)) {
            return existingZones.get(zoneKey);
        }

        // Generate new zone structure
        this.initialize();

        // Handle interior dimension specially
        if (dimension === 1) {
            // Interior of the house at (0,0)
            if (zoneX === 0 && zoneY === 0) {
                // Place a PORT tile at the bottom-middle to exit
                const portX = Math.floor(GRID_SIZE / 2);
                const portY = GRID_SIZE - 1; // Bottom edge
                this.grid[portY][portX] = TILE_TYPES.PORT;

                // Place Crayn in the center
                this.grid[4][4] = TILE_TYPES.CRAYN;

                // Place Felt near Crayn
                this.grid[4][6] = TILE_TYPES.FELT;

                // Place Forge in an open spot
                const forgePos = this.findOpenNpcSpawn(4);
                if (forgePos) {
                    this.grid[forgePos.y][forgePos.x] = TILE_TYPES.FORGE;
                }

                // Place enemy statues on the back wall (y=1)
                this.grid[1][1] = TILE_TYPES.LIZARDY_STATUE;
                this.grid[1][2] = TILE_TYPES.LIZARDO_STATUE;
                this.grid[1][3] = TILE_TYPES.ZARD_STATUE;
                this.grid[1][5] = TILE_TYPES.LIZARDEAUX_STATUE;
                this.grid[1][6] = TILE_TYPES.LIZORD_STATUE;
                this.grid[1][7] = TILE_TYPES.LAZERD_STATUE;

                // 1. NPCs have a chance to randomly spawn
                if (Math.random() < 0.1) { // 10% chance for a Lion
                    const pos = this.findOpenNpcSpawn(2);
                    if (pos) this.grid[pos.y][pos.x] = TILE_TYPES.LION;
                }
                if (Math.random() < 0.1) { // 10% chance for a Squig
                    const pos = this.findOpenNpcSpawn(2);
                    if (pos) this.grid[pos.y][pos.x] = TILE_TYPES.SQUIG;
                }

                // 2. & 3. Spawn 1 to 2 random items
                const itemPool = [
                    { type: TILE_TYPES.FOOD, foodType: this.foodAssets[Math.floor(Math.random() * this.foodAssets.length)] },
                    TILE_TYPES.BOMB,
                    { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 },
                    { type: TILE_TYPES.HORSE_ICON, uses: 3 },
                    TILE_TYPES.WATER,
                    { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 },
                ];

                // Determine number of items to spawn (1 or 2)
                const numItemsToSpawn = 1 + (Math.random() < 0.5 ? 1 : 0); // 1 item, plus a 50% chance for a 2nd

                for (let i = 0; i < numItemsToSpawn; i++) {
                    const pos = this.findOpenNpcSpawn(0);
                    if (pos) {
                        // Select a random item from the pool
                        const itemToSpawn = itemPool[Math.floor(Math.random() * itemPool.length)];
                        // Special handling for food if no food assets are loaded
                        if (itemToSpawn.type === TILE_TYPES.FOOD && (!this.foodAssets || this.foodAssets.length === 0)) {
                            this.grid[pos.y][pos.x] = TILE_TYPES.WATER; // Fallback to water
                        } else {
                            this.grid[pos.y][pos.x] = itemToSpawn;
                        }
                    }
                }

                // Set player spawn away from walls
                return {
                    grid: JSON.parse(JSON.stringify(this.grid)),
                    enemies: [],
                    playerSpawn: { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) + 2 }
                };
            } else {
                // Shack interior: generate food/water items
                // Ensure PORT tile exists at bottom-middle for exit
                const portX = Math.floor(GRID_SIZE / 2);
                const portY = GRID_SIZE - 1;
                this.grid[portY][portX] = TILE_TYPES.PORT;

                // Helper to find a valid spawn location in shack interior
                const findValidShackSpawn = () => {
                    const validSpawns = [];
                    // Only spawn in the lower part, away from door
                    for (let y = 2; y < GRID_SIZE - 2; y++) {
                        for (let x = 1; x < GRID_SIZE - 1; x++) {
                            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                                validSpawns.push({ x, y });
                            }
                        }
                    }
                    if (validSpawns.length > 0) {
                        return validSpawns[Math.floor(Math.random() * validSpawns.length)];
                    }
                    return null;
                };

                // Determine number of food/water items to spawn (at least 2, with diminishing additional chances)
                let additionalItems = 0;
                if (Math.random() < 0.25) additionalItems++; // 25% chance for 3rd item
                if (additionalItems >= 1 && Math.random() < 0.20) additionalItems++; // 20% chance for 4th item
                if (additionalItems >= 2 && Math.random() < 0.15) additionalItems++; // 15% chance for 5th item
                if (additionalItems >= 3 && Math.random() < 0.10) additionalItems++; // 10% chance for 6th item
                if (additionalItems >= 4 && Math.random() < 0.05) additionalItems++; // 5% chance for 7th item
                const totalItems = 2 + additionalItems;

                // Spawn the items
                for (let i = 0; i < totalItems; i++) {
                    const pos = findValidShackSpawn();
                    if (pos) {
                        const isWater = Math.random() < 0.5;
                        if (isWater) {
                            this.grid[pos.y][pos.x] = TILE_TYPES.WATER;
                        } else {
                            // Spawn food if available
                            if (this.foodAssets && this.foodAssets.length > 0) {
                                this.grid[pos.y][pos.x] = {
                                    type: TILE_TYPES.FOOD,
                                    foodType: this.foodAssets[Math.floor(Math.random() * this.foodAssets.length)]
                                };
                            } else {
                                // Fallback to water if no food assets
                                this.grid[pos.y][pos.x] = TILE_TYPES.WATER;
                            }
                        }
                    }
                }

                // Set player spawn away from walls and door
                return {
                    grid: JSON.parse(JSON.stringify(this.grid)),
                    enemies: [],
                    playerSpawn: { x: portX, y: Math.floor(GRID_SIZE / 2) + 1 }
                };
            }
        }

        // Handle underground dimension specially
        if (dimension === 2) {
            const zoneLevel = ZoneStateManager.getZoneLevel(zoneX, zoneY);
            const isHomeZone = (zoneX === 0 && zoneY === 0);

            // Check if there's a surface cistern that requires an underground counterpart
            const surfaceZoneKey = `${zoneX},${zoneY}:${0}`;
            const surfaceZone = existingZones.get(surfaceZoneKey);
            let hasSurfaceCistern = false;

            if (surfaceZone && surfaceZone.grid) {
                // Check if surface zone has a cistern
                for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                        if (surfaceZone.grid[y][x] === TILE_TYPES.CISTERN) {
                            hasSurfaceCistern = true;
                            break;
                        }
                    }
                    if (hasSurfaceCistern) break;
                }
            }

            // Initialize specialized generators
            const structureGenerator = new StructureGenerator(this.grid);
            const featureGenerator = new FeatureGenerator(this.grid, foodAssets);
            const itemGenerator = new ItemGenerator(this.grid, foodAssets, zoneX, zoneY, dimension);
            const enemyGenerator = new EnemyGenerator(this.enemies);
            const pathGenerator = new PathGenerator(this.grid);

            // Generate exits and add frontier sign if needed
            this.generateExits(zoneX, zoneY, zoneConnections, featureGenerator, zoneLevel);

            // Generate underground zone content similar to surface
            ZoneStateManager.zoneCounter++;

            // Add random features but reduced since it's underground
            if (!isHomeZone) {
                featureGenerator.addRandomFeatures(zoneLevel, zoneX, zoneY, true); // Pass true for underground
            }

            // Force a cistern if there's a surface cistern above
            if (hasSurfaceCistern) {
                structureGenerator.addCistern(zoneX, zoneY, true);
            }

            // Add special zone items - this includes nib and rune spawning logic which are now restricted to underground
            itemGenerator.addSpecialZoneItems();

            // Higher enemy chance in underground for challenge
            const baseProbabilities = { 1: 0.15, 2: 0.20, 3: 0.22, 4: 0.27 };
            const baseEnemyProbability = baseProbabilities[zoneLevel] || 0.15;
            const enemyProbability = baseEnemyProbability + Math.floor(ZoneStateManager.zoneCounter / 10) * 0.01;

            if (Math.random() < enemyProbability) {
                enemyGenerator.addRandomEnemyWithValidation(zoneLevel, zoneX, zoneY, this.grid, []);
            }


            // Ensure exit accessibility
            pathGenerator.ensureExitAccess();

            // Find a valid player spawn tile
            this.playerSpawn = this.findValidPlayerSpawn();

            // Sanitize grid to fix any corrupted tiles
            this.sanitizeGrid();

            return {
                grid: JSON.parse(JSON.stringify(this.grid)),
                enemies: [...this.enemies],
                playerSpawn: this.playerSpawn ? { ...this.playerSpawn } : null
            };
        }

        const zoneLevel = ZoneStateManager.getZoneLevel(zoneX, zoneY);
        const isHomeZone = (zoneX === 0 && zoneY === 0);

        // Initialize specialized generators
        const structureGenerator = new StructureGenerator(this.grid);
        const featureGenerator = new FeatureGenerator(this.grid, foodAssets);
        const itemGenerator = new ItemGenerator(this.grid, foodAssets, zoneX, zoneY, dimension);
        const enemyGenerator = new EnemyGenerator(this.enemies);
        const pathGenerator = new PathGenerator(this.grid);

        // Add specific notes for regions before adding house or other features
        this.addRegionNotes(zoneKey, structureGenerator);

        // Special handling for the starting zone (0,0)
        if (isHomeZone) {
            structureGenerator.addHouse(zoneX, zoneY);
            structureGenerator.addSign("WOODCUTTERS<br>CLUB", zoneX, zoneY);
        }

        // Generate exits and add frontier sign if needed
        this.generateExits(zoneX, zoneY, zoneConnections, featureGenerator, zoneLevel);
        if (zoneLevel === 4 && !ZoneStateManager.firstFrontierSignPlaced) {
            structureGenerator.addSign("TURN BACK");
            ZoneStateManager.firstFrontierSignPlaced = true;
        }

        // Non-home zone features
        if (!isHomeZone) {
            ZoneStateManager.zoneCounter++;

            // Add random features
            featureGenerator.addRandomFeatures(zoneLevel, zoneX, zoneY);

            // Add unique structures based on zone level (moved here to place after obstacles)
            if (zoneLevel === 4 && !ZoneStateManager.wellSpawned) {
                structureGenerator.addWell(zoneX, zoneY);
            }
            if (zoneLevel === 2 && !ZoneStateManager.deadTreeSpawned) {
                structureGenerator.addDeadTree(zoneX, zoneY);
            }

            // Add hammer warning sign in the first level 2 zone encountered
            if (zoneLevel === 2 && !ZoneStateManager.hammerWarningSignPlaced) {
                structureGenerator.addSign("FIND THE HAMMER<br>IN THE WOODS");
                ZoneStateManager.hammerWarningSignPlaced = true;
            }

            // Add random cistern with 7% chance in all non-home zones
            if (Math.random() < 0.07) {
                structureGenerator.addCistern(zoneX, zoneY, false);
            }

            // Add level-based items and enemies
            itemGenerator.addLevelBasedFoodAndWater();

            // Determine enemy spawn probability and add enemies
            const baseProbabilities = { 1: 0.11, 2: 0.15, 3: 0.17, 4: 0.22 };
            const baseEnemyProbability = baseProbabilities[zoneLevel] || 0.11;
            const enemyProbability = baseEnemyProbability + Math.floor(ZoneStateManager.zoneCounter / 10) * 0.01;

            if (Math.random() < enemyProbability) {
                enemyGenerator.addRandomEnemyWithValidation(zoneLevel, zoneX, zoneY, this.grid, []);
            }

            // Add special zone items
            itemGenerator.addSpecialZoneItems();
        }

        // Ensure exit accessibility
        pathGenerator.ensureExitAccess();

        // Find a valid player spawn tile
        this.playerSpawn = this.findValidPlayerSpawn();

        // Sanitize grid to fix any corrupted tiles
        this.sanitizeGrid();

        return {
            grid: JSON.parse(JSON.stringify(this.grid)),
            enemies: [...this.enemies],
            playerSpawn: this.playerSpawn ? { ...this.playerSpawn } : null
        };
    }

    initialize() {
        // Initialize grid with floor tiles using safe initialization
        this.grid = initializeGrid();
        this.enemies = [];
        this.addWallBorders();

        // Initial sanity check to prevent corruption from previous issues
        this.sanitizeGrid();
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

    addRegionNotes(zoneKey, structureGenerator) {
        // Add specific notes for regions before adding house or other features
        const homeNoteMap = {
            '0,0': 0,
            '1,0': 1,
            '0,1': 2,
            '-1,0': 3,
            '0,-1': 4
        };
        if (homeNoteMap[zoneKey]) {
            structureGenerator.addSpecificNote(homeNoteMap[zoneKey], this.currentZoneX, this.currentZoneY);
        }

        const wildsNoteMap = {
            '3,0': 0,
            '3,1': 1,
            '4,0': 2,
            '4,1': 3,
            '4,2': 4
        };
        if (wildsNoteMap[zoneKey]) {
            structureGenerator.addSpecificNote(wildsNoteMap[zoneKey], this.currentZoneX, this.currentZoneY);
        }

        const frontierNoteMap = {
            '10,0': 0,
            '10,1': 1,
            '11,0': 2,
            '11,1': 3,
            '11,2': 4
        };
        if (frontierNoteMap[zoneKey]) {
            structureGenerator.addSpecificNote(frontierNoteMap[zoneKey], this.currentZoneX, this.currentZoneY);
        }
    }

    generateExits(zoneX, zoneY, zoneConnections, featureGenerator, zoneLevel) {
        // Apply the predetermined exits to current zone
        const zoneKey = `${zoneX},${zoneY}`;
        const connections = zoneConnections.get(zoneKey);

        if (connections) {
            // Ensure grid rows are initialized (safety check)
            if (!Array.isArray(this.grid[0])) {
                for (let y = 0; y < GRID_SIZE; y++) {
                    if (!Array.isArray(this.grid[y])) {
                        this.grid[y] = [];
                    }
                }
            }

            // For underground zones, reduce connectivity - only 50% chance to have each connection
            let effectiveConnections = { ...connections };
            if (this.currentDimension === 2) {
                effectiveConnections.north = connections.north !== null && Math.random() < 0.50 ? connections.north : null;
                effectiveConnections.south = connections.south !== null && Math.random() < 0.50 ? connections.south : null;
                effectiveConnections.west = connections.west !== null && Math.random() < 0.50 ? connections.west : null;
                effectiveConnections.east = connections.east !== null && Math.random() < 0.50 ? connections.east : null;
            }

            // Apply exits based on effective connections with bounds checking
            if (effectiveConnections.north !== null && effectiveConnections.north >= 0 && effectiveConnections.north < GRID_SIZE) {
                this.grid[0][effectiveConnections.north] = TILE_TYPES.EXIT;
            }
            if (effectiveConnections.south !== null && effectiveConnections.south >= 0 && effectiveConnections.south < GRID_SIZE) {
                this.grid[GRID_SIZE - 1][effectiveConnections.south] = TILE_TYPES.EXIT;
            }
            if (effectiveConnections.west !== null && effectiveConnections.west >= 0 && effectiveConnections.west < GRID_SIZE) {
                this.grid[effectiveConnections.west][0] = TILE_TYPES.EXIT;
            }
            if (effectiveConnections.east !== null && effectiveConnections.east >= 0 && effectiveConnections.east < GRID_SIZE) {
                this.grid[effectiveConnections.east][GRID_SIZE - 1] = TILE_TYPES.EXIT;
            }

            // Block some exits with rocks/shrubbery
            featureGenerator.blockExitsWithShrubbery(zoneLevel, effectiveConnections, this.currentDimension === 2);
        }
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

        // Clear adjacent inward tiles to create wider entry area (3x3 around inward tile)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = inwardX + dx;
                const ny = inwardY + dy;
                if (nx >= 1 && nx < GRID_SIZE - 1 && ny >= 1 && ny < GRID_SIZE - 1) {
                    const tile = this.grid[ny][nx];
                    if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY || tile === TILE_TYPES.SHACK) {
                        this.grid[ny][nx] = TILE_TYPES.FLOOR;
                    }
                }
            }
        }

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
            if (this.grid[currentY][currentX] === TILE_TYPES.WALL || this.grid[currentY][currentX] === TILE_TYPES.ROCK || this.grid[currentY][currentX] === TILE_TYPES.SHRUBBERY || this.grid[currentY][currentX] === TILE_TYPES.SHACK) {
                this.grid[currentY][currentX] = TILE_TYPES.FLOOR;
            }

            // Prevent infinite loops
            if (currentX === centerX && currentY === centerY) {
                break;
            }
        }
    }

    /**
     * Sanitizes the grid by replacing any null or undefined tiles with FLOOR tiles.
     * This fixes corrupted save data or generation bugs.
     */
    sanitizeGrid() {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] === null || this.grid[y][x] === undefined) {
                    logger.warn(`Fixed corrupted tile at (${x}, ${y}) by replacing with FLOOR`);
                    this.grid[y][x] = TILE_TYPES.FLOOR;
                }
            }
        }
    }

    /**
     * Finds a walkable tile with a minimum number of adjacent walkable tiles.
     * @param {number} requiredNeighbors - The minimum number of walkable neighbors.
     * @returns {{x, y}|null}
     */
    findOpenNpcSpawn(requiredNeighbors) {
        const candidates = [];
        for (let y = 1; y < GRID_SIZE - 1; y++) {
            for (let x = 1; x < GRID_SIZE - 1; x++) {
                if (this.isTileFree(x, y)) {
                    let walkableNeighbors = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = x + dx;
                            const ny = y + dy;
                            if (this.isTileFree(nx, ny)) {
                                walkableNeighbors++;
                            }
                        }
                    }
                    if (walkableNeighbors >= requiredNeighbors) {
                        candidates.push({ x, y });
                    }
                }
            }
        }
        return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
    }
}
