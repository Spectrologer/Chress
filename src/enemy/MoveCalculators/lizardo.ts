import { BaseMoveCalculator } from './base';
import { DistanceUtils, AttackBehaviors } from './BaseAttackBehaviors';

export class LizardoMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        const distance = DistanceUtils.chebyshev(enemy.x, enemy.y, playerPos.x, playerPos.y);
        if (distance === 1) {
            this.performAdjacentAttack(enemy, player, playerPos.x, playerPos.y, isSimulation, game);
            return null;
        }
        return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }

    performAdjacentAttack(enemy, player, playerX, playerY, isSimulation, game) {
        AttackBehaviors.performAdjacentAttack(
            enemy, player, playerX, playerY, isSimulation, game,
            this.performAttack.bind(this)
        );
    }
}
