// @ts-check
/**
 * PlayerCombatHandler - Handles player attack logic
 *
 * Manages player attack animations and enemy defeat with combo tracking.
 * Extracted from CombatManager to reduce file size.
 */

import audioManager from '../../utils/AudioManager.js';
import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { EnemyAttackHelper } from '../../enemy/EnemyAttackHelper.js';

export class PlayerCombatHandler {
    /**
     * @param {any} game - The main game instance
     * @param {Function} defeatEnemy - Function to defeat enemy
     */
    constructor(game, defeatEnemy) {
        this.game = game;
        this.defeatEnemy = defeatEnemy;
    }

    /**
     * Handle player attack on an enemy
     * @param {any} enemy - The enemy being attacked
     * @param {any} playerPos - Current player position {x, y}
     * @returns {any} Result of the attack including defeated status
     */
    handlePlayerAttack(enemy, playerPos) {
        // Emit player attack animation event
        eventBus.emit(EventTypes.ANIMATION_ATTACK, {
            x: playerPos.x,
            y: playerPos.y
        });

        // Enemy bump animation (pushed back from player)
        enemy.startBump(playerPos.x - enemy.x, playerPos.y - enemy.y);

        // Set player action state (via facade)
        this.game.playerFacade.setAction('attack');

        // Play axe sound if player has the ability (via facade)
        if (this.game.playerFacade.hasAbility('axe')) {
            audioManager.playSound('slash', { game: this.game });
            enemy._suppressAttackSound = true;
        }

        // Defeat the enemy
        const result = this.defeatEnemy(enemy, 'player');

        // Handle post-defeat animations based on combo
        if (result?.defeated) {
            if (result.consecutiveKills >= 2) {
                // Emit backflip animation event on combo kills (2+)
                eventBus.emit(EventTypes.ANIMATION_BACKFLIP, {
                    x: playerPos.x,
                    y: playerPos.y
                });
            } else {
                // Emit bump animation event towards enemy on single kill
                EnemyAttackHelper.emitBumpEventWithDirection(
                    enemy.x - playerPos.x,
                    enemy.y - playerPos.y,
                    playerPos.x,
                    playerPos.y
                );
            }
        }

        return result;
    }
}
