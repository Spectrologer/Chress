import { GRID_SIZE } from '../constants.js';

export class EnemyChargeBehaviors {
    // Helper for zard: find adjacent tile next to player along diagonal line of sight and charge there
    static getChargeAdjacentDiagonalMove(enemy, playerX, playerY, grid, enemies) {
        // Assume diagonal line of sight already checked
        const stepX = playerX > enemy.x ? 1 : -1;
        const stepY = playerY > enemy.y ? 1 : -1;

        // Check clear line of sight (walls/obstacles AND other enemies)
        const dx = Math.abs(enemy.x - playerX);
        for (let i = 1; i < dx; i++) {
            const checkX = enemy.x + i * stepX;
            const checkY = enemy.y + i * stepY;
            if (!enemy.isWalkable(checkX, checkY, grid)) return null;
            if (enemies.find(e => e.x === checkX && e.y === checkY)) return null;
        }

        // Find diagonal adjacent tile next to player
        const adjX = playerX - stepX;
        const adjY = playerY - stepY;

        // Check if that tile is walkable and not occupied by another enemy
        if (adjX >= 0 && adjX < GRID_SIZE && adjY >= 0 && adjY < GRID_SIZE &&
            enemy.isWalkable(adjX, adjY, grid) &&
            !enemies.find(e => e.x === adjX && e.y === adjY)) {
            return { x: adjX, y: adjY };
        }

        return null;
    }
}
