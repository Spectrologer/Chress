import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';

export class MultiTileHandler {
    static findHousePosition(targetX, targetY, grid, isStrictCheck = false) {
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

                // If doing a strict check (e.g., for cistern detection), ensure the target tile itself is a HOUSE or PORT.
                if (isStrictCheck && isHouse) {
                    const targetTile = grid[targetY]?.[targetX];
                    if (!(targetTile === TILE_TYPES.HOUSE || targetTile === TILE_TYPES.PORT)) continue;
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

    static findShackPosition(targetX, targetY, grid, isStrictCheck = false) {
        // Find the top-left corner of the shack that contains this tile
        for (let startY = Math.max(0, targetY - 2); startY <= Math.min(GRID_SIZE - 3, targetY); startY++) {
            for (let startX = Math.max(0, targetX - 2); startX <= Math.min(GRID_SIZE - 3, targetX); startX++) {                
                // Check if there's a 3x3 shack starting at this position
                let isShack = true;
                for (let y = startY; y < startY + 3 && isShack; y++) {
                    for (let x = startX; x < startX + 3 && isShack; x++) {
                        const tile = grid[y]?.[x];
                        // A shack tile can be either SHACK or a PORT (the door)
                        if (!(tile === TILE_TYPES.SHACK || tile === TILE_TYPES.PORT)) {
                            isShack = false;
                        }
                    }
                }

                // If doing a strict check (e.g., for cistern detection), ensure the target tile itself is a SHACK or PORT.
                if (isStrictCheck && isShack) {
                    const targetTile = grid[targetY]?.[targetX];
                    if (!(targetTile === TILE_TYPES.SHACK || targetTile === TILE_TYPES.PORT)) continue;
                }
                if (isShack && targetX >= startX && targetX < startX + 3 &&
                    targetY >= startY && targetY < startY + 3) {
                    return { startX, startY };
                }
            }
        }
        return null;
    }

    static findCisternPosition(targetX, targetY, grid) {
        // Find the top-left corner of the 1x2 cistern that contains this tile
        // The structure is a top PORT tile and a bottom CISTERN tile.
        // Check if the current tile is the bottom part.
        if (targetY > 0 && grid[targetY][targetX] === TILE_TYPES.CISTERN && grid[targetY - 1][targetX] === TILE_TYPES.PORT) {
            return { startX: targetX, startY: targetY - 1 };
        }
    
        // Check if the current tile is the top part.
        if (targetY < GRID_SIZE - 1 && grid[targetY][targetX] === TILE_TYPES.PORT && grid[targetY + 1][targetX] === TILE_TYPES.CISTERN) {
            // Before confirming, ensure this isn't a door for a shack or house
            const shackInfo = this.findShackPosition(targetX, targetY, grid, true);
            const houseInfo = this.findHousePosition(targetX, targetY, grid, true);
            if (!shackInfo && !houseInfo) {
                return { startX: targetX, startY: targetY };
            }
        }
    
        return null;
    }
}
