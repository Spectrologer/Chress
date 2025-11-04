import { BaseMoveCalculator } from './base';
import { EnemySpecialActions } from '@enemy/EnemySpecialActions';
import { ChargeMoveHelpers } from './BaseAttackBehaviors';

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
