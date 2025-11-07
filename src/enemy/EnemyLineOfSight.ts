import {
    checkDiagonalLineOfSight as checkDiagonalLOS,
    checkOrthogonalLineOfSight as checkOrthogonalLOS,
    checkQueenLineOfSight as checkQueenLOS
} from '@utils/LineOfSightUtils';

interface Enemy {
    x: number;
    y: number;
    isWalkable: (x: number, y: number, grid: unknown[][]) => boolean;
}

export class EnemyLineOfSight {
    // Helper for Zard: check diagonal line of sight
    static checkDiagonalLineOfSight(
        enemy: Enemy,
        playerX: number,
        playerY: number,
        grid: unknown[][]
    ): boolean {
        return checkDiagonalLOS(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x: number, y: number, grid: unknown[][]) => enemy.isWalkable(x, y, grid),
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
        grid: unknown[][],
        enemies: Enemy[]
    ): boolean {
        return checkOrthogonalLOS(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x: number, y: number, grid: unknown[][]) => enemy.isWalkable(x, y, grid),
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
        grid: unknown[][]
    ): boolean {
        return checkQueenLOS(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x: number, y: number, grid: unknown[][]) => enemy.isWalkable(x, y, grid),
                checkEnemies: false,
                includeEndpoint: false
            }
        );
    }
}
