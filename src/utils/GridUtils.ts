import { GRID_SIZE } from '../core/constants/index.ts';

/**
 * Check if coordinates are within the grid boundaries
 * @param x - X coordinate to check
 * @param y - Y coordinate to check
 * @returns True if coordinates are within grid bounds
 */
export const isWithinGrid = (x: number, y: number): boolean => {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
};
