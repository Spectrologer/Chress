import { TextureManager } from '@renderers/TextureManager';
import { ConnectionManager } from '@managers/ConnectionManager';
import { ZoneGenerator } from './ZoneGenerator';
import { Player } from '@entities/Player';
import { Enemy } from '@entities/Enemy';
import { InputManager } from '@managers/InputManager';
import { UIManager } from '@ui/UIManager';
import { RenderManager } from '@renderers/RenderManager';
import { CombatManager } from '@managers/CombatManager';
import { InteractionManager } from '@managers/InteractionManager';
import { ItemManager } from '@managers/ItemManager';
import { InventoryService } from '@managers/inventory/InventoryService';
import { InventoryInteractionHandler } from '@managers/inventory/InventoryInteractionHandler';
import { ZoneManager } from '@managers/ZoneManager';
import { ZoneTransitionManager } from '@managers/ZoneTransitionManager';
import { ActionManager } from '@managers/ActionManager';
import { TurnManager } from './TurnManager';
import { InventoryUI } from '@ui/InventoryUI';
import { RadialInventoryUI } from '@ui/RadialInventoryUI';
import { loadRadialInventory } from '@managers/RadialPersistence';
import { GameStateManager } from './GameStateManager';
import { SoundManager } from './SoundManager';
import { ConsentManager } from './ConsentManager';
import { AnimationScheduler } from './AnimationScheduler';
import { GameInitializer } from './GameInitializer';
import { AssetLoader } from './AssetLoader';
import { OverlayManager } from '@ui/OverlayManager';
import { ZoneTransitionController } from '@controllers/ZoneTransitionController';
import { GlobalErrorHandler } from './GlobalErrorHandler';
import { NPCInteractionManager } from '@managers/NPCInteractionManager';
import { ItemPickupManager } from '@managers/inventory/ItemPickupManager';
import { CombatActionManager } from '@managers/CombatActionManager';
import { BombManager } from '@managers/BombManager';
import { TerrainInteractionManager } from '@managers/TerrainInteractionManager';
import { EnvironmentalInteractionManager } from '@managers/EnvironmentalInteractionManager';
import { EnemyDefeatFlow } from '@managers/EnemyDefeatFlow';
import { GridManager } from '@managers/GridManager';
import { PlayerFacade } from '@facades/PlayerFacade';
import { TransientGameState } from '@state/TransientGameState';
import { EnemyCollection } from '@facades/EnemyCollection';
import { NPCManager } from '@managers/NPCManager';
import { NPCRenderer } from '@renderers/NPCRenderer';
import { AnimationCoordinator } from './AnimationCoordinator';
import { InteractionFacade } from '@facades/InteractionFacade';
import { CombatFacade } from '@facades/CombatFacade';
import { WorldFacade } from '@facades/WorldFacade';
import type { GameContext } from './context/GameContextCore';
import type { IGame } from './context';
import type { Game } from './game';

type ServiceFactory = () => unknown;

/**
 * Lightweight service container with lazy initialization for better testability.
 * Services are only instantiated when first accessed, allowing tests to mock
 * or partially initialize the game without creating all 30+ dependencies.
 */
export class ServiceContainer {
    private game: IGame;
    private _instances: Map<string, unknown>;
    private _serviceRegistry: Record<string, ServiceFactory>;

    constructor(game: IGame) {
        this.game = game;
        this._instances = new Map();
        this._serviceRegistry = this._buildServiceRegistry();
    }

    /**
     * Get or create a service instance by name.
     */
    get<T = unknown>(serviceName: string): T {
        if (!this._instances.has(serviceName)) {
            this._instances.set(serviceName, this._createService(serviceName));
        }
        return this._instances.get(serviceName) as T;
    }

    /**
     * Set a service instance (useful for testing/mocking)
     */
    set(serviceName: string, instance: unknown): void {
        this._instances.set(serviceName, instance);
    }

    /**
     * Check if a service has been initialized
     */
    has(serviceName: string): boolean {
        return this._instances.has(serviceName);
    }

    /**
     * Clear all service instances (useful for testing)
     */
    clear(): void {
        this._instances.clear();
    }

    /**
     * Build the service registry - a map of service names to factory functions.
     * Each factory function receives the ServiceContainer instance and returns the service.
     */
    private _buildServiceRegistry(): Record<string, ServiceFactory> {
        return {
            // Grid abstraction layer (initialize early, needed by many services)
            gridManager: () => new GridManager(this.game.grid!),

            // Player facade (initialize after player entity is created)
            playerFacade: () => new PlayerFacade(this.game.player!),

            // Animation coordinator (handles player animation events)
            animationCoordinator: () => new AnimationCoordinator(this.game.player!),

            // Enemy collection facade (wraps enemies array for controlled access)
            enemyCollection: () => new EnemyCollection(this.game.enemies, this.game),

            // NPC management (like enemies but for friendly NPCs)
            npcManager: () => new NPCManager(this.game),
            npcRenderer: () => new NPCRenderer(this.game),

            // Transient state container (session-specific, non-persisted state)
            transientGameState: () => new TransientGameState(),

            // Visual / external services
            textureManager: () => new TextureManager(),
            connectionManager: () => new ConnectionManager(),
            /**
             * ZoneGenerator uses a minimal interface for dependency injection.
             * IGame satisfies this interface at runtime through its index signature.
             * Using as unknown as for incompatible structural types.
             */
            zoneGenerator: () => new ZoneGenerator(this.game as unknown as ConstructorParameters<typeof ZoneGenerator>[0]),

            // Entities
            player: () => new Player(),
            Enemy: () => Enemy, // expose class for GameStateManager

            /**
             * Inventory services expect Game type (which extends GameContext).
             * IGame is structurally compatible at runtime.
             */
            inventoryService: () => new InventoryService(this.game as Game),
            itemManager: () => {
                const itemManager = new ItemManager(this.game as Game);
                // Cross-reference: player needs itemManager
                // Note: Player defines its own ItemManager interface, but the class is compatible
                const player = this.get<Player>('player');
                if (player) {
                    player.itemManager = itemManager as unknown as Player['itemManager'];
                }
                return itemManager;
            },
            itemService: () => this.get('inventoryService'), // Backward compatibility alias
            itemUsageHandler: () => null, // Replaced by ItemEffectStrategy
            itemUsageManager: () => null, // Replaced by ItemEffectStrategy
            inventoryInteractionHandler: () => new InventoryInteractionHandler(this.game),
            inventoryUI: () => new InventoryUI(this.game, this.get('inventoryService')),
            radialInventoryUI: () => new RadialInventoryUI(this.game, this.get('inventoryService')),

            /**
             * Input and UI managers expect GameContext type.
             * IGame implements GameContext and is compatible at runtime.
             */
            inputManager: () => new InputManager(this.game as GameContext, this.get('inventoryService')),
            uiManager: () => new UIManager(this.game as GameContext),
            assetLoader: () => new AssetLoader(this.game as GameContext),
            overlayManager: () => new OverlayManager(this.game as GameContext),
            gameInitializer: () => new GameInitializer(this.game as GameContext),

            // Rendering
            renderManager: () => new RenderManager(this.game as GameContext),

            /**
             * Core managers - ActionManager expects IGame, ConsentManager expects local GameInstance interface.
             * Using type assertions where needed (ConsentManager defines own GameInstance locally).
             */
            actionManager: () => new ActionManager(this.game),
            consentManager: () => new ConsentManager(this.game as unknown as ConstructorParameters<typeof ConsentManager>[0]),

            // Systems / utilities
            animationScheduler: () => new AnimationScheduler(),
            soundManager: () => new SoundManager(),
            turnManager: () => new TurnManager(this.game as GameContext),

            /**
             * Sub-managers for InteractionManager.
             * Most expect Game type (GameContext subclass), some expect IGame.
             */
            npcInteractionManager: () => new NPCInteractionManager(this.game),
            itemPickupManager: () => new ItemPickupManager(this.game as Game),
            combatActionManager: () => new CombatActionManager(this.game as Game),
            bombManager: () => new BombManager(this.game),
            terrainInteractionManager: () => new TerrainInteractionManager(this.game),
            environmentalInteractionManager: () => new EnvironmentalInteractionManager(this.game as Game),
            enemyDefeatFlow: () => new EnemyDefeatFlow(this.game as Game),

            // Facades for grouping related dependencies
            interactionFacade: () => new InteractionFacade(
                this.get('npcInteractionManager'),
                this.get('environmentalInteractionManager'),
                this.get('inputManager')
            ),
            combatFacade: () => new CombatFacade(
                this.get('combatActionManager'),
                this.get('bombManager')
            ),
            worldFacade: () => new WorldFacade(
                this.get('terrainInteractionManager'),
                this.get('zoneTransitionManager'),
                this.get('itemPickupManager')
            ),

            // Managers with dependencies
            combatManager: () => new CombatManager(
                this.game,
                this.get<TurnManager>('turnManager').occupiedTilesThisTurn,
                this.get('bombManager'),
                this.get('enemyDefeatFlow')
            ),
            interactionManager: () => new InteractionManager(
                this.game,
                this.get('interactionFacade'),
                this.get('combatFacade'),
                this.get('worldFacade')
            ),

            /**
             * Zone management - requires various game types.
             * ZoneTransitionManager expects Game, others expect IGame or GameContext.
             */
            zoneManager: () => new ZoneManager(this.game),
            zoneTransitionManager: () => new ZoneTransitionManager(this.game as Game, this.get('inputManager')),
            zoneTransitionController: () => new ZoneTransitionController(this.game as GameContext),

            /**
             * Error and state management.
             * GlobalErrorHandler expects local GameInstance interface, GameStateManager expects GameContext.
             */
            globalErrorHandler: () => new GlobalErrorHandler(this.game as unknown as ConstructorParameters<typeof GlobalErrorHandler>[0]),
            gameStateManager: () => new GameStateManager(this.game as GameContext)
        };
    }

    /**
     * Factory method that creates services based on name.
     * This maintains the same initialization order and dependencies as before.
     */
    private _createService(serviceName: string): unknown {
        const factory = this._serviceRegistry[serviceName];
        if (!factory) {
            throw new Error(`Unknown service: ${serviceName}`);
        }
        return factory();
    }

    /**
     * Initialize all core services eagerly (maintains backward compatibility).
     * This method creates all services at once, like the original implementation.
     * Use this for production to ensure everything is initialized at startup.
     */
    createCoreServices(): ServiceContainer {
        // Define initialization order (some services depend on others)
        const serviceNames = [
            // Error handling (initialize first to catch errors during initialization)
            'globalErrorHandler',

            // Transient state (initialize early, no dependencies)
            'transientGameState',

            // External services first
            'textureManager',
            'connectionManager',
            'zoneGenerator',

            // Entities
            'player',
            'Enemy',

            // Player facade (after player entity is created)
            'playerFacade',

            // Enemy collection facade (after enemies array is available)
            'enemyCollection',

            // Inventory system
            'inventoryService',
            'itemManager',
            'itemService', // alias
            'itemUsageHandler',
            'itemUsageManager',
            'inventoryInteractionHandler',

            // UI services
            'inventoryUI',
            'radialInventoryUI',
            'uiManager',

            // Asset management
            'assetLoader',
            'overlayManager',

            // Game initialization (must be early for canvas/ctx setup)
            'gameInitializer',

            // Rendering
            'renderManager',

            // Core managers
            'actionManager',
            'consentManager',

            // Systems / utilities
            'animationScheduler',
            'soundManager',

            // Turn management
            'turnManager',

            // Sub-managers (must be created before their parent managers)
            'npcInteractionManager',
            'itemPickupManager',
            'combatActionManager',
            'bombManager',
            'terrainInteractionManager',
            'environmentalInteractionManager',
            'enemyDefeatFlow',

            // Managers with dependencies
            'inputManager',
            'combatManager',
            'interactionManager',

            // Zone management
            'zoneManager',
            'zoneTransitionManager',
            'zoneTransitionController',

            // State management
            'gameStateManager'

            // NOTE: gridManager and enemyCollection are NOT eagerly initialized here
            // They wrap game.grid and game.enemies which don't exist until generateZone() is called
            // These services use lazy initialization - they'll be created on first access
        ];

        // Create all services and register managers in ManagerRegistry
        serviceNames.forEach(name => {
            const service = this.get(name);
            // Use type assertion to set dynamic properties on IGame
            // These properties are defined in IGame but TypeScript needs help with dynamic access
            (this.game as Record<string, unknown>)[name] = service;

            // Also register in ManagerRegistry if it's a manager type
            // This provides both backward compatibility (game.combatManager)
            // and new facade access (game.managers.get('combatManager'))
            const managerNames = [
                'textureManager', 'connectionManager', 'zoneGenerator', 'inputManager',
                'renderManager', 'combatManager', 'interactionManager', 'itemManager',
                'inventoryService', 'zoneManager', 'zoneTransitionManager',
                'zoneTransitionController', 'actionManager', 'turnManager',
                'gameStateManager', 'animationScheduler', 'assetLoader',
                'gridManager', 'npcManager', 'bombManager', 'npcInteractionManager',
                'terrainInteractionManager', 'itemRepository', 'inventoryInteractionHandler'
            ];

            if (managerNames.includes(name) && service) {
                // Type assertion needed because manager names are a union of string literals
                this.game.managers.register(name as Parameters<typeof this.game.managers.register>[0], service);
            }
        });

        // Also set animationManager from animationScheduler
        if (this.game.animationScheduler) {
            this.game.managers.register('animationManager', this.game.animationScheduler);
        }

        // Also set gameInitializer in managers
        if (this.game.gameInitializer) {
            this.game.managers.register('gameInitializer', this.game.gameInitializer);
        }

        // Initialize global error handlers early (after service creation)
        const gameWithHandlers = this.game as Record<string, unknown>;
        const globalErrorHandler = gameWithHandlers.globalErrorHandler as { initialize?: () => void } | undefined;
        if (globalErrorHandler?.initialize) {
            globalErrorHandler.initialize();
        }

        // Load persisted radial items (if any)
        loadRadialInventory(this.game);

        return this;
    }
}
