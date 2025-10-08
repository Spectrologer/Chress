import { Sign } from '../Sign.js';
import { TILE_TYPES, GRID_SIZE } from '../constants.js';
import { ZoneStateManager } from './ZoneStateManager.js';
import logger from '../logger.js';

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
                // Centered for a 4-wide building, we can choose one of the two middle tiles.
                if ((x === houseStartX + 1 || x === houseStartX + 2) && y === houseStartY + 2) {
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
    }

    addSign(message, zoneX, zoneY) {
        // Special case for home zone (0,0) to place sign at a fixed location
        if (zoneX === 0 && zoneY === 0) {
            const houseStartX = 3;
            const houseStartY = 3;
            const portX = houseStartX + 1; // PORT center x = 4
            const signX = portX - 1; // 1 tile to the left of the PORT
            const signY = houseStartY + 3; // PORT at houseStartY + 2 = 5, so one tile bottom = 6
            // Force placement by clearing the tile first if necessary
            if (this.grid[signY][signX] !== TILE_TYPES.PORT && this.grid[signY][signX] !== TILE_TYPES.HOUSE) {
                this.grid[signY][signX] = { type: TILE_TYPES.SIGN, message: message };
                return; // Placed successfully
            }
            // Fallback to random placement if the preferred spot is occupied by house or port
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
                ZoneStateManager.deadTreeSpawned = true;
                logger.log(`Dead tree spawned at zone (${zoneX}, ${zoneY})`);
                break; // Successfully placed dead tree
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

        if (this.checkSignExists()) return;

        // Try to place the note in a valid location (max 50 attempts)
        for (let attempts = 0; attempts < 50; attempts++) {
            let x, y;
            if (zoneX === 0 && zoneY === 0) {
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
