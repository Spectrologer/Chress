import { GRID_SIZE, TILE_TYPES } from './constants.js';
import { ServiceContainer } from './ServiceContainer.js';
import { ECS, TileSystem, EnemySystem } from './ECS.js';
import { AnimationManager } from './DataContracts.js';
import { COMPONENT_TYPES } from './constants.js';

// Game state
class Game {
    constructor() {

        // Use ServiceContainer to centralize manager/service creation
        this._services = new ServiceContainer(this).createCoreServices();

        // Backwards-compatible aliases for older code/tests that access turn state
        // The TurnManager owns the canonical data.
        if (this.turnManager) {
            this.turnQueue = this.turnManager.turnQueue;
            this.occupiedTilesThisTurn = this.turnManager.occupiedTilesThisTurn;
            this.initialEnemyTilesThisTurn = this.turnManager.initialEnemyTilesThisTurn;
        }

        // Turn-based system state
        this.isPlayerTurn = true;
        this.playerJustAttacked = false;

        // Initialize ECS and systems
        this.ecs = new ECS();
        this.tileSystem = new TileSystem(this.ecs, GRID_SIZE, GRID_SIZE);
        this.enemySystem = new EnemySystem(this.ecs, this.tileSystem);
        this.animationManager = new AnimationManager();

        // Initialize animation scheduler
    // animationScheduler created by ServiceContainer (referenced via this.animationScheduler)

        // Perform consent check immediately on game load (created by ServiceContainer)
        if (this.consentManager && typeof this.consentManager.initialize === 'function') {
            this.consentManager.initialize();
        }
        this.turnQueue = [];
        this.occupiedTilesThisTurn = new Set();

    // Additional managers and references were created by ServiceContainer


        // Initialize game state properties (legacy support)
        this.zones = new Map();
        this.specialZones = new Map();
        this.defeatedEnemies = new Set();
        this.availableFoodAssets = [];
        this.pendingCharge = null;

        // Item usage modes
        this.shovelMode = false;
        this.activeShovel = null;
        this.portTransitionData = null; // Data for hole -> cistern transitions
        this.isInPitfallZone = false; // True if player is in a zone entered via pitfall
        this.pitfallTurnsSurvived = 0; // Turns survived in a pitfall zone

        // Load assets and start game
        this.gameInitializer.loadAssets();

        // Track last known player position so UI updates that don't move the player
        // don't accidentally close the radial inventory.
        try { this._lastPlayerPos = this.player ? { x: this.player.x, y: this.player.y } : null; } catch (e) { this._lastPlayerPos = null; }
    }

    startEnemyTurns() {
        return this.turnManager.startEnemyTurns();
    }

    processTurnQueue() {
        return this.turnManager.processTurnQueue();
    }
    
    render() {
        this.renderManager.render();
    }
    


    handleEnemyMovements() {
        this.combatManager.handleEnemyMovements();
    }

    checkCollisions() {
        this.combatManager.checkCollisions();
    }

    checkLionInteraction() {
        this.interactionManager.checkLionInteraction();
    }

    checkSquigInteraction() {
        this.interactionManager.checkSquigInteraction();
    }

    checkItemPickup() {
        this.interactionManager.checkItemPickup();
    }

    useMapNote() {
        this.interactionManager.useMapNote();
    }

    interactWithNPC(foodType) {
        this.interactionManager.interactWithNPC(foodType);
    }

    addTreasureToInventory() {
        this.gameStateManager.addTreasureToInventory();
    }

    // Console command to add bomb to inventory
    addBomb() {
        this.actionManager.addBomb();
    }

    // Proxy to UIManager
    hideOverlayMessage() {
        this.uiManager.hideOverlayMessage();
    }

    // Proxy to UIManager for sign messages
    showSignMessage(text, imageSrc = null, name = null) {
        this.uiManager.showSignMessage(text, imageSrc, name);
    }

    updatePlayerPosition() {
        this.uiManager.updatePlayerPosition();
        try {
            const cur = this.player ? { x: this.player.x, y: this.player.y } : null;
            const last = this._lastPlayerPos;
            const moved = !last || !cur || last.x !== cur.x || last.y !== cur.y;
            if (moved) {
                if (this.radialInventoryUI && this.radialInventoryUI.open) this.radialInventoryUI.close();
            }
            this._lastPlayerPos = cur;
        } catch (e) {}
    }

    updatePlayerStats() {
        this.uiManager.updatePlayerStats();
    }

    incrementBombActions() {
        this.actionManager.incrementBombActions();
    }

    performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy) {
        this.actionManager.performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy);
    }

    performHorseIconCharge(item, targetX, targetY, enemy, dx, dy) {
        this.actionManager.performHorseIconCharge(item, targetX, targetY, enemy, dx, dy);
    }

    performBowShot(item, targetX, targetY) {
        this.actionManager.performBowShot(item, targetX, targetY);
    }

    explodeBomb(bx, by) {
        this.actionManager.explodeBomb(bx, by);
    }

    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        this.gameInitializer.transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY);
    }

    generateZone() {
        this.zoneManager.generateZone();
    }

    spawnTreasuresOnGrid(treasures) {
        this.zoneManager.spawnTreasuresOnGrid(treasures);
    }

    resetGame() {
        this.gameInitializer.resetGame();
    }

    gameLoop() {
        // Update animations
        this.player.updateAnimations();
        this.enemies.forEach(enemy => enemy.updateAnimations());

        // Update centralized animation manager
        this.animationManager.updateAnimations();

        // Only process next turn if it's the player's turn.
        if (!this.isPlayerTurn && this.turnQueue.length === 0) {
             this.isPlayerTurn = true;
        }

        // Remove enemies whose death animation has finished
        this.enemies.forEach(enemy => {
            if (enemy.isDead() && enemy.deathAnimation === 0) {
                enemy.startDeathAnimation();
            }
        });
        this.enemies = this.enemies.filter(enemy => !enemy.isDead() || enemy.deathAnimation > 0);

        if (this.player.isDead()) {
            this.uiManager.showGameOverScreen();
            // Don't continue the game loop logic if dead, just wait for restart.
            // We still need to render to see the final state.
            this.render();
            return;
        }



        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}
    
// Initialize game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    // Debug: Press Q to spawn aguamelin at player position
    window.addEventListener('keydown', (e) => {
        if (e.key === 'q' || e.key === 'Q') {
            if (game && game.player && game.zoneManager && game.zoneManager.game && game.zoneManager.game.grid) {
                const { x, y } = game.player;
                const grid = game.zoneManager.game.grid;
                // Only place if floor
                if (grid[y][x] === TILE_TYPES.FLOOR || (typeof grid[y][x] === 'object' && grid[y][x].type === TILE_TYPES.FLOOR)) {
                    grid[y][x] = { type: TILE_TYPES.FOOD, foodType: 'food/aguamelin.png' };
                    if (game.render) game.render();
                }
            }
        }
    });
});
