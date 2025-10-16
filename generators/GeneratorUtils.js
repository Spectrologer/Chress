// GeneratorUtils.js
// Shared utilities for random placement, attempts loops, and tile validation in generators
import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';
import logger from '../core/logger.js';

/**
 * Returns a random integer between min (inclusive) and max (exclusive)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Attempts to find a valid (x, y) coordinate within the grid, using a validation callback.
 * Tries up to `maxAttempts` times. Returns {x, y} or null if not found.
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
            return { x, y };
        }
    }
    return null;
}

/**
 * Checks if a tile is within grid bounds (excluding border)
 */
export function isWithinBounds(x, y) {
    return x >= 1 && x < GRID_SIZE - 1 && y >= 1 && y < GRID_SIZE - 1;
}

/**
 * Checks if a tile type is allowed for placement
 */
export function isAllowedTile(tile, allowedTiles) {
    return allowedTiles.includes(tile);
}

/**
 * Returns the center coordinates of the grid
 */
export function getGridCenter() {
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_SIZE / 2);
    return { centerX, centerY };
}

/**
 * Safely sets a tile with validation to prevent corruption
 */
export function validateAndSetTile(grid, x, y, tileType) {
    if (grid[y]?.[x] === undefined) {
        grid[y] = grid[y] || [];
    }
    // Allow valid tile types only - reject null/undefined
    if (tileType !== null && tileType !== undefined) {
        grid[y][x] = tileType;
    } else {
        grid[y][x] = TILE_TYPES.FLOOR;
        logger.warn(`Attempted to set invalid tile at (${x}, ${y}), defaulting to FLOOR`);
    }
}

/**
 * Initializes grid safely with proper array allocation
 */
export function initializeGrid() {
    const grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = new Array(GRID_SIZE).fill(TILE_TYPES.FLOOR);
    }
    return grid;
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
            for (let x = 0; x < GRID_SIZE; x++) {
                if (!grid[y][x] || grid[y][x] === null || grid[y][x] === undefined) {
                    grid[y][x] = TILE_TYPES.FLOOR;
                    corruptionFixed = true;
                }
            }
        }
    }

    if (corruptionFixed) {
        logger.warn('Fixed corrupted tiles in loaded grid data');
    }

    return grid;
}
