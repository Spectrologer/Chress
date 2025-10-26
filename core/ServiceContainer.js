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
import { ZoneManager } from '../managers/ZoneManager.js';
import { ZoneTransitionManager } from '../managers/ZoneTransitionManager.js';
import { ActionManager } from '../managers/ActionManager.js';
import { TurnManager } from './TurnManager.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { RadialInventoryUI } from '../ui/RadialInventoryUI.js';
import { loadRadialInventory } from '../managers/RadialPersistence.js';
import { GameStateManager } from './GameStateManager.js';
import { SoundManager } from './SoundManager.js';
import { ConsentManager } from './ConsentManager.js';
import { AnimationScheduler } from './AnimationScheduler.js';
import { GameInitializer } from './GameInitializer.js';
import { AssetLoader } from './AssetLoader.js';
import { OverlayManager } from '../ui/OverlayManager.js';
import { ZoneTransitionController } from '../controllers/ZoneTransitionController.js';
import { GlobalErrorHandler } from './GlobalErrorHandler.js';

/**
 * Lightweight service container with lazy initialization for better testability.
 * Services are only instantiated when first accessed, allowing tests to mock
 * or partially initialize the game without creating all 30+ dependencies.
 */
export class ServiceContainer {
    constructor(game) {
        this.game = game;
        this._instances = new Map();
    }

    /**
     * Get or create a service instance by name.
     * @param {string} serviceName - Name of the service to retrieve
     * @returns {*} The service instance
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
     * @param {*} instance - The service instance to set
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
     */
    clear() {
        this._instances.clear();
    }

    /**
     * Factory method that creates services based on name.
     * This maintains the same initialization order and dependencies as before.
     */
    _createService(serviceName) {
        switch (serviceName) {
            // Visual / external services
            case 'textureManager':
                return new TextureManager();

            case 'connectionManager':
                return new ConnectionManager();

            case 'zoneGenerator':
                return new ZoneGenerator(this.game);

            // Entities
            case 'player':
                return new Player();

            case 'Enemy':
                return Enemy; // expose class for GameStateManager

            // Consolidated inventory system
            case 'inventoryService':
                return new InventoryService(this.game);

            case 'itemManager': {
                const itemManager = new ItemManager(this.game);
                // Cross-reference: player needs itemManager
                const player = this.get('player');
                if (player) {
                    player.itemManager = itemManager;
                }
                return itemManager;
            }

            case 'itemService':
                // Backward compatibility alias
                return this.get('inventoryService');

            case 'itemUsageHandler':
                return null; // Replaced by ItemEffectStrategy

            case 'itemUsageManager':
                return null; // Replaced by ItemEffectStrategy

            case 'inventoryUI':
                return new InventoryUI(this.game, this.get('inventoryService'));

            case 'radialInventoryUI':
                return new RadialInventoryUI(this.game, this.get('inventoryService'));

            case 'inputManager':
                return new InputManager(this.game, this.get('inventoryService'));

            case 'uiManager':
                return new UIManager(this.game);

            case 'assetLoader':
                return new AssetLoader(this.game);

            case 'overlayManager':
                return new OverlayManager(this.game);

            case 'gameInitializer':
                return new GameInitializer(this.game);

            case 'renderManager':
                return new RenderManager(this.game);

            case 'actionManager':
                return new ActionManager(this.game);

            case 'consentManager':
                return new ConsentManager(this.game);

            case 'animationScheduler':
                return new AnimationScheduler();

            case 'soundManager':
                return new SoundManager();

            case 'turnManager':
                return new TurnManager(this.game);

            case 'combatManager':
                return new CombatManager(this.game, this.get('turnManager').occupiedTilesThisTurn);

            case 'interactionManager':
                return new InteractionManager(this.game, this.get('inputManager'));

            case 'zoneManager':
                return new ZoneManager(this.game);

            case 'zoneTransitionManager':
                return new ZoneTransitionManager(this.game, this.get('inputManager'));

            case 'zoneTransitionController':
                return new ZoneTransitionController(this.game);

            case 'globalErrorHandler':
                return new GlobalErrorHandler(this.game);

            case 'gameStateManager':
                return new GameStateManager(this.game);

            case 'inventoryManager':
                // Legacy reference for code expecting inventoryManager object
                return this.get('inventoryUI');

            default:
                throw new Error(`Unknown service: ${serviceName}`);
        }
    }

    /**
     * Initialize all core services eagerly (maintains backward compatibility).
     * This method creates all services at once, like the original implementation.
     * Use this for production to ensure everything is initialized at startup.
     */
    createCoreServices() {
        // Define initialization order (some services depend on others)
        const serviceNames = [
            // Error handling (initialize first to catch errors during initialization)
            'globalErrorHandler',

            // External services first
            'textureManager',
            'connectionManager',
            'zoneGenerator',

            // Entities
            'player',
            'Enemy',

            // Inventory system
            'inventoryService',
            'itemManager',
            'itemService', // alias
            'itemUsageHandler',
            'itemUsageManager',

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

            // Managers with dependencies
            'inputManager',
            'combatManager',
            'interactionManager',

            // Zone management
            'zoneManager',
            'zoneTransitionManager',
            'zoneTransitionController',

            // State management
            'gameStateManager',

            // Legacy aliases
            'inventoryManager'
        ];

        // Create all services
        serviceNames.forEach(name => {
            this.game[name] = this.get(name);
        });

        // Initialize global error handlers early (after service creation)
        if (this.game.globalErrorHandler) {
            this.game.globalErrorHandler.initialize();
        }

        // Load persisted radial items (if any)
        loadRadialInventory(this.game);

        return this;
    }
}
