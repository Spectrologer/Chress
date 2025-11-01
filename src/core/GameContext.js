// @ts-check

import { GameWorld } from './GameWorld.js';
import { GameUI } from './GameUI.js';
import { GameAudio } from './GameAudio.js';
import { UI_TIMING_CONSTANTS } from './constants/ui.js';
import { ZoneGenerationState } from '../state/ZoneGenerationState.js';
import { storageAdapter } from '../state/StorageAdapter.js';

/**
 * @typedef {import('./ServiceContainer.js').ServiceContainer} ServiceContainer
 * @typedef {import('../state/StorageAdapter.js').StorageAdapter} StorageAdapter
 * @typedef {import('./DataContracts.js').AnimationManager} AnimationManager
 * @typedef {import('./AnimationScheduler.js').AnimationScheduler} AnimationScheduler
 * @typedef {import('./GameInitializer.js').GameInitializer} GameInitializer
 * @typedef {import('./AssetLoader.js').AssetLoader} AssetLoader
 * @typedef {import('../managers/GridManager.js').GridManager} GridManager
 * @typedef {import('../managers/ZoneManager.js').ZoneManager} ZoneManager
 * @typedef {import('../managers/ZoneTransitionManager.js').ZoneTransitionManager} ZoneTransitionManager
 * @typedef {import('../controllers/ZoneTransitionController.js').ZoneTransitionController} ZoneTransitionController
 * @typedef {import('../managers/CombatManager.js').CombatManager} CombatManager
 * @typedef {import('../managers/InteractionManager.js').InteractionManager} InteractionManager
 * @typedef {import('../managers/ItemManager.js').ItemManager} ItemManager
 * @typedef {import('../managers/inventory/InventoryService.js').InventoryService} InventoryService
 * @typedef {import('../managers/ActionManager.js').ActionManager} ActionManager
 * @typedef {import('../core/TurnManager.js').TurnManager} TurnManager
 * @typedef {import('../core/GameStateManager.js').GameStateManager} GameStateManager
 * @typedef {import('../managers/InputManager.js').InputManager} InputManager
 * @typedef {import('../renderers/RenderManager.js').RenderManager} RenderManager
 * @typedef {import('../renderers/TextureManager.js').TextureManager} TextureManager
 * @typedef {import('../managers/ConnectionManager.js').ConnectionManager} ConnectionManager
 * @typedef {import('../core/ZoneGenerator.js').ZoneGenerator} ZoneGenerator
 * @typedef {import('../ui/UIManager.js').UIManager} UIManager
 * @typedef {import('../ui/OverlayManager.js').OverlayManager} OverlayManager
 * @typedef {import('../ui/InventoryUI.js').InventoryUI} InventoryUI
 * @typedef {import('../ui/RadialInventoryUI.js').RadialInventoryUI} RadialInventoryUI
 * @typedef {import('../entities/Player.js').Player} Player
 * @typedef {import('../entities/Enemy.js').Enemy} Enemy
 * @typedef {import('../facades/EnemyCollection.js').EnemyCollection} EnemyCollection
 * @typedef {import('../managers/NPCManager.js').NPCManager} NPCManager
 *
 * @typedef {Object} Item
 * @property {string} name
 * @property {string} type
 * @property {number} [uses]
 */

/**
 * GameContext
 *
 * Combines all game subsystems into a unified context that can be passed to managers.
 * This replaces the sprawling Game class property bag with organized, cohesive modules.
 *
 * Structure:
 * - world: Grid, zones, entities (GameWorld)
 * - ui: UI managers, canvas contexts (GameUI)
 * - audio: Sound and consent managers (GameAudio)
 * - Plus all managers and services (set by ServiceContainer)
 */
export class GameContext {
    constructor() {
        // Core subsystems
        /** @type {GameWorld} */
        this.world = new GameWorld();

        /** @type {GameUI} */
        this.ui = new GameUI();

        /** @type {GameAudio} */
        this.audio = new GameAudio();

        // State management (replaces ZoneStateManager static properties)
        /** @type {import('../state/ZoneGenerationState.js').ZoneGenerationState} */
        this.zoneGenState = new ZoneGenerationState();

        /** @type {StorageAdapter} */
        this.storageAdapter = storageAdapter; // Singleton instance

        // Turn-based system state
        /** @type {boolean} */
        this.isPlayerTurn = true;

        /** @type {boolean} Track if player just stepped off exit tile */
        this.justLeftExitTile = false;

        // Item usage modes (shovel is not yet migrated to TransientGameState)
        /** @type {boolean} */
        this.shovelMode = false;

        /** @type {Item | null} */
        this.activeShovel = null;

        // Assets
        /** @type {string[]} */
        this.availableFoodAssets = [];

        // Managers and services (set by ServiceContainer)
        /** @type {TextureManager | null} */
        this.textureManager = null;

        /** @type {ConnectionManager | null} */
        this.connectionManager = null;

        /** @type {ZoneGenerator | null} */
        this.zoneGenerator = null;

        /** @type {InputManager | null} */
        this.inputManager = null;

        /** @type {RenderManager | null} */
        this.renderManager = null;

        /** @type {CombatManager | null} */
        this.combatManager = null;

        /** @type {InteractionManager | null} */
        this.interactionManager = null;

        /** @type {ItemManager | null} */
        this.itemManager = null;

        /** @type {InventoryService | null} */
        this.inventoryService = null;

        /** @type {ZoneManager | null} */
        this.zoneManager = null;

        /** @type {ZoneTransitionManager | null} */
        this.zoneTransitionManager = null;

        /** @type {ZoneTransitionController | null} */
        this.zoneTransitionController = null;

        /** @type {ActionManager | null} */
        this.actionManager = null;

        /** @type {TurnManager | null} */
        this.turnManager = null;

        /** @type {GameStateManager | null} */
        this.gameStateManager = null;

        /** @type {AnimationManager | null} */
        this.animationManager = null;

        /** @type {AnimationScheduler | null} */
        this.animationScheduler = null;

        /** @type {GameInitializer | null} */
        this.gameInitializer = null;

        /** @type {AssetLoader | null} */
        this.assetLoader = null;

        // Backward compatibility aliases
        /** @type {InventoryService | null} -> inventoryService */
        this.itemService = null;

        /** @type {InventoryUI | null} -> inventoryUI */
        this.inventoryManager = null;

        // Turn queue (backwards-compatible aliases)
        /** @type {Enemy[]} */
        this.turnQueue = [];

        /** @type {Set<string>} */
        this.occupiedTilesThisTurn = new Set();

        /** @type {Set<string>} */
        this.initialEnemyTilesThisTurn = new Set();

        // Enemy class reference
        /** @type {any} */
        this.Enemy = null;

        // Additional properties used in gameLoop
        /** @type {ServiceContainer | null} */
        this._services = null;

        /** @type {EnemyCollection | null} */
        this.enemyCollection = null;

        /** @type {NPCManager | null} */
        this.npcManager = null;

        /** @type {number | null} */
        this.playerDeathTimer = null;
    }

    // ========================================
    // Convenience getters for common access patterns
    // ========================================

    /** @returns {Player | null} */
    get player() { return this.world.player; }
    /** @param {Player | null} value */
    set player(value) { this.world.player = value; }

    /** @returns {Enemy[]} */
    get enemies() { return this.world.enemies; }
    /** @param {Enemy[]} value */
    set enemies(value) { this.world.enemies = value; }

    /** @returns {any[][] | null} */
    get grid() { return this.world.grid; }
    /** @param {any[][] | null} value */
    set grid(value) { this.world.grid = value; }

    // Lazy-load gridManager from ServiceContainer
    /** @returns {GridManager | null} */
    get gridManager() {
        if (!this._services) return null;
        return this._services.get('gridManager');
    }

    /** @returns {Map<string, any>} */
    get zones() { return this.world.zones; }
    /** @param {Map<string, any>} value */
    set zones(value) { this.world.zones = value; }

    /** @returns {Map<string, any>} */
    get specialZones() { return this.world.specialZones; }
    /** @param {Map<string, any>} value */
    set specialZones(value) { this.world.specialZones = value; }

    /** @returns {Set<string>} */
    get defeatedEnemies() { return this.world.defeatedEnemies; }
    /** @param {Set<string>} value */
    set defeatedEnemies(value) { this.world.defeatedEnemies = value; }

    /** @returns {string | null} */
    get currentRegion() { return this.world.currentRegion; }
    /** @param {string | null} value */
    set currentRegion(value) { this.world.currentRegion = value; }

    /** @returns {HTMLCanvasElement | null} */
    get canvas() { return this.ui.canvas; }
    /**
     * @param {HTMLCanvasElement | null} value
     */
    set canvas(value) {
        // @ts-ignore - Canvas may be null or HTMLElement during initialization
        this.ui.canvas = value;
    }

    /** @returns {CanvasRenderingContext2D | null} */
    get ctx() { return this.ui.ctx; }
    /** @param {CanvasRenderingContext2D | null} value */
    set ctx(value) { this.ui.ctx = value; }

    /** @returns {HTMLCanvasElement | null} */
    get mapCanvas() { return this.ui.mapCanvas; }
    /**
     * @param {HTMLCanvasElement | null} value
     */
    set mapCanvas(value) {
        // @ts-ignore - Canvas may be null or HTMLElement during initialization
        this.ui.mapCanvas = value;
    }

    /** @returns {CanvasRenderingContext2D | null} */
    get mapCtx() { return this.ui.mapCtx; }
    /** @param {CanvasRenderingContext2D | null} value */
    set mapCtx(value) { this.ui.mapCtx = value; }

    /** @returns {boolean} */
    get gameStarted() { return this.ui.gameStarted; }
    /** @param {boolean} value */
    set gameStarted(value) { this.ui.gameStarted = value; }

    /** @returns {boolean} */
    get previewMode() { return this.ui.previewMode; }
    /** @param {boolean} value */
    set previewMode(value) { this.ui.previewMode = value; }

    /** @returns {UIManager | null} */
    get uiManager() { return this.ui.uiManager; }
    /** @param {UIManager | null} value */
    set uiManager(value) { this.ui.uiManager = value; }

    /** @returns {OverlayManager | null} */
    get overlayManager() { return this.ui.overlayManager; }
    /** @param {OverlayManager | null} value */
    set overlayManager(value) { this.ui.overlayManager = value; }

    /** @returns {InventoryUI | null} */
    get inventoryUI() { return this.ui.inventoryUI; }
    /** @param {InventoryUI | null} value */
    set inventoryUI(value) { this.ui.inventoryUI = value; }

    /** @returns {RadialInventoryUI | null} */
    get radialInventoryUI() { return this.ui.radialInventoryUI; }
    /** @param {RadialInventoryUI | null} value */
    set radialInventoryUI(value) { this.ui.radialInventoryUI = value; }

    // Backward compatibility aliases
    /** @returns {InventoryUI | null} */
    get inventoryManager() { return this.ui.inventoryUI; }
    /** @param {InventoryUI | null} value */
    set inventoryManager(value) { this.ui.inventoryUI = value; }

    /** @returns {InventoryService | null} */
    get itemService() { return this.inventoryService; }
    /** @param {InventoryService | null} value */
    set itemService(value) { this.inventoryService = value; }

    /** @returns {{x: number, y: number} | null} */
    get _lastPlayerPos() { return this.ui._lastPlayerPos; }
    /** @param {{x: number, y: number} | null} value */
    set _lastPlayerPos(value) { this.ui._lastPlayerPos = value; }

    /** @returns {any} */
    get soundManager() { return this.audio.soundManager; }
    /** @param {any} value */
    set soundManager(value) { this.audio.soundManager = value; }

    /** @returns {any} */
    get consentManager() { return this.audio.consentManager; }
    /** @param {any} value */
    set consentManager(value) { this.audio.consentManager = value; }

    // ========================================
    // Command methods for state changes
    // ========================================

    /**
     * Exit shovel mode - command pattern for state mutation
     * @returns {void}
     */
    exitShovelMode() {
        this.shovelMode = false;
        this.activeShovel = null;
        this.hideOverlayMessage();
    }

    /**
     * Check if player is on an exit tile
     * @returns {boolean} True if player is on an exit tile
     */
    isPlayerOnExitTile() {
        if (!this.player || !this.grid) return false;
        const pos = this.player.getPosition();
        const tile = this.grid[pos.y] && this.grid[pos.y][pos.x];
        const tileType = tile && tile.type ? tile.type : tile;
        return tileType === 3; // TILE_TYPES.EXIT = 3
    }

    // ========================================
    // Delegated methods for backward compatibility
    // ========================================

    /**
     * @returns {void}
     */
    handleTurnCompletion() {
        // @ts-ignore - Delegate to turnManager
        return this.turnManager.handleTurnCompletion();
    }

    /**
     * @returns {void}
     */
    startEnemyTurns() {
        return this.turnManager.startEnemyTurns();
    }

    /**
     * @returns {void}
     */
    processTurnQueue() {
        return this.turnManager.processTurnQueue();
    }

    /**
     * @returns {void}
     */
    render() {
        this.renderManager.render();
    }

    /**
     * @returns {void}
     */
    handleEnemyMovements() {
        this.combatManager.handleEnemyMovements();
    }

    /**
     * @returns {void}
     */
    checkCollisions() {
        this.combatManager.checkCollisions();
    }

    /**
     * @returns {void}
     */
    checkPenneInteraction() {
        this.interactionManager.checkPenneInteraction();
    }

    /**
     * @returns {void}
     */
    checkSquigInteraction() {
        this.interactionManager.checkSquigInteraction();
    }

    /**
     * @returns {void}
     */
    checkItemPickup() {
        this.interactionManager.checkItemPickup();
    }

    /**
     * @returns {void}
     */
    useMapNote() {
        this.interactionManager.useMapNote();
    }

    /**
     * @param {string} foodType
     * @returns {void}
     */
    interactWithNPC(foodType) {
        // @ts-ignore - Method exists on InteractionManager
        this.interactionManager.interactWithNPC(foodType);
    }

    /**
     * @returns {void}
     */
    addTreasureToInventory() {
        this.gameStateManager.addTreasureToInventory();
    }

    /**
     * @returns {void}
     */
    addBomb() {
        this.actionManager.addBomb();
    }

    /**
     * @returns {void}
     */
    hideOverlayMessage() {
        this.uiManager.hideOverlayMessage();
    }

    /**
     * @param {string} text
     * @param {string | null} [imageSrc]
     * @param {string | null} [name]
     * @param {string | null} [buttonText]
     * @returns {void}
     */
    showSignMessage(text, imageSrc = null, name = null, buttonText = null) {
        this.uiManager.showSignMessage(text, imageSrc, name, buttonText);
    }

    /**
     * @returns {void}
     */
    updatePlayerPosition() {
        this.uiManager.updatePlayerPosition();
        try {
            const moved = this.ui.hasPlayerMoved(this.player);
            if (moved) {
                if (this.radialInventoryUI && this.radialInventoryUI.open) {
                    this.radialInventoryUI.close();
                }
            }
            this.ui.updateLastPlayerPosition(this.player);
        } catch (e) {}
    }

    /**
     * @returns {void}
     */
    updatePlayerStats() {
        // Emit event instead of calling directly
        // @ts-ignore - eventBus is globally available
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * @returns {void}
     */
    incrementBombActions() {
        this.actionManager.incrementBombActions();
    }

    /**
     * @param {Item} item
     * @param {number} targetX
     * @param {number} targetY
     * @param {any} enemy
     * @param {number} dx
     * @param {number} dy
     * @returns {void}
     */
    performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy) {
        this.actionManager.performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy);
    }

    /**
     * @param {Item} item
     * @param {number} targetX
     * @param {number} targetY
     * @param {any} enemy
     * @param {number} dx
     * @param {number} dy
     * @returns {void}
     */
    performHorseIconCharge(item, targetX, targetY, enemy, dx, dy) {
        this.actionManager.performHorseIconCharge(item, targetX, targetY, enemy, dx, dy);
    }

    /**
     * @param {Item} item
     * @param {number} targetX
     * @param {number} targetY
     * @returns {void}
     */
    performBowShot(item, targetX, targetY) {
        this.actionManager.performBowShot(item, targetX, targetY);
    }

    /**
     * @param {number} bx
     * @param {number} by
     * @returns {void}
     */
    explodeBomb(bx, by) {
        this.actionManager.explodeBomb(bx, by);
    }

    /**
     * @param {number} newZoneX
     * @param {number} newZoneY
     * @param {string} exitSide
     * @param {number} exitX
     * @param {number} exitY
     * @returns {void}
     */
    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        this.gameInitializer.transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY);
    }

    /**
     * @returns {void}
     */
    generateZone() {
        this.zoneManager.generateZone();
    }

    /**
     * @param {any[]} treasures
     * @returns {void}
     */
    spawnTreasuresOnGrid(treasures) {
        this.zoneManager.spawnTreasuresOnGrid(treasures);
    }

    /**
     * @returns {void}
     */
    resetGame() {
        this.gameInitializer.resetGame();
    }

    /**
     * Main game loop - updates animations and processes turn queue
     * @returns {void}
     */
    gameLoop() {
        // Update animations
        this.player.updateAnimations();
        // Use enemyCollection to ensure we update the correct enemy array
        if (this.enemyCollection) {
            this.enemyCollection.forEach(enemy => enemy.updateAnimations());
        }

        // Update NPC animations
        if (this.npcManager) {
            this.npcManager.updateAnimations();
        }

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
            // If player just died, start death animation timer and keep rendering
            if (!this.playerDeathTimer) {
                this.playerDeathTimer = UI_TIMING_CONSTANTS.PLAYER_DEATH_TIMER; // frames to show death animation (~1 second at 60fps)
            }

            this.playerDeathTimer--;

            // Show game over screen after death animation has played
            if (this.playerDeathTimer <= 0) {
                this.uiManager.showGameOverScreen();
                // Don't continue the game loop logic if dead, just wait for restart.
                // We still need to render to see the final state.
                this.render();
                return;
            }
        } else {
            // Reset death timer if player is alive
            this.playerDeathTimer = null;
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}
