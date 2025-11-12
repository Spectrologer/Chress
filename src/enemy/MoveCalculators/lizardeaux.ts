import { BaseMoveCalculator, type Enemy, type Player, type Position, type Grid, type Game } from './base';
import { EnemySpecialActions } from '@enemy/EnemySpecialActions';
import { ChargeMoveHelpers } from './BaseAttackBehaviors';

/**
 * Lizardeaux Move Calculator
 *
 * CHESS PIECE: ROOK
 * - Moves orthogonally only (horizontal or vertical)
 * - Can move any distance along straight lines
 * - Cannot move or attack diagonally
 * - Powerful charge attack along orthogonal lines (Chesse enhancement)
 *
 * Movement: Unlimited orthogonal (straight line) movement
 * Attack: Orthogonal charge attacks
 * Restriction: No diagonal movement whatsoever
 */
export class LizardeauxMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy: Enemy, player: Player, playerPos: Position, grid: Grid, enemies: Enemy[], isSimulation = false, game: Game | null = null): Position {
        const chargeResult = EnemySpecialActions.executeLizardeauxCharge(
            enemy, player, playerPos.x, playerPos.y, grid, enemies, isSimulation, game
        );
        return ChargeMoveHelpers.handleChargeResult(
            chargeResult,
            () => super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game)
        );
    }
}
