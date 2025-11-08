import { GRID_SIZE } from '@core/constants/index';
import { isWithinGrid } from '@utils/GridUtils';
import {
    checkDiagonalLineOfSight,
    checkOrthogonalLineOfSight,
    checkQueenLineOfSight
} from '@utils/LineOfSightUtils';
import type { GridCompat } from '@types/core';

interface Enemy {
    x: number;
    y: number;
    isWalkable: (x: number, y: number, grid: GridCompat) => boolean;
}

export class EnemyChargeBehaviors {
    // Helper for zard: find adjacent tile next to player along diagonal line of sight and charge there
    static getChargeAdjacentDiagonalMove(
        enemy: Enemy,
        playerX: number,
        playerY: number,
        grid: GridCompat,
        enemies: Enemy[]
    ): { x: number; y: number } | null {
        // Check clear line of sight using utility function
        const hasLineOfSight: boolean = checkDiagonalLineOfSight(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x: number, y: number, grid: GridCompat) => enemy.isWalkable(x, y, grid),
                checkEnemies: true,
                enemies: enemies,
                includeEndpoint: false
            }
        );

        if (!hasLineOfSight) return null;

        // Find diagonal adjacent tile next to player
        const stepX: number = playerX > enemy.x ? 1 : -1;
        const stepY: number = playerY > enemy.y ? 1 : -1;
        const adjX: number = playerX - stepX;
        const adjY: number = playerY - stepY;

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
    static getChargeAdjacentMove(
        enemy: Enemy,
        playerX: number,
        playerY: number,
        grid: GridCompat,
        enemies: Enemy[]
    ): { x: number; y: number } | null {
        // Check clear line of sight using utility function
        const hasLineOfSight: boolean = checkOrthogonalLineOfSight(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x: number, y: number, grid: GridCompat) => enemy.isWalkable(x, y, grid),
                checkEnemies: true,
                enemies: enemies,
                includeEndpoint: false
            }
        );

        if (!hasLineOfSight) return null;

        // Calculate step direction
        const dx: number = Math.abs(enemy.x - playerX);
        const dy: number = Math.abs(enemy.y - playerY);
        const stepX: number = playerX > enemy.x ? 1 : playerX < enemy.x ? -1 : 0;
        const stepY: number = playerY > enemy.y ? 1 : playerY < enemy.y ? -1 : 0;

        // Find orthogonal adjacent tile next to player
        let adjX: number = playerX;
        let adjY: number = playerY;
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
    static getQueenChargeAdjacentMove(
        enemy: Enemy,
        playerX: number,
        playerY: number,
        grid: GridCompat,
        enemies: Enemy[]
    ): { x: number; y: number } | null {
        // Check clear line of sight using utility function
        const hasLineOfSight: boolean = checkQueenLineOfSight(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x: number, y: number, grid: GridCompat) => enemy.isWalkable(x, y, grid),
                checkEnemies: true,
                enemies: enemies,
                includeEndpoint: false
            }
        );

        if (!hasLineOfSight) return null;

        // Determine steps
        const stepX: number = playerX > enemy.x ? 1 : (playerX < enemy.x ? -1 : 0);
        const stepY: number = playerY > enemy.y ? 1 : (playerY < enemy.y ? -1 : 0);

        // Find adjacent tile next to player along the line
        const adjX: number = playerX - stepX;
        const adjY: number = playerY - stepY;

        // Check if that tile is walkable and not occupied by another enemy
        if (isWithinGrid(adjX, adjY) &&
            enemy.isWalkable(adjX, adjY, grid) &&
            !enemies.find(e => e.x === adjX && e.y === adjY)) {
            return { x: adjX, y: adjY };
        }

        return null;
    }
}
