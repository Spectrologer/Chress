// @ts-check

import { TextureManager } from '../renderers/TextureManager.js';
import { ConnectionManager } from '../managers/ConnectionManager.js';
import { ZoneGenerator } from './ZoneGenerator.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { InputManager } from '../managers/InputManager.js';
import { UIManager } from '../ui/UIManager.js';
import { RenderManager } from '../renderers/RenderManager.js';
import { CombatManager } from '../managers/CombatManager.js';
import { InteractionManager } from '../managers/InteractionManager.js';
import { ItemManager } from '../managers/ItemManager.js';
import { InventoryService } from '../managers/inventory/InventoryService.js';
import { InventoryInteractionHandler } from '../managers/inventory/InventoryInteractionHandler.js';
import { ZoneManager } from '../managers/ZoneManager.js';
import { ZoneTransitionManager } from '../managers/ZoneTransitionManager.js';
import { ActionManager } from '../managers/ActionManager.js';
import { TurnManager } from './TurnManager.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { RadialInventoryUI } from '../ui/RadialInventoryUI.js';
import { loadRadialInventory } from '../managers/RadialPersistence.js';
import { GameStateManager } from './GameStateManager.js';
import { SoundManager } from './SoundManager.js';
import { ConsentManager } from './ConsentManager.ts';
import { AnimationScheduler } from './AnimationScheduler.js';
import { GameInitializer } from './GameInitializer.js';
import { AssetLoader } from './AssetLoader.js';
import { OverlayManager } from '../ui/OverlayManager.ts';
import { ZoneTransitionController } from '../controllers/ZoneTransitionController.js';
import { GlobalErrorHandler } from './GlobalErrorHandler.ts';
import { NPCInteractionManager } from '../managers/NPCInteractionManager.js';
import { ItemPickupManager } from '../managers/inventory/ItemPickupManager.js';
import { CombatActionManager } from '../managers/CombatActionManager.js';
import { BombManager } from '../managers/BombManager.js';
import { TerrainInteractionManager } from '../managers/TerrainInteractionManager.js';
import { EnvironmentalInteractionManager } from '../managers/EnvironmentalInteractionManager.js';
import { EnemyDefeatFlow } from '../managers/EnemyDefeatFlow.js';
import { GridManager } from '../managers/GridManager.js';
import { PlayerFacade } from '../facades/PlayerFacade.js';
import { TransientGameState } from '../state/TransientGameState.js';
import { EnemyCollection } from '../facades/EnemyCollection.js';
import { NPCManager } from '../managers/NPCManager.js';
import { NPCRenderer } from '../renderers/NPCRenderer.js';
import { AnimationCoordinator } from './AnimationCoordinator.js';
import { InteractionFacade } from '../facades/InteractionFacade.js';
import { CombatFacade } from '../facades/CombatFacade.js';
import { WorldFacade } from '../facades/WorldFacade.js';

/**
 * @typedef {import('./GameContext.js').GameContext} GameContext
 * @typedef {() => any} ServiceFactory
 */

/**
 * Lightweight service container with lazy initialization for better testability.
 * Services are only instantiated when first accessed, allowing tests to mock
 * or partially initialize the game without creating all 30+ dependencies.
 */
export class ServiceContainer {
    /**
     * @param {GameContext} game
     */
    constructor(game) {
        /** @type {GameContext} */
        this.game = game;

        /** @type {Map<string, any>} */
        this._instances = new Map();

        /** @type {Record<string, ServiceFactory>} */
        this._serviceRegistry = this._buildServiceRegistry();
    }

    /**
     * Get or create a service instance by name.
     * @param {string} serviceName - Name of the service to retrieve
     * @returns {any} The service instance
     */
    get(serviceName) {
        if (!this._instances.has(serviceName)) {
            this._instances.set(serviceName, this._createService(serviceName));
        }
        return this._instances.get(serviceName);
    }

    /**
     * Set a service instance (useful for testing/mocking)
     * @param {string} serviceName - Name of the service
     * @param {any} instance - The service instance to set
     * @returns {void}
     */
    set(serviceName, instance) {
        this._instances.set(serviceName, instance);
    }

    /**
     * Check if a service has been initialized
     * @param {string} serviceName - Name of the service
     * @returns {boolean} True if the service has been created
     */
    has(serviceName) {
        return this._instances.has(serviceName);
    }

    /**
     * Clear all service instances (useful for testing)
     * @returns {void}
     */
    clear() {
        this._instances.clear();
    }

    /**
     * Build the service registry - a map of service names to factory functions.
     * Each factory function receives the ServiceContainer instance and returns the service.
     * @returns {Record<string, ServiceFactory>}
     */
    _buildServiceRegistry() {
        return {
            // Grid abstraction layer (initialize early, needed by many services)
            gridManager: () => new GridManager(this.game.grid),

            // Player facade (initialize after player entity is created)
            playerFacade: () => new PlayerFacade(this.game.player),

            // Animation coordinator (handles player animation events)
            animationCoordinator: () => new AnimationCoordinator(this.game.player),

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
            zoneGenerator: () => new ZoneGenerator(this.game),

            // Entities
            player: () => new Player(),
            Enemy: () => Enemy, // expose class for GameStateManager

            // Consolidated inventory system
            inventoryService: () => new InventoryService(this.game),
            itemManager: () => {
                const itemManager = new ItemManager(this.game);
                // Cross-reference: player needs itemManager
                const player = this.get('player');
                if (player) {
                    player.itemManager = itemManager;
                }
                return itemManager;
            },
            itemService: () => this.get('inventoryService'), // Backward compatibility alias
            itemUsageHandler: () => null, // Replaced by ItemEffectStrategy
            itemUsageManager: () => null, // Replaced by ItemEffectStrategy
            inventoryInteractionHandler: () => new InventoryInteractionHandler(this.game),
            inventoryUI: () => new InventoryUI(this.game, this.get('inventoryService')),
            radialInventoryUI: () => new RadialInventoryUI(this.game, this.get('inventoryService')),

            // Input and UI
            inputManager: () => new InputManager(this.game, this.get('inventoryService')),
            uiManager: () => new UIManager(this.game),
            assetLoader: () => new AssetLoader(this.game),
            overlayManager: () => new OverlayManager(this.game),
            gameInitializer: () => new GameInitializer(this.game),

            // Rendering
            renderManager: () => new RenderManager(this.game),

            // Core managers
            // @ts-ignore - game type compatibility
            actionManager: () => new ActionManager(this.game),
            consentManager: () => new ConsentManager(this.game),

            // Systems / utilities
            animationScheduler: () => new AnimationScheduler(),
            soundManager: () => new SoundManager(),
            turnManager: () => new TurnManager(this.game),

            // Sub-managers for InteractionManager
            npcInteractionManager: () => new NPCInteractionManager(this.game),
            itemPickupManager: () => new ItemPickupManager(this.game),
            combatActionManager: () => new CombatActionManager(this.game),
            // @ts-ignore - game type compatibility
            bombManager: () => new BombManager(this.game),
            terrainInteractionManager: () => new TerrainInteractionManager(this.game),
            environmentalInteractionManager: () => new EnvironmentalInteractionManager(this.game),
            enemyDefeatFlow: () => new EnemyDefeatFlow(this.game),

            // Facades for grouping related dependencies
            interactionFacade: () => new InteractionFacade(
                this.get('npcInteractionManager'),
                this.get('environmentalInteractionManager'),
                // @ts-ignore - inputManager type compatibility
                this.get('inputManager')
            ),
            combatFacade: () => new CombatFacade(
                this.get('combatActionManager'),
                this.get('bombManager')
            ),
            worldFacade: () => new WorldFacade(
                this.get('terrainInteractionManager'),
                // @ts-ignore - zoneTransitionManager type compatibility
                this.get('zoneTransitionManager'),
                this.get('itemPickupManager')
            ),

            // Managers with dependencies
            combatManager: () => new CombatManager(
                this.game,
                this.get('turnManager').occupiedTilesThisTurn,
                this.get('bombManager'),
                this.get('enemyDefeatFlow')
            ),
            interactionManager: () => new InteractionManager(
                this.game,
                this.get('interactionFacade'),
                this.get('combatFacade'),
                this.get('worldFacade')
            ),

            // Zone management
            // @ts-ignore - game type compatibility
            zoneManager: () => new ZoneManager(this.game),
            zoneTransitionManager: () => new ZoneTransitionManager(this.game, this.get('inputManager')),
            zoneTransitionController: () => new ZoneTransitionController(this.game),

            // Error and state management
            // @ts-ignore - game type compatibility
            globalErrorHandler: () => new GlobalErrorHandler(this.game),
            // @ts-ignore - game type compatibility
            gameStateManager: () => new GameStateManager(this.game)
        };
    }

    /**
     * Factory method that creates services based on name.
     * This maintains the same initialization order and dependencies as before.
     * @param {string} serviceName
     * @returns {any}
     */
    _createService(serviceName) {
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
     * @returns {ServiceContainer}
     */
    createCoreServices() {
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

        // Create all services
        serviceNames.forEach(name => {
            this.game[name] = this.get(name);
        });

        // Initialize global error handlers early (after service creation)
        // @ts-ignore - globalErrorHandler exists after service creation
        if (this.game.globalErrorHandler) {
            // @ts-ignore - globalErrorHandler exists after service creation
            this.game.globalErrorHandler.initialize();
        }

        // Load persisted radial items (if any)
        loadRadialInventory(this.game);

        return this;
    }
}
