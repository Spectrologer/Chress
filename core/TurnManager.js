export class TurnManager {
    constructor(game) {
        this.game = game;
        this.turnQueue = [];
        this.occupiedTilesThisTurn = new Set();
        this.initialEnemyTilesThisTurn = new Set();
    }

    startEnemyTurns() {
        // If the player just entered a zone, give them one free turn: skip enemy turns
        // and clear the one-time flag so enemies resume next turn.
        // Prefer an explicit numeric counter (justEnteredZoneCount) if present.
        if (typeof this.game.justEnteredZoneCount === 'number' && this.game.justEnteredZoneCount > 0) {
            this.game.justEnteredZoneCount = Math.max(0, this.game.justEnteredZoneCount - 1);
            if (this.game.justEnteredZoneCount === 0) {
                // Clear boolean flag for compatibility
                this.game.justEnteredZone = false;
                delete this.game.justEnteredZoneCount;
            }
            return;
        }

        // Fallback to boolean justEnteredZone for backward compatibility
        if (this.game.justEnteredZone) {
            this.game.justEnteredZone = false;
            return;
        }

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
