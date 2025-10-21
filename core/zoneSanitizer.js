import { GRID_SIZE, TILE_TYPES } from './constants.js';
import logger from './logger.js';

export function sanitizeGrid(zoneGen) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (zoneGen.grid[y][x] === null || zoneGen.grid[y][x] === undefined) {
                logger.warn(`Fixed corrupted tile at (${x}, ${y}) by replacing with FLOOR`);
                zoneGen.grid[y][x] = TILE_TYPES.FLOOR;
            }
        }
    }
}
