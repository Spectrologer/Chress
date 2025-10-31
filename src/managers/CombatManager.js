// @ts-check
/**
 * CombatManager - Combat coordinator
 *
 * Refactored Architecture:
 * - EnemyMovementHandler: Enemy movement and pitfall logic
 * - PlayerCombatHandler: Player attack handling
 * - CollisionDetectionSystem: Collision detection and resolution
 */
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.js';
import { safeCall, safeGet } from '../utils/SafeServiceCall.js';
import { EnemyMovementHandler } from './combat/EnemyMovementHandler.js';
import { PlayerCombatHandler } from './combat/PlayerCombatHandler.js';
import { CollisionDetectionSystem } from './combat/CollisionDetectionSystem.js';

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
     * @param {any} game - The main game instance
     * @param {Set<string>} occupiedTiles - Set of tiles occupied during enemy turns
     * @param {any} bombManager - Manages bomb timing and explosions
     * @param {any} defeatFlow - Handles enemy defeat logic and rewards
     */
    constructor(game, occupiedTiles, bombManager, defeatFlow) {
        this.game = game;
        this.occupiedTiles = occupiedTiles;
        this.bombManager = bombManager;
        this.defeatFlow = defeatFlow;

        // Initialize sub-handlers
        this.movementHandler = new EnemyMovementHandler(game, occupiedTiles);
        this.playerCombatHandler = new PlayerCombatHandler(game, (enemy, initiator) => this.defeatEnemy(enemy, initiator));
        this.collisionSystem = new CollisionDetectionSystem(game, bombManager, (enemy, initiator) => this.defeatEnemy(enemy, initiator));
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

    handlePlayerAttack(enemy, playerPos) {
        return this.playerCombatHandler.handlePlayerAttack(enemy, playerPos);
    }

    handleSingleEnemyMovement(enemy) {
        this.movementHandler.handleSingleEnemyMovement(enemy);
    }

    /**
     * Handle enemy movements after player actions
     * @returns {void}
     */
    handleEnemyMovements() {
        // Handle enemy movements after player actions
         // This is a placeholder for now as the main enemy movement logic might be in game.js
    }

    checkCollisions() {
        return this.collisionSystem.checkCollisions();
    }
}
