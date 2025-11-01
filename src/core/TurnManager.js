// @ts-check

/**
 * @typedef {import('./GameContext.js').GameContext} GameContext
 * @typedef {import('../entities/Enemy.js').Enemy} Enemy
 * @typedef {import('../facades/EnemyCollection.js').EnemyCollection} EnemyCollection
 */

/**
 * TurnManager
 *
 * Manages the turn-based game loop including:
 * - Turn queue processing for enemy movements
 * - Exit tile freeze mechanics
 * - Occupied tile tracking
 * - Pitfall turn counting
 */
export class TurnManager {
    /**
     * @param {GameContext} game
     */
    constructor(game) {
        /** @type {GameContext} */
        this.game = game;

        /** @type {Enemy[]} */
        this.turnQueue = [];

        /** @type {Set<string>} Tiles occupied during current turn */
        this.occupiedTilesThisTurn = new Set();

        /** @type {Set<string>} Initial enemy positions at turn start */
        this.initialEnemyTilesThisTurn = new Set();

        /** @type {boolean} Track player's previous exit tile state */
        this.wasPlayerOnExitLastTurn = false;
    }

    /**
     * Handle turn completion after player action
     * Manages pitfall tracking
     * @returns {boolean} True if enemy turns were started
     */
    handleTurnCompletion() {
        this.startEnemyTurns();
        // @ts-ignore - transientGameState exists on game
        const transientState = this.game.transientGameState;
        if (transientState.isInPitfallZone()) {
            transientState.incrementPitfallTurnsSurvived();
        }
        return true;
    }

    /**
     * Start enemy turns and set up turn queue
     * @returns {void}
     */
    startEnemyTurns() {
        // @ts-ignore - transientGameState exists on game
        const transientState = this.game.transientGameState;
        // If the player just attacked and an attack has delay, enemy turns will
        // be started by the attack resolution elsewhere.
        if (transientState.didPlayerJustAttack()) return;

        // Check if player is on exit tile - if so, freeze all enemies
        const playerOnExit = this.game.isPlayerOnExitTile();

        const enemyCollection = /** @type {EnemyCollection} */ (this.game.enemyCollection);

        this.game.isPlayerTurn = false;
        this.occupiedTilesThisTurn.clear();
        this.initialEnemyTilesThisTurn = enemyCollection.getPositionsSet();

        const playerPos = this.game.player.getPosition();
        this.occupiedTilesThisTurn.add(`${playerPos.x},${playerPos.y}`);

        // Detect if player just stepped off exit tile
        if (this.wasPlayerOnExitLastTurn && !playerOnExit) {
            // Player just left the exit tile - set flag for 1-turn grace period
            this.game.justLeftExitTile = true;
        }

        // Set freeze state on all enemies based on player position
        // Enemies stay frozen for 1 turn after leaving exit tile
        const shouldFreeze = playerOnExit || this.game.justLeftExitTile;
        enemyCollection.forEach(enemy => {
            enemy.isFrozen = shouldFreeze;
            // Visual freeze effect is removed 1 turn earlier (only when on exit tile, not during grace period)
            enemy.showFrozenVisual = playerOnExit;
        });

        // Clear the grace period flag after it's been used for one turn
        if (this.game.justLeftExitTile && !playerOnExit) {
            this.game.justLeftExitTile = false;
        }

        // Update the tracking variable for next turn
        this.wasPlayerOnExitLastTurn = playerOnExit;

        this.turnQueue = enemyCollection.getAll();
        this.processTurnQueue();
    }

    /**
     * Process the turn queue recursively
     * Handles enemy movement and collision detection
     * @returns {void}
     */
    processTurnQueue() {
        if (this.turnQueue.length === 0) {
            this.game.isPlayerTurn = true;
            // @ts-ignore - playerJustAttacked exists on game
            this.game.playerJustAttacked = false;
            // After all enemy moves, run collision and pickup checks
            let playerWasAttacked = false;
            if (this.game.combatManager && typeof this.game.combatManager.checkCollisions === 'function') {
                playerWasAttacked = this.game.combatManager.checkCollisions();
            }
            if (this.game.interactionManager && typeof this.game.interactionManager.checkItemPickup === 'function') {
                this.game.interactionManager.checkItemPickup();
            }
            // Add a pause if player was attacked for dramatic effect
            if (playerWasAttacked) {
                // Use animation scheduler to actually pause the game
                // @ts-ignore - animationScheduler exists
                this.game.animationScheduler.createSequence()
                    .wait(500)
                    .start();
            }
            return;
        }

        const enemy = this.turnQueue.shift();
        const enemyCollection = /** @type {EnemyCollection} */ (this.game.enemyCollection);
        const isStillValid = enemy && !enemy.isDead() && enemyCollection.includes(enemy);

        // Frozen enemies process faster since they don't actually move
        const waitTime = (isStillValid && enemy.isFrozen) ? 50 : 400;

        // @ts-ignore - animationScheduler exists
        this.game.animationScheduler.createSequence()
            .then(() => {
                if (isStillValid && !enemy.isFrozen) {
                    // @ts-ignore - handleSingleEnemyMovement exists
                    this.game.combatManager.handleSingleEnemyMovement(enemy);
                }
            })
            .wait(waitTime)
            .then(() => this.processTurnQueue())
            .start();
    }
}
