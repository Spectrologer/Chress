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

import type { Position, Enemy, Player, Game } from './base';

declare global {
    interface Window {
        soundManager?: {
            playSound(soundName: string): void;
        };
    }
}

/**
 * Distance calculation utilities
 */
export const DistanceUtils = {
    /**
     * Calculate Manhattan distance (sum of absolute differences)
     * Used for orthogonal movement (rook-like)
     */
    manhattan(x1: number, y1: number, x2: number, y2: number): number {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    },

    /**
     * Calculate Chebyshev distance (max of absolute differences)
     * Used for 8-way movement and adjacency checks
     */
    chebyshev(x1: number, y1: number, x2: number, y2: number): number {
        return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    },

    /**
     * Check if two positions are adjacent (Chebyshev distance = 1)
     */
    isAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
        return this.chebyshev(x1, y1, x2, y2) === 1;
    },

    /**
     * Check if two positions are diagonally adjacent (both dx and dy are 1)
     */
    isDiagonallyAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
        const dx: number = Math.abs(x2 - x1);
        const dy: number = Math.abs(y2 - y1);
        return dx === 1 && dy === 1;
    },

    /**
     * Check if two positions are orthogonally adjacent (one axis differs by 1, other is 0)
     */
    isOrthogonallyAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
        const dx: number = Math.abs(x2 - x1);
        const dy: number = Math.abs(y2 - y1);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    },

    /**
     * Get deltas between two positions
     */
    getDeltas(x1: number, y1: number, x2: number, y2: number): { dx: number; dy: number } {
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
     */
    shouldSkipEffects(isSimulation: boolean): boolean {
        return isSimulation === true;
    }
};

type PerformAttackFn = (
    enemy: Enemy,
    player: Player,
    playerX: number,
    playerY: number,
    grid: null,
    enemies: null,
    game: Game | null
) => void;

/**
 * Standard attack behavior implementations
 */
export const AttackBehaviors = {
    /**
     * Perform a standard adjacent attack (used by most enemy types)
     * Deals damage, plays sound, triggers bump animations
     */
    performAdjacentAttack(
        enemy: Enemy,
        player: Player,
        playerX: number,
        playerY: number,
        isSimulation: boolean,
        game: Game | null,
        performAttackFn: PerformAttackFn
    ): void {
        if (SimulationGuards.shouldSkipEffects(isSimulation)) return;
        performAttackFn(enemy, player, playerX, playerY, null, null, game);
    },

    /**
     * Perform a diagonal attack (used by zard, lizardy)
     * Similar to adjacent but specifically for diagonal positions
     */
    performDiagonalAttack(
        enemy: Enemy,
        player: Player,
        playerX: number,
        playerY: number,
        isSimulation: boolean,
        game: Game | null,
        performAttackFn: PerformAttackFn
    ): void {
        if (SimulationGuards.shouldSkipEffects(isSimulation)) return;
        performAttackFn(enemy, player, playerX, playerY, null, null, game);
    },

    /**
     * Perform a bump attack without damage (used by lizardy)
     * Only plays animation and sound, no damage dealt
     */
    performBumpAttack(enemy: Enemy, player: Player, isSimulation: boolean): void {
        if (SimulationGuards.shouldSkipEffects(isSimulation)) return;

        player.startBump(enemy.x - player.x, enemy.y - player.y);
        enemy.startBump!(player.x - enemy.x, player.y - enemy.y);

        // Use type-safe window access for soundManager
        if (typeof window !== 'undefined' && window.soundManager) {
            window.soundManager.playSound('attack');
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
     */
    handleChargeResult(
        chargeResult: Position | false | null,
        fallbackMoveFn: () => Position | null
    ): Position | null {
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
     */
    shouldAttackPlayer(enemy: Enemy, playerX: number, playerY: number, game: Game | null): boolean {
        // Don't attack if player just attacked
        if (game && game.playerJustAttacked) {
            return false;
        }

        const dx: number = Math.abs(enemy.x - playerX);
        const dy: number = Math.abs(enemy.y - playerY);

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
     */
    positionsMatch(x1: number, y1: number, x2: number, y2: number): boolean {
        return x1 === x2 && y1 === y2;
    }
};
