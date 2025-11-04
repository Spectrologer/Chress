import { GRID_SIZE } from '@core/constants/index';
import { logger } from '@core/logger';

/**
 * Check if coordinates are within the grid boundaries
 * @param x - X coordinate to check
 * @param y - Y coordinate to check
 * @returns True if coordinates are within grid bounds
 */
export const isWithinGrid = (x: number, y: number): boolean => {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
};

/**
 * Safely retrieves the GridManager from a zone generation context
 * @param zoneGen - Zone generation context object
 * @param context - Optional context string for logging (e.g., function name)
 * @returns GridManager instance or null if not available
 */
export const getGridManager = (zoneGen: any, context?: string): any | null => {
    const gridManager = zoneGen.gridManager || (zoneGen.game && zoneGen.game.gridManager);

    if (!gridManager && context) {
        logger.warn(`${context}: gridManager not available`);
    }

    return gridManager || null;
};
