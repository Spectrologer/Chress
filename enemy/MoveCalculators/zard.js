import { BaseMoveCalculator } from './base.js';
import { EnemySpecialActions } from '../EnemySpecialActions.js';

export class ZardMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        const { x: playerX, y: playerY } = playerPos;
        const dx_adj = Math.abs(enemy.x - playerX); const dy_adj = Math.abs(enemy.y - playerY);
        if (dx_adj === 1 && dy_adj === 1) { this.performDiagonalAttack(enemy, player, isSimulation, game); return null; }
        const chargeResult = EnemySpecialActions.executeZardCharge(enemy, player, playerX, playerY, grid, enemies, isSimulation, game);
        if (chargeResult !== false) return chargeResult;
        const dx = Math.abs(enemy.x - playerX); const dy = Math.abs(enemy.y - playerY); const currentDistance = dx + dy;
        if (currentDistance <= 2) {
            const defensiveMoves = this.tacticalAI ? this.tacticalAI.getDefensiveMoves(enemy, playerX, playerY, enemy.x, enemy.y, grid, enemies) : [];
            if (defensiveMoves.length > 0) {
                if (!isSimulation && this.calculateMoveDistance(enemy.x, enemy.y, defensiveMoves[0].x, defensiveMoves[0].y) > 1) {
                    enemy.smokeAnimations.push({ x: enemy.x + (defensiveMoves[0].x - enemy.x) / 2, y: enemy.y + (defensiveMoves[0].y - enemy.y) / 2, frame: 18 });
                }
                return { x: defensiveMoves[0].x, y: defensiveMoves[0].y };
            }
        }
        return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }

    performDiagonalAttack(enemy, player, isSimulation, game) { if (!isSimulation && (!game || !game.playerJustAttacked)) { player.takeDamage(enemy.attack); player.startBump(enemy.x - player.x, enemy.y - player.y); enemy.startBump(player.x - enemy.x, player.y - enemy.y); enemy.justAttacked = true; enemy.attackAnimation = 15; if (window.soundManager) window.soundManager.playSound('attack'); } return null; }

    calculateMoveDistance(x1, y1, x2, y2) { return Math.abs(x2 - x1) + Math.abs(y2 - y1); }
}
