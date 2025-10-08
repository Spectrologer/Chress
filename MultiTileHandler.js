import { TILE_TYPES, GRID_SIZE } from './constants.js';

export class MultiTileHandler {
    static findHousePosition(targetX, targetY, grid) {
        // Find the top-left corner of the 4x3 club that contains this tile
        for (let startY = Math.max(0, targetY - 2); startY <= Math.min(GRID_SIZE - 3, targetY); startY++) {
            for (let startX = Math.max(0, targetX - 3); startX <= Math.min(GRID_SIZE - 4, targetX); startX++) {
                // Check if there's a 4x3 club starting at this position
                let isHouse = true;
                for (let y = startY; y < startY + 3 && isHouse; y++) { // 3 tiles high
                    for (let x = startX; x < startX + 4 && isHouse; x++) { // 4 tiles wide
                        const tile = grid[y]?.[x];
                        // A house tile can be either HOUSE or a PORT (the door)
                        if (!(tile === TILE_TYPES.HOUSE || tile === TILE_TYPES.PORT)) {
                            isHouse = false;
                        }
                    }
                }

                if (isHouse && targetX >= startX && targetX < startX + 4 &&
                    targetY >= startY && targetY < startY + 3) {
                    return { startX, startY };
                }
            }
        }
        return null;
    }

    static findWellPosition(targetX, targetY, grid) {
        // Find the top-left corner of the well that contains this tile
        for (let startY = Math.max(0, targetY - 1); startY <= Math.min(GRID_SIZE - 2, targetY); startY++) {
            for (let startX = Math.max(0, targetX - 1); startX <= Math.min(GRID_SIZE - 2, targetX); startX++) {
                // Check if there's a 2x2 well starting at this position
                let isWell = true;
                for (let y = startY; y < startY + 2 && isWell; y++) {
                    for (let x = startX; x < startX + 2 && isWell; x++) {
                        if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE &&
                            grid[y][x] !== TILE_TYPES.WELL) {
                            isWell = false;
                        }
                    }
                }

                if (isWell && targetX >= startX && targetX < startX + 2 &&
                    targetY >= startY && targetY < startY + 2) {
                    return { startX, startY };
                }
            }
        }
        return null;
    }

    static findDeadTreePosition(targetX, targetY, grid) {
        // Find the top-left corner of the dead tree that contains this tile
        for (let startY = Math.max(0, targetY - 1); startY <= Math.min(GRID_SIZE - 2, targetY); startY++) {
            for (let startX = Math.max(0, targetX - 1); startX <= Math.min(GRID_SIZE - 2, targetX); startX++) {
                // Check if there's a 2x2 dead tree starting at this position
                let isDeadTree = true;
                for (let y = startY; y < startY + 2 && isDeadTree; y++) {
                    for (let x = startX; x < startX + 2 && isDeadTree; x++) {
                        if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE &&
                            grid[y][x] !== TILE_TYPES.DEADTREE) {
                            isDeadTree = false;
                        }
                    }
                }

                if (isDeadTree && targetX >= startX && targetX < startX + 2 &&
                    targetY >= startY && targetY < startY + 2) {
                    return { startX, startY };
                }
            }
        }
        return null;
    }
}
