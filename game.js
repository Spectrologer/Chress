import { GRID_SIZE, TILE_TYPES } from './constants.js';
import { GameInitializer } from './GameInitializer.js';
import { ActionManager } from './ActionManager.js';
import { TextureManager } from './TextureManager.js';
import { ConnectionManager } from './ConnectionManager.js';
import { ZoneGenerator } from './ZoneGenerator.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Sign } from './Sign.js';
import { InputManager } from './InputManager.js';
import { InventoryManager } from './InventoryManager.js';
import { UIManager } from './UIManager.js';
import { RenderManager } from './RenderManager.js';
import { CombatManager } from './CombatManager.js';
import { InteractionManager } from './InteractionManager.js';
import { ZoneManager } from './ZoneManager.js';
import { GameStateManager } from './GameStateManager.js';
import { SoundManager } from './SoundManager.js';

// Game state
class Game {
    constructor() {

        // Initialize new managers
        this.gameInitializer = new GameInitializer(this);
        this.actionManager = new ActionManager(this);

        // Initialize modules
        this.textureManager = new TextureManager();
        this.connectionManager = new ConnectionManager();
        this.zoneGenerator = new ZoneGenerator();
        this.player = new Player();
        this.inputManager = new InputManager(this);
        this.inventoryManager = new InventoryManager(this);
        this.uiManager = new UIManager(this);

        // Turn-based system state
        this.isPlayerTurn = true;
        this.turnQueue = [];
        this.occupiedTilesThisTurn = new Set();

        // Initialize additional managers
        this.renderManager = new RenderManager(this);
        this.combatManager = new CombatManager(this, this.occupiedTilesThisTurn);
        this.interactionManager = new InteractionManager(this, this.inputManager);
        this.zoneManager = new ZoneManager(this);
        this.gameStateManager = new GameStateManager(this);
        this.soundManager = new SoundManager();

        // Add references to managers for easier access
        this.Enemy = Enemy;

        // Initialize game state properties
        this.zones = new Map();
        this.specialZones = new Map();
        this.defeatedEnemies = new Set();
        this.availableFoodAssets = [];
        this.pendingCharge = null;

        // Load assets and start game
        this.gameInitializer.loadAssets();
    }

    startEnemyTurns() {
        this.isPlayerTurn = false;
        this.occupiedTilesThisTurn.clear();
        // Add player's position to occupied tiles to prevent enemies from moving there
        const playerPos = this.player.getPosition();
        this.occupiedTilesThisTurn.add(`${playerPos.x},${playerPos.y}`);

        this.turnQueue = [...this.enemies]; // Get a fresh copy of enemies for the turn
        this.processTurnQueue();
    }

    processTurnQueue() {
        if (this.turnQueue.length > 0) {
            const enemy = this.turnQueue.shift();
            if (enemy && !enemy.isDead()) {
                this.combatManager.handleSingleEnemyMovement(enemy);
            }

            // Wait for a short duration before processing the next enemy
            // This gives time for the animation to play out
            setTimeout(() => {
                this.processTurnQueue();
            }, 150); // 150ms delay between enemy moves
        } else {
            // All enemies have moved, it's the player's turn again
            this.isPlayerTurn = true;
            this.checkCollisions(); // Check for collisions after all moves are done
            this.checkItemPickup();
        }
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
    showSignMessage(message) {
        this.uiManager.showSignMessage(message);
    }

    updatePlayerPosition() {
        this.uiManager.updatePlayerPosition();
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

        // Update and filter point animations
        if (this.pointAnimations) {
            this.pointAnimations.forEach(anim => anim.frame--);
            this.pointAnimations = this.pointAnimations.filter(anim => anim.frame > 0);
        }

        // Update and filter horse charge animations
        this.horseChargeAnimations.forEach(anim => anim.frame--);
        this.horseChargeAnimations = this.horseChargeAnimations.filter(anim => anim.frame > 0);

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
window.addEventListener('load', () => {
    new Game();
    // Sentry verification: This will cause an intentional error to test the integration.
    myUndefinedFunction();
});
