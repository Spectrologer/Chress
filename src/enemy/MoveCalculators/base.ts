// @ts-check
/**
 * BaseMoveCalculator - Core enemy movement decision system.
 *
 * Implements a layered approach to enemy AI movement:
 * 1. Pathfinding: Find route to target (BFS)
 * 2. Aggressive: Consider multi-tile charge moves
 * 3. Tactical: Apply flanking and clustering adjustments
 * 4. Defensive: Override with retreat if threatened
 * 5. Special: Handle pitfalls, bumps, smoke trails
 *
 * Design Pattern: Strategy Pattern + Pipeline
 * - Each layer modifies the proposed move
 * - Layers can override previous decisions
 * - Final move is validated before execution
 *
 * Cooperative Behavior:
 * - Leader-follower pattern for groups of 3+
 * - Tactical AI for flanking and positioning
 * - Anti-stacking to prevent blocking allies
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} Enemy
 * @property {number} x - Current X position
 * @property {number} y - Current Y position
 * @property {number} [lastX] - Previous X position
 * @property {number} [lastY] - Previous Y position
 * @property {string} enemyType - Enemy type ('lizardy', 'lizardo', 'lizardeaux', 'lizord', 'lazerd', 'zard')
 * @property {string} [type] - Alias for enemyType
 * @property {number} attack - Attack damage
 * @property {boolean} [justAttacked] - Whether enemy just attacked
 * @property {number} [attackAnimation] - Attack animation frame counter
 * @property {Array<{x: number, y: number, frame: number}>} smokeAnimations - Smoke trail animations
 * @property {Function} isWalkable - Check if position is walkable
 * @property {Function} [startBump] - Start bump animation
 */

/**
 * @typedef {Object} Player
 * @property {number} x - Player X position
 * @property {number} y - Player Y position
 * @property {Function} takeDamage - Take damage function
 * @property {Function} setPosition - Set player position
 * @property {Function} startBump - Start bump animation
 * @property {Function} isWalkable - Check if position is walkable
 * @property {Function} [isDead] - Check if player is dead
 */

/**
 * @typedef {Object} Game
 * @property {boolean} [playerJustAttacked] - Whether player just attacked
 * @property {*} [zoneManager] - Zone manager instance
 */

/**
 * @typedef {Array<Array<number>>} Grid
 */

import { GRID_SIZE, TILE_TYPES, ANIMATION_CONSTANTS } from '../../core/constants/index';
import { EnemyPathfinding } from '../EnemyPathfinding';
import { EnemySpecialActions } from '../EnemySpecialActions';
import { logger } from '../../core/logger';

import { applyAggressiveMovement } from './aggressive';
import { applyTacticalAdjustments, applyDefensiveMoves } from './tactics';
import { handlePlayerInteraction, handlePitfallTransition } from './interaction';

export class BaseMoveCalculator {
    constructor() {
        /** @type {any} */
        this.tacticalAI = null; // Will be set by movement mixin
    }

    /**
     * Main entry point for calculating enemy movement.
     * Delegates to findPathedMove for the full decision pipeline.
     *
     * @param {Enemy} enemy - The enemy calculating its move
     * @param {Player} player - The player (target)
     * @param {Position} playerPos - Player position
     * @param {Grid} grid - Game grid
     * @param {Enemy[]} enemies - All enemies
     * @param {boolean} [isSimulation=false] - If true, skip visual effects
     * @param {Game|null} [game=null] - Game instance
     * @returns {Position|null} Next position or null
     */
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        return this.findPathedMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }

    /**
     * Executes the full AI decision pipeline to determine enemy's next move.
     *
     * Decision Pipeline (5 layers):
     * 1. Leader-Follower: Groups of 3+ follow a leader instead of all chasing player
     * 2. Pathfinding: BFS to target (player or leader)
     * 3. Aggressive: Check for multi-tile charge opportunities
     * 4. Tactical: Apply flanking/clustering adjustments
     * 5. Defensive: Override with retreat if threatened
     *
     * Leader-Follower Pattern:
     * - Activates when 3+ enemies present
     * - First enemy becomes leader (simple selection)
     * - Followers path toward leader instead of player
     * - Creates more varied attack patterns
     * - Prevents all enemies stacking on player
     *
     * Special Cases:
     * - Lizord knight bump: Can attack by landing on player
     * - Pitfalls: Enemy falls to lower level (handled separately)
     * - Multi-tile moves: Add smoke trail animations
     *
     * @param {Enemy} enemy - The enemy calculating its move
     * @param {Player} player - The player
     * @param {Position} playerPos - Player position
     * @param {Grid} grid - Game grid
     * @param {Enemy[]} enemies - All enemies
     * @param {boolean} isSimulation - If true, skip visual/audio effects
     * @param {Game|null} game - Game instance
     * @returns {Position|null} Next position or null if stuck
     */
    findPathedMove(enemy, player, playerPos, grid, enemies, isSimulation, game) {
        const { x: playerX, y: playerY } = playerPos;

        // Layer 1: Leader-Follower Pattern (cooperative behavior)
        const totalEnemies = enemies.length;
        const isLargeGroup = totalEnemies >= 3;
        const leader = isLargeGroup ? enemies.find(e => e === enemies[0] || e) : null;
        const followLeader = isLargeGroup && enemy !== leader;

        // Followers target leader, leader targets player
        const targetX = followLeader ? leader.x : playerX;
        const targetY = followLeader ? leader.y : playerY;

        // Layer 2: Pathfinding (BFS to target)
        const path = EnemyPathfinding.findPath(
            enemy.x, enemy.y, targetX, targetY, grid, enemy.enemyType,
            (x, y, g) => enemy.isWalkable(x, y, g)
        );

        if (path && path.length > 1) {
            let next = path[1];  // path[0] is current position

            // Special Case: Lizord knight bump attack
            if (enemy.enemyType === 'lizord' && !isSimulation) {
                const startDx = Math.abs(next.x - enemy.x);
                const startDy = Math.abs(next.y - enemy.y);
                const isKnightMove = (startDx === 2 && startDy === 1) || (startDx === 1 && startDy === 2);

                if (isKnightMove && next.x === playerX && next.y === playerY) {
                    return handlePlayerInteraction(this, enemy, next, player, playerX, playerY, grid, enemies, isSimulation, game);
                }
            }

            if (enemy.enemyType === 'lizord' && !isSimulation) {
                logger.debug(`[Lizord Debug] path=${path.map(p => `${p.x},${p.y}`).join(' -> ')}`);
                logger.debug(`[Lizord Debug] initial next=${next.x},${next.y} enemy=${enemy.x},${enemy.y} player=${playerX},${playerY}`);
            }

            // Layer 3: Aggressive movement (multi-tile charges)
            next = applyAggressiveMovement(enemy, path, next);

            // Layer 4: Tactical adjustments (flanking/clustering)
            next = applyTacticalAdjustments(this.tacticalAI, enemy, next, playerX, playerY, grid, enemies);

            // Layer 5: Defensive overrides (retreat if threatened)
            next = applyDefensiveMoves(this.tacticalAI, enemy, player, next, playerX, playerY, grid, enemies, isSimulation, /** @type {any} */ (game), logger);

            // Visual Effects: Add smoke trail for multi-tile moves
            if (!isSimulation && (Math.abs(next.x - enemy.x) + Math.abs(next.y - enemy.y) > 1)) {
                this.addSmokeTrail(enemy, next);
            }

            // Validate final move
            if (enemy.isWalkable(next.x, next.y, grid)) {
                // Special Case: Pitfall transition
                if (!isSimulation && grid[next.y][next.x] === TILE_TYPES.PITFALL) {
                    handlePitfallTransition(this, enemy, next.x, next.y, game);
                    return null;
                }

                if (enemy.enemyType === 'lizord' && !isSimulation) {
                    logger.debug(`[Lizord Debug] considering player interaction at next=${next.x},${next.y}`);
                }

                // Handle player interaction (attack if adjacent)
                return handlePlayerInteraction(this, enemy, next, player, playerX, playerY, grid, enemies, isSimulation, game);
            }
        }

        // Fallback: If pathfinding failed, try any valid adjacent move
        const anyAdjacentMove = this.findAnyValidAdjacentMove(enemy, grid, enemies);
        if (anyAdjacentMove) return anyAdjacentMove;

        return null;  // Stuck, can't move
    }

    /**
     * Calculates Chebyshev distance (8-way grid distance).
     * Used for determining if moves are adjacent or multi-tile.
     *
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @returns {number} Maximum of |deltaX| and |deltaY|
     */
    calculateMoveDistance(x1, y1, x2, y2) {
        return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    }

    /**
     * Executes lizord (knight) bump attack with knockback.
     * Lizord lands on player position and knocks player to adjacent tile.
     *
     * Algorithm:
     * 1. Deal damage to player
     * 2. Find all valid adjacent knockback positions (orthogonal only)
     * 3. Score each position by distance from enemy's previous position
     * 4. Choose position that maximizes knockback distance
     * 5. Move player to knockback position
     * 6. Animate both player and enemy bumps
     *
     * Knockback Scoring:
     * - Higher score = farther from enemy's last position
     * - Maximizes displacement for strategic positioning
     * - Prevents predictable knockback patterns
     *
     * Validation:
     * - Must be walkable terrain
     * - Cannot be occupied by another enemy
     * - If no valid positions, player stays in place
     *
     * @param {Enemy} enemy - The attacking lizord
     * @param {Player} player - The player being attacked
     * @param {number} playerX - Current player X
     * @param {number} playerY - Current player Y
     * @param {Grid} grid - Game grid
     * @param {Enemy[]} enemies - All enemies
     * @param {Game} game - Game instance
     * @returns {void}
     */
    performLizordBumpAttack(enemy, player, playerX, playerY, grid, enemies, game) {
        // Deal damage and trigger attack visuals
        player.takeDamage(enemy.attack);
        enemy.justAttacked = true;
        enemy.attackAnimation = 15;
        if (/** @type {any} */ (window).soundManager) /** @type {any} */ (window).soundManager.playSound('attack');

        // Early exit if player died from damage
        if (player.isDead && player.isDead()) return;

        // Define 4 orthogonal knockback positions
        const possiblePositions = [
            { x: playerX, y: playerY - 1 },  // North
            { x: playerX, y: playerY + 1 },  // South
            { x: playerX - 1, y: playerY },  // West
            { x: playerX + 1, y: playerY }   // East
        ];

        // Filter to valid knockback positions
        const candidates = possiblePositions.filter(pos => {
            if (!player.isWalkable(pos.x, pos.y, grid)) return false;
            if (enemies.some(e => e.x === pos.x && e.y === pos.y)) return false;
            return true;
        });

        if (candidates.length === 0) return;  // No valid knockback, player stays

        // Score each candidate by distance from enemy's previous position
        let best = candidates[0];
        let bestScore = -Infinity;

        for (const c of candidates) {
            // Manhattan distance from enemy's last position
            const score = Math.abs(c.x - (enemy.lastX || enemy.x)) +
                         Math.abs(c.y - (enemy.lastY || enemy.y));

            if (score > bestScore) {
                bestScore = score;
                best = c;
            }
        }

        // Execute knockback
        player.setPosition(best.x, best.y);
        player.startBump(best.x - playerX, best.y - playerY);

        // Animate enemy bump (charging into player position)
        if (typeof enemy.lastX !== 'undefined' && typeof enemy.lastY !== 'undefined') {
            enemy.startBump(playerX - enemy.lastX, playerY - enemy.lastY);
        }
    }

    /**
     * Perform a standard enemy attack on the player
     * @param {Enemy} enemy - The attacking enemy
     * @param {Player} player - The player being attacked
     * @param {number} playerX - Player X position
     * @param {number} playerY - Player Y position
     * @param {Grid} grid - Game grid
     * @param {Enemy[]} enemies - All enemies
     * @param {Game|null} game - Game instance
     * @returns {void}
     */
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
        if (/** @type {any} */ (window).soundManager) /** @type {any} */ (window).soundManager.playSound('attack');
        if (player.isDead()) {
            // handle death if necessary
        }
    }

    /**
     * Find any valid adjacent move as a fallback when pathfinding fails
     * @param {Enemy} enemy - The enemy
     * @param {Grid} grid - Game grid
     * @param {Enemy[]} enemies - All enemies
     * @returns {Position|null} A valid adjacent position or null
     */
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

    /**
     * Adds smoke trail animations for multi-tile enemy charge moves.
     * Creates smoke puffs at intermediate tiles along the charge path.
     *
     * Only applies to charge-type enemies:
     * - lizardeaux (rook): Orthogonal charges
     * - zard (bishop): Diagonal charges
     *
     * Algorithm (Proportional Step Interpolation):
     * 1. Determine primary movement axis (X or Y with greater distance)
     * 2. Calculate step increments for both axes
     * 3. For each tile along primary axis, interpolate secondary axis position
     * 4. Round to nearest grid coordinate
     * 5. Add smoke animation at each interpolated position
     *
     * Why Proportional Steps:
     * - Ensures smoke appears at every tile along the path
     * - Works for both orthogonal and diagonal movements
     * - Handles different aspect ratios (not just 45° diagonals)
     *
     * Example:
     * Move from (5,5) to (10,7): dx=5, dy=2
     * - Primary axis: X (distX=5 > distY=2)
     * - For i=1: x=6, y=5+round(1*2/5)=5
     * - For i=2: x=7, y=5+round(2*2/5)=6
     * - For i=3: x=8, y=5+round(3*2/5)=6
     * - For i=4: x=9, y=5+round(4*2/5)=7
     *
     * @param {Enemy} enemy - The charging enemy
     * @param {Position} next - Destination position
     * @returns {void}
     */
    addSmokeTrail(enemy, next) {
        const chargeTypes = new Set(['lizardeaux', 'zard']);

        if (chargeTypes.has(enemy.enemyType)) {
            const startX = enemy.x;
            const startY = enemy.y;
            const dx = next.x - startX;
            const dy = next.y - startY;
            const distX = Math.abs(dx);
            const distY = Math.abs(dy);

            // Branch based on primary movement axis
            if (distX >= distY) {
                // X is primary axis: step along X, interpolate Y
                const stepX = dx > 0 ? 1 : -1;  // Direction: +1 or -1
                const stepY = dy === 0 ? 0 : dy / distX;  // Proportional Y increment

                for (let i = 1; i < distX; i++) {
                    enemy.smokeAnimations.push({
                        x: startX + i * stepX,
                        y: startY + Math.round((i * dy) / distX),  // Interpolate Y
                        frame: 18
                    });
                }
            } else {
                // Y is primary axis: step along Y, interpolate X
                const stepY = dy > 0 ? 1 : -1;  // Direction: +1 or -1
                const stepX = dx === 0 ? 0 : dx / distY;  // Proportional X increment

                for (let i = 1; i < distY; i++) {
                    enemy.smokeAnimations.push({
                        x: startX + Math.round((i * dx) / distY),  // Interpolate X
                        y: startY + i * stepY,
                        frame: 18
                    });
                }
            }
        }
    }
}
