import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';
import { isWithinGrid } from '@utils/GridUtils';
import { isTileType, isPort, isGrate, isShack } from '@utils/TileUtils';
import type { GridManager } from './types';

interface StructurePosition {
    startX: number;
    startY: number;
}

export class MultiTileHandler {
    static findHousePosition(targetX: number, targetY: number, gridManager: GridManager, isStrictCheck = false): StructurePosition | null {
        // Find the top-left corner of the 4x3 museum that contains this tile
        // Uses a lenient check that allows overlays/decorations on top of the structure
        // IMPORTANT: Always return the top-leftmost valid structure to ensure consistent rendering

        let bestMatch: StructurePosition | null = null;
        let bestMatchCount = 0;

        for (let startY = Math.max(0, targetY - 2); startY <= Math.min(GRID_SIZE - 3, targetY); startY++) {
            for (let startX = Math.max(0, targetX - 3); startX <= Math.min(GRID_SIZE - 4, targetX); startX++) {
                // Count how many tiles match HOUSE or PORT
                let matchingTiles = 0;
                let totalTiles = 0;

                for (let y = startY; y < startY + 3; y++) { // 3 tiles high
                    for (let x = startX; x < startX + 4; x++) { // 4 tiles wide
                        totalTiles++;
                        const tile = gridManager.getTile(x, y);
                        // A house tile can be either HOUSE or a PORT (the door)
                        if (isTileType(tile, TILE_TYPES.HOUSE) || isTileType(tile, TILE_TYPES.PORT)) {
                            matchingTiles++;
                        }
                    }
                }

                // Accept if at least 75% of tiles match (9 out of 12 tiles)
                // This allows some tiles to be overlaid with decorations
                const matchThreshold = Math.ceil(totalTiles * 0.75);
                const isHouse = matchingTiles >= matchThreshold;

                // If doing a strict check (e.g., for Grate detection), ensure the target tile itself is a HOUSE or PORT.
                if (isStrictCheck && isHouse) {
                    const targetTile = gridManager.getTile(targetX, targetY);
                    if (!(isTileType(targetTile, TILE_TYPES.HOUSE) || isTileType(targetTile, TILE_TYPES.PORT))) continue;
                }

                if (isHouse && targetX >= startX && targetX < startX + 4 &&
                    targetY >= startY && targetY < startY + 3) {
                    // Prefer matches with more tiles, and prefer top-left positions when counts are equal
                    if (!bestMatch || matchingTiles > bestMatchCount ||
                        (matchingTiles === bestMatchCount && (startY < bestMatch.startY ||
                         (startY === bestMatch.startY && startX < bestMatch.startX)))) {
                        bestMatch = { startX, startY };
                        bestMatchCount = matchingTiles;
                    }
                }
            }
        }
        return bestMatch;
    }

    static _find2x2StructurePosition(targetX: number, targetY: number, gridManager: GridManager, tileType: any): StructurePosition | null {
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

    static findWellPosition(targetX: number, targetY: number, gridManager: GridManager): StructurePosition | null {
        return this._find2x2StructurePosition(targetX, targetY, gridManager, TILE_TYPES.WELL);
    }

    static findDeadTreePosition(targetX: number, targetY: number, gridManager: GridManager): StructurePosition | null {
        return this._find2x2StructurePosition(targetX, targetY, gridManager, TILE_TYPES.DEADTREE);
    }

    static findBigTreePosition(targetX: number, targetY: number, gridManager: GridManager): StructurePosition | null {
        // Find the top-left corner of the 2x3 big tree that contains this tile
        // Uses a lenient check that allows overlays/decorations on top of the structure
        for (let startY = Math.max(0, targetY - 2); startY <= Math.min(GRID_SIZE - 3, targetY); startY++) {
            for (let startX = Math.max(0, targetX - 1); startX <= Math.min(GRID_SIZE - 2, targetX); startX++) {
                // Count how many tiles match BIG_TREE
                let matchingTiles = 0;
                let totalTiles = 0;

                for (let y = startY; y < startY + 3; y++) { // 3 tiles high
                    for (let x = startX; x < startX + 2; x++) { // 2 tiles wide
                        totalTiles++;
                        const tile = gridManager.getTile(x, y);
                        if (isTileType(tile, TILE_TYPES.BIG_TREE)) {
                            matchingTiles++;
                        }
                    }
                }

                // Accept if at least 75% of tiles match (5 out of 6 tiles)
                // This allows some tiles to be overlaid with decorations
                const matchThreshold = Math.ceil(totalTiles * 0.75);
                const isBigTree = matchingTiles >= matchThreshold;

                if (isBigTree && targetX >= startX && targetX < startX + 2 &&
                    targetY >= startY && targetY < startY + 3) {
                    return { startX, startY };
                }
            }
        }
        return null;
    }

    static findShackPosition(targetX: number, targetY: number, gridManager: GridManager, isStrictCheck = false): StructurePosition | null {
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
                            if (!isPort(tile)) {
                                isCompleteShack = false;
                            }
                        } else {
                            // Other tiles must be SHACK
                            if (!isShack(tile)) {
                                isCompleteShack = false;
                            }
                        }
                    }
                }

                // If doing a strict check, ensure the target tile is part of this shack
                if (isStrictCheck && isCompleteShack) {
                    const targetTile = gridManager.getTile(targetX, targetY);
                    if (!(isShack(targetTile) || isPort(targetTile))) {
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

    static findGratePosition(targetX: number, targetY: number, gridManager: GridManager): StructurePosition | null {
        // Check if the tile at the target position is a grate
        const tile = gridManager.getTile(targetX, targetY);
        if (!isGrate(tile)) {
            return null;
        }
        // Grates are single-tile structures, so return the position itself
        return { startX: targetX, startY: targetY };
    }

    static isHole(targetX: number, targetY: number, gridManager: GridManager): boolean {
        const tile = gridManager.getTile(targetX, targetY);
        if (!isPort(tile)) {
            return false;
        }
        const isShack = this.findShackPosition(targetX, targetY, gridManager);
        const isHouse = this.findHousePosition(targetX, targetY, gridManager);

        return !isShack && !isHouse;
    }
}
