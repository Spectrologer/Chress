export class TurnManager {
    constructor(game) {
        this.game = game;
        this.turnQueue = [];
        this.occupiedTilesThisTurn = new Set();
        this.initialEnemyTilesThisTurn = new Set();
        this.wasPlayerOnExitLastTurn = false; // Track player's previous exit tile state
    }

    /**
     * Handle turn completion after player action
     * Manages pitfall tracking
     * @returns {boolean} True if enemy turns were started
     */
    handleTurnCompletion() {
        this.startEnemyTurns();
        const transientState = this.game.transientGameState;
        if (transientState.isInPitfallZone()) {
            transientState.incrementPitfallTurnsSurvived();
        }
        return true;
    }

    startEnemyTurns() {
        const transientState = this.game.transientGameState;
        // If the player just attacked and an attack has delay, enemy turns will
        // be started by the attack resolution elsewhere.
        if (transientState.didPlayerJustAttack()) return;

        // Check if player is on exit tile - if so, freeze all enemies
        const playerOnExit = this.game.isPlayerOnExitTile();

        const enemyCollection = this.game.enemyCollection;

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

    processTurnQueue() {
        if (this.turnQueue.length === 0) {
            this.game.isPlayerTurn = true;
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
                this.game.animationScheduler.createSequence()
                    .wait(500)
                    .start();
            }
            return;
        }

        const enemy = this.turnQueue.shift();
        const enemyCollection = this.game.enemyCollection;
        const isStillValid = enemy && !enemy.isDead() && enemyCollection.includes(enemy);

        // Frozen enemies process faster since they don't actually move
        const waitTime = (isStillValid && enemy.isFrozen) ? 50 : 400;

        this.game.animationScheduler.createSequence()
            .then(() => {
                if (isStillValid && !enemy.isFrozen) {
                    this.game.combatManager.handleSingleEnemyMovement(enemy);
                }
            })
            .wait(waitTime)
            .then(() => this.processTurnQueue())
            .start();
    }
}
