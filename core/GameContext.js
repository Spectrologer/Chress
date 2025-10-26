import { GameWorld } from './GameWorld.js';
import { GameUI } from './GameUI.js';
import { GameAudio } from './GameAudio.js';

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
        this.world = new GameWorld();
        this.ui = new GameUI();
        this.audio = new GameAudio();

        // Turn-based system state
        this.isPlayerTurn = true;
        this.playerJustAttacked = false;
        this.justLeftExitTile = false; // Track if player just stepped off exit tile

        // Item usage modes
        this.shovelMode = false;
        this.activeShovel = null;
        this.bombPlacementMode = false;
        this.bombPlacementPositions = [];
        this.pendingCharge = null;

        // Assets
        this.availableFoodAssets = [];

        // Managers and services (set by ServiceContainer)
        this.textureManager = null;
        this.connectionManager = null;
        this.zoneGenerator = null;
        this.inputManager = null;
        this.renderManager = null;
        this.combatManager = null;
        this.interactionManager = null;
        this.itemManager = null;
        this.inventoryService = null;
        this.zoneManager = null;
        this.zoneTransitionManager = null;
        this.zoneTransitionController = null;
        this.actionManager = null;
        this.turnManager = null;
        this.gameStateManager = null;
        this.animationManager = null;
        this.animationScheduler = null;
        this.gameInitializer = null;
        this.assetLoader = null;

        // Backward compatibility aliases
        this.itemService = null; // -> inventoryService
        this.inventoryManager = null; // -> inventoryUI

        // Turn queue (backwards-compatible aliases)
        this.turnQueue = [];
        this.occupiedTilesThisTurn = new Set();
        this.initialEnemyTilesThisTurn = new Set();

        // Enemy class reference
        this.Enemy = null;
    }

    // ========================================
    // Convenience getters for common access patterns
    // ========================================

    get player() { return this.world.player; }
    set player(value) { this.world.player = value; }

    get enemies() { return this.world.enemies; }
    set enemies(value) { this.world.enemies = value; }

    get grid() { return this.world.grid; }
    set grid(value) { this.world.grid = value; }

    get zones() { return this.world.zones; }
    set zones(value) { this.world.zones = value; }

    get specialZones() { return this.world.specialZones; }
    set specialZones(value) { this.world.specialZones = value; }

    get defeatedEnemies() { return this.world.defeatedEnemies; }
    set defeatedEnemies(value) { this.world.defeatedEnemies = value; }

    get currentRegion() { return this.world.currentRegion; }
    set currentRegion(value) { this.world.currentRegion = value; }

    get isInPitfallZone() { return this.world.isInPitfallZone; }
    set isInPitfallZone(value) { this.world.isInPitfallZone = value; }

    get pitfallTurnsSurvived() { return this.world.pitfallTurnsSurvived; }
    set pitfallTurnsSurvived(value) { this.world.pitfallTurnsSurvived = value; }

    get portTransitionData() { return this.world.portTransitionData; }
    set portTransitionData(value) { this.world.portTransitionData = value; }

    get canvas() { return this.ui.canvas; }
    set canvas(value) { this.ui.canvas = value; }

    get ctx() { return this.ui.ctx; }
    set ctx(value) { this.ui.ctx = value; }

    get mapCanvas() { return this.ui.mapCanvas; }
    set mapCanvas(value) { this.ui.mapCanvas = value; }

    get mapCtx() { return this.ui.mapCtx; }
    set mapCtx(value) { this.ui.mapCtx = value; }

    get gameStarted() { return this.ui.gameStarted; }
    set gameStarted(value) { this.ui.gameStarted = value; }

    get previewMode() { return this.ui.previewMode; }
    set previewMode(value) { this.ui.previewMode = value; }

    get uiManager() { return this.ui.uiManager; }
    set uiManager(value) { this.ui.uiManager = value; }

    get overlayManager() { return this.ui.overlayManager; }
    set overlayManager(value) { this.ui.overlayManager = value; }

    get inventoryUI() { return this.ui.inventoryUI; }
    set inventoryUI(value) { this.ui.inventoryUI = value; }

    get radialInventoryUI() { return this.ui.radialInventoryUI; }
    set radialInventoryUI(value) { this.ui.radialInventoryUI = value; }

    get _lastPlayerPos() { return this.ui._lastPlayerPos; }
    set _lastPlayerPos(value) { this.ui._lastPlayerPos = value; }

    get soundManager() { return this.audio.soundManager; }
    set soundManager(value) { this.audio.soundManager = value; }

    get consentManager() { return this.audio.consentManager; }
    set consentManager(value) { this.audio.consentManager = value; }

    // ========================================
    // Command methods for state changes
    // ========================================

    /**
     * Exit shovel mode - command pattern for state mutation
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

    handleTurnCompletion() {
        return this.turnManager.handleTurnCompletion();
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

    checkPenneInteraction() {
        this.interactionManager.checkPenneInteraction();
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

    addBomb() {
        this.actionManager.addBomb();
    }

    hideOverlayMessage() {
        this.uiManager.hideOverlayMessage();
    }

    showSignMessage(text, imageSrc = null, name = null, buttonText = null) {
        this.uiManager.showSignMessage(text, imageSrc, name, buttonText);
    }

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

    updatePlayerStats() {
        // Emit event instead of calling directly
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
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
            // If player just died, start death animation timer and keep rendering
            if (!this.playerDeathTimer) {
                this.playerDeathTimer = 60; // frames to show death animation (~1 second at 60fps)
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
