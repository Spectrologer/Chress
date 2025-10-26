/**
 * DirectionUtils - Helper for direction/coordinate conversions
 *
 * Centralizes logic for converting between:
 * - Arrow key strings ('arrowup', 'arrowdown', 'arrowleft', 'arrowright')
 * - Coordinate offsets ({x, y})
 * - Delta values (dx, dy) to direction strings
 */

/**
 * Direction to offset mapping
 */
const DIRECTION_OFFSETS = {
    arrowup: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 }
};

/**
 * Get coordinate offset for a direction key
 * @param {string} direction - Arrow key string (e.g., 'arrowright', 'arrowup')
 * @returns {{x: number, y: number}} Coordinate offset
 *
 * @example
 * getOffset('arrowright') // => { x: 1, y: 0 }
 * getOffset('arrowup')    // => { x: 0, y: -1 }
 */
export function getOffset(direction) {
    const normalized = direction.toLowerCase();
    return DIRECTION_OFFSETS[normalized] || { x: 0, y: 0 };
}

/**
 * Convert delta values to the appropriate arrow key direction
 * Prioritizes larger absolute delta (horizontal over vertical when equal)
 *
 * @param {number} dx - Delta X (positive = right, negative = left)
 * @param {number} dy - Delta Y (positive = down, negative = up)
 * @returns {string|null} Arrow key string or null if both deltas are 0
 *
 * @example
 * getDeltaToDirection(5, 2)   // => 'arrowright' (|dx| > |dy|)
 * getDeltaToDirection(-3, 8)  // => 'arrowdown' (|dy| > |dx|)
 * getDeltaToDirection(4, -4)  // => 'arrowright' (horizontal priority on tie)
 * getDeltaToDirection(0, 0)   // => null
 */
export function getDeltaToDirection(dx, dy) {
    if (dx === 0 && dy === 0) return null;

    if (Math.abs(dx) >= Math.abs(dy)) {
        // Horizontal movement (prioritize horizontal on tie)
        return dx > 0 ? 'arrowright' : 'arrowleft';
    } else {
        // Vertical movement
        return dy > 0 ? 'arrowdown' : 'arrowup';
    }
}

/**
 * Check if a string is a valid arrow direction
 * @param {string} direction - Direction string to check
 * @returns {boolean} True if valid arrow direction
 *
 * @example
 * isValidDirection('arrowup')    // => true
 * isValidDirection('w')          // => false
 * isValidDirection('ARROWRIGHT') // => true (case insensitive)
 */
export function isValidDirection(direction) {
    const normalized = direction.toLowerCase();
    return normalized in DIRECTION_OFFSETS;
}

/**
 * Get all valid arrow direction strings
 * @returns {string[]} Array of valid direction strings
 */
export function getAllDirections() {
    return Object.keys(DIRECTION_OFFSETS);
}

/**
 * Check if two positions are adjacent (including diagonals)
 * @param {number} dx - Absolute delta X
 * @param {number} dy - Absolute delta Y
 * @returns {boolean} True if positions are adjacent (not the same position)
 *
 * @example
 * isAdjacent(1, 0)  // => true (horizontally adjacent)
 * isAdjacent(1, 1)  // => true (diagonally adjacent)
 * isAdjacent(0, 0)  // => false (same position)
 * isAdjacent(2, 1)  // => false (not adjacent)
 */
export function isAdjacent(dx, dy) {
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
}
