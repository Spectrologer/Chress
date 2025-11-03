// GeneratorUtils.js
// Shared utilities for random placement, attempts loops, and tile validation in generators
import { GRID_SIZE, TILE_TYPES } from '../core/constants/index.ts';
import { logger } from '../core/logger.ts';
import GridIterator from '../utils/GridIterator.js';
import { Position } from '../core/Position.ts';

/**
 * Returns a random integer between min (inclusive) and max (exclusive)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Attempts to find a valid (x, y) coordinate within the grid, using a validation callback.
 * Tries up to `maxAttempts` times. Returns Position or null if not found.
 */
export function findValidPlacement({
    maxAttempts = 50,
    minX = 1,
    minY = 1,
    maxX = GRID_SIZE - 1,
    maxY = GRID_SIZE - 1,
    validate = () => true
} = {}) {
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
        const x = randomInt(minX, maxX);
        const y = randomInt(minY, maxY);
        if (validate(x, y)) {
            return new Position(x, y);
        }
    }
    return null;
}

/**
 * Checks if a position is within grid bounds (excluding border)
 * Accepts either Position object or separate x, y coordinates
 */
export function isWithinBounds(xOrPos, y) {
    if (xOrPos instanceof Position) {
        return xOrPos.isInInnerBounds(GRID_SIZE);
    }
    const pos = new Position(xOrPos, y);
    return pos.isInInnerBounds(GRID_SIZE);
}

/**
 * Checks if a tile type is allowed for placement
 */
export function isAllowedTile(tile, allowedTiles) {
    return allowedTiles.includes(tile);
}

/**
 * Returns the center coordinates of the grid as a Position
 */
export function getGridCenter() {
    return Position.center(GRID_SIZE);
}

/**
 * Safely sets a tile with validation to prevent corruption
 * Accepts either Position object or separate x, y coordinates
 */
export function validateAndSetTile(grid, xOrPos, yOrTileType, tileType) {
    let pos, tile;

    if (xOrPos instanceof Position) {
        pos = xOrPos;
        tile = yOrTileType;
    } else {
        pos = new Position(xOrPos, yOrTileType);
        tile = tileType;
    }

    if (grid[pos.y]?.[pos.x] === undefined) {
        grid[pos.y] = grid[pos.y] || [];
    }
    // Allow valid tile types only - reject null/undefined
    if (tile !== null && tile !== undefined) {
        pos.setTile(grid, tile);
    } else {
        pos.setTile(grid, TILE_TYPES.FLOOR);
        logger.warn(`Attempted to set invalid tile at ${pos.toString()}, defaulting to FLOOR`);
    }
}

/**
 * Initializes grid safely with proper array allocation
 */
export function initializeGrid() {
    return GridIterator.initialize(TILE_TYPES.FLOOR);
}

/**
 * Validates loaded grid data after deserialization
 */
export function validateLoadedGrid(grid) {
    if (!Array.isArray(grid) || grid.length !== GRID_SIZE) {
        logger.warn('Grid is not a proper array or wrong size, recreating');
        return initializeGrid();
    }

    let corruptionFixed = false;
    for (let y = 0; y < GRID_SIZE; y++) {
        if (!Array.isArray(grid[y])) {
            grid[y] = new Array(GRID_SIZE).fill(TILE_TYPES.FLOOR);
            corruptionFixed = true;
        } else {
            GridIterator.forEach(grid, (tile, x, y) => {
                // Check if tile is actually invalid (null/undefined)
                // Note: tile can be 0 (FLOOR) or an object {type: 0}, both are valid
                if (tile === null || tile === undefined) {
                    grid[y][x] = TILE_TYPES.FLOOR;
                    corruptionFixed = true;
                }
            }, { startY: y, endY: y + 1 });
        }
    }

    if (corruptionFixed) {
        logger.warn('Fixed corrupted tiles in loaded grid data');
    }

    return grid;
}
