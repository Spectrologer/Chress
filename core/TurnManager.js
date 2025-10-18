export class TurnManager {
    constructor(game) {
        this.game = game;
        this.turnQueue = [];
        this.occupiedTilesThisTurn = new Set();
        this.initialEnemyTilesThisTurn = new Set();
    }

    startEnemyTurns() {
        // If the player just attacked and an attack has delay, enemy turns will
        // be started by the attack resolution elsewhere.
        if (this.game.playerJustAttacked) return;

        this.game.isPlayerTurn = false;
        this.occupiedTilesThisTurn.clear();
        this.initialEnemyTilesThisTurn = new Set((this.game.enemies || []).map(e => `${e.x},${e.y}`));

        const playerPos = this.game.player.getPosition();
        this.occupiedTilesThisTurn.add(`${playerPos.x},${playerPos.y}`);

        this.turnQueue = [...this.game.enemies];
        this.processTurnQueue();
    }

    processTurnQueue() {
        if (this.turnQueue.length === 0) {
            this.game.isPlayerTurn = true;
            this.game.playerJustAttacked = false;
            // After all enemy moves, run collision and pickup checks
            if (this.game.combatManager && typeof this.game.combatManager.checkCollisions === 'function') {
                this.game.combatManager.checkCollisions();
            }
            if (this.game.interactionManager && typeof this.game.interactionManager.checkItemPickup === 'function') {
                this.game.interactionManager.checkItemPickup();
            }
            return;
        }

        const enemy = this.turnQueue.shift();
        const isStillValid = enemy && !enemy.isDead() && this.game.enemies.includes(enemy);

        this.game.animationScheduler.createSequence()
            .then(() => {
                if (isStillValid) {
                    this.game.combatManager.handleSingleEnemyMovement(enemy);
                }
            })
            .wait(150)
            .then(() => this.processTurnQueue())
            .start();
    }
}
