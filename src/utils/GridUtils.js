// @ts-check
import { GRID_SIZE } from '../core/constants/index.js';

/**
 * Check if coordinates are within the grid boundaries
 * @param {number} x - X coordinate to check
 * @param {number} y - Y coordinate to check
 * @returns {boolean} True if coordinates are within grid bounds
 */
export const isWithinGrid = (x, y) => {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
};
