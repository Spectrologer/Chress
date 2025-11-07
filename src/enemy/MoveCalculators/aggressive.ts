import { EnemyPathfinding } from '@enemy/EnemyPathfinding';
import type { Position, Enemy, Grid } from './base';

export interface Direction {
    x: number;
    y: number;
}

/**
 * Get multi-move directions for charging enemy types
 */
export function getMultiMoveDirections(enemyType: string): Direction[] {
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
 */
function isPathConsistent(
    path: Position[],
    dir: Direction,
    enemy: Enemy,
    maxMoveIndex: number,
    i: number
): boolean {
    const checkX = path[i].x - dir.x * (i - maxMoveIndex);
    const checkY = path[i].y - dir.y * (i - maxMoveIndex);
    return checkX === enemy.x && checkY === enemy.y;
}

/**
 * Apply aggressive multi-tile charging movement for charge-type enemies
 * Allows enemies like lizardeaux (rook) and zard (bishop) to charge multiple tiles
 */
export function applyAggressiveMovement(
    enemy: Enemy,
    path: Position[],
    next: Position
): Position {
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
