/**
 * DirectionUtils - Helper for direction/coordinate conversions
 *
 * Centralizes logic for converting between:
 * - Arrow key strings ('arrowup', 'arrowdown', 'arrowleft', 'arrowright')
 * - Coordinate offsets ({x, y})
 * - Delta values (dx, dy) to direction strings
 */

export interface DirectionOffset {
    x: number;
    y: number;
}

export type ArrowDirection = 'arrowup' | 'arrowdown' | 'arrowleft' | 'arrowright';

/**
 * Direction to offset mapping
 */
const DIRECTION_OFFSETS: Record<ArrowDirection, DirectionOffset> = {
    arrowup: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 }
};

/**
 * Get coordinate offset for a direction key
 * @param direction - Arrow key string (e.g., 'arrowright', 'arrowup')
 * @returns Coordinate offset
 *
 * @example
 * getOffset('arrowright') // => { x: 1, y: 0 }
 * getOffset('arrowup')    // => { x: 0, y: -1 }
 */
export function getOffset(direction: string): DirectionOffset {
    const normalized = direction.toLowerCase() as ArrowDirection;
    return DIRECTION_OFFSETS[normalized] || { x: 0, y: 0 };
}

/**
 * Convert delta values to the appropriate arrow key direction
 * Prioritizes larger absolute delta (horizontal over vertical when equal)
 *
 * @param dx - Delta X (positive = right, negative = left)
 * @param dy - Delta Y (positive = down, negative = up)
 * @returns Arrow key string or null if both deltas are 0
 *
 * @example
 * getDeltaToDirection(5, 2)   // => 'arrowright' (|dx| > |dy|)
 * getDeltaToDirection(-3, 8)  // => 'arrowdown' (|dy| > |dx|)
 * getDeltaToDirection(4, -4)  // => 'arrowright' (horizontal priority on tie)
 * getDeltaToDirection(0, 0)   // => null
 */
export function getDeltaToDirection(dx: number, dy: number): ArrowDirection | null {
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
 * @param direction - Direction string to check
 * @returns True if valid arrow direction
 *
 * @example
 * isValidDirection('arrowup')    // => true
 * isValidDirection('w')          // => false
 * isValidDirection('ARROWRIGHT') // => true (case insensitive)
 */
export function isValidDirection(direction: string): direction is ArrowDirection {
    const normalized = direction.toLowerCase();
    return normalized in DIRECTION_OFFSETS;
}

/**
 * Get all valid arrow direction strings
 * @returns Array of valid direction strings
 */
export function getAllDirections(): ArrowDirection[] {
    return Object.keys(DIRECTION_OFFSETS) as ArrowDirection[];
}

/**
 * Check if two positions are adjacent (including diagonals)
 * @param dx - Absolute delta X
 * @param dy - Absolute delta Y
 * @returns True if positions are adjacent (not the same position)
 *
 * @example
 * isAdjacent(1, 0)  // => true (horizontally adjacent)
 * isAdjacent(1, 1)  // => true (diagonally adjacent)
 * isAdjacent(0, 0)  // => false (same position)
 * isAdjacent(2, 1)  // => false (not adjacent)
 */
export function isAdjacent(dx: number, dy: number): boolean {
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
}
