// @ts-check
import { EnemyPathfinding } from '../EnemyPathfinding';

/**
 * @typedef {Object} Direction
 * @property {number} x - X direction (-1, 0, or 1)
 * @property {number} y - Y direction (-1, 0, or 1)
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {Array<Array<number>>} [g] - Grid reference
 */

/**
 * @typedef {Object} Enemy
 * @property {number} x - Enemy X position
 * @property {number} y - Enemy Y position
 * @property {string} enemyType - Enemy type identifier
 * @property {Function} isWalkable - Check if position is walkable
 */

/**
 * Get multi-move directions for charging enemy types
 * @param {string} enemyType - Enemy type ('lazerd', 'lizardeaux', 'zard', etc.)
 * @returns {Direction[]} Array of direction vectors
 */
export function getMultiMoveDirections(enemyType) {
    switch (enemyType) {
        case 'lazerd':
            return [
                { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
                { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
            ];
        case 'lizardeaux':
            return [ { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 } ];
        case 'zard':
            return [ { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 } ];
        default:
            return [ { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 } ];
    }
}

/**
 * Check if path is consistent in a given direction
 * @param {Position[]} path - The path array
 * @param {Direction} dir - Direction vector
 * @param {Enemy} enemy - The enemy
 * @param {number} maxMoveIndex - Maximum move index found so far
 * @param {number} i - Current index to check
 * @returns {boolean} True if path is consistent
 */
function isPathConsistent(path, dir, enemy, maxMoveIndex, i) {
    const checkX = path[i].x - dir.x * (i - maxMoveIndex);
    const checkY = path[i].y - dir.y * (i - maxMoveIndex);
    return checkX === enemy.x && checkY === enemy.y;
}

/**
 * Apply aggressive multi-tile charging movement for charge-type enemies
 * Allows enemies like lizardeaux (rook) and zard (bishop) to charge multiple tiles
 * @param {Enemy} enemy - The enemy
 * @param {Position[]} path - Pathfinding result
 * @param {Position} next - Proposed next position
 * @returns {Position} Adjusted position (may be multiple tiles ahead if charging)
 */
export function applyAggressiveMovement(enemy, path, next) {
    const multiMoveTypes = new Set(['lazerd', 'lizardeaux', 'zard']);
    if (!multiMoveTypes.has(enemy.enemyType)) return next;

    const directions = getMultiMoveDirections(enemy.enemyType);
    for (const dir of directions) {
        if (next.x - enemy.x === dir.x && next.y - enemy.y === dir.y) {
            let maxMoveIndex = 1;
            for (let i = 2; i < path.length; i++) {
                if (!isPathConsistent(path, dir, enemy, maxMoveIndex, i)) continue;
                if (!enemy.isWalkable(path[i].x, path[i].y, path[0].g || [])) continue;
                maxMoveIndex = i;
            }
            next = path[maxMoveIndex];
            break;
        }
    }

    return next;
}
