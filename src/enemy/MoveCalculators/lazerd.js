import { BaseMoveCalculator } from './base.js';
import { EnemySpecialActions } from '../EnemySpecialActions.js';
import { ChargeMoveHelpers } from './BaseAttackBehaviors.js';

export class LazerdMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        const chargeResult = EnemySpecialActions.executeLazerdCharge(
            enemy, player, playerPos.x, playerPos.y, grid, enemies, isSimulation, game
        );
        return ChargeMoveHelpers.handleChargeResult(
            chargeResult,
            () => super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game)
        );
    }
}
