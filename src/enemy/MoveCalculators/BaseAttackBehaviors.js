// @ts-check
/**
 * BaseAttackBehaviors - Consolidated attack behavior utilities for enemy move calculators.
 *
 * This module consolidates common patterns found across all enemy move calculators:
 * - Distance calculations (Manhattan, Chebyshev, diagonal checks)
 * - Simulation guards (prevent visual effects during AI simulation)
 * - Standard attack patterns (adjacent, diagonal, bump attacks)
 * - Charge move helpers
 *
 * Design Goals:
 * - DRY: Eliminate code duplication across 16+ calculator files
 * - Consistency: Standardize attack behavior implementations
 * - Maintainability: Single source of truth for attack logic
 */

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Enemy
 * @property {number} x
 * @property {number} y
 * @property {number} attack
 * @property {string} enemyType
 * @property {boolean} [justAttacked]
 * @property {number} [attackAnimation]
 * @property {Function} startBump
 * @property {Array<{x: number, y: number, frame: number}>} smokeAnimations
 */

/**
 * @typedef {Object} Player
 * @property {number} x
 * @property {number} y
 * @property {Function} takeDamage
 * @property {Function} startBump
 * @property {Function} [isDead]
 */

/**
 * @typedef {Object} Game
 * @property {boolean} [playerJustAttacked]
 */

/**
 * Distance calculation utilities
 */
export const DistanceUtils = {
    /**
     * Calculate Manhattan distance (sum of absolute differences)
     * Used for orthogonal movement (rook-like)
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @returns {number} Manhattan distance
     */
    manhattan(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    },

    /**
     * Calculate Chebyshev distance (max of absolute differences)
     * Used for 8-way movement and adjacency checks
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @returns {number} Chebyshev distance
     */
    chebyshev(x1, y1, x2, y2) {
        return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    },

    /**
     * Check if two positions are adjacent (Chebyshev distance = 1)
     * @param {number} x1 - First X
     * @param {number} y1 - First Y
     * @param {number} x2 - Second X
     * @param {number} y2 - Second Y
     * @returns {boolean} True if adjacent
     */
    isAdjacent(x1, y1, x2, y2) {
        return this.chebyshev(x1, y1, x2, y2) === 1;
    },

    /**
     * Check if two positions are diagonally adjacent (both dx and dy are 1)
     * @param {number} x1 - First X
     * @param {number} y1 - First Y
     * @param {number} x2 - Second X
     * @param {number} y2 - Second Y
     * @returns {boolean} True if diagonally adjacent
     */
    isDiagonallyAdjacent(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        return dx === 1 && dy === 1;
    },

    /**
     * Check if two positions are orthogonally adjacent (one axis differs by 1, other is 0)
     * @param {number} x1 - First X
     * @param {number} y1 - First Y
     * @param {number} x2 - Second X
     * @param {number} y2 - Second Y
     * @returns {boolean} True if orthogonally adjacent
     */
    isOrthogonallyAdjacent(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    },

    /**
     * Get deltas between two positions
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @returns {{dx: number, dy: number}} Deltas
     */
    getDeltas(x1, y1, x2, y2) {
        return {
            dx: Math.abs(x2 - x1),
            dy: Math.abs(y2 - y1)
        };
    }
};

/**
 * Simulation check utilities
 */
export const SimulationGuards = {
    /**
     * Check if we should skip visual/audio effects during simulation
     * Use this as an early return in attack methods to prevent animations during AI pathfinding
     * @param {boolean} isSimulation - Whether this is a simulation
     * @returns {boolean} True if we should skip effects
     */
    shouldSkipEffects(isSimulation) {
        return isSimulation === true;
    }
};

/**
 * Standard attack behavior implementations
 */
export const AttackBehaviors = {
    /**
     * Perform a standard adjacent attack (used by most enemy types)
     * Deals damage, plays sound, triggers bump animations
     *
     * @param {Enemy} enemy - Attacking enemy
     * @param {Player} player - Target player
     * @param {number} playerX - Player X position
     * @param {number} playerY - Player Y position
     * @param {boolean} isSimulation - Skip effects if true
     * @param {Game|null} game - Game instance
     * @param {Function} performAttackFn - The actual performAttack function from calculator
     */
    performAdjacentAttack(enemy, player, playerX, playerY, isSimulation, game, performAttackFn) {
        if (SimulationGuards.shouldSkipEffects(isSimulation)) return;
        performAttackFn(enemy, player, playerX, playerY, null, null, game);
    },

    /**
     * Perform a diagonal attack (used by zard, lizardy)
     * Similar to adjacent but specifically for diagonal positions
     *
     * @param {Enemy} enemy - Attacking enemy
     * @param {Player} player - Target player
     * @param {number} playerX - Player X position
     * @param {number} playerY - Player Y position
     * @param {boolean} isSimulation - Skip effects if true
     * @param {Game|null} game - Game instance
     * @param {Function} performAttackFn - The actual performAttack function from calculator
     */
    performDiagonalAttack(enemy, player, playerX, playerY, isSimulation, game, performAttackFn) {
        if (SimulationGuards.shouldSkipEffects(isSimulation)) return;
        performAttackFn(enemy, player, playerX, playerY, null, null, game);
    },

    /**
     * Perform a bump attack without damage (used by lizardy)
     * Only plays animation and sound, no damage dealt
     *
     * @param {Enemy} enemy - Attacking enemy
     * @param {Player} player - Target player
     * @param {boolean} isSimulation - Skip effects if true
     */
    performBumpAttack(enemy, player, isSimulation) {
        if (SimulationGuards.shouldSkipEffects(isSimulation)) return;

        player.startBump(enemy.x - player.x, enemy.y - player.y);
        enemy.startBump(player.x - enemy.x, player.y - enemy.y);

        if (/** @type {any} */ (window).soundManager) {
            /** @type {any} */ (window).soundManager.playSound('attack');
        }
    }
};

/**
 * Charge move helper utilities
 */
export const ChargeMoveHelpers = {
    /**
     * Handle the result of a charge move execution
     * Common pattern: if charge succeeds, return result; otherwise continue with normal movement
     *
     * @param {Position|false|null} chargeResult - Result from charge execution
     * @param {Function} fallbackMoveFn - Function to call if charge fails
     * @returns {Position|null} Move result
     */
    handleChargeResult(chargeResult, fallbackMoveFn) {
        if (chargeResult !== false) {
            return chargeResult;
        }
        return fallbackMoveFn();
    }
};

/**
 * Position check utilities for attack validation
 */
export const AttackValidation = {
    /**
     * Check if enemy should attack player at given position
     * Handles special cases for different enemy types
     *
     * @param {Enemy} enemy - The enemy
     * @param {number} playerX - Player X
     * @param {number} playerY - Player Y
     * @param {Game|null} game - Game instance
     * @returns {boolean} True if should attack
     */
    shouldAttackPlayer(enemy, playerX, playerY, game) {
        // Don't attack if player just attacked
        if (game && game.playerJustAttacked) {
            return false;
        }

        const dx = Math.abs(enemy.x - playerX);
        const dy = Math.abs(enemy.y - playerY);

        // Special case: lizardeaux (rook) can't attack diagonally
        if (enemy.enemyType === 'lizardeaux' && dx === 1 && dy === 1) {
            return false;
        }

        // Special case: zard (bishop) can't attack orthogonally
        if (enemy.enemyType === 'zard' && DistanceUtils.isOrthogonallyAdjacent(enemy.x, enemy.y, playerX, playerY)) {
            return false;
        }

        return true;
    },

    /**
     * Check if positions match (for attack range validation)
     * @param {number} x1 - First X
     * @param {number} y1 - First Y
     * @param {number} x2 - Second X
     * @param {number} y2 - Second Y
     * @returns {boolean} True if positions match
     */
    positionsMatch(x1, y1, x2, y2) {
        return x1 === x2 && y1 === y2;
    }
};
