import { BaseMoveCalculator } from './base.js';
import { EnemySpecialActions } from '../EnemySpecialActions.js';

export class LizardeauxMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        const chargeResult = EnemySpecialActions.executeLizardeauxCharge(enemy, player, playerPos.x, playerPos.y, grid, enemies, isSimulation, game);
        if (chargeResult !== false) return chargeResult;
        return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }
}
