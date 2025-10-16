import { Sign } from '../ui/Sign.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';
import { ZoneStateManager } from './ZoneStateManager.js';
import logger from '../core/logger.js';

export class StructureGenerator {
    constructor(grid) {
        this.grid = grid;
    }

    addHouse(zoneX, zoneY) {
        // Place a 4x3 club in the center-left area of zone (0,0)
        // Position it so the player can spawn in front of it (to the south)
        const houseStartX = 3; // Start at x=3
        const houseStartY = 3; // Start at y=3

        // Place the 4x3 club
        for (let y = houseStartY; y < houseStartY + 3; y++) {
            for (let x = houseStartX; x < houseStartX + 4; x++) {
                // Place a PORT tile at the bottom-middle of the house as an entrance
                // Centered for a 4-wide building, we place one door.
                if (x === houseStartX + 1 && y === houseStartY + 2) {
                    if (!(this.grid[y][x] && typeof this.grid[y][x] === 'object' && this.grid[y][x].type === TILE_TYPES.SIGN)) {
                        this.grid[y][x] = TILE_TYPES.PORT;
                    }
                } else if (x >= 1 && x < GRID_SIZE - 1 && y >= 1 && y < GRID_SIZE - 1) {
                    // Check bounds for the rest of the club
                    if (!(this.grid[y][x] && typeof this.grid[y][x] === 'object' && this.grid[y][x].type === TILE_TYPES.SIGN)) {
                        this.grid[y][x] = TILE_TYPES.HOUSE;
                    }
                }
            }
        }

        // Clear the area in front of the house (south side) for player spawn
        for (let x = houseStartX; x < houseStartX + 3; x++) {
            const frontY = houseStartY + 3; // One row south of the club
            if (frontY < GRID_SIZE - 1) {
                this.grid[frontY][x] = TILE_TYPES.FLOOR;
            }
        }

        // Clear a bit more space around the house
        for (let y = houseStartY + 3; y < houseStartY + 5 && y < GRID_SIZE - 1; y++) {
            for (let x = houseStartX - 1; x < houseStartX + 5 && x >= 1 && x < GRID_SIZE - 1; x++) {
                this.grid[y][x] = TILE_TYPES.FLOOR;
            }
        }

        // Always add a cistern behind the house in the home zone (0,0)
        if (zoneX === 0 && zoneY === 0) {
            // Place PORT tile two tiles above the sign (sign is at 2,5, so PORT at 2,3 and CISTERN at 2,4)
            this.grid[3][2] = TILE_TYPES.PORT;     // Top part (entrance) - two tiles above the sign
            this.grid[4][2] = TILE_TYPES.CISTERN; // Bottom part
        }
    }

    addSign(message, zoneX, zoneY) {
        // Special case for home zone (0,0) to place sign at specific position
        if (zoneX === 0 && zoneY === 0) {
            const signX = 2;
            const signY = 5;
            this.grid[signY][signX] = { type: TILE_TYPES.SIGN, message: message };
            logger.log(`WOODCUTTERS sign placed at tile ${signX},${signY} in zone (0,0)`);
            return; // Placed successfully
        }

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

    addWell(zoneX, zoneY) {
        // Place a 2x2 well in Frontier zones (level 4) randomly, avoiding borders
        // Try to place the well in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            // Place away from borders
            const x = Math.floor(Math.random() * ((GRID_SIZE - 3) - 1)) + 1; // x from 1 to GRID_SIZE-3
            const y = Math.floor(Math.random() * ((GRID_SIZE - 3) - 1)) + 1; // y from 1 to GRID_SIZE-3

            // Check if all 2x2 tiles are placeable (allow clearing obstacles)
            let free = true;
            const allowedTiles = [TILE_TYPES.FLOOR, TILE_TYPES.ROCK, TILE_TYPES.SHRUBBERY, TILE_TYPES.GRASS, TILE_TYPES.WATER];
            for (let dy = 0; dy < 2 && free; dy++) {
                for (let dx = 0; dx < 2 && free; dx++) {
                    if (!allowedTiles.includes(this.grid[y + dy][x + dx])) {
                        free = false;
                    }
                }
            }

            if (free) {
                // Place the 2x2 well, overwriting any obstacles
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        this.grid[y + dy][x + dx] = TILE_TYPES.WELL;
                    }
                }
                ZoneStateManager.wellSpawned = true;
                break; // Successfully placed well
            }
        }
    }

    addDeadTree(zoneX, zoneY) {
        // Place a 2x2 dead tree in Woods zones (level 2) randomly, avoiding borders
        // Try to place the dead tree in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            // Place away from borders
            const x = Math.floor(Math.random() * ((GRID_SIZE - 3) - 1)) + 1; // x from 1 to GRID_SIZE-3
            const y = Math.floor(Math.random() * ((GRID_SIZE - 3) - 1)) + 1; // y from 1 to GRID_SIZE-3

            // Check if all 2x2 tiles are placeable (allow clearing obstacles)
            let free = true;
            const allowedTiles = [TILE_TYPES.FLOOR, TILE_TYPES.ROCK, TILE_TYPES.SHRUBBERY, TILE_TYPES.GRASS, TILE_TYPES.WATER];
            for (let dy = 0; dy < 2 && free; dy++) {
                for (let dx = 0; dx < 2 && free; dx++) {
                    if (!allowedTiles.includes(this.grid[y + dy][x + dx])) {
                        free = false;
                    }
                }
            }

            if (free) {
                // Place the 2x2 dead tree, overwriting any obstacles
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        this.grid[y + dy][x + dx] = TILE_TYPES.DEADTREE;
                    }
                }
                ZoneStateManager.deadTreeSpawned = true;
                logger.log(`Dead tree spawned at zone (${zoneX}, ${zoneY})`);
                break; // Successfully placed shack
            }
        }
    }

    addShack(zoneX, zoneY) {
        // Shack generation disabled
    }

    addCistern(zoneX, zoneY, force = false) {
        // Cistern generation disabled (except for home zone)
        if (zoneX === 0 && zoneY === 0 && force) {
            // Always add the cistern behind the house in the home zone (0,0)
            // Place PORT tile two tiles above the sign (sign is at 2,5, so PORT at 2,3 and CISTERN at 2,4)
            this.grid[3][2] = TILE_TYPES.PORT;     // Top part (entrance)
            this.grid[4][2] = TILE_TYPES.CISTERN; // Bottom part
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

    addSpecificNote(messageIndex, zoneX, zoneY) {
        let area;
        const level = ZoneStateManager.getZoneLevel(zoneX, zoneY);
        if (level === 1) area = 'home';
        else if (level === 2) area = 'woods';
        else if (level === 3) area = 'wilds';
        else if (level === 4) area = 'frontier';
        else return;

        const message = Sign.getMessageByIndex(area, messageIndex);
        logger.log('[Note Debug] addSpecificNote:', { area, messageIndex, message });
        if (Sign.spawnedMessages.has(message)) return;

        // Try to place the note in a valid location (max 50 attempts)
        let x, y;
        if (zoneX === 0 && zoneY === 0) {
            // Fixed location for home zone, at tile 3,4
            x = 3;
            y = 4;
            // Override any tile here to place the sign
            this.grid[y][x] = {
                type: TILE_TYPES.SIGN,
                message: message
            };
            Sign.spawnedMessages.add(message);
            logger.log(`Home note sign placed at tile 3,4 in zone (0,0)`);
            return;
        }

        // For other zones, use random placement
        for (let attempts = 0; attempts < 50; attempts++) {
            x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                this.grid[y][x] = {
                    type: TILE_TYPES.SIGN,
                    message: message
                };
                Sign.spawnedMessages.add(message);
                break; // Successfully placed sign
            }
        }
    }

    addRandomSign(zoneX, zoneY) {
        // Try to place the sign in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

            // Only place on floor tiles (not on walls, rocks, grass, etc.)
            if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                const message = Sign.getProceduralMessage(zoneX, zoneY);
                this.grid[y][x] = {
                    type: TILE_TYPES.SIGN,
                    message: message
                };
                break; // Successfully placed sign
            }
        }
    }
}
