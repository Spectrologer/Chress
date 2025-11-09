import {
    checkDiagonalLineOfSight as checkDiagonalLOS,
    checkOrthogonalLineOfSight as checkOrthogonalLOS,
    checkQueenLineOfSight as checkQueenLOS
} from '@utils/LineOfSightUtils';
import type { GridCompat } from '@types/core';

interface Enemy {
    x: number;
    y: number;
    isWalkable: (x: number, y: number, grid: GridCompat) => boolean;
}

export class EnemyLineOfSight {
    // Helper for Zard: check diagonal line of sight
    static checkDiagonalLineOfSight(
        enemy: Enemy,
        playerX: number,
        playerY: number,
        grid: GridCompat
    ): boolean {
        return checkDiagonalLOS(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x: number, y: number, grid: GridCompat) => enemy.isWalkable(x, y, grid),
                checkEnemies: false,
                includeEndpoint: false
            }
        );
    }

    // Helper for Lizardeaux: check orthogonal line of sight
    static checkOrthogonalLineOfSight(
        enemy: Enemy,
        playerX: number,
        playerY: number,
        grid: GridCompat,
        enemies: Enemy[]
    ): boolean {
        return checkOrthogonalLOS(
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
    }

    // Helper for Lazerd: check orthogonal/diagonal line of sight
    static checkQueenLineOfSight(
        enemy: Enemy,
        playerX: number,
        playerY: number,
        grid: GridCompat
    ): boolean {
        return checkQueenLOS(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x: number, y: number, grid: GridCompat) => enemy.isWalkable(x, y, grid),
                checkEnemies: false,
                includeEndpoint: false
            }
        );
    }
}
