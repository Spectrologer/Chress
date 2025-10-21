import { GRID_SIZE, TILE_TYPES, ANIMATION_CONSTANTS } from '../../core/constants.js';
import { EnemyPathfinding } from '../EnemyPathfinding.js';
import { EnemySpecialActions } from '../EnemySpecialActions.js';
import { logger } from '../../core/logger.js';

import { applyAggressiveMovement } from './aggressive.js';
import { applyTacticalAdjustments, applyDefensiveMoves } from './tactics.js';
import { handlePlayerInteraction, handlePitfallTransition } from './interaction.js';

export class BaseMoveCalculator {
    constructor() {
        this.tacticalAI = null; // Will be set by movement mixin
    }

    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        return this.findPathedMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }

    findPathedMove(enemy, player, playerPos, grid, enemies, isSimulation, game) {
        const { x: playerX, y: playerY } = playerPos;

        // Leader-Follower Pattern for cooperative behavior
        const totalEnemies = enemies.length;
        const isLargeGroup = totalEnemies >= 3;
        const leader = isLargeGroup ? enemies.find(e => e === enemies[0] || e) : null; // simple leader selection
        const followLeader = isLargeGroup && enemy !== leader;
        const targetX = followLeader ? leader.x : playerX;
        const targetY = followLeader ? leader.y : playerY;

        const path = EnemyPathfinding.findPath(enemy.x, enemy.y, targetX, targetY, grid, enemy.enemyType, (x, y, g) => enemy.isWalkable(x, y, g));

        if (path && path.length > 1) {
            let next = path[1];

            // Lizord knight-bump delegation handled in interaction module
            if (enemy.enemyType === 'lizord' && !isSimulation) {
                const startDx = Math.abs(next.x - enemy.x);
                const startDy = Math.abs(next.y - enemy.y);
                const isKnightMove = (startDx === 2 && startDy === 1) || (startDx === 1 && startDy === 2);
                if (isKnightMove && next.x === playerX && next.y === playerY) {
                    return handlePlayerInteraction(this, enemy, next, player, playerX, playerY, grid, enemies, isSimulation, game);
                }
            }

            if (enemy.enemyType === 'lizord' && !isSimulation) {
                logger.debug(`[Lizord Debug] path=${path.map(p=>`${p.x},${p.y}`).join(' -> ')}`);
                logger.debug(`[Lizord Debug] initial next=${next.x},${next.y} enemy=${enemy.x},${enemy.y} player=${playerX},${playerY}`);
            }

            next = applyAggressiveMovement(enemy, path, next);

            next = applyTacticalAdjustments(this.tacticalAI, enemy, next, playerX, playerY, grid, enemies);

            next = applyDefensiveMoves(this.tacticalAI, enemy, player, next, playerX, playerY, grid, enemies, isSimulation, game, logger);

            if (!isSimulation && (Math.abs(next.x - enemy.x) + Math.abs(next.y - enemy.y) > 1)) {
                this.addSmokeTrail(enemy, next);
            }

            if (enemy.isWalkable(next.x, next.y, grid)) {
                if (!isSimulation && grid[next.y][next.x] === TILE_TYPES.PITFALL) {
                    handlePitfallTransition(this, enemy, next.x, next.y, game);
                    return null;
                }

                if (enemy.enemyType === 'lizord' && !isSimulation) {
                    logger.debug(`[Lizord Debug] considering player interaction at next=${next.x},${next.y}`);
                }
                return handlePlayerInteraction(this, enemy, next, player, playerX, playerY, grid, enemies, isSimulation, game);
            }
        }

        const anyAdjacentMove = this.findAnyValidAdjacentMove(enemy, grid, enemies);
        if (anyAdjacentMove) return anyAdjacentMove;

        return null;
    }

    calculateMoveDistance(x1, y1, x2, y2) { return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); }

    performLizordBumpAttack(enemy, player, playerX, playerY, grid, enemies, game) {
        player.takeDamage(enemy.attack);
        enemy.justAttacked = true;
        enemy.attackAnimation = 15;
        if (window.soundManager) window.soundManager.playSound('attack');
        if (player.isDead && player.isDead()) return;

        const possiblePositions = [
            { x: playerX, y: playerY - 1 },
            { x: playerX, y: playerY + 1 },
            { x: playerX - 1, y: playerY },
            { x: playerX + 1, y: playerY }
        ];

        const candidates = possiblePositions.filter(pos => {
            if (!player.isWalkable(pos.x, pos.y, grid)) return false;
            if (enemies.some(e => e.x === pos.x && e.y === pos.y)) return false;
            return true;
        });

        if (candidates.length === 0) return;

        let best = candidates[0];
        let bestScore = -Infinity;
        for (const c of candidates) {
            const score = Math.abs(c.x - (enemy.lastX || enemy.x)) + Math.abs(c.y - (enemy.lastY || enemy.y));
            if (score > bestScore) { bestScore = score; best = c; }
        }

        player.setPosition(best.x, best.y);
        player.startBump(best.x - playerX, best.y - playerY);
        if (typeof enemy.lastX !== 'undefined' && typeof enemy.lastY !== 'undefined') {
            enemy.startBump(playerX - enemy.lastX, playerY - enemy.lastY);
        }
    }

    performAttack(enemy, player, playerX, playerY, grid, enemies, game) {
        if (game && game.playerJustAttacked) return;
        const dx = Math.abs(enemy.x - playerX);
        const dy = Math.abs(enemy.y - playerY);
        if (enemy.enemyType === 'lizardeaux' && dx === 1 && dy === 1) return;
        if (enemy.enemyType === 'zard' && ((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) return;

        player.takeDamage(enemy.attack);
        player.startBump(enemy.x - playerX, enemy.y - playerY);
        enemy.startBump(playerX - enemy.x, playerY - enemy.y);
        enemy.justAttacked = true;
        enemy.attackAnimation = 15;
        if (window.soundManager) window.soundManager.playSound('attack');
        if (player.isDead()) {
            // handle death if necessary
        }
    }

    findAnyValidAdjacentMove(enemy, grid, enemies) {
        const directions = EnemyPathfinding.getMovementDirections(enemy.enemyType || enemy.type);
        for (const dir of directions) {
            const newX = enemy.x + dir.x;
            const newY = enemy.y + dir.y;
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) continue;
            if (!enemy.isWalkable(newX, newY, grid)) continue;
            const occupiedByOtherEnemy = enemies.some(e => e.x === newX && e.y === newY);
            if (occupiedByOtherEnemy) continue;
            return { x: newX, y: newY };
        }
        return null;
    }

    addSmokeTrail(enemy, next) {
        const chargeTypes = new Set(['lizardeaux', 'zard']);
        if (chargeTypes.has(enemy.enemyType)) {
            const startX = enemy.x;
            const startY = enemy.y;
            const dx = next.x - startX;
            const dy = next.y - startY;
            const distX = Math.abs(dx);
            const distY = Math.abs(dy);

            if (distX >= distY) {
                const stepX = dx > 0 ? 1 : -1;
                const stepY = dy === 0 ? 0 : dy / distX;
                for (let i = 1; i < distX; i++) {
                    enemy.smokeAnimations.push({ x: startX + i * stepX, y: startY + Math.round((i * dy) / distX), frame: 18 });
                }
            } else {
                const stepY = dy > 0 ? 1 : -1;
                const stepX = dx === 0 ? 0 : dx / distY;
                for (let i = 1; i < distY; i++) {
                    enemy.smokeAnimations.push({ x: startX + Math.round((i * dx) / distY), y: startY + i * stepY, frame: 18 });
                }
            }
        }
    }
}
