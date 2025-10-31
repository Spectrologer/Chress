// @ts-check
/**
 * CollisionDetectionSystem - Handles collision detection and resolution
 *
 * Manages collisions between enemies and player, applies damage and knockback.
 * Extracted from CombatManager to reduce file size.
 */

import audioManager from '../../utils/AudioManager.js';
import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { EnemyAttackHelper } from '../../enemy/EnemyAttackHelper.js';
import { safeCall } from '../../utils/SafeServiceCall.js';

export class CollisionDetectionSystem {
    /**
     * @param {any} game - The main game instance
     * @param {any} bombManager - Bomb manager
     * @param {Function} defeatEnemy - Function to defeat enemy
     */
    constructor(game, bombManager, defeatEnemy) {
        this.game = game;
        this.bombManager = bombManager;
        this.defeatEnemy = defeatEnemy;
    }

    /**
     * Check for collisions between enemies and player, handle combat
     * @returns {boolean} True if player was attacked (needs pause), false otherwise
     */
    checkCollisions() {
        // Delegate bomb timing checks to BombManager
        safeCall(this.bombManager, 'tickBombsAndExplode');

        const enemyCollection = this.game.enemyCollection;
        const playerPos = this.game.player.getPosition();
        const toRemove = [];
        let playerWasAttacked = false;

        enemyCollection.forEach((enemy) => {
            const enemyIsDead = safeCall(enemy, 'isDead') ?? (enemy.health <= 0);
            if (enemyIsDead) {
                this.defeatEnemy(enemy);
                toRemove.push(enemy);
                return;
            }

            let isDefeated = false;

            // Check for player-enemy collision
            if (enemy.x === playerPos.x && enemy.y === playerPos.y && !enemy.justAttacked && enemy.enemyType !== 'lizardy') {
                playerWasAttacked = true;

                // Visual feedback on player
                this.game.player.animations.startDamageAnimation();

                // Calculate knockback direction
                const enemyMoveX = enemy.x - (enemy.lastX !== undefined ? enemy.lastX : enemy.x);
                const enemyMoveY = enemy.y - (enemy.lastY !== undefined ? enemy.lastY : enemy.y);
                const knockbackX = enemyMoveX !== 0 ? Math.sign(enemyMoveX) : 1;
                const knockbackY = enemyMoveY !== 0 ? Math.sign(enemyMoveY) : 0;

                // Emit bump animation event for player knockback
                EnemyAttackHelper.emitBumpEventWithDirection(
                    knockbackX, knockbackY, playerPos.x, playerPos.y
                );

                // Enemy attack animation
                enemy.attackAnimation = 15;
                enemy.startBump(knockbackX, knockbackY);

                // Play hurt sound
                audioManager.playSound('hurt', { game: this.game });

                // Deal damage
                this.game.playerFacade.takeDamage(enemy.attack);
                enemy.takeDamage(enemy.health);
                isDefeated = true;
            }

            if (enemy.health <= 0) isDefeated = true;

            if (isDefeated) {
                this.defeatEnemy(enemy);
                toRemove.push(enemy);
            }
        });

        // Remove defeated enemies
        for (const enemy of toRemove) {
            enemyCollection.remove(enemy, false);
        }

        // Emit event for player stats change
        eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {
            health: this.game.playerFacade.getHealth(),
            points: this.game.playerFacade.getPoints(),
            hunger: this.game.playerFacade.getHunger(),
            thirst: this.game.playerFacade.getThirst()
        });

        return playerWasAttacked;
    }
}
