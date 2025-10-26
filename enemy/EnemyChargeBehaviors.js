import { GRID_SIZE } from '../core/constants.js';
import { isWithinGrid } from '../utils/GridUtils.js';

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
        // Assume orthogonal line of sight already checked
        let stepX = 0, stepY = 0;
        if (playerX !== enemy.x) {
            stepX = playerX > enemy.x ? 1 : -1;
        } else {
            stepY = playerY > enemy.y ? 1 : -1;
        }

        // Check clear line of sight (walls/obstacles AND other enemies)
        const dx = Math.abs(enemy.x - playerX);
        const dy = Math.abs(enemy.y - playerY);
        const maxSteps = Math.max(dx, dy);
        for (let i = 1; i < maxSteps; i++) {
            const checkX = enemy.x + i * stepX;
            const checkY = enemy.y + i * stepY;
            if (!enemy.isWalkable(checkX, checkY, grid)) return null;
            if (enemies.find(e => e.x === checkX && e.y === checkY)) return null;
        }

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
        // Check for orthogonal or diagonal line of sight
        const dx = Math.abs(enemy.x - playerX);
        const dy = Math.abs(enemy.y - playerY);
        const isDiagonal = dx === dy;
        const isOrthogonal = (dx === 0 && dy !== 0) || (dy === 0 && dx !== 0);

        if (!isDiagonal && !isOrthogonal) return null; // Not in straight line

        // Determine steps
        const stepX = playerX > enemy.x ? 1 : (playerX < enemy.x ? -1 : 0);
        const stepY = playerY > enemy.y ? 1 : (playerY < enemy.y ? -1 : 0);

        // Check clear line of sight (walls/obstacles AND other enemies)
        const maxSteps = Math.max(dx, dy);
        for (let i = 1; i < maxSteps; i++) {
            const checkX = enemy.x + i * stepX;
            const checkY = enemy.y + i * stepY;
            if (!enemy.isWalkable(checkX, checkY, grid)) return null;
            if (enemies.find(e => e.x === checkX && e.y === checkY)) return null;
        }

        // Find adjacent tile next to player along the line
        let adjX = playerX - stepX;
        let adjY = playerY - stepY;

        // Check if that tile is walkable and not occupied by another enemy
        if (isWithinGrid(adjX, adjY) &&
            enemy.isWalkable(adjX, adjY, grid) &&
            !enemies.find(e => e.x === adjX && e.y === adjY)) {
            return { x: adjX, y: adjY };
        }

        return null;
    }
}
