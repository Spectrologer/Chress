import audioManager from '../utils/AudioManager.js';
import { ANIMATION_CONSTANTS } from '../core/constants/index.js';
import { eventBus } from '../core/EventBus.ts';
import { EventTypes } from '../core/EventTypes.ts';

/**
 * EnemyAttackHelper - Centralized utility for enemy attack animations and events
 * Eliminates duplication across EnemyAttack, EnemySpecialActions, and CombatManager
 */
export class EnemyAttackHelper {
    /**
     * Perform standard attack animation sequence for an enemy
     * @param {Object} enemy - The attacking enemy
     * @param {Object} audioManager - Audio manager instance (optional, uses default if not provided)
     */
    static performAttackAnimation(enemy, audioManagerInstance = audioManager) {
        enemy.justAttacked = true;
        enemy.attackAnimation = ANIMATION_CONSTANTS.ATTACK_ANIMATION_FRAMES;

        // Only play sound if not suppressed (e.g., when player has axe)
        if (!enemy._suppressAttackSound) {
            audioManagerInstance.playSound('attack');
        }
    }

    /**
     * Emit bump animation event for player being pushed
     * @param {Object} enemy - The attacking enemy
     * @param {number} playerX - Player's X position
     * @param {number} playerY - Player's Y position
     */
    static emitBumpEvent(enemy, playerX, playerY) {
        eventBus.emit(EventTypes.ANIMATION_BUMP, {
            dx: enemy.x - playerX,
            dy: enemy.y - playerY,
            playerX: playerX,
            playerY: playerY
        });
    }

    /**
     * Emit bump animation event with explicit direction
     * @param {number} dx - Direction X offset
     * @param {number} dy - Direction Y offset
     * @param {number} playerX - Player's X position
     * @param {number} playerY - Player's Y position
     */
    static emitBumpEventWithDirection(dx, dy, playerX, playerY) {
        eventBus.emit(EventTypes.ANIMATION_BUMP, {
            dx: dx,
            dy: dy,
            playerX: playerX,
            playerY: playerY
        });
    }

    /**
     * Emit knockback event to push player away
     * @param {number} knockbackX - Target X position after knockback
     * @param {number} knockbackY - Target Y position after knockback
     * @param {string} source - Source identifier for knockback (e.g., 'enemy_ram', 'enemy_charge')
     */
    static emitKnockbackEvent(knockbackX, knockbackY, source) {
        eventBus.emit(EventTypes.PLAYER_KNOCKBACK, {
            x: knockbackX,
            y: knockbackY,
            source: source
        });
    }

    /**
     * Complete attack sequence: damage, animations, sound, bump, and knockback
     * @param {Object} enemy - The attacking enemy
     * @param {Object} player - The player being attacked
     * @param {number} playerX - Player's X position
     * @param {number} playerY - Player's Y position
     * @param {Object} grid - Game grid for walkability checks
     * @param {string} source - Attack source identifier (e.g., 'enemy_ram')
     * @param {Object} options - Optional configuration
     * @param {boolean} options.skipKnockback - Skip knockback calculation
     * @param {Object} options.knockbackOverride - Override knockback position {x, y}
     */
    static performCompleteAttack(enemy, player, playerX, playerY, grid, source, options = {}) {
        // Deal damage
        player.takeDamage(enemy.attack);

        // Emit bump animation for player
        this.emitBumpEvent(enemy, playerX, playerY);

        // Enemy bump animation (recoil)
        enemy.startBump(playerX - enemy.x, playerY - enemy.y);

        // Attack animation and sound
        this.performAttackAnimation(enemy);

        // Handle knockback if not skipped
        if (!options.skipKnockback) {
            let knockbackX, knockbackY;

            if (options.knockbackOverride) {
                knockbackX = options.knockbackOverride.x;
                knockbackY = options.knockbackOverride.y;
            } else {
                // Calculate knockback direction (away from enemy)
                const attackDx = playerX - enemy.x;
                const attackDy = playerY - enemy.y;

                knockbackX = playerX;
                knockbackY = playerY;

                if (attackDx !== 0) knockbackX += Math.sign(attackDx);
                if (attackDy !== 0) knockbackY += Math.sign(attackDy);
            }

            // Only knockback if the position is walkable
            if (player.isWalkable(knockbackX, knockbackY, grid)) {
                this.emitKnockbackEvent(knockbackX, knockbackY, source);
            }
        }
    }

    /**
     * Calculate knockback position based on attack direction
     * @param {number} attackDx - Attack direction X
     * @param {number} attackDy - Attack direction Y
     * @param {number} playerX - Player's current X
     * @param {number} playerY - Player's current Y
     * @returns {Object} Knockback position {x, y}
     */
    static calculateKnockbackPosition(attackDx, attackDy, playerX, playerY) {
        const absDx = Math.abs(attackDx);
        const absDy = Math.abs(attackDy);
        let knockbackX = playerX;
        let knockbackY = playerY;

        if (absDx > absDy) {
            // Horizontal knockback
            knockbackX += attackDx > 0 ? 1 : -1;
        } else if (absDy > absDx) {
            // Vertical knockback
            knockbackY += attackDy > 0 ? 1 : -1;
        } else {
            // Diagonal knockback
            knockbackX += attackDx > 0 ? 1 : -1;
            knockbackY += attackDy > 0 ? 1 : -1;
        }

        return { x: knockbackX, y: knockbackY };
    }
}
