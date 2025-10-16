import { Sign } from '../ui/Sign.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';
import { randomInt, findValidPlacement, isAllowedTile, validateAndSetTile } from './GeneratorUtils.js';
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
                        validateAndSetTile(this.grid, x, y, TILE_TYPES.PORT);
                    }
                } else if (x >= 1 && x < GRID_SIZE - 1 && y >= 1 && y < GRID_SIZE - 1) {
                    // Check bounds for the rest of the club
                    if (!(this.grid[y][x] && typeof this.grid[y][x] === 'object' && this.grid[y][x].type === TILE_TYPES.SIGN)) {
                        validateAndSetTile(this.grid, x, y, TILE_TYPES.HOUSE);
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

        this._placeSignRandomly(message);
    }

    _placeStructure(width, height, tileType, onPlacedCallback) {
        const allowedTiles = [TILE_TYPES.FLOOR, TILE_TYPES.ROCK, TILE_TYPES.SHRUBBERY, TILE_TYPES.GRASS, TILE_TYPES.WATER];
        const pos = findValidPlacement({
            maxAttempts: 50,
            minX: 1,
            minY: 1,
            maxX: GRID_SIZE - width,
            maxY: GRID_SIZE - height,
            validate: (x, y) => {
                for (let dy = 0; dy < height; dy++) {
                    for (let dx = 0; dx < width; dx++) {
                        if (!isAllowedTile(this.grid[y + dy][x + dx], allowedTiles)) {
                            return false;
                        }
                    }
                }
                return true;
            }
        });
        if (pos) {
            const { x, y } = pos;
            for (let dy = 0; dy < height; dy++) {
                for (let dx = 0; dx < width; dx++) {
                    this.grid[y + dy][x + dx] = tileType;
                }
            }
            if (onPlacedCallback) {
                onPlacedCallback(x, y);
            }
            return true;
        }
        return false;
    }

    addWell(zoneX, zoneY) {
        this._placeStructure(2, 2, TILE_TYPES.WELL, () => { ZoneStateManager.wellSpawned = true; });
    }

    addDeadTree(zoneX, zoneY) {
        this._placeStructure(2, 2, TILE_TYPES.DEADTREE, () => {
            ZoneStateManager.deadTreeSpawned = true;
            logger.log(`Dead tree spawned at zone (${zoneX}, ${zoneY})`);
        });
    }

    addShack(zoneX, zoneY) {
        // Shack generation disabled
    }

    addCistern(zoneX, zoneY, force = false) {
        // Handle forced placement for home zone
        if (zoneX === 0 && zoneY === 0 && force) {
            // Always add the cistern behind the house in the home zone (0,0)
            // Place PORT tile two tiles above the sign (sign is at 2,5, so PORT at 2,3 and CISTERN at 2,4)
            this.grid[3][2] = TILE_TYPES.PORT;     // Top part (entrance)
            this.grid[4][2] = TILE_TYPES.CISTERN; // Bottom part
            return;
        }

        // For random spawning, try to place a cistern in a valid location
        const placeableTiles = [TILE_TYPES.FLOOR, TILE_TYPES.GRASS, TILE_TYPES.WATER];
        const pos = findValidPlacement({
            maxAttempts: 50,
            minX: 1,
            minY: 1,
            maxX: GRID_SIZE - 3,
            maxY: GRID_SIZE - 3,
            validate: (x, y) => {
                const topTile = this.grid[y][x];
                const bottomTile = this.grid[y + 1][x];
                return isAllowedTile(topTile, placeableTiles) && isAllowedTile(bottomTile, placeableTiles);
            }
        });
        if (pos) {
            const { x, y } = pos;
            this.grid[y][x] = TILE_TYPES.PORT;
            this.grid[y + 1][x] = TILE_TYPES.CISTERN;
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
        this._placeSignRandomly(message, () => Sign.spawnedMessages.add(message));
    }

    addRandomSign(zoneX, zoneY) {
        // Try to place the sign in a valid location (max 50 attempts)
        const pos = findValidPlacement({
            maxAttempts: 50,
            validate: (x, y) => this.grid[y][x] === TILE_TYPES.FLOOR
        });
        if (pos) {
            const { x, y } = pos;
            const message = Sign.getProceduralMessage(zoneX, zoneY);
            this.grid[y][x] = {
                type: TILE_TYPES.SIGN,
                message: message
            };
        }
    }

    _placeSignRandomly(message, onPlacedCallback = null) {
        const pos = findValidPlacement({
            maxAttempts: 50,
            validate: (x, y) => this.grid[y][x] === TILE_TYPES.FLOOR
        });
        if (pos) {
            const { x, y } = pos;
            this.grid[y][x] = { type: TILE_TYPES.SIGN, message: message };
            if (onPlacedCallback) {
                onPlacedCallback();
            }
            return true;
        }
        return false;
    }
}
