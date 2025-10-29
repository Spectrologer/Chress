// AI and tactical decision-making constants

/**
 * Tactical AI Direction Quadrant Codes
 * Used in TacticalAI.js for determining enemy movement directions
 *
 * The system uses a dual-code approach:
 * - Single digits (1-4) for diagonal directions
 * - Multiples of 10 (10-40) for orthogonal (cardinal) directions
 */
export const DIRECTION_QUADRANTS = {
    // Diagonal quadrants
    NORTHEAST: 1,
    SOUTHEAST: 2,
    NORTHWEST: 3,
    SOUTHWEST: 4,

    // Orthogonal directions (cardinal)
    EAST: 10,
    WEST: 20,
    NORTH: 30,
    SOUTH: 40,
};

/**
 * Helper to check if direction code is diagonal
 * @param {number} code - Direction quadrant code
 * @returns {boolean} True if diagonal (1-4)
 */
export function isDiagonalDirection(code) {
    return code >= 1 && code <= 4;
}

/**
 * Helper to check if direction code is orthogonal
 * @param {number} code - Direction quadrant code
 * @returns {boolean} True if orthogonal (10, 20, 30, 40)
 */
export function isOrthogonalDirection(code) {
    return code >= 10 && code <= 40 && code % 10 === 0;
}

/**
 * Map direction codes to delta coordinates
 */
export const DIRECTION_DELTAS = {
    [DIRECTION_QUADRANTS.NORTHEAST]: { dx: 1, dy: -1 },
    [DIRECTION_QUADRANTS.SOUTHEAST]: { dx: 1, dy: 1 },
    [DIRECTION_QUADRANTS.NORTHWEST]: { dx: -1, dy: -1 },
    [DIRECTION_QUADRANTS.SOUTHWEST]: { dx: -1, dy: 1 },
    [DIRECTION_QUADRANTS.EAST]: { dx: 1, dy: 0 },
    [DIRECTION_QUADRANTS.WEST]: { dx: -1, dy: 0 },
    [DIRECTION_QUADRANTS.NORTH]: { dx: 0, dy: -1 },
    [DIRECTION_QUADRANTS.SOUTH]: { dx: 0, dy: 1 },
};
