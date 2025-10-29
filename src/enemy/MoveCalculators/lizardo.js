import { BaseMoveCalculator } from './base.js';

export class LizardoMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        const dx = Math.abs(enemy.x - playerPos.x); const dy = Math.abs(enemy.y - playerPos.y);
        const distance = Math.max(dx, dy);
        if (distance === 1) { this.performAdjacentAttack(enemy, player, playerPos.x, playerPos.y, isSimulation, game); return null; }
        return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }

    performAdjacentAttack(enemy, player, playerX, playerY, isSimulation, game) {
        if (isSimulation) return;
        super.performAttack(enemy, player, playerX, playerY, null, null, game);
    }
}
