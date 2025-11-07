/**
 * Game Context Core - Main GameContext class implementation
 * Split into smaller modules for better maintainability
 */

import { GameWorld } from '../GameWorld';
import { GameUI } from '../GameUI';
import { GameAudio } from '../GameAudio';
import { UI_TIMING_CONSTANTS } from '../constants/ui';
import { ZoneGenerationState } from '@state/ZoneGenerationState';
import { storageAdapter, StorageAdapter } from '@state/StorageAdapter';
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

// Import manager types
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
 * Combines all game subsystems into a unified context that can be passed to managers.
 * This replaces the sprawling Game class property bag with organized, cohesive modules.
 *
 * Note: The getters/setters from GameContextGetters are applied via mixin at the end of this file
 */
export class GameContext extends GameContextCommands implements IGame {
    // Properties provided by GameContextGetters mixin
    declare player: any;
    declare enemies: any[];
    declare grid: any;
    declare gridManager: any;
    declare zones: Map<string, any>;
    declare specialZones: Map<string, any>;
    declare defeatedEnemies: Set<string>;
    declare currentRegion: string | null;
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

    // Core subsystems
    world: GameWorld;
    ui: GameUI;
    audio: GameAudio;

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

    // Turn-based system state
    isPlayerTurn: boolean;
    justLeftExitTile: boolean;

    // Item usage modes
    shovelMode: boolean;
    activeShovel: Item | null;

    // Assets
    availableFoodAssets: string[];

    // Managers and services
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

    // Turn queue
    turnQueue: Enemy[];
    occupiedTilesThisTurn: Set<string>;
    initialEnemyTilesThisTurn: Set<string>;

    // Enemy class reference
    Enemy: new (...args: unknown[]) => Enemy;

    // Additional properties
    _services: ServiceContainer | null;
    enemyCollection: EnemyCollection | null;
    npcManager: NPCManager | null;
    playerDeathTimer: number | null;

    constructor() {
        super();

        // Core subsystems
        this.world = new GameWorld();
        this.ui = new GameUI();
        this.audio = new GameAudio();

        // State management
        this.zoneGenState = new ZoneGenerationState();
        this.storageAdapter = storageAdapter;

        // Turn-based system state
        this.isPlayerTurn = true;
        this.justLeftExitTile = false;

        // Item usage modes
        this.shovelMode = false;
        this.activeShovel = null;

        // Assets
        this.availableFoodAssets = [];

        // Managers and services
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

        // Turn queue
        this.turnQueue = [];
        this.occupiedTilesThisTurn = new Set();
        this.initialEnemyTilesThisTurn = new Set();

        // Enemy class reference
        this.Enemy = null!;

        // Additional properties
        this._services = null;
        this.enemyCollection = null;
        this.npcManager = null;
        this.playerDeathTimer = null;
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

        // Only process next turn if it's the player's turn
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
            // If player just died, start death animation timer
            if (!this.playerDeathTimer) {
                this.playerDeathTimer = UI_TIMING_CONSTANTS.PLAYER_DEATH_TIMER;
            }

            this.playerDeathTimer--;

            // Show game over screen after death animation has played
            if (this.playerDeathTimer <= 0) {
                this.uiManager!.showGameOverScreen();
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

// Apply getters mixin
Object.getOwnPropertyNames(GameContextGetters.prototype).forEach(name => {
    if (name !== 'constructor') {
        Object.defineProperty(GameContext.prototype, name,
            Object.getOwnPropertyDescriptor(GameContextGetters.prototype, name)!);
    }
});
