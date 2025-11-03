import { GRID_SIZE } from '../core/constants/index';
import { isWithinGrid } from '../utils/GridUtils';
import {
    checkDiagonalLineOfSight,
    checkOrthogonalLineOfSight,
    checkQueenLineOfSight
} from '../utils/LineOfSightUtils';

export class EnemyChargeBehaviors {
    // Helper for zard: find adjacent tile next to player along diagonal line of sight and charge there
    static getChargeAdjacentDiagonalMove(enemy, playerX, playerY, grid, enemies) {
        // Check clear line of sight using utility function
        const hasLineOfSight = checkDiagonalLineOfSight(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x, y, grid) => enemy.isWalkable(x, y, grid),
                checkEnemies: true,
                enemies: enemies,
                includeEndpoint: false
            }
        );

        if (!hasLineOfSight) return null;

        // Find diagonal adjacent tile next to player
        const stepX = playerX > enemy.x ? 1 : -1;
        const stepY = playerY > enemy.y ? 1 : -1;
        const adjX = playerX - stepX;
        const adjY = playerY - stepY;

        // Sanity: ensure the adj tile is truly diagonal adjacent to player (dx=1,dy=1)
        if (Math.abs(adjX - playerX) !== 1 || Math.abs(adjY - playerY) !== 1) return null;

        // Check if that tile is walkable and not occupied by another enemy
        if (isWithinGrid(adjX, adjY) &&
            enemy.isWalkable(adjX, adjY, grid) &&
            !enemies.find(e => e.x === adjX && e.y === adjY)) {
            return { x: adjX, y: adjY };
        }

        return null;
    }

    // Helper for lizardeaux: find adjacent tile next to player along orthogonal line of sight and charge there
    static getChargeAdjacentMove(enemy, playerX, playerY, grid, enemies) {
        // Check clear line of sight using utility function
        const hasLineOfSight = checkOrthogonalLineOfSight(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x, y, grid) => enemy.isWalkable(x, y, grid),
                checkEnemies: true,
                enemies: enemies,
                includeEndpoint: false
            }
        );

        if (!hasLineOfSight) return null;

        // Calculate step direction
        const dx = Math.abs(enemy.x - playerX);
        const dy = Math.abs(enemy.y - playerY);
        const stepX = playerX > enemy.x ? 1 : playerX < enemy.x ? -1 : 0;
        const stepY = playerY > enemy.y ? 1 : playerY < enemy.y ? -1 : 0;

        // Find orthogonal adjacent tile next to player
        let adjX = playerX;
        let adjY = playerY;
        if (dx > dy) {
            adjX -= stepX;
        } else if (dy > dx) {
            adjY -= stepY;
        } else {
            // Equal, but since orthogonal, shouldn't happen if confirmed orthogonal line of sight
            adjX -= stepX;
        }

        // Check if that tile is walkable and not occupied by another enemy
        if (isWithinGrid(adjX, adjY) &&
            enemy.isWalkable(adjX, adjY, grid) &&
            !enemies.find(e => e.x === adjX && e.y === adjY)) {
            return { x: adjX, y: adjY };
        }

        return null;
    }

    // Helper for lazerd: find adjacent tile next to player along queen-like (orthogonal or diagonal) line of sight and charge there
    static getQueenChargeAdjacentMove(enemy, playerX, playerY, grid, enemies) {
        // Check clear line of sight using utility function
        const hasLineOfSight = checkQueenLineOfSight(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x, y, grid) => enemy.isWalkable(x, y, grid),
                checkEnemies: true,
                enemies: enemies,
                includeEndpoint: false
            }
        );

        if (!hasLineOfSight) return null;

        // Determine steps
        const stepX = playerX > enemy.x ? 1 : (playerX < enemy.x ? -1 : 0);
        const stepY = playerY > enemy.y ? 1 : (playerY < enemy.y ? -1 : 0);

        // Find adjacent tile next to player along the line
        const adjX = playerX - stepX;
        const adjY = playerY - stepY;

        // Check if that tile is walkable and not occupied by another enemy
        if (isWithinGrid(adjX, adjY) &&
            enemy.isWalkable(adjX, adjY, grid) &&
            !enemies.find(e => e.x === adjX && e.y === adjY)) {
            return { x: adjX, y: adjY };
        }

        return null;
    }
}
