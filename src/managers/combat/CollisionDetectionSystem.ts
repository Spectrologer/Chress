/**
 * CollisionDetectionSystem - Handles collision detection and resolution
 *
 * Manages collisions between enemies and player, applies damage and knockback.
 * Extracted from CombatManager to reduce file size.
 */

import audioManager from '@utils/AudioManager';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { EnemyAttackHelper } from '@enemy/EnemyAttackHelper';
import { safeCall } from '@utils/SafeServiceCall';
import type { Game } from '@core/game';
import type { Position } from '@core/Position';
import type { Enemy } from '@entities/Enemy';
import type { BombManager } from '../BombManager';

interface AttackResult {
    defeated: boolean;
    consecutiveKills: number;
}

export class CollisionDetectionSystem {
    private game: Game;
    private bombManager: BombManager;
    private defeatEnemy: (enemy: Enemy, initiator?: string) => AttackResult;

    constructor(game: Game, bombManager: BombManager, defeatEnemy: (enemy: Enemy, initiator?: string) => AttackResult) {
        this.game = game;
        this.bombManager = bombManager;
        this.defeatEnemy = defeatEnemy;
    }

    /**
     * Check for collisions between enemies and player, handle combat
     * @returns True if player was attacked (needs pause), false otherwise
     */
    public checkCollisions(): boolean {
        // Delegate bomb timing checks to BombManager
        safeCall(this.bombManager, 'tickBombsAndExplode');

        const enemyCollection = this.game.enemyCollection;
        if (!enemyCollection) return false;

        // CRITICAL: Skip collision detection in chess mode - player is off-board and shouldn't interact with pieces
        const isChessMode = this.game.gameMode?.currentMode === 'chess';
        if (isChessMode) {
            console.log('[Chess] Skipping collision detection - chess mode active');
            return false;
        }

        const playerPos = (this.game.player as any).getPosition() as Position;
        console.log('[Chess] checkCollisions - player at', playerPos.x, playerPos.y);
        const toRemove: Enemy[] = [];
        let playerWasAttacked = false;

        enemyCollection.forEach((enemy: Enemy) => {
            const enemyIsDead = safeCall(enemy, 'isDead') ?? (enemy.health <= 0);
            if (enemyIsDead) {
                console.log('[Chess] Removing dead enemy:', enemy.enemyType, 'at', enemy.x, enemy.y, 'health:', enemy.health);
                this.defeatEnemy(enemy);
                toRemove.push(enemy);
                return;
            }

            let isDefeated = false;

            // Check for player-enemy collision
            if (enemy.x === playerPos.x && enemy.y === playerPos.y && !enemy.justAttacked && enemy.enemyType !== 'lizardy') {
                console.log('[Chess] COLLISION detected with', enemy.enemyType, 'at', enemy.x, enemy.y);
                playerWasAttacked = true;

                // Visual feedback on player
                (this.game.player as any).animations.startDamageAnimation();

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
