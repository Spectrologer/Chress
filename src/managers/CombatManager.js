// @ts-check
import { TILE_TYPES } from '../core/constants/index.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import audioManager from '../utils/AudioManager.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.js';
import { safeCall, safeGet } from '../utils/SafeServiceCall.js';
import { EnemyAttackHelper } from '../enemy/EnemyAttackHelper.js';

/**
 * @typedef {Object} ZoneInfo
 * @property {number} x - Zone X coordinate
 * @property {number} y - Zone Y coordinate
 * @property {number} dimension - Dimension (0=surface, 1=interior, 2=underground)
 * @property {number} depth - Underground depth
 */

/**
 * @typedef {Object} DefeatResult
 * @property {boolean} defeated - Whether the enemy was defeated
 * @property {number} consecutiveKills - Number of consecutive kills
 */

/**
 * @typedef {Object} Enemy
 * @property {string} id - Enemy ID
 * @property {number} x - Enemy X position
 * @property {number} y - Enemy Y position
 * @property {number} [lastX] - Previous X position
 * @property {number} [lastY] - Previous Y position
 * @property {number} health - Enemy health
 * @property {number} attack - Enemy attack power
 * @property {string} enemyType - Enemy type identifier
 * @property {boolean} [justAttacked] - Whether enemy just attacked
 * @property {number} [attackAnimation] - Attack animation frames
 * @property {number} [liftFrames] - Lift animation frames
 * @property {boolean} [_suppressAttackSound] - Suppress attack sound flag
 * @property {Function} startBump - Start bump animation
 * @property {Function} takeDamage - Take damage
 * @property {Function} [isDead] - Check if dead
 * @property {Function} planMoveTowards - Plan movement towards target
 * @property {Function} serialize - Serialize enemy data
 */

/**
 * @typedef {Object} PlayerPos
 * @property {number} x - Player X position
 * @property {number} y - Player Y position
 */

/**
 * @typedef {Object} Game
 * @property {any} player - Player instance
 * @property {any} playerFacade - Player facade
 * @property {any} enemyCollection - Enemy collection
 * @property {any} gridManager - Grid manager
 * @property {any} zoneRepository - Zone repository
 * @property {Array<Array<number|Object>>} grid - Game grid
 * @property {any} [turnManager] - Turn manager
 * @property {Set<string>} [initialEnemyTilesThisTurn] - Initial enemy tiles this turn
 */

export class CombatManager {
    /**
     * CombatManager handles all combat-related logic including enemy movements,
     * collisions, and defeat flow. Dependencies are injected to enable testing
     * and avoid circular dependencies.
     *
     * @param {Game} game - The main game instance
     * @param {Set<string>} occupiedTiles - Set of tiles occupied during enemy turns
     * @param {any} bombManager - Manages bomb timing and explosions
     * @param {any} defeatFlow - Handles enemy defeat logic and rewards
     */
    constructor(game, occupiedTiles, bombManager, defeatFlow) {
        /** @type {Game} */
        this.game = game;

        /** @type {Set<string>} */
        this.occupiedTiles = occupiedTiles;

        /** @type {any} */
        this.bombManager = bombManager;

        /** @type {any} */
        this.defeatFlow = defeatFlow;
    }

    /**
     * Safe accessor for player's current zone to support tests/mocks
     * @returns {ZoneInfo}
     */
    getCurrentZone() {
        try {
            const zone = safeCall(this.game.player, 'getCurrentZone');
            if (zone) return zone;

            const currentZone = safeGet(this.game, 'player.currentZone');
            if (currentZone) return currentZone;
        } catch (e) {
            errorHandler.handle(e, /** @type {any} */ (ErrorSeverity.WARNING), {
                component: 'CombatManager',
                action: 'get current zone'
            });
        }
        return { x: 0, y: 0, dimension: 0, depth: 0 };
    }

    /**
     * Add point animation at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} amount - Point amount
     * @returns {void}
     */
    addPointAnimation(x, y, amount) {
        // Delegate to defeatFlow
        this.defeatFlow.addPointAnimation(x, y, amount);
    }

    /**
     * Handle enemy defeated (without combo tracking)
     * @param {Enemy} enemy - The defeated enemy
     * @param {ZoneInfo} currentZone - Current zone
     * @returns {void}
     */
    handleEnemyDefeated(enemy, currentZone) {
        // Delegate to defeatFlow without combo tracking (initiator=null)
        this.defeatFlow.executeDefeat(enemy, currentZone, null);
    }

    /**
     * Defeat an enemy with optional combo tracking
     * @param {Enemy} enemy - The enemy to defeat
     * @param {string|null} [initiator=null] - Optional initiator ('player', 'bomb', etc.)
     * @returns {DefeatResult} Result including defeated status and consecutive kills
     */
    defeatEnemy(enemy, initiator = null) {
        const currentZone = this.getCurrentZone();
        // Delegate to defeatFlow for all defeat logic including combo tracking
        return this.defeatFlow.executeDefeat(enemy, currentZone, initiator);
    }

    /**
     * Handle player attack on an enemy
     * @param {Enemy} enemy - The enemy being attacked
     * @param {PlayerPos} playerPos - Current player position {x, y}
     * @returns {DefeatResult} Result of the attack including defeated status
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

    /**
     * Handle movement for a single enemy
     * @param {Enemy} enemy - The enemy to move
     * @returns {void}
     */
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

    /**
     * Handle enemy movements after player actions
     * @returns {void}
     */
    handleEnemyMovements() {
        // Handle enemy movements after player actions
         // This is a placeholder for now as the main enemy movement logic might be in game.js
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
