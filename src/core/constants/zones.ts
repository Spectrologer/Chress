// Zone generation and level constants
// Import GRID_SIZE from tiles.js to avoid duplication
import { GRID_SIZE } from './tiles.js';

/**
 * Zone level distance thresholds
 * Determines zone difficulty/type based on Manhattan distance from origin
 *
 * CRITICAL: These values are used in multiple files:
 * - ConnectionManager.js (connection generation)
 * - RenderManager.js (visual styling)
 * - ZoneStateManager.js (zone level determination)
 *
 * Always use these constants to maintain consistency!
 */
export const ZONE_LEVEL_DISTANCES = {
    HOME_RADIUS: 2, // Distance <= 2: Level 1 (Home zones)
    WOODS_RADIUS: 8, // Distance <= 8: Level 2 (Woods zones)
    WILDS_RADIUS: 16, // Distance <= 16: Level 3 (Wilds zones)
    // Distance > 16: Level 4 (Deep wilds/endgame)
};

/**
 * Helper function to get zone level from distance
 * @param distance - Manhattan distance from origin
 * @returns Zone level (1-4)
 */
export function getZoneLevelFromDistance(distance: number): number {
    if (distance <= ZONE_LEVEL_DISTANCES.HOME_RADIUS) return 1;
    if (distance <= ZONE_LEVEL_DISTANCES.WOODS_RADIUS) return 2;
    if (distance <= ZONE_LEVEL_DISTANCES.WILDS_RADIUS) return 3;
    return 4;
}

/**
 * Derived grid calculations
 * Note: Math.floor(10/2) = 5
 * The center is at position (5,5) with 10x10 grid
 * GRID_SIZE is imported from tiles.js
 */
export const GRID_CENTER = Math.floor(GRID_SIZE / 2); // = 5
export const GRID_MAX_INDEX = GRID_SIZE - 1; // = 9

// Re-export GRID_SIZE for convenience so it can be imported from zones.js
export { GRID_SIZE };
