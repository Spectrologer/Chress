import { BaseMoveCalculator, type Enemy, type Player, type Position, type Grid, type Game } from './base';
import { EnemySpecialActions } from '@enemy/EnemySpecialActions';
import { DistanceUtils, AttackBehaviors, ChargeMoveHelpers } from './BaseAttackBehaviors';

/**
 * Zard Move Calculator
 *
 * CHESS PIECE: BISHOP
 * - Moves diagonally only
 * - Can move any distance along diagonal lines
 * - Attacks diagonally adjacent squares
 * - Can charge at player from distance (Chress enhancement)
 * - Uses tactical defensive positioning when threatened
 *
 * Movement: Unlimited diagonal movement
 * Attack: Diagonal adjacent + diagonal charge attacks
 * Special: Smoke trail effects during multi-tile moves
 */
export class ZardMoveCalculator extends BaseMoveCalculator {
    calculateMove(
        enemy: Enemy,
        player: Player,
        playerPos: Position,
        grid: Grid,
        enemies: Enemy[],
        isSimulation: boolean = false,
        game: Game | null = null
    ): Position | null {
        const { x: playerX, y: playerY } = playerPos;

        // Check for diagonal attack opportunity
        if (DistanceUtils.isDiagonallyAdjacent(enemy.x, enemy.y, playerX, playerY)) {
            this.performDiagonalAttack(enemy, player, isSimulation, game);
            return null;
        }

        // Try charge move
        const chargeResult = EnemySpecialActions.executeZardCharge(
            enemy, player, playerX, playerY, grid, enemies, isSimulation, game
        );
        if (chargeResult !== false) return chargeResult;

        // Tactical defensive positioning at close range
        const currentDistance = DistanceUtils.manhattan(enemy.x, enemy.y, playerX, playerY);
        if (currentDistance <= 2) {
            const defensiveMoves = this.tacticalAI
                ? this.tacticalAI.getDefensiveMoves(enemy, playerX, playerY, enemy.x, enemy.y, grid, enemies)
                : [];

            if (defensiveMoves.length > 0) {
                const moveDistance = DistanceUtils.manhattan(
                    enemy.x, enemy.y, defensiveMoves[0].x, defensiveMoves[0].y
                );

                // Add smoke trail for multi-tile defensive moves
                if (!isSimulation && moveDistance > 1) {
                    enemy.smokeAnimations.push({
                        x: enemy.x + (defensiveMoves[0].x - enemy.x) / 2,
                        y: enemy.y + (defensiveMoves[0].y - enemy.y) / 2,
                        frame: 18
                    });
                }

                return { x: defensiveMoves[0].x, y: defensiveMoves[0].y };
            }
        }

        return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }

    performDiagonalAttack(
        enemy: Enemy,
        player: Player,
        isSimulation: boolean,
        game: Game | null
    ): null {
        AttackBehaviors.performDiagonalAttack(
            enemy, player, player.x, player.y, isSimulation, game,
            this.performAttack.bind(this)
        );
        return null;
    }
}
