import { GRID_SIZE, TILE_TYPES } from './constants.js';
import { GameInitializer } from './GameInitializer.js'; // This is already here
import { ActionManager } from '../managers/ActionManager.js';
import { TextureManager } from '../renderers/TextureManager.js';
import { ConnectionManager } from '../managers/ConnectionManager.js';
import { ZoneGenerator } from './ZoneGenerator.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Sign } from '../ui/Sign.js';
import { InputManager } from '../managers/InputManager.js';
import { InventoryManager } from '../managers/InventoryManager.js';
import { UIManager } from '../ui/UIManager.js';
import { RenderManager } from '../renderers/RenderManager.js';
import { CombatManager } from '../managers/CombatManager.js';
import { InteractionManager } from '../managers/InteractionManager.js';
import { ItemManager } from '../managers/ItemManager.js';
import { ZoneManager } from '../managers/ZoneManager.js';
import { GameStateManager } from './GameStateManager.js';
import { SoundManager } from './SoundManager.js';
import { ConsentManager } from './ConsentManager.js';
import { AnimationScheduler } from './AnimationScheduler.js';

// Game state
class Game {
    constructor() {

        // Initialize modules
        this.textureManager = new TextureManager();
        this.connectionManager = new ConnectionManager();
        this.zoneGenerator = new ZoneGenerator();
        this.player = new Player();
        this.itemManager = new ItemManager(this);
        this.inputManager = new InputManager(this);
        this.inventoryManager = new InventoryManager(this);
        this.uiManager = new UIManager(this);

        // Initialize new managers
        this.actionManager = new ActionManager(this);
        this.consentManager = new ConsentManager(this);
        this.gameInitializer = new GameInitializer(this);

        // Assign managers to player
        this.player.itemManager = this.itemManager;

        // Turn-based system state
        this.isPlayerTurn = true;
        this.playerJustAttacked = false;

        // Initialize animation scheduler
        this.animationScheduler = new AnimationScheduler();

        // Perform consent check immediately on game load
        this.consentManager.initialize();
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
        this.arrowAnimations = [];

        // Load assets and start game
        this.gameInitializer.loadAssets();
    }

    startEnemyTurns() {
6        // If the player just attacked, and the attack has a delay (like a bow shot),
        // the enemy turn will be started by the attack's resolution (in setTimeout).
        // This prevents enemies from moving before the arrow hits.
        if (this.playerJustAttacked) return;

        this.isPlayerTurn = false;
        this.occupiedTilesThisTurn.clear();
        // Add player's position to occupied tiles to prevent enemies from moving there
        const playerPos = this.player.getPosition();
        this.occupiedTilesThisTurn.add(`${playerPos.x},${playerPos.y}`);

        this.turnQueue = [...this.enemies]; // Get a fresh copy of enemies for the turn
        this.processTurnQueue();
    }

    processTurnQueue() {
        if (this.turnQueue.length === 0) {
            // All enemies have moved, it's the player's turn again
            this.isPlayerTurn = true;
            this.playerJustAttacked = false; // Reset flag after enemy turns
            this.checkCollisions(); // Check for collisions after all moves are done
            this.checkItemPickup();
            return;
        }

        // Process next enemy in queue
        const enemy = this.turnQueue.shift();
        // Re-check if the enemy is still alive and in the game's main enemy list.
        // This is crucial because an enemy might have been defeated by a previous enemy's action
        // (e.g., a bomb explosion) during the same turn sequence.
        const isStillValid = enemy && !enemy.isDead() && this.enemies.includes(enemy);

        // Create animation sequence for enemy turn with 150ms delay
        this.animationScheduler.createSequence()
            .then(() => {
                if (isStillValid) {
                    this.combatManager.handleSingleEnemyMovement(enemy);
                }
            })
            .wait(150) // 150ms delay between enemy moves for animation
            .then(() => {
                // Recursively process remaining enemies
                this.processTurnQueue();
            })
            .start();
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
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
