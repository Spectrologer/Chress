import { BaseMoveCalculator, type Enemy, type Player, type Position, type Grid, type Game } from './base';
import { DistanceUtils, AttackBehaviors } from './BaseAttackBehaviors';

/**
 * Lizardo Move Calculator
 *
 * CHESS PIECE: KING
 * - Moves in any direction (orthogonal or diagonal)
 * - Limited to 1 square per move
 * - Attacks any adjacent square (8-way)
 * - Most flexible short-range piece
 *
 * Movement: 1 square in any of 8 directions
 * Attack: All 8 adjacent squares
 */
export class LizardoMoveCalculator extends BaseMoveCalculator {
    calculateMove(
        enemy: Enemy,
        player: Player,
        playerPos: Position,
        grid: Grid,
        enemies: Enemy[],
        isSimulation: boolean = false,
        game: Game | null = null
    ): Position | null {
        const distance = DistanceUtils.chebyshev(enemy.x, enemy.y, playerPos.x, playerPos.y);
        if (distance === 1) {
            this.performAdjacentAttack(enemy, player, playerPos.x, playerPos.y, isSimulation, game);
            return null;
        }
        return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }

    performAdjacentAttack(
        enemy: Enemy,
        player: Player,
        playerX: number,
        playerY: number,
        isSimulation: boolean,
        game: Game | null
    ): void {
        AttackBehaviors.performAdjacentAttack(
            enemy, player, playerX, playerY, isSimulation, game,
            this.performAttack.bind(this)
        );
    }
}
