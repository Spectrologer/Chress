import {
    checkDiagonalLineOfSight as checkDiagonalLOS,
    checkOrthogonalLineOfSight as checkOrthogonalLOS,
    checkQueenLineOfSight as checkQueenLOS
} from '../utils/LineOfSightUtils';

export class EnemyLineOfSight {
    // Helper for Zard: check diagonal line of sight
    static checkDiagonalLineOfSight(enemy, playerX, playerY, grid) {
        return checkDiagonalLOS(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x, y, grid) => enemy.isWalkable(x, y, grid),
                checkEnemies: false,
                includeEndpoint: false
            }
        );
    }

    // Helper for Lizardeaux: check orthogonal line of sight
    static checkOrthogonalLineOfSight(enemy, playerX, playerY, grid, enemies) {
        return checkOrthogonalLOS(
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
    }

    // Helper for Lazerd: check orthogonal/diagonal line of sight
    static checkQueenLineOfSight(enemy, playerX, playerY, grid) {
        return checkQueenLOS(
            enemy.x, enemy.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x, y, grid) => enemy.isWalkable(x, y, grid),
                checkEnemies: false,
                includeEndpoint: false
            }
        );
    }
}
