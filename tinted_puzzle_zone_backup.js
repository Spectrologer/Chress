// Backup of tinted puzzle zone logic - can be restored later if needed

// From generators/ZoneStateManager.js
// static puzzleZoneSpawned = false;

// From generators/ZoneStateManager.js resetSessionData()
// this.puzzleZoneSpawned = false;

// From generators/FeatureGenerator.js
/*
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
*/

// From generators/FeatureGenerator.js in addRandomFeatures
/*
        // Special tinted dirt easter egg zone - very rare chance in the Wilds (zone level 3)
        if (zoneLevel === 3 && !ZoneStateManager.puzzleZoneSpawned && Math.random() < 0.01) { // 1% chance
            this.addSpecialTintZone();
            ZoneStateManager.puzzleZoneSpawned = true;
            logger.log(`Special puzzle zone spawned at (${zoneX}, ${zoneY})`);
        }
*/

// From generators/ZoneGenerator.js in clearPathToExit
/*
        // Check if this is the special tinted zone - only clear non-tinted tiles
        const isSpecialZone = (this.currentZoneX === 8 && this.currentZoneY === 8);
        const currentTile = this.grid[inwardY][inwardX];
        const isTintedTile = currentTile >= TILE_TYPES.PINK_FLOOR && currentTile <= TILE_TYPES.YELLOW_FLOOR;

        if (!isSpecialZone || !isTintedTile) {
            // Clear the adjacent tile
            this.grid[inwardY][inwardX] = TILE_TYPES.FLOOR;
        }
*/

// In clearPathToCenter in ZoneGenerator.js
/*
        // Check if this is the special tinted zone - don't clear tinted tiles
        const isSpecialZone = (this.currentZoneX === 8 && this.currentZoneY === 8);
*/

// And in the loop:
/*
            // Clear this tile if it's not already floor or exit, and not a tinted tile in special zone
            const currentTile = this.grid[currentY][currentX];
            const isTintedTile = currentTile >= TILE_TYPES.PINK_FLOOR && currentTile <= TILE_TYPES.YELLOW_FLOOR;
            if ((this.grid[currentY][currentX] === TILE_TYPES.WALL || this.grid[currentY][currentX] === TILE_TYPES.ROCK || this.grid[currentY][currentX] === TILE_TYPES.SHRUBBERY) &&
                !(isSpecialZone && isTintedTile)) {
                this.grid[currentY][currentX] = TILE_TYPES.FLOOR;
            }
*/

// Also, tiled floors are in constants.js and remain, since used elsewhere or could be.
