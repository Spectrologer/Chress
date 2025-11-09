import { TILE_TYPES, GRID_SIZE, ZONE_CONSTANTS } from '@core/constants/index';
import { randomInt, findValidPlacement, isAllowedTile, validateAndSetTile } from './GeneratorUtils';
import { ZoneStateManager } from './ZoneStateManager';
import { logger } from '@core/logger';
import { isTileType, isTileObjectOfType, isFloor } from '@utils/TypeChecks';
import type { GridManager } from '@managers/GridManager';
import type { IGame } from '@core/context';

export class StructureGenerator {
    private gridManager: GridManager;
    private game: IGame | null;

    constructor(gridManager: GridManager, game: IGame | null = null) {
        this.gridManager = gridManager;
        this.game = game; // For accessing zoneGenState
    }

    addHouse(zoneX: number, zoneY: number): void {
        // Place a 4x3 club in the center-left area of zone (0,0)
        // Position it so the player can spawn in front of it (to the south)
        const houseStartX = ZONE_CONSTANTS.HOUSE_START_POSITION.x;
        const houseStartY = ZONE_CONSTANTS.HOUSE_START_POSITION.y;

        // Place the 4x3 club
        for (let y = houseStartY; y < houseStartY + 3; y++) {
            for (let x = houseStartX; x < houseStartX + 4; x++) {
                // Place a PORT tile at the bottom-middle of the house as an entrance
                // Centered for a 4-wide building, we place one door.
                if (x === houseStartX + 1 && y === houseStartY + 2) {
                    if (!isTileObjectOfType(this.gridManager.getTile(x, y), TILE_TYPES.SIGN)) {
                        validateAndSetTile(this.gridManager, x, y, TILE_TYPES.PORT);
                    }
                } else if (x >= 1 && x < GRID_SIZE - 1 && y >= 1 && y < GRID_SIZE - 1) {
                    // Check bounds for the rest of the club
                    if (!isTileObjectOfType(this.gridManager.getTile(x, y), TILE_TYPES.SIGN)) {
                        validateAndSetTile(this.gridManager, x, y, TILE_TYPES.HOUSE);
                    }
                }
            }
        }

        // Clear the area in front of the house (south side) for player spawn
        for (let x = houseStartX; x < houseStartX + 3; x++) {
            const frontY = houseStartY + 3; // One row south of the club
            if (frontY < GRID_SIZE - 1) {
                this.gridManager.setTile(x, frontY, TILE_TYPES.FLOOR);
            }
        }

        // Clear a bit more space around the house
        for (let y = houseStartY + 3; y < houseStartY + 5 && y < GRID_SIZE - 1; y++) {
            for (let x = houseStartX - 1; x < houseStartX + 5 && x >= 1 && x < GRID_SIZE - 1; x++) {
                this.gridManager.setTile(x, y, TILE_TYPES.FLOOR);
            }
        }

        // Always add a cistern behind the house in the home zone (0,0)
        if (zoneX === 0 && zoneY === 0) {
            // Place PORT tile two tiles above the textbox (sign is at 2,5, so PORT at 2,3 and CISTERN at 2,4)
            this.gridManager.setTile(2, 3, TILE_TYPES.PORT);     // Top part (entrance) - two tiles above the sign
            this.gridManager.setTile(2, 4, TILE_TYPES.CISTERN); // Bottom part
        }
    }

    _placeStructure(width: number, height: number, tileType: number, onPlacedCallback?: (x: number, y: number) => void): boolean {
        const allowedTiles = [TILE_TYPES.FLOOR, TILE_TYPES.ROCK, TILE_TYPES.SHRUBBERY, TILE_TYPES.GRASS, TILE_TYPES.WATER];
        const pos = findValidPlacement({
            maxAttempts: 50,
            minX: 1,
            minY: 1,
            maxX: GRID_SIZE - width,
            maxY: GRID_SIZE - height,
            validate: (x: number, y: number): boolean => {
                for (let dy = 0; dy < height; dy++) {
                    for (let dx = 0; dx < width; dx++) {
                        if (!isAllowedTile(this.gridManager.getTile(x + dx, y + dy), allowedTiles)) {
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
                    this.gridManager.setTile(x + dx, y + dy, tileType);
                }
            }
            if (onPlacedCallback) {
                onPlacedCallback(x, y);
            }
            return true;
        }
        return false;
    }

    addWell(zoneX: number, zoneY: number): void {
        this._placeStructure(2, 2, TILE_TYPES.WELL, () => {
            this.game?.zoneGenState.setSpawnFlag('well', true);
        });
    }

    addDeadTree(zoneX: number, zoneY: number): void {
        this._placeStructure(2, 2, TILE_TYPES.DEADTREE, () => {
            this.game?.zoneGenState.setSpawnFlag('deadTree', true);
            logger.log(`Dead tree spawned at zone (${zoneX}, ${zoneY})`);
        });
    }

    addShack(zoneX: number, zoneY: number): boolean {
        // Place a 3x3 shack with a PORT at the middle bottom
        // Allow placement on floor, grass, rock, shrubbery, and water to ensure reliable spawning in wilds zones
        const allowedTiles = [TILE_TYPES.FLOOR, TILE_TYPES.GRASS, TILE_TYPES.ROCK, TILE_TYPES.SHRUBBERY, TILE_TYPES.WATER];
        const pos = findValidPlacement({
            maxAttempts: 50,
            minX: 1,
            minY: 1,
            maxX: GRID_SIZE - 3,
            maxY: GRID_SIZE - 3,
            validate: (x: number, y: number): boolean => {
                // Check 3x3 area + one tile in front for the door
                for (let dy = 0; dy < 4; dy++) {
                    for (let dx = 0; dx < 3; dx++) {
                        const tile = this.gridManager.getTile(x + dx, y + dy);
                        if (!isAllowedTile(tile, allowedTiles)) return false;
                    }
                }
                return true;
            }
        });

        if (pos) {
            const { x, y } = pos;
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    this.gridManager.setTile(x + dx, y + dy, (dy === 2 && dx === 1) ? TILE_TYPES.PORT : TILE_TYPES.SHACK);
                }
            }

            // Clear a 3x3 area around the entrance (PORT) to ensure the shack fits and has space
            // The entrance is at (x+1, y+2), so clear tiles from (x, y+3) to (x+2, y+5)
            // Also clear the sides and a bit in front
            const entranceX = x + 1;
            const entranceY = y + 2;
            for (let clearY = entranceY - 1; clearY <= entranceY + 3 && clearY < GRID_SIZE - 1; clearY++) {
                for (let clearX = entranceX - 1; clearX <= entranceX + 1 && clearX >= 1 && clearX < GRID_SIZE - 1; clearX++) {
                    // Only clear rocks, shrubs, and other obstacles; leave floor/grass/water/shack/port
                    const tile = this.gridManager.getTile(clearX, clearY);
                    if (isTileType(tile, TILE_TYPES.ROCK) || isTileType(tile, TILE_TYPES.SHRUBBERY)) {
                        this.gridManager.setTile(clearX, clearY, TILE_TYPES.FLOOR);
                    }
                }
            }

            logger.log(`Shack spawned at zone (${zoneX}, ${zoneY}) position (${x}, ${y})`);
            return true;
        }
        return false;
    }

    addCistern(zoneX: number, zoneY: number, force: boolean = false, forcedX: number | null = null, forcedY: number | null = null): void {
        // Handle forced placement for home zone
        if (zoneX === 0 && zoneY === 0 && force) {
            // Always add the cistern behind the house in the home zone (0,0)
            // Place PORT tile two tiles above the textbox (sign is at 2,5, so PORT at 2,3 and CISTERN at 2,4)
            this.gridManager.setTile(2, 3, TILE_TYPES.PORT);     // Top part (entrance)
            this.gridManager.setTile(2, 4, TILE_TYPES.CISTERN); // Bottom part
            return;
        }

        // Handle forced placement at specific coordinates (e.g., from a hole)
        if (forcedX !== null && forcedY !== null) {
            this.gridManager.setTile(forcedX, forcedY, TILE_TYPES.PORT);
            // The cistern structure is a PORT on top of a CISTERN tile. But for a hole, it's just a PORT.
            // The logic in ZoneTransitionManager handles this. We just need the PORT to exist.
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
            validate: (x: number, y: number): boolean => {
                const topTile = this.gridManager.getTile(x, y);
                const bottomTile = this.gridManager.getTile(x, y + 1);
                return isAllowedTile(topTile, placeableTiles) && isAllowedTile(bottomTile, placeableTiles);
            }
        });
        if (pos) {
            const { x, y } = pos;
            this.gridManager.setTile(x, y, TILE_TYPES.PORT);
            this.gridManager.setTile(x, y + 1, TILE_TYPES.CISTERN);
        }
    }

}
