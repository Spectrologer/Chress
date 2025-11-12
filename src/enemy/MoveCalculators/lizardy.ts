import { BaseMoveCalculator } from './base';
import { ANIMATION_CONSTANTS } from '@core/constants/index';
import { AttackBehaviors, AttackValidation } from './BaseAttackBehaviors';
import type { Enemy } from '@entities/Enemy';
import type { Player } from '@entities/Player';
import type { Grid } from '@types/game';

/**
 * Lizardy Move Calculator
 *
 * CHESS PIECE: PAWN
 * - Moves vertically only (forward/backward based on direction)
 * - Attacks diagonally (like pawn captures)
 * - Flips direction when blocked (unique Chesse behavior)
 * - Simplest movement pattern in the game
 *
 * Movement: 1 square vertically per turn
 * Attack: Diagonal adjacent squares in movement direction
 */
export class LizardyMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy: Enemy, player: Player, playerPos: any, grid: Grid, enemies: Enemy[], isSimulation: boolean = false, game: any = null): { x: number; y: number } | null {
        const { x: playerX, y: playerY } = playerPos;
        if (enemy.movementDirection === undefined) enemy.movementDirection = 1;

        // Lizardy attacks diagonally in the direction it's moving
        const attackDirections = enemy.movementDirection === -1
            ? [{ x: -1, y: -1 }, { x: 1, y: -1 }]
            : [{ x: -1, y: 1 }, { x: 1, y: 1 }];

        // Check for diagonal attack opportunities
        if (!game || !game.playerJustAttacked) {
            for (const dir of attackDirections) {
                const attackX = enemy.x + dir.x;
                const attackY = enemy.y + dir.y;
                if (AttackValidation.positionsMatch(attackX, attackY, playerX, playerY)) {
                    this.performDiagonalAttack(enemy, player, attackX, attackY, isSimulation);
                    return null;
                }
            }
        }

        // Vertical movement with direction flipping
        let nextY = enemy.y + enemy.movementDirection;
        let nextX = enemy.x;

        if (AttackValidation.positionsMatch(nextX, nextY, playerX, playerY)) {
            this.performBumpAttack(enemy, player, isSimulation);
            return null;
        }

        // Check if move is blocked, flip direction if needed
        if (!enemy.isWalkable(nextX, nextY, grid) || enemies.some((e: Enemy) => e.x === nextX && e.y === nextY)) {
            enemy.movementDirection *= -1;
            enemy.flipAnimation = ANIMATION_CONSTANTS.LIZARDY_FLIP_FRAMES;
            nextY = enemy.y + enemy.movementDirection;

            // Check if flipped direction is also blocked
            if (!enemy.isWalkable(nextX, nextY, grid) || enemies.some((e: Enemy) => e.x === nextX && e.y === nextY)) {
                if (AttackValidation.positionsMatch(nextX, nextY, playerX, playerY)) {
                    this.performBumpAttack(enemy, player, isSimulation);
                }
                return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
            }

            if (AttackValidation.positionsMatch(nextX, nextY, playerX, playerY)) {
                this.performBumpAttack(enemy, player, isSimulation);
                return null;
            }
        }

        return { x: nextX, y: nextY };
    }

    performDiagonalAttack(enemy: Enemy, player: Player, attackX: number, attackY: number, isSimulation: boolean): void {
        AttackBehaviors.performDiagonalAttack(
            enemy, player, attackX, attackY, isSimulation, null,
            this.performAttack.bind(this)
        );
    }

    performBumpAttack(enemy: Enemy, player: Player, isSimulation: boolean): void {
        AttackBehaviors.performBumpAttack(enemy, player, isSimulation);
    }
}
