import { Position } from '../../core/Position.js';

/**
 * Generates a coordinate key for hashing
 * Accepts either Position object or separate x, y coordinates
 */
export function coordKey(xOrPos, y) {
    if (xOrPos instanceof Position) {
        return xOrPos.toKey();
    }
    return `${xOrPos},${y}`;
}

/**
 * Calculates Chebyshev distance (8-way grid movement)
 * Accepts either Position objects or separate coordinates
 */
export function chebyshev(aXOrPosA, aYOrPosB, bX, bY) {
    if (aXOrPosA instanceof Position && aYOrPosB instanceof Position) {
        return aXOrPosA.chebyshevDistance(aYOrPosB);
    }
    return Math.max(Math.abs(bX - aXOrPosA), Math.abs(bY - aYOrPosB));
}

/**
 * Calculates Manhattan distance (4-way grid movement)
 * Accepts either Position objects or separate coordinates
 */
export function manhattan(aXOrPosA, aYOrPosB, bX, bY) {
    if (aXOrPosA instanceof Position && aYOrPosB instanceof Position) {
        return aXOrPosA.manhattanDistance(aYOrPosB);
    }
    return Math.abs(bX - aXOrPosA) + Math.abs(bY - aYOrPosB);
}
