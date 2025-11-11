/**
 * Game Context Core - Main GameContext class implementation
 * Refactored to use ManagerRegistry and domain facades instead of 30+ manager properties
 */

import { GameWorld } from '../GameWorld';
import { GameUI } from '../GameUI';
import { GameAudio } from '../GameAudio';
import { UI_TIMING_CONSTANTS } from '../constants/ui';
import { ZoneGenerationState } from '@state/ZoneGenerationState';
import { storageAdapter, StorageAdapter } from '@state/StorageAdapter';
import { ManagerRegistry } from './ManagerRegistry';
import { TurnState } from './TurnState';
import {
    CombatFacade,
    InventoryFacade,
    InteractionFacade,
    TurnsFacade,
    RenderFacade,
    ZoneFacade,
    ActionsFacade
} from './GameFacades';
import { GameContextGetters } from './GameContextGetters';
import { GameContextCommands } from './GameContextCommands';
import type { IGame, Item, ICoordinates } from './GameContextInterfaces';
import type { Coordinates } from '../PositionTypes';
import type { Enemy } from '@entities/Enemy';
import type { ServiceContainer } from '../ServiceContainer';
import type { EnemyCollection } from '@facades/EnemyCollection';
import type { NPCManager } from '@managers/NPCManager';
import type { InventoryService } from '@managers/inventory/InventoryService';
import type { InventoryUI } from '@ui/InventoryUI';

// Import manager types for backward compatibility getters
import type { TextureManager } from '@renderers/TextureManager';
import type { ConnectionManager } from '@managers/ConnectionManager';
import type { ZoneGenerator } from '@core/ZoneGenerator';
import type { InputManager } from '@managers/InputManager';
import type { RenderManager } from '@renderers/RenderManager';
import type { CombatManager } from '@managers/CombatManager';
import type { InteractionManager } from '@managers/InteractionManager';
import type { ItemManager } from '@managers/ItemManager';
import type { ZoneManager } from '@managers/ZoneManager';
import type { ZoneTransitionManager } from '@managers/ZoneTransitionManager';
import type { ZoneTransitionController } from '@controllers/ZoneTransitionController';
import type { ActionManager } from '@managers/ActionManager';
import type { TurnManager } from '@core/TurnManager';
import type { GameStateManager } from '@core/GameStateManager';
import type { AnimationManager } from '../DataContracts';
import type { AnimationScheduler } from '../AnimationScheduler';
import type { GameInitializer } from '../GameInitializer';
import type { AssetLoader } from '../AssetLoader';

/**
 * GameContext
 *
 * Refactored to use composition over property bag:
 * - ManagerRegistry for all managers (replaces 30+ nullable properties)
 * - TurnState for turn-based game state
 * - Domain facades for clean APIs (combat, inventory, etc.)
 * - Core subsystems (world, ui, audio) remain for data
 *
 * Note: Backward compatibility getters are applied via mixin at the end of this file
 */
export class GameContext extends GameContextCommands implements IGame {
    // Properties provided by GameContextGetters mixin
    declare player: any;
    declare enemies: any[];
    declare grid: any;
    declare gridManager: any;
    declare specialZones: Map<string, any>;
    declare defeatedEnemies: Set<string>;
    declare currentRegion: string | null;
    declare partnerCubes: Map<string, any>;
    declare cubeLinkages: Map<string, any>;
    declare canvas: HTMLCanvasElement | null;
    declare ctx: CanvasRenderingContext2D | null;
    declare mapCanvas: HTMLCanvasElement | null;
    declare mapCtx: CanvasRenderingContext2D | null;
    declare gameStarted: boolean;
    declare previewMode: boolean;
    declare uiManager: any;
    declare overlayManager: any;
    declare inventoryUI: any;
    declare radialInventoryUI: any;
    declare _lastPlayerPos: any;
    declare soundManager: any;
    declare consentManager: any;

    // Core subsystems (data containers)
    world: GameWorld;
    ui: GameUI;
    audio: GameAudio;

    // Manager registry (replaces 30+ manager properties)
    managers: ManagerRegistry;

    // Domain facades (clean API)
    combat: CombatFacade;
    inventory: InventoryFacade;
    interaction: InteractionFacade;
    turns: TurnsFacade;
    rendering: RenderFacade;
    zones: ZoneFacade;
    actions: ActionsFacade;

    // Turn-based state (focused object)
    turnState: TurnState;

    // State management
    zoneGenState: ZoneGenerationState;
    storageAdapter: StorageAdapter;

    // Dynamic properties
    zoneRepository?: any;
    messageLog?: string[];
    dialogueState?: Map<string, any>;
    lastExitSide?: string | null;
    _newGameSpawnPosition?: Coordinates | null;
    transientGameState?: any;
    playerFacade?: any;
    displayingMessageForSign?: any;
    _entranceAnimationInProgress?: boolean;

    // Item usage modes
    shovelMode: boolean;
    activeShovel: Item | null;

    // Assets
    availableFoodAssets: string[];

    // Enemy class reference
    Enemy: new (...args: unknown[]) => Enemy;

    // Additional properties
    _services: ServiceContainer | null;
    enemyCollection: EnemyCollection | null;
    npcManager: NPCManager | null;

    // Backward compatibility - delegate to managers registry
    get textureManager(): TextureManager | null { return this.managers.get('textureManager'); }
    set textureManager(value: TextureManager | null) { if (value) this.managers.register('textureManager', value); }

    get connectionManager(): ConnectionManager | null { return this.managers.get('connectionManager'); }
    set connectionManager(value: ConnectionManager | null) { if (value) this.managers.register('connectionManager', value); }

    get zoneGenerator(): ZoneGenerator | null { return this.managers.get('zoneGenerator'); }
    set zoneGenerator(value: ZoneGenerator | null) { if (value) this.managers.register('zoneGenerator', value); }

    get inputManager(): InputManager | null { return this.managers.get('inputManager'); }
    set inputManager(value: InputManager | null) { if (value) this.managers.register('inputManager', value); }

    get renderManager(): RenderManager | null { return this.managers.get('renderManager'); }
    set renderManager(value: RenderManager | null) { if (value) this.managers.register('renderManager', value); }

    get combatManager(): CombatManager | null { return this.managers.get('combatManager'); }
    set combatManager(value: CombatManager | null) { if (value) this.managers.register('combatManager', value); }

    get interactionManager(): InteractionManager | null { return this.managers.get('interactionManager'); }
    set interactionManager(value: InteractionManager | null) { if (value) this.managers.register('interactionManager', value); }

    get itemManager(): ItemManager | null { return this.managers.get('itemManager'); }
    set itemManager(value: ItemManager | null) { if (value) this.managers.register('itemManager', value); }

    get inventoryService(): InventoryService | null { return this.managers.get('inventoryService'); }
    set inventoryService(value: InventoryService | null) { if (value) this.managers.register('inventoryService', value); }

    get zoneManager(): ZoneManager | null { return this.managers.get('zoneManager'); }
    set zoneManager(value: ZoneManager | null) { if (value) this.managers.register('zoneManager', value); }

    get zoneTransitionManager(): ZoneTransitionManager | null { return this.managers.get('zoneTransitionManager'); }
    set zoneTransitionManager(value: ZoneTransitionManager | null) { if (value) this.managers.register('zoneTransitionManager', value); }

    get zoneTransitionController(): ZoneTransitionController | null { return this.managers.get('zoneTransitionController'); }
    set zoneTransitionController(value: ZoneTransitionController | null) { if (value) this.managers.register('zoneTransitionController', value); }

    get actionManager(): ActionManager | null { return this.managers.get('actionManager'); }
    set actionManager(value: ActionManager | null) { if (value) this.managers.register('actionManager', value); }

    get turnManager(): TurnManager | null { return this.managers.get('turnManager'); }
    set turnManager(value: TurnManager | null) { if (value) this.managers.register('turnManager', value); }

    get gameStateManager(): GameStateManager | null { return this.managers.get('gameStateManager'); }
    set gameStateManager(value: GameStateManager | null) { if (value) this.managers.register('gameStateManager', value); }

    get animationManager(): AnimationManager | null { return this.managers.get('animationManager'); }
    set animationManager(value: AnimationManager | null) { if (value) this.managers.register('animationManager', value); }

    get animationScheduler(): AnimationScheduler | null { return this.managers.get('animationScheduler'); }
    set animationScheduler(value: AnimationScheduler | null) { if (value) this.managers.register('animationScheduler', value); }

    get gameInitializer(): GameInitializer | null { return this.managers.get('gameInitializer'); }
    set gameInitializer(value: GameInitializer | null) { if (value) this.managers.register('gameInitializer', value); }

    get assetLoader(): AssetLoader | null { return this.managers.get('assetLoader'); }
    set assetLoader(value: AssetLoader | null) { if (value) this.managers.register('assetLoader', value); }

    // Additional backward compatibility aliases
    get itemService(): InventoryService | null { return this.inventoryService; }
    set itemService(value: InventoryService | null) { this.inventoryService = value; }

    get inventoryManager(): InventoryUI | null { return this.inventoryUI; }
    set inventoryManager(value: InventoryUI | null) { this.inventoryUI = value; }

    // Delegate turn state properties for backward compatibility
    get isPlayerTurn(): boolean { return this.turnState.isPlayerTurn; }
    set isPlayerTurn(value: boolean) { this.turnState.isPlayerTurn = value; }

    get justLeftExitTile(): boolean { return this.turnState.justLeftExitTile; }
    set justLeftExitTile(value: boolean) { this.turnState.justLeftExitTile = value; }

    get turnQueue(): Enemy[] { return this.turnState.turnQueue; }
    set turnQueue(value: Enemy[]) { this.turnState.turnQueue = value; }

    get occupiedTilesThisTurn(): Set<string> { return this.turnState.occupiedTilesThisTurn; }
    set occupiedTilesThisTurn(value: Set<string>) { this.turnState.occupiedTilesThisTurn = value; }

    get initialEnemyTilesThisTurn(): Set<string> { return this.turnState.initialEnemyTilesThisTurn; }
    set initialEnemyTilesThisTurn(value: Set<string>) { this.turnState.initialEnemyTilesThisTurn = value; }

    get playerDeathTimer(): number | null { return this.turnState.playerDeathTimer; }
    set playerDeathTimer(value: number | null) { this.turnState.playerDeathTimer = value; }

    constructor() {
        super();

        // Core subsystems (data containers)
        this.world = new GameWorld();
        this.ui = new GameUI();
        this.audio = new GameAudio();

        // Manager registry (replaces individual manager properties)
        this.managers = new ManagerRegistry();

        // Domain facades (clean API)
        this.combat = new CombatFacade(this.managers);
        this.inventory = new InventoryFacade(this.managers);
        this.interaction = new InteractionFacade(this.managers);
        this.turns = new TurnsFacade(this.managers);
        this.rendering = new RenderFacade(this.managers);
        this.zones = new ZoneFacade(this.managers);
        this.actions = new ActionsFacade(this.managers);

        // Turn-based state (focused object)
        this.turnState = new TurnState();

        // State management
        this.zoneGenState = new ZoneGenerationState();
        this.storageAdapter = storageAdapter;

        // Item usage modes
        this.shovelMode = false;
        this.activeShovel = null;

        // Game mode system
        this.gameMode = {
            currentMode: 'normal' as import('@core/GameMode').GameMode,
            chess: {
                selectedUnit: null,
                turnBased: true,
                showMoveIndicators: true,
                aiDelayMs: 500
            }
        };

        // Legacy chess mode (kept for backward compatibility)
        this.chessMode = false;
        this.selectedUnit = null;

        // Assets
        this.availableFoodAssets = [];

        // Enemy class reference
        this.Enemy = null!;

        // Additional properties
        this._services = null;
        this.enemyCollection = null;
        this.npcManager = null;
    }

    /**
     * Main game loop - updates animations and processes turn queue
     */
    gameLoop(): void {
        // Update animations
        this.player!.updateAnimations();

        if (this.enemyCollection) {
            this.enemyCollection.forEach(enemy => enemy.updateAnimations());
        }

        // Update NPC animations
        if (this.npcManager) {
            this.npcManager.updateAnimations();
        }

        // Update centralized animation manager
        this.animationManager!.updateAnimations();

        // REMOVED: TurnManager now handles re-enabling player turn after animations complete
        // This was causing isPlayerTurn to be set immediately when queue empties,
        // skipping the animation wait time in TurnManager.processTurnQueue()
        // if (!this.turnState.isPlayerTurn && this.turnState.isTurnQueueEmpty()) {
        //     this.turnState.startPlayerTurn();
        // }

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
            // If player just died, start death animation timer
            if (!this.turnState.playerDeathTimer) {
                this.turnState.playerDeathTimer = UI_TIMING_CONSTANTS.PLAYER_DEATH_TIMER;
            }

            this.turnState.playerDeathTimer--;

            // Show game over screen after death animation has played
            if (this.turnState.playerDeathTimer <= 0) {
                this.uiManager!.showGameOverScreen();
                this.render();
                return;
            }
        } else {
            // Reset death timer if player is alive
            this.turnState.playerDeathTimer = null;
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Apply getters mixin
Object.getOwnPropertyNames(GameContextGetters.prototype).forEach(name => {
    if (name !== 'constructor') {
        Object.defineProperty(GameContext.prototype, name,
            Object.getOwnPropertyDescriptor(GameContextGetters.prototype, name)!);
    }
});
