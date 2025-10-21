import { BaseMoveCalculator } from './base.js';
import { ANIMATION_CONSTANTS } from '../../core/constants.js';

export class LizardyMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        const { x: playerX, y: playerY } = playerPos;
        if (enemy.movementDirection === undefined) enemy.movementDirection = 1;
        const attackDirections = enemy.movementDirection === -1 ? [{ x: -1, y: -1 }, { x: 1, y: -1 }] : [{ x: -1, y: 1 }, { x: 1, y: 1 }];

        if (!game || !game.playerJustAttacked) {
            for (const dir of attackDirections) {
                const attackX = enemy.x + dir.x; const attackY = enemy.y + dir.y;
                if (attackX === playerX && attackY === playerY) { this.performDiagonalAttack(enemy, player, attackX, attackY, isSimulation); return null; }
            }
        }

        let nextY = enemy.y + enemy.movementDirection; let nextX = enemy.x;
        if (nextX === playerX && nextY === playerY) { this.performBumpAttack(enemy, player, isSimulation); return null; }

        if (!enemy.isWalkable(nextX, nextY, grid) || enemies.some(e => e.x === nextX && e.y === nextY)) {
            enemy.movementDirection *= -1; enemy.flipAnimation = ANIMATION_CONSTANTS.LIZARDY_FLIP_FRAMES; nextY = enemy.y + enemy.movementDirection;
            if (!enemy.isWalkable(nextX, nextY, grid) || enemies.some(e => e.x === nextX && e.y === nextY)) {
                if (nextX === playerX && nextY === playerY) { this.performBumpAttack(enemy, player, isSimulation); }
                return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
            }
            if (nextX === playerX && nextY === playerY) { this.performBumpAttack(enemy, player, isSimulation); return null; }
        }

        return { x: nextX, y: nextY };
    }

    performDiagonalAttack(enemy, player, attackX, attackY, isSimulation) { if (isSimulation) return; player.takeDamage(enemy.attack); player.startBump(enemy.x - attackX, enemy.y - attackY); enemy.startBump(attackX - enemy.x, attackY - enemy.y); enemy.justAttacked = true; enemy.attackAnimation = 15; if (window.soundManager) window.soundManager.playSound('attack'); }

    performBumpAttack(enemy, player, isSimulation) { if (isSimulation) return; player.startBump(enemy.x - player.x, enemy.y - player.y); enemy.startBump(player.x - enemy.x, player.y - enemy.y); if (window.soundManager) window.soundManager.playSound('attack'); }
}
