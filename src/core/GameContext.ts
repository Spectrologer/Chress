import { GameWorld } from './GameWorld';
import { GameUI } from './GameUI';
import { GameAudio } from './GameAudio';
import { UI_TIMING_CONSTANTS } from './constants/ui';
import { ZoneGenerationState } from '@state/ZoneGenerationState';
import { storageAdapter, StorageAdapter } from '@state/StorageAdapter';
import type { Coordinates } from './PositionTypes';
import type { Grid } from './SharedTypes';
import type { ServiceContainer } from './ServiceContainer';
import type { AnimationManager } from './DataContracts';
import type { AnimationScheduler } from './AnimationScheduler';
import type { GameInitializer } from './GameInitializer';
import type { AssetLoader } from './AssetLoader';
import type { GridManager } from '@managers/GridManager';
import type { ZoneManager } from '@managers/ZoneManager';
import type { ZoneTransitionManager } from '@managers/ZoneTransitionManager';
import type { ZoneTransitionController } from '@controllers/ZoneTransitionController';
import type { CombatManager } from '@managers/CombatManager';
import type { InteractionManager } from '@managers/InteractionManager';
import type { ItemManager } from '@managers/ItemManager';
import type { InventoryService } from '@managers/inventory/InventoryService';
import type { ActionManager } from '@managers/ActionManager';
import type { TurnManager } from '@core/TurnManager';
import type { GameStateManager } from '@core/GameStateManager';
import type { InputManager } from '@managers/InputManager';
import type { RenderManager } from '@renderers/RenderManager';
import type { TextureManager } from '@renderers/TextureManager';
import type { ConnectionManager } from '@managers/ConnectionManager';
import type { ZoneGenerator } from '@core/ZoneGenerator';
import type { UIManager } from '@ui/UIManager';
import type { OverlayManager } from '@ui/OverlayManager';
import type { InventoryUI } from '@ui/InventoryUI';
import type { RadialInventoryUI } from '@ui/RadialInventoryUI';
import type { Player } from '@entities/Player';
import type { Enemy } from '@entities/Enemy';
import type { EnemyCollection } from '@facades/EnemyCollection';
import type { NPCManager } from '@managers/NPCManager';
import type { Treasure } from '@managers/ZoneManager';
import type { TransientGameState } from '@state/TransientGameState';
import type { PlayerFacade } from '@facades/PlayerFacade';
import type { BombManager } from '@managers/BombManager';
// import type { UICoordinator } from '@ui/UICoordinator'; // File doesn't exist
import type { MessageManager } from '@ui/MessageManager';
import type { PanelManager } from '@ui/PanelManager';
import type { PlayerStatsUI } from '@ui/PlayerStatsUI';
import type { DialogueManager } from '@ui/DialogueManager';
// import type { TurnFeedbackRenderer } from '@renderers/TurnFeedbackRenderer'; // File doesn't exist
import type { NPCInteractionManager } from '@managers/NPCInteractionManager';
import type { TerrainInteractionManager } from '@managers/TerrainInteractionManager';
import type { ItemRepository } from '@managers/inventory/ItemRepository';
import type { InventoryInteractionHandler } from '@managers/inventory/InventoryInteractionHandler';
import type { InventoryItem } from '@managers/inventory/ItemMetadata';
import type { SoundManager as ISoundManager } from '../types/game.js';

export interface Item {
    name?: string;
    type: string;
    uses?: number;
    [key: string]: unknown;
}

/**
 * Coordinates type used throughout the game
 */
export interface ICoordinates {
    x: number;
    y: number;
}

/**
 * Comprehensive Game interface that replaces all 29 duplicate definitions
 * This interface represents the complete game state and all managers
 */
export interface IGame {
    // Core subsystems
    world: GameWorld;
    ui: GameUI;
    audio: GameAudio;

    // State management
    zoneGenState: ZoneGenerationState;
    storageAdapter: StorageAdapter;
    transientGameState?: TransientGameState;
    displayingMessageForSign?: any;
    radialInventorySnapshot?: InventoryItem[];

    // Dynamic properties (used by GameStateManager)
    zoneRepository?: any; // ZoneRepository instance
    messageLog?: string[];
    dialogueState?: Map<string, any>;
    lastExitSide?: string | null;
    _newGameSpawnPosition?: Coordinates | null;
    pendingConfirmationAction?: string;
    pendingConfirmationData?: any;

    // Turn-based system state
    isPlayerTurn: boolean;
    justLeftExitTile: boolean;
    turnQueue: Enemy[];
    occupiedTilesThisTurn: Set<string>;
    initialEnemyTilesThisTurn: Set<string>;

    // Item usage modes
    shovelMode: boolean;
    activeShovel: Item | null;

    // Assets
    availableFoodAssets: string[];

    // Core entities and collections
    player: Player | null;
    enemies: Enemy[];
    enemyCollection: EnemyCollection | null;
    playerFacade?: PlayerFacade;
    Enemy: new (...args: unknown[]) => Enemy;

    // Grid and world data
    grid: Grid | null;
    zones: Map<string, any>;
    specialZones: Map<string, any>;
    defeatedEnemies: Set<string>;
    currentRegion: string | null;

    // Canvas contexts
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    mapCanvas: HTMLCanvasElement | null;
    mapCtx: CanvasRenderingContext2D | null;

    // Game state flags
    gameStarted: boolean;
    previewMode: boolean;
    playerDeathTimer: number | null;

    // Managers - Core
    gridManager: GridManager | null;
    textureManager: TextureManager | null;
    connectionManager: ConnectionManager | null;
    zoneGenerator: ZoneGenerator | null;
    inputManager: InputManager | null;
    renderManager: RenderManager | null;
    combatManager: CombatManager | null;
    interactionManager: InteractionManager | null;
    itemManager: ItemManager | null;
    inventoryService: InventoryService | null;
    zoneManager: ZoneManager | null;
    zoneTransitionManager: ZoneTransitionManager | null;
    zoneTransitionController: ZoneTransitionController | null;
    actionManager: ActionManager | null;
    turnManager: TurnManager | null;
    gameStateManager: GameStateManager | null;
    animationManager: AnimationManager | null;
    animationScheduler: AnimationScheduler | null;
    gameInitializer: GameInitializer | null;
    assetLoader: AssetLoader | null;
    npcManager: NPCManager | null;
    bombManager?: BombManager;
    npcInteractionManager?: NPCInteractionManager;
    terrainInteractionManager?: TerrainInteractionManager;
    itemRepository?: ItemRepository;
    inventoryInteractionHandler?: InventoryInteractionHandler;

    // UI Managers
    uiManager: UIManager | null;
    overlayManager: OverlayManager | null;
    inventoryUI: InventoryUI | null;
    radialInventoryUI: RadialInventoryUI | null;
    // uiCoordinator?: UICoordinator; // Type doesn't exist
    messageManager?: MessageManager;
    panelManager?: PanelManager;
    playerStatsUI?: PlayerStatsUI;
    dialogueManager?: DialogueManager;

    // Renderers
    // turnFeedbackRenderer?: TurnFeedbackRenderer; // Type doesn't exist

    // Audio
    soundManager: ISoundManager | null;
    consentManager: object | null;

    // Backward compatibility aliases
    itemService: InventoryService | null;
    inventoryManager: InventoryUI | null;
    _lastPlayerPos: ICoordinates | null;

    // Private/internal properties
    _services?: ServiceContainer | null;

    // Command methods
    exitShovelMode(): void;
    isPlayerOnExitTile(): boolean;
    handleTurnCompletion(): void;
    startEnemyTurns(): void;
    processTurnQueue(): void;
    render(): void;
    handleEnemyMovements(): void;
    checkCollisions(): boolean;
    checkPenneInteraction(): void;
    checkSquigInteraction(): void;
    checkItemPickup(): void;
    useMapNote(): void;
    interactWithNPC(foodType: string): void;
    addTreasureToInventory(): void;
    addBomb(): void;
    hideOverlayMessage(): void;
    showSignMessage(text: string, imageSrc?: string | null, name?: string | null, buttonText?: string | null, category?: string, portraitBackground?: string): void;
    updatePlayerPosition(): void;
    updatePlayerStats(): void;
    incrementBombActions(): void;
    performBishopSpearCharge(item: Item, targetX: number, targetY: number, enemy: Enemy, dx: number, dy: number): void;
    performHorseIconCharge(item: Item, targetX: number, targetY: number, enemy: Enemy, dx: number, dy: number): void;
    performBowShot(item: Item, targetX: number, targetY: number): void;
    explodeBomb(bx: number, by: number): void;
    transitionToZone(newZoneX: number, newZoneY: number, exitSide: string, exitX: number, exitY: number): void;
    generateZone(): void;
    spawnTreasuresOnGrid(treasures: Treasure[]): void;
    resetGame(): void;
    gameLoop(): void;
}

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
export class GameContext implements IGame {
    // Core subsystems
    world: GameWorld;
    ui: GameUI;
    audio: GameAudio;

    // State management (replaces ZoneStateManager static properties)
    zoneGenState: ZoneGenerationState;
    storageAdapter: StorageAdapter;

    // Dynamic properties (used by GameStateManager)
    zoneRepository?: any; // ZoneRepository instance
    messageLog?: string[];
    dialogueState?: Map<string, any>;
    lastExitSide?: string | null;
    _newGameSpawnPosition?: Coordinates | null;
    transientGameState?: any;

    // Turn-based system state
    isPlayerTurn: boolean;
    justLeftExitTile: boolean;

    // Item usage modes (shovel is not yet migrated to TransientGameState)
    shovelMode: boolean;
    activeShovel: Item | null;

    // Assets
    availableFoodAssets: string[];

    // Managers and services (set by ServiceContainer)
    textureManager: TextureManager | null;
    connectionManager: ConnectionManager | null;
    zoneGenerator: ZoneGenerator | null;
    inputManager: InputManager | null;
    renderManager: RenderManager | null;
    combatManager: CombatManager | null;
    interactionManager: InteractionManager | null;
    itemManager: ItemManager | null;
    inventoryService: InventoryService | null;
    zoneManager: ZoneManager | null;
    zoneTransitionManager: ZoneTransitionManager | null;
    zoneTransitionController: ZoneTransitionController | null;
    actionManager: ActionManager | null;
    turnManager: TurnManager | null;
    gameStateManager: GameStateManager | null;
    animationManager: AnimationManager | null;
    animationScheduler: AnimationScheduler | null;
    gameInitializer: GameInitializer | null;
    assetLoader: AssetLoader | null;

    // Backward compatibility aliases
    itemService: InventoryService | null;
    inventoryManager: InventoryUI | null;

    // Turn queue (backwards-compatible aliases)
    turnQueue: Enemy[];
    occupiedTilesThisTurn: Set<string>;
    initialEnemyTilesThisTurn: Set<string>;

    // Enemy class reference (constructor function)
    Enemy: new (...args: unknown[]) => Enemy;

    // Additional properties used in gameLoop
    _services: ServiceContainer | null;
    enemyCollection: EnemyCollection | null;
    npcManager: NPCManager | null;
    playerDeathTimer: number | null;
    playerFacade?: PlayerFacade;

    constructor() {
        // Core subsystems
        this.world = new GameWorld();
        this.ui = new GameUI();
        this.audio = new GameAudio();

        // State management (replaces ZoneStateManager static properties)
        this.zoneGenState = new ZoneGenerationState();
        this.storageAdapter = storageAdapter; // Singleton instance

        // Turn-based system state
        this.isPlayerTurn = true;
        this.justLeftExitTile = false;

        // Item usage modes (shovel is not yet migrated to TransientGameState)
        this.shovelMode = false;
        this.activeShovel = null;

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
        this.itemService = null;
        this.inventoryManager = null;

        // Turn queue (backwards-compatible aliases)
        this.turnQueue = [];
        this.occupiedTilesThisTurn = new Set();
        this.initialEnemyTilesThisTurn = new Set();

        // Enemy class reference
        this.Enemy = null;

        // Additional properties used in gameLoop
        this._services = null;
        this.enemyCollection = null;
        this.npcManager = null;
        this.playerDeathTimer = null;
    }

    // ========================================
    // Convenience getters for common access patterns
    // ========================================

    get player(): Player | null { return this.world.player; }
    set player(value: Player | null) { this.world.player = value; }

    get enemies(): Enemy[] { return this.world.enemies; }
    set enemies(value: Enemy[]) { this.world.enemies = value; }

    get grid(): Grid | null { return this.world.grid; }
    set grid(value: Grid | null) { this.world.grid = value; }

    // Lazy-load gridManager from ServiceContainer
    get gridManager(): GridManager | null {
        if (!this._services) return null;
        return this._services.get('gridManager');
    }

    get zones(): Map<string, any> { return this.world.zones; }
    set zones(value: Map<string, any>) { this.world.zones = value; }

    get specialZones(): Map<string, any> { return this.world.specialZones; }
    set specialZones(value: Map<string, any>) { this.world.specialZones = value; }

    get defeatedEnemies(): Set<string> { return this.world.defeatedEnemies; }
    set defeatedEnemies(value: Set<string>) { this.world.defeatedEnemies = value; }

    get currentRegion(): string | null { return this.world.currentRegion; }
    set currentRegion(value: string | null) { this.world.currentRegion = value; }

    get canvas(): HTMLCanvasElement | null { return this.ui.canvas; }
    set canvas(value: HTMLCanvasElement | null) {
        this.ui.canvas = value;
    }

    get ctx(): CanvasRenderingContext2D | null { return this.ui.ctx; }
    set ctx(value: CanvasRenderingContext2D | null) { this.ui.ctx = value; }

    get mapCanvas(): HTMLCanvasElement | null { return this.ui.mapCanvas; }
    set mapCanvas(value: HTMLCanvasElement | null) {
        this.ui.mapCanvas = value;
    }

    get mapCtx(): CanvasRenderingContext2D | null { return this.ui.mapCtx; }
    set mapCtx(value: CanvasRenderingContext2D | null) { this.ui.mapCtx = value; }

    get gameStarted(): boolean { return this.ui.gameStarted; }
    set gameStarted(value: boolean) { this.ui.gameStarted = value; }

    get previewMode(): boolean { return this.ui.previewMode; }
    set previewMode(value: boolean) { this.ui.previewMode = value; }

    get uiManager(): UIManager | null { return this.ui.uiManager; }
    set uiManager(value: UIManager | null) { this.ui.uiManager = value; }

    get overlayManager(): OverlayManager | null { return this.ui.overlayManager; }
    set overlayManager(value: OverlayManager | null) { this.ui.overlayManager = value; }

    get inventoryUI(): InventoryUI | null { return this.ui.inventoryUI; }
    set inventoryUI(value: InventoryUI | null) { this.ui.inventoryUI = value; }

    get radialInventoryUI(): RadialInventoryUI | null { return this.ui.radialInventoryUI; }
    set radialInventoryUI(value: RadialInventoryUI | null) { this.ui.radialInventoryUI = value; }

    // Backward compatibility alias
    get _lastPlayerPos(): Coordinates | null { return this.ui._lastPlayerPos; }
    set _lastPlayerPos(value: Coordinates | null) { this.ui._lastPlayerPos = value; }

    get soundManager(): ISoundManager | null { return this.audio.soundManager as ISoundManager | null; }
    set soundManager(value: ISoundManager | null) { this.audio.soundManager = value; }

    get consentManager(): object | null { return this.audio.consentManager; }
    set consentManager(value: object | null) { this.audio.consentManager = value; }

    // ========================================
    // Command methods for state changes
    // ========================================

    /**
     * Exit shovel mode - command pattern for state mutation
     */
    exitShovelMode(): void {
        this.shovelMode = false;
        this.activeShovel = null;
        this.hideOverlayMessage();
    }

    /**
     * Check if player is on an exit tile
     */
    isPlayerOnExitTile(): boolean {
        if (!this.player || !this.grid) return false;
        const pos = this.player.getPosition();
        const tile = this.grid[pos.y] && this.grid[pos.y][pos.x];
        const tileType = (tile && typeof tile === 'object' && 'type' in tile) ? tile.type : tile;
        return tileType === 3; // TILE_TYPES.EXIT = 3
    }

    // ========================================
    // Delegated methods for backward compatibility
    // ========================================

    handleTurnCompletion(): void {
        this.turnManager!.handleTurnCompletion();
    }

    startEnemyTurns(): void {
        this.turnManager!.startEnemyTurns();
    }

    processTurnQueue(): void {
        this.turnManager!.processTurnQueue();
    }

    render(): void {
        this.renderManager!.render();
    }

    handleEnemyMovements(): void {
        this.combatManager!.handleEnemyMovements();
    }

    checkCollisions(): boolean {
        return this.combatManager!.checkCollisions();
    }

    checkPenneInteraction(): void {
        this.interactionManager!.checkPenneInteraction();
    }

    checkSquigInteraction(): void {
        this.interactionManager!.checkSquigInteraction();
    }

    checkItemPickup(): void {
        this.interactionManager!.checkItemPickup();
    }

    useMapNote(): void {
        this.interactionManager!.useMapNote();
    }

    interactWithNPC(foodType: string): void {
        (this.interactionManager as any).interactWithNPC(foodType);
    }

    addTreasureToInventory(): void {
        this.gameStateManager!.addTreasureToInventory();
    }

    addBomb(): void {
        this.actionManager!.addBomb();
    }

    hideOverlayMessage(): void {
        this.uiManager!.hideOverlayMessage();
    }

    showSignMessage(text: string, imageSrc: string | null = null, name: string | null = null, buttonText: string | null = null, category: string = 'unknown', portraitBackground?: string): void {
        this.uiManager!.showSignMessage(text, imageSrc, name, buttonText, category, portraitBackground);
    }

    updatePlayerPosition(): void {
        this.uiManager!.updatePlayerPosition();
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

    updatePlayerStats(): void {
        // Emit event instead of calling directly
        (window as any).eventBus.emit((window as any).EventTypes.UI_UPDATE_STATS, {});
    }

    incrementBombActions(): void {
        this.actionManager!.incrementBombActions();
    }

    performBishopSpearCharge(item: InventoryItem, targetX: number, targetY: number, enemy: Enemy, dx: number, dy: number): void {
        this.actionManager!.performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy);
    }

    performHorseIconCharge(item: InventoryItem, targetX: number, targetY: number, enemy: Enemy, dx: number, dy: number): void {
        this.actionManager!.performHorseIconCharge(item, targetX, targetY, enemy, dx, dy);
    }

    performBowShot(item: InventoryItem, targetX: number, targetY: number): void {
        this.actionManager!.performBowShot(item, targetX, targetY);
    }

    explodeBomb(bx: number, by: number): void {
        this.actionManager!.explodeBomb(bx, by);
    }

    transitionToZone(newZoneX: number, newZoneY: number, exitSide: string, exitX: number, exitY: number): void {
        this.gameInitializer!.transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY);
    }

    generateZone(): void {
        this.zoneManager!.generateZone();
    }

    spawnTreasuresOnGrid(treasures: Treasure[]): void {
        this.zoneManager!.spawnTreasuresOnGrid(treasures);
    }

    resetGame(): void {
        this.gameInitializer!.resetGame();
    }

    /**
     * Main game loop - updates animations and processes turn queue
     */
    gameLoop(): void {
        // Update animations
        this.player!.updateAnimations();
        // Use enemyCollection to ensure we update the correct enemy array
        if (this.enemyCollection) {
            this.enemyCollection.forEach(enemy => enemy.updateAnimations());
        }

        // Update NPC animations
        if (this.npcManager) {
            this.npcManager.updateAnimations();
        }

        // Update centralized animation manager
        this.animationManager!.updateAnimations();

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
        // Remove dead enemies in place to avoid GC pressure
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.isDead() && enemy.deathAnimation === 0) {
                this.enemies.splice(i, 1);
            }
        }

        if (this.player!.isDead()) {
            // If player just died, start death animation timer and keep rendering
            if (!this.playerDeathTimer) {
                this.playerDeathTimer = UI_TIMING_CONSTANTS.PLAYER_DEATH_TIMER; // frames to show death animation (~1 second at 60fps)
            }

            this.playerDeathTimer--;

            // Show game over screen after death animation has played
            if (this.playerDeathTimer <= 0) {
                this.uiManager!.showGameOverScreen();
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
