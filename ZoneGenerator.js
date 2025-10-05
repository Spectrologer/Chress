import { TILE_TYPES, GRID_SIZE } from './constants.js';
import { Enemy } from './Enemy.js';
import { Note } from './Note.js';

export class ZoneGenerator {
    static zoneCounter = 0;
    static enemyCounter = 0;
    static axeSpawned = false;
    static hammerSpawned = false;
    static spearSpawned = false;
    static lionSpawned = false;
    static squigSpawned = false;
    static wellSpawned = false;
    static deadTreeSpawned = false;
    static puzzleZoneSpawned = false; // Track if the puzzle zone has been spawned

    // Pre-determined spawn locations for special items
    static axeSpawnZone = null;
    static hammerSpawnZone = null;
    static spearSpawnZone = null;

    constructor() {
        this.grid = null;
        this.enemies = null;
        this.currentZoneX = null;
        this.currentZoneY = null;
        this.playerSpawn = null; // {x, y}
        // Initialize item locations if they haven't been set for this session
        ZoneGenerator.initializeItemLocations();
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
            const frontY = houseStartY + 3;
            for (let x = houseStartX; x < houseStartX + 3; x++) {
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
        if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY || tile === TILE_TYPES.HOUSE || tile === TILE_TYPES.DEADTREE || tile === TILE_TYPES.WELL || tile === TILE_TYPES.SIGN || (tile && tile.type === TILE_TYPES.SIGN)) return false;
        // Check for enemy
        if (this.enemies && this.enemies.some(e => e.x === x && e.y === y)) return false;
        // Check for items (axe, hammer, spear, note, etc.)
        // If items are stored in grid, check type
        if (tile === TILE_TYPES.AXE || tile === TILE_TYPES.HAMMER || tile === TILE_TYPES.SPEAR || tile === TILE_TYPES.NOTE || (tile && tile.type === TILE_TYPES.NOTE)) return false;
        return true;
    }

    checkNoteExists() {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x].type === TILE_TYPES.NOTE) {
                    return true;
                }
            }
        }
        return false;
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

    generateZone(zoneX, zoneY, existingZones, zoneConnections, foodAssets) {
        this.foodAssets = foodAssets;
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

        // Add specific notes for regions before adding house or other features
        const homeNoteMap = {
            '0,0': 0,
            '1,0': 1,
            '0,1': 2,
            '-1,0': 3,
            '0,-1': 4
        };
        if (homeNoteMap[zoneKey]) {
            this.addSpecificNote(homeNoteMap[zoneKey]);
        }

        const wildsNoteMap = {
            '3,0': 0,
            '3,1': 1,
            '4,0': 2,
            '4,1': 3,
            '4,2': 4
        };
        if (wildsNoteMap[zoneKey]) {
            this.addSpecificNote(wildsNoteMap[zoneKey]);
        }

        const frontierNoteMap = {
            '10,0': 0,
            '10,1': 1,
            '11,0': 2,
            '11,1': 3,
            '11,2': 4
        };
        if (frontierNoteMap[zoneKey]) {
            this.addSpecificNote(frontierNoteMap[zoneKey]);
        }

        // Special handling for the starting zone (0,0) - add house
        if (zoneX === 0 && zoneY === 0) {
            this.addHouse();
            this.addSign("Chalk, Woodcutting Services");
        }

        // Add a unique well to level 4 (Frontier) zones
        if (this.getZoneLevel() === 4 && !ZoneGenerator.wellSpawned) {
            this.addWell();
        }

        // Add a unique dead tree to level 2 (Woods) zones
        if (this.getZoneLevel() === 2 && !ZoneGenerator.deadTreeSpawned) {
            this.addDeadTree();
        }

        // Generate exits using pre-determined connections
        this.generateExits(zoneX, zoneY, zoneConnections);
        
        // Add random features (skip if this is the house zone to avoid cluttering)
        if (!(zoneX === 0 && zoneY === 0)) {
            ZoneGenerator.zoneCounter++;
            // Add level-based food and water spawning
            this.addLevelBasedFoodAndWater(foodAssets);

            // Add enemy with native level-based probability plus flat increase per zones discovered (1% per 10 zones)
            const zoneLevel = this.getZoneLevel();
            const baseEnemyProbability = zoneLevel === 2 ? 0.15 : zoneLevel === 3 ? 0.17 : zoneLevel === 4 ? 0.22 : 0.11;
            const enemyProbability = baseEnemyProbability + Math.floor(ZoneGenerator.zoneCounter / 10) * 0.01;
            if (Math.random() < enemyProbability) {
                this.addRandomEnemy();
            }

            // Check if the current zone is the designated spawn zone for an item
            if (ZoneGenerator.axeSpawnZone && zoneX === ZoneGenerator.axeSpawnZone.x && zoneY === ZoneGenerator.axeSpawnZone.y && !ZoneGenerator.axeSpawned) {
                this.addAxeItem();
            }
            if (ZoneGenerator.hammerSpawnZone && zoneX === ZoneGenerator.hammerSpawnZone.x && zoneY === ZoneGenerator.hammerSpawnZone.y && !ZoneGenerator.hammerSpawned) {
                this.addHammerItem();
            }
            if (ZoneGenerator.spearSpawnZone && zoneX === ZoneGenerator.spearSpawnZone.x && zoneY === ZoneGenerator.spearSpawnZone.y && !ZoneGenerator.spearSpawned) {
                this.addSpearItem();
            }

            // Add a rare lion with low chance to spawn per zone (not level, but per zone)
            if (!ZoneGenerator.lionSpawned && Math.random() < 0.02) { // 2% chance
                this.addLionItem();
            }

            // Add a rare squig with low chance to spawn per zone (not level, but per zone)
            if (!ZoneGenerator.squigSpawned && Math.random() < 0.02) { // 2% chance
                this.addSquigItem();
            }

            // Add a bomb with a 3% chance in zones level 2-4
            const zoneLevelForBomb = this.getZoneLevel();
            if (zoneLevelForBomb >= 2 && zoneLevelForBomb <= 4 && Math.random() < 0.03) {
                this.addBombItem();
            }

            // Special tinted dirt easter egg zone - very rare chance in the Wilds (zone level 3)
            if (this.getZoneLevel() === 3 && !ZoneGenerator.puzzleZoneSpawned && Math.random() < 0.01) { // 1% chance
                this.addSpecialTintZone();
                ZoneGenerator.puzzleZoneSpawned = true;
                console.log(`Special puzzle zone spawned at (${this.currentZoneX}, ${this.currentZoneY})`);
            } else {
                // Only add random features if it's not the puzzle zone
                this.addRandomFeatures();
            }
        }
        

        // Ensure exit accessibility
        this.ensureExitAccess();

        // Find a valid player spawn tile
        this.playerSpawn = this.findValidPlayerSpawn();

        // Return the generated grid, enemies, and player spawn
        return {
            grid: JSON.parse(JSON.stringify(this.grid)),
            enemies: [...this.enemies],
            playerSpawn: this.playerSpawn ? { ...this.playerSpawn } : null
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

        // Block some exits with shrubbery in Frontier regions (zone level 4)
        this.blockExitsWithShrubbery(zoneX, zoneY, connections);
    }

    addRandomFeatures() {
        const zoneLevel = this.getZoneLevel();

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
        featureCount += Math.floor(ZoneGenerator.zoneCounter / 10);

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
            this.addChanceTile();
        }
    }

    addChanceTile() {
        // Add a chance tile: could be an extra water, food, or note (5% chance)

        // Try to place a chance tile in a valid location (max 20 attempts)
        for (let attempts = 0; attempts < 20; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                const chanceType = Math.random();
                if (chanceType < 0.05) {
                    // 5% chance for a note
                    if (!this.checkNoteExists()) {
                        const message = Note.getProceduralMessage(this.currentZoneX, this.currentZoneY);
                        this.grid[y][x] = {
                            type: TILE_TYPES.NOTE,
                            note: new Note(message, x, y)
                        };
                    }
                } else if (chanceType < 0.35) {
                    // 30% chance for water
                    this.grid[y][x] = TILE_TYPES.WATER;
                } else {
                    // 65% chance for food
                    // Use seeded random for consistency
                    const zoneKey = this.getZoneKey();
                    const seed = this.hashCode(zoneKey) % this.foodAssets.length;
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

    addLevelBasedFoodAndWater(foodAssets) {
        const zoneLevel = this.getZoneLevel();
        let spawnChance = 0;

        switch (zoneLevel) {
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
            this.addRandomItem(foodAssets);
        }
    }

    addAxeItem() {
        // Add the rare axe item

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
                ZoneGenerator.axeSpawned = true;
                break; // Successfully placed axe
            }
        }

        // Ensure a clear path to the axe from the center
        if (axeX !== null && axeY !== null) {
            this.clearPathToCenter(axeX, axeY);
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

    addSpearItem() {
        // Add the rare spear item

        // Try to place the spear in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.SPEAR;
                ZoneGenerator.spearSpawned = true;
                break; // Successfully placed spear
            }
        }
    }

    addBombItem() {
        // Add the bomb item

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

    addNote() {
        // Add the note with a procedural message
        if (this.checkNoteExists()) return;

        // Try to place the note in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                const message = Note.getProceduralMessage(this.currentZoneX, this.currentZoneY);
                this.grid[y][x] = {
                    type: TILE_TYPES.NOTE,
                    note: new Note(message, x, y)
                };
                break; // Successfully placed note
            }
        }
    }

    addSpecificNote(messageIndex) {

    let area;
    const level = this.getZoneLevel();
    if (level === 1) area = 'home';
    else if (level === 2) area = 'woods';
    else if (level === 3) area = 'wilds';
    else if (level === 4) area = 'frontier';
    else return;

    const message = Note.getMessageByIndex(area, messageIndex);
    console.log('[Note Debug] addSpecificNote:', { area, messageIndex, message });
    if (Note.spawnedMessages.has(message)) return;

    if (this.checkNoteExists()) return;

        // Try to place the note in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            let x, y;
            if (this.currentZoneX === 0 && this.currentZoneY === 0) {
                // Fixed location for home zone second note
                x = 1;
                y = 8;
            } else {
                x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            }

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = {
                    type: TILE_TYPES.NOTE,
                    note: new Note(message, x, y)
                };
                Note.spawnedMessages.add(message);
                break; // Successfully placed note
            }
        }
    }



    addRandomEnemy() {
        // Add multiple lizards based on zone level
        let enemyCount = 1; // Default for home
        const zoneLevel = this.getZoneLevel();
        if (zoneLevel === 2) {
            // Woods: 1-2 lizards
            enemyCount = Math.floor(Math.random() * 2) + 1;
        } else if (zoneLevel === 3) {
            // Wilds: 1-3 lizards
            enemyCount = Math.floor(Math.random() * 3) + 1;
        } else if (zoneLevel === 4) {
            // Frontier: 1-4 lizards
            enemyCount = Math.floor(Math.random() * 4) + 1;
        }

        for (let count = 0; count < enemyCount; count++) {
            // Try to place the enemy in a valid location (max 50 attempts per enemy)
            for (let attempts = 0; attempts < 50; attempts++) {
                const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

                // Only place on floor tiles (not on walls, rocks, grass, etc.) and not already occupied by enemy
                if (this.grid[y][x] === TILE_TYPES.FLOOR && !this.isTileOccupiedByEnemy(x, y)) {
                ZoneGenerator.enemyCounter++;
                // Determine enemy type - 'lizardo' appears in the Wilds (level 3)
                const enemyType = (zoneLevel === 3 && Math.random() < 0.5) ? 'lizardo' : 'lizardy';
                this.enemies.push({ x, y, enemyType: enemyType, id: ZoneGenerator.enemyCounter });
                break; // Successfully placed enemy
                }
            }
        }
    }

    isTileOccupiedByEnemy(x, y) {
        for (const enemy of this.enemies) {
            if (enemy.x === x && enemy.y === y) {
                return true;
            }
        }
        return false;
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

        // Check if this is the special tinted zone - only clear non-tinted tiles
        const isSpecialZone = (this.currentZoneX === 8 && this.currentZoneY === 8);
        const currentTile = this.grid[inwardY][inwardX];
        const isTintedTile = currentTile >= TILE_TYPES.PINK_FLOOR && currentTile <= TILE_TYPES.YELLOW_FLOOR;

        if (!isSpecialZone || !isTintedTile) {
            // Clear the adjacent tile
            this.grid[inwardY][inwardX] = TILE_TYPES.FLOOR;
        }

        // Clear adjacent inward tiles to create wider entry area (3x3 around inward tile)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = inwardX + dx;
                const ny = inwardY + dy;
                if (nx >= 1 && nx < GRID_SIZE - 1 && ny >= 1 && ny < GRID_SIZE - 1) {
                    const tile = this.grid[ny][nx];
                    const isTinted = tile >= TILE_TYPES.PINK_FLOOR && tile <= TILE_TYPES.YELLOW_FLOOR;
                    if ((!isSpecialZone || !isTinted) && (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY)) {
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

        // Check if this is the special tinted zone - don't clear tinted tiles
        const isSpecialZone = (this.currentZoneX === 8 && this.currentZoneY === 8);

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

            // Clear this tile if it's not already floor or exit, and not a tinted tile in special zone
            const currentTile = this.grid[currentY][currentX];
            const isTintedTile = currentTile >= TILE_TYPES.PINK_FLOOR && currentTile <= TILE_TYPES.YELLOW_FLOOR;
            if ((this.grid[currentY][currentX] === TILE_TYPES.WALL || this.grid[currentY][currentX] === TILE_TYPES.ROCK || this.grid[currentY][currentX] === TILE_TYPES.SHRUBBERY) &&
                !(isSpecialZone && isTintedTile)) {
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

    addSign(message) {
        // Try to place the sign in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = {
                    type: TILE_TYPES.SIGN,
                    message: message
                };
                break; // Successfully placed sign
            }
        }
    }

    addWell() {
        // Place a 2x2 well in Frontier zones (level 4) randomly, avoiding borders
        // Try to place the well in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            // Place away from borders
            const x = Math.floor(Math.random() * ((GRID_SIZE - 3) - 1)) + 1; // x from 1 to GRID_SIZE-3
            const y = Math.floor(Math.random() * ((GRID_SIZE - 3) - 1)) + 1; // y from 1 to GRID_SIZE-3

            // Check if all 2x2 tiles are free floor and not house
            let free = true;
            for (let dy = 0; dy < 2 && free; dy++) {
                for (let dx = 0; dx < 2 && free; dx++) {
                    if (this.grid[y + dy][x + dx] !== TILE_TYPES.FLOOR) {
                        free = false;
                    }
                }
            }

            if (free) {
                // Place the 2x2 well
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        this.grid[y + dy][x + dx] = TILE_TYPES.WELL;
                    }
                }
                ZoneGenerator.wellSpawned = true;
                break; // Successfully placed well
            }
        }
    }

    addDeadTree() {
        // Place a 2x2 dead tree in Woods zones (level 2) randomly, avoiding borders
        // Try to place the dead tree in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            // Place away from borders
            const x = Math.floor(Math.random() * ((GRID_SIZE - 3) - 1)) + 1; // x from 1 to GRID_SIZE-3
            const y = Math.floor(Math.random() * ((GRID_SIZE - 3) - 1)) + 1; // y from 1 to GRID_SIZE-3

            // Check if all 2x2 tiles are free floor and not house
            let free = true;
            for (let dy = 0; dy < 2 && free; dy++) {
                for (let dx = 0; dx < 2 && free; dx++) {
                    if (this.grid[y + dy][x + dx] !== TILE_TYPES.FLOOR) {
                        free = false;
                    }
                }
            }

            if (free) {
                // Place the 2x2 dead tree
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        this.grid[y + dy][x + dx] = TILE_TYPES.DEADTREE;
                    }
                }
                ZoneGenerator.deadTreeSpawned = true;
                console.log(`Dead tree spawned at zone (${this.currentZoneX}, ${this.currentZoneY})`);
                break; // Successfully placed dead tree
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
    if (dist <= 2) return 1; // Home
    else if (dist <= 8) return 2; // Woods
    else if (dist <= 16) return 3; // Wilds
    else return 4; // Frontier
    }

    blockExitsWithShrubbery(zoneX, zoneY, connections) {
        if (this.getZoneLevel() !== 4 || !connections) {
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

    static initializeItemLocations() {
        if (this.axeSpawnZone && this.hammerSpawnZone && this.spearSpawnZone) {
            return; // Already initialized
        }

        // Level 1 (Home): dist 1-2
        this.axeSpawnZone = this.getRandomZoneForLevel(1, 2);

        // Level 2 (Woods): dist 3-8
        this.hammerSpawnZone = this.getRandomZoneForLevel(3, 8);

        // Level 3 (Wilds): dist 9-16
        this.spearSpawnZone = this.getRandomZoneForLevel(9, 16);

        console.log('Special Item Locations:', {
            axe: this.axeSpawnZone,
            hammer: this.hammerSpawnZone,
            spear: this.spearSpawnZone
        });
    }

    addLionItem() {
        // Add the rare lion item

        // Try to place the lion in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.LION;
                ZoneGenerator.lionSpawned = true;
                console.log(`Lion spawned at zone (${this.currentZoneX}, ${this.currentZoneY}) at (${x}, ${y})`);
                break; // Successfully placed lion
            }
        }
    }

    addSquigItem() {
        // Add the rare squig item

        // Try to place the squig in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = TILE_TYPES.SQUIG;
                ZoneGenerator.squigSpawned = true;
                console.log(`Squig spawned at zone (${this.currentZoneX}, ${this.currentZoneY}) at (${x}, ${y})`);
                break; // Successfully placed squig
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

        // Ensure maze is solvable by clearing path to center if needed
        this.clearPathToCenter(startX, startY);
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

    static getRandomZoneForLevel(minDist, maxDist) {
        let x, y;
        do {
            const range = maxDist * 2 + 1;
            x = Math.floor(Math.random() * range) - maxDist;
            y = Math.floor(Math.random() * range) - maxDist;
        } while (Math.max(Math.abs(x), Math.abs(y)) < minDist || Math.max(Math.abs(x), Math.abs(y)) > maxDist);
        return { x, y };
    }
}
