import { TILE_TYPES } from '../core/constants/index.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import audioManager from '../utils/AudioManager.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.js';
import { safeCall, safeGet } from '../utils/SafeServiceCall.js';
import { EnemyAttackHelper } from '../enemy/EnemyAttackHelper.js';

export class CombatManager {
    /**
     * CombatManager handles all combat-related logic including enemy movements,
     * collisions, and defeat flow. Dependencies are injected to enable testing
     * and avoid circular dependencies.
     *
     * @param {Object} game - The main game instance
     * @param {Set} occupiedTiles - Set of tiles occupied during enemy turns
     * @param {Object} bombManager - Manages bomb timing and explosions
     * @param {Object} defeatFlow - Handles enemy defeat logic and rewards
     */
    constructor(game, occupiedTiles, bombManager, defeatFlow) {
        this.game = game;
        this.occupiedTiles = occupiedTiles;
        this.bombManager = bombManager;
        this.defeatFlow = defeatFlow;
    }

    // Safe accessor for player's current zone to support tests/mocks
    getCurrentZone() {
        try {
            const zone = safeCall(this.game.player, 'getCurrentZone');
            if (zone) return zone;

            const currentZone = safeGet(this.game, 'player.currentZone');
            if (currentZone) return currentZone;
        } catch (e) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'CombatManager',
                action: 'get current zone'
            });
        }
        return { x: 0, y: 0, dimension: 0, depth: 0 };
    }

    addPointAnimation(x, y, amount) {
        // Delegate to defeatFlow
        this.defeatFlow.addPointAnimation(x, y, amount);
    }

    handleEnemyDefeated(enemy, currentZone) {
        // Delegate to defeatFlow without combo tracking (initiator=null)
        this.defeatFlow.executeDefeat(enemy, currentZone, null);
    }

    // initiator: optional string e.g. 'player', 'bomb', null
    // Returns an object { defeated: bool, consecutiveKills: number }
    defeatEnemy(enemy, initiator = null) {
        const currentZone = this.getCurrentZone();
        // Delegate to defeatFlow for all defeat logic including combo tracking
        return this.defeatFlow.executeDefeat(enemy, currentZone, initiator);
    }

    /**
     * Handle player attack on an enemy
     * @param {Object} enemy - The enemy being attacked
     * @param {Object} playerPos - Current player position {x, y}
     * @returns {Object} Result of the attack including defeated status
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

    handleSingleEnemyMovement(enemy) {
        const enemyCollection = this.game.enemyCollection;
        // Ensure we are not trying to move a dead or non-existent enemy
        if (!enemy || enemy.health <= 0 || !enemyCollection.includes(enemy)) {
            return;
        }
        const gridManager = this.game.gridManager;
        const playerPos = this.game.player.getPosition();

        const allEnemies = enemyCollection.getAll();
        const move = enemy.planMoveTowards(this.game.player, this.game.grid, allEnemies, playerPos, false, this.game);
        if (move) {
            // Check if enemy is moving onto a pitfall trap
            const targetTile = gridManager.getTile(move.x, move.y);
            if (targetTile === TILE_TYPES.PITFALL) {
                // The enemy falls into the pit!
                // The enemy falls into the pit. Leave the surface tile as a primitive
                // PITFALL (do not create an object-style 'stairup' on the surface).
                gridManager.setTile(move.x, move.y, TILE_TYPES.PITFALL);

                // Remove the enemy from the current zone's active enemy list
                // Before removing, clear any turn-manager bookkeeping for this enemy so
                // other enemies don't rely on stale occupancy data.
                try {
                    const startKey = `${enemy.x},${enemy.y}`;
                    if (this.game.turnManager && this.game.turnManager.initialEnemyTilesThisTurn) {
                        this.game.turnManager.initialEnemyTilesThisTurn.delete(startKey);
                    }
                    if (this.occupiedTiles) {
                        this.occupiedTiles.delete(startKey);
                    }
                } catch (e) {
                    // Defensive: continue even if turnManager isn't present or delete fails
                }

                enemyCollection.removeById(enemy.id, false); // Don't emit event for pitfall removals

                // Add the enemy to the corresponding underground zone's data
                const currentZone = this.getCurrentZone();
                const depth = this.game.playerFacade.getUndergroundDepth() || 1;
                const undergroundZoneKey = createZoneKey(currentZone.x, currentZone.y, 2, depth);
                if (this.game.zoneRepository.hasByKey(undergroundZoneKey)) {
                    const undergroundZoneData = this.game.zoneRepository.getByKey(undergroundZoneKey);
                    // Find a valid spawn point for the enemy in the pitfall zone
                    const spawnPos = this.game.player.getValidSpawnPosition(this.game);
                    enemy.x = spawnPos.x;
                    enemy.y = spawnPos.y;
                    undergroundZoneData.enemies.push(enemy.serialize());
                }
                return; // Enemy has fallen, its turn in this zone is over.
            }

            const key = `${move.x},${move.y}`;
            // Extra safeguard: don't move onto a tile currently occupied by another enemy
            // (exclude the moving enemy itself when comparing)
            const occupiedNow = enemyCollection.some(e => e.id !== enemy.id && e.x === move.x && e.y === move.y);
            if (occupiedNow) {
                return; // Tile is currently occupied, block the move
            }
            // Disallow moving into tiles that were occupied at the start of the enemy turn
            // by other enemies. Allow moving into your own starting tile (enemy may choose to stay).
            const initialSet = this.game.initialEnemyTilesThisTurn || new Set();
            const ownStartKey = `${enemy.lastX || enemy.x},${enemy.lastY || enemy.y}`;
            if (initialSet.has(key) && key !== ownStartKey) {
                return; // Prevent moving into a tile that was occupied at turn start
            }
            if (this.occupiedTiles.has(key)) {
                return; // Tile is already claimed for this turn sequence
            }
            this.occupiedTiles.add(key);
            
            enemy.lastX = enemy.x;
            enemy.lastY = enemy.y;
            enemy.x = move.x;
            enemy.y = move.y;
            enemy.liftFrames = 15; // Start lift animation

            // Add horse charge animation for lizord when it moves
            if (enemy.enemyType === 'lizord' && (enemy.lastX !== enemy.x || enemy.lastY !== enemy.y)) {
                const dx = enemy.x - enemy.lastX;
                const dy = enemy.y - enemy.lastY;
                let midX, midY; // The "corner" of the L-shaped move

                // A lizord (knight) moves 2 tiles in one cardinal direction and 1 in a perpendicular one.
                // The 'midPos' should be the corner of the 'L'.
                // We determine the long leg of the L-move and set the midpoint accordingly.
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Moved further horizontally (e.g., 2 tiles) than vertically (e.g., 1 tile).
                    // The corner of the L is at the end of the horizontal leg.
                    midX = enemy.x;
                    midY = enemy.lastY;
                } else {
                    // Moved further vertically than horizontally.
                    // The corner of the L is at the end of the vertical leg.
                    midX = enemy.lastX;
                    midY = enemy.y;
                }

                // Emit event instead of directly calling animationManager
                eventBus.emit(EventTypes.ANIMATION_REQUESTED, {
                    type: 'horseCharge',
                    x: enemy.x,
                    y: enemy.y,
                    data: {
                        startPos: { x: enemy.lastX, y: enemy.lastY },
                        midPos: { x: midX, y: midY },
                        endPos: { x: enemy.x, y: enemy.y }
                    }
                });
            }
        }
    }

    handleEnemyMovements() {
        // Handle enemy movements after player actions
         // This is a placeholder for now as the main enemy movement logic might be in game.js
    }

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
            if (enemy.x === playerPos.x && enemy.y === playerPos.y && !enemy.justAttacked && enemy.enemyType !== 'lizardy') {
                // Player is being attacked!
                playerWasAttacked = true;

                // Visual feedback on player
                this.game.player.animations.startDamageAnimation();

                // Knockback: Use enemy's last position to determine direction
                // Enemy moved from (lastX, lastY) to current position (x, y)
                const enemyMoveX = enemy.x - (enemy.lastX !== undefined ? enemy.lastX : enemy.x);
                const enemyMoveY = enemy.y - (enemy.lastY !== undefined ? enemy.lastY : enemy.y);

                // Push player in the direction the enemy was moving
                // If enemy didn't move, use a default bump
                const knockbackX = enemyMoveX !== 0 ? Math.sign(enemyMoveX) : 1;
                const knockbackY = enemyMoveY !== 0 ? Math.sign(enemyMoveY) : 0;

                // Emit bump animation event for player knockback
                EnemyAttackHelper.emitBumpEventWithDirection(
                    knockbackX, knockbackY, playerPos.x, playerPos.y
                );

                // Enemy attack animation (bump towards player - opposite of knockback)
                enemy.attackAnimation = 15;
                enemy.startBump(knockbackX, knockbackY);

                // Play hurt sound
                audioManager.playSound('hurt', { game: this.game });

                // Deal damage (via facade)
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
            enemyCollection.remove(enemy, false); // Don't emit events for combat removals
        }

        // Emit event for player stats change (via facade) instead of calling UIManager directly
        eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {
            health: this.game.playerFacade.getHealth(),
            points: this.game.playerFacade.getPoints(),
            hunger: this.game.playerFacade.getHunger(),
            thirst: this.game.playerFacade.getThirst()
        });

        // If player was attacked, add a pause for dramatic effect
        if (playerWasAttacked) {
            return true; // Signal that we need a pause
        }
        return false;
    }


}
