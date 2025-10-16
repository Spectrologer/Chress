// GeneratorUtils.js
// Shared utilities for random placement, attempts loops, and tile validation in generators
import { GRID_SIZE } from '../core/constants.js';

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
