import { BaseMoveCalculator } from './base.js';
import { EnemySpecialActions } from '../EnemySpecialActions.js';
import { DistanceUtils, AttackBehaviors, ChargeMoveHelpers } from './BaseAttackBehaviors.js';

export class ZardMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
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

    performDiagonalAttack(enemy, player, isSimulation, game) {
        AttackBehaviors.performDiagonalAttack(
            enemy, player, player.x, player.y, isSimulation, game,
            this.performAttack.bind(this)
        );
        return null;
    }
}
