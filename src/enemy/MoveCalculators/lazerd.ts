import { BaseMoveCalculator, type Enemy, type Player, type Position, type Grid, type Game } from './base';
import { EnemySpecialActions } from '@enemy/EnemySpecialActions';
import { ChargeMoveHelpers } from './BaseAttackBehaviors';

/**
 * Lazerd Move Calculator
 *
 * CHESS PIECE: QUEEN
 * - Most powerful piece in the game
 * - Combines Rook + Bishop movement (orthogonal + diagonal)
 * - Can move any distance in any direction
 * - Devastating charge attacks from any angle (Chesse enhancement)
 * - Worth 9 points (highest enemy value)
 *
 * Movement: Unlimited movement in all 8 directions
 * Attack: Queen-style charge attacks (any direction, any distance)
 * Status: Boss-tier enemy
 */
export class LazerdMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy: Enemy, player: Player, playerPos: Position, grid: Grid, enemies: Enemy[], isSimulation = false, game: Game | null = null): Position {
        const chargeResult = EnemySpecialActions.executeLazerdCharge(
            enemy, player, playerPos.x, playerPos.y, grid, enemies, isSimulation, game
        );
        return ChargeMoveHelpers.handleChargeResult(
            chargeResult,
            () => super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game)
        );
    }
}
