import { TILE_TYPES, GRID_SIZE } from '../core/constants/index.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { isTileType } from '../utils/TileUtils.js';

export class MultiTileHandler {
    static findHousePosition(targetX, targetY, gridManager, isStrictCheck = false) {
        // Find the top-left corner of the 4x3 club that contains this tile
        for (let startY = Math.max(0, targetY - 2); startY <= Math.min(GRID_SIZE - 3, targetY); startY++) {
            for (let startX = Math.max(0, targetX - 3); startX <= Math.min(GRID_SIZE - 4, targetX); startX++) {
                // Check if there's a 4x3 club starting at this position
                let isHouse = true;
                for (let y = startY; y < startY + 3 && isHouse; y++) { // 3 tiles high
                    for (let x = startX; x < startX + 4 && isHouse; x++) { // 4 tiles wide
                        const tile = gridManager.getTile(x, y);
                        // A house tile can be either HOUSE or a PORT (the door)
                        if (!(isTileType(tile, TILE_TYPES.HOUSE) || isTileType(tile, TILE_TYPES.PORT))) {
                            isHouse = false;
                        }
                    }
                }

                // If doing a strict check (e.g., for cistern detection), ensure the target tile itself is a HOUSE or PORT.
                if (isStrictCheck && isHouse) {
                    const targetTile = gridManager.getTile(targetX, targetY);
                    if (!(isTileType(targetTile, TILE_TYPES.HOUSE) || isTileType(targetTile, TILE_TYPES.PORT))) continue;
                }
                if (isHouse && targetX >= startX && targetX < startX + 4 &&
                    targetY >= startY && targetY < startY + 3) {
                    return { startX, startY };
                }
            }
        }
        return null;
    }

    static _find2x2StructurePosition(targetX, targetY, gridManager, tileType) {
        // Find the top-left corner of the 2x2 structure that contains this tile
        for (let startY = Math.max(0, targetY - 1); startY <= Math.min(GRID_SIZE - 2, targetY); startY++) {
            for (let startX = Math.max(0, targetX - 1); startX <= Math.min(GRID_SIZE - 2, targetX); startX++) {
                // Check if there's a 2x2 structure starting at this position
                let isStructure = true;
                for (let y = startY; y < startY + 2 && isStructure; y++) {
                    for (let x = startX; x < startX + 2 && isStructure; x++) {
                        if (isWithinGrid(x, y) &&
                            gridManager.getTile(x, y) !== tileType) {
                            isStructure = false;
                        }
                    }
                }

                if (isStructure && targetX >= startX && targetX < startX + 2 &&
                    targetY >= startY && targetY < startY + 2) {
                    return { startX, startY };
                }
            }
        }
        return null;
    }

    static findWellPosition(targetX, targetY, gridManager) {
        return this._find2x2StructurePosition(targetX, targetY, gridManager, TILE_TYPES.WELL);
    }

    static findDeadTreePosition(targetX, targetY, gridManager) {
        return this._find2x2StructurePosition(targetX, targetY, gridManager, TILE_TYPES.DEADTREE);
    }

    static findShackPosition(targetX, targetY, gridManager, isStrictCheck = false) {
        // Handle gridManager validity
        const targetTileInitial = gridManager.getTile(targetX, targetY);
        if (targetTileInitial === undefined) {
            return null;
        }

        // Find the top-left corner of the shack that contains this tile
        for (let startY = Math.max(0, targetY - 2); startY <= Math.min(GRID_SIZE - 3, targetY); startY++) {
            for (let startX = Math.max(0, targetX - 2); startX <= Math.min(GRID_SIZE - 3, targetX); startX++) {
                // Check all 3x3 tiles to ensure it's a complete shack structure
                let isCompleteShack = true;
                for (let dy = 0; dy < 3 && isCompleteShack; dy++) {
                    for (let dx = 0; dx < 3 && isCompleteShack; dx++) {
                        const tileY = startY + dy;
                        const tileX = startX + dx;
                        const tile = gridManager.getTile(tileX, tileY);

                        // Check for grid corruption in shack detection
                        if (tile === null || tile === undefined) {
                            isCompleteShack = false;
                            break;
                        }

                        if (dy === 2 && dx === 1) {
                            // Door must be PORT
                            if (tile !== TILE_TYPES.PORT) {
                                isCompleteShack = false;
                            }
                        } else {
                            // Other tiles must be SHACK
                            if (tile !== TILE_TYPES.SHACK) {
                                isCompleteShack = false;
                            }
                        }
                    }
                }

                // If doing a strict check, ensure the target tile is part of this shack
                if (isStrictCheck && isCompleteShack) {
                    const targetTile = gridManager.getTile(targetX, targetY);
                    if (!(targetTile === TILE_TYPES.SHACK || targetTile === TILE_TYPES.PORT)) {
                        isCompleteShack = false;
                    }
                }

                if (isCompleteShack && targetX >= startX && targetX < startX + 3 &&
                    targetY >= startY && targetY < startY + 3) {
                    return { startX, startY };
                }
            }
        }
        return null;
    }

    static findCisternPosition(targetX, targetY, gridManager) {
        // Find the top-left corner of the 1x2 cistern that contains this tile
        // The structure is a top PORT tile and a bottom CISTERN tile.
        // Check if the current tile is the bottom part.
        if (targetY > 0 && gridManager.getTile(targetX, targetY) === TILE_TYPES.CISTERN && gridManager.getTile(targetX, targetY - 1) === TILE_TYPES.PORT) {
            return { startX: targetX, startY: targetY - 1 };
        }

        // Check if the current tile is the top part.
        if (targetY < GRID_SIZE - 1 && gridManager.getTile(targetX, targetY) === TILE_TYPES.PORT && gridManager.getTile(targetX, targetY + 1) === TILE_TYPES.CISTERN) {
            // Before confirming, ensure this isn't a door for a shack or house
            const shackInfo = this.findShackPosition(targetX, targetY, gridManager, true);
            const houseInfo = this.findHousePosition(targetX, targetY, gridManager, true);
            if (!shackInfo && !houseInfo) {
                return { startX: targetX, startY: targetY };
            }
        }

        return null;
    }

    static isHole(targetX, targetY, gridManager) {
        const tile = gridManager.getTile(targetX, targetY);
        if (tile !== TILE_TYPES.PORT) {
            return false;
        }
        const isCistern = this.findCisternPosition(targetX, targetY, gridManager);
        const isShack = this.findShackPosition(targetX, targetY, gridManager);
        const isHouse = this.findHousePosition(targetX, targetY, gridManager);

        return !isCistern && !isShack && !isHouse;
    }
}
