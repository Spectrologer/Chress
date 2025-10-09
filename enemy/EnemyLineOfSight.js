export class EnemyLineOfSight {
    // Helper for Zard: check diagonal line of sight
    static checkDiagonalLineOfSight(enemy, playerX, playerY, grid) {
        const dx = Math.abs(enemy.x - playerX);
        const dy = Math.abs(enemy.y - playerY);

        if (dx !== dy) return false; // Not on diagonal

        const sameDiagonal1 = (playerX - enemy.x) === (playerY - enemy.y);
        const sameDiagonal2 = (playerX - enemy.x) === -(playerY - enemy.y);

        if (!sameDiagonal1 && !sameDiagonal2) return false;

        // Determine step direction
        const stepX = playerX > enemy.x ? 1 : -1;
        const stepY = playerY > enemy.y ? 1 : -1;

        if (sameDiagonal1) {
            // Step diagonally
            for (let i = 1; i < dx; i++) {
                const x = enemy.x + i * stepX;
                const y = enemy.y + i * stepY;
                if (!enemy.isWalkable(x, y, grid)) return false;
            }
        } else {
            // Other diagonal
            const stepYAlt = playerY > enemy.y ? -1 : -1;
            for (let i = 1; i < dx; i++) {
                const x = enemy.x + i * stepX;
                const y = enemy.y + i * stepYAlt;
                if (!enemy.isWalkable(x, y, grid)) return false;
            }
        }

        return true;
    }

    // Helper for Lizardeaux: check orthogonal line of sight
    static checkOrthogonalLineOfSight(enemy, playerX, playerY, grid, enemies) {
        const sameRow = enemy.y === playerY;
        const sameCol = enemy.x === playerX;

        if (!sameRow && !sameCol) return false; // Not in straight line

        // Determine direction
        let stepX = 0, stepY = 0;
        if (sameRow) {
            stepX = playerX > enemy.x ? 1 : -1;
        } else {
            stepY = playerY > enemy.y ? 1 : -1;
        }

        // Check line of sight, including blocking by other enemies
        const steps = sameRow ? Math.abs(playerX - enemy.x) : Math.abs(playerY - enemy.y);
        for (let i = 1; i < steps; i++) {
            const checkX = enemy.x + i * stepX;
            const checkY = enemy.y + i * stepY;
            if (!enemy.isWalkable(checkX, checkY, grid)) return false;
            if (enemies.find(e => e.x === checkX && e.y === checkY)) return false;
        }

        return true;
    }

    // Helper for Lazerd: check orthogonal/diagonal line of sight
    static checkQueenLineOfSight(enemy, playerX, playerY, grid) {
        const dx = Math.abs(enemy.x - playerX);
        const dy = Math.abs(enemy.y - playerY);

        // Check if same row, column, or diagonal
        const sameRow = enemy.y === playerY;
        const sameCol = enemy.x === playerX;
        const sameDiagonal = dx === dy;

        if (!sameRow && !sameCol && !sameDiagonal) return false;

        // Determine direction
        let stepX = 0, stepY = 0;
        if (sameCol) {
            // Vertical
            stepY = playerY > enemy.y ? 1 : -1;
        } else if (sameRow) {
            // Horizontal
            stepX = playerX > enemy.x ? 1 : -1;
        } else {
            // Diagonal
            stepX = playerX > enemy.x ? 1 : -1;
            stepY = playerY > enemy.y ? 1 : -1;
        }

        // Check line of sight
        const steps = Math.max(dx, dy);
        for (let i = 1; i < steps; i++) {
            const checkX = enemy.x + i * stepX;
            const checkY = enemy.y + i * stepY;
            if (!enemy.isWalkable(checkX, checkY, grid)) return false;
        }

        return true;
    }
}
