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
import { InventoryUI } from '../managers/InventoryUI.js';
import { RadialInventoryUI } from '../managers/RadialInventoryUI.js';
import { loadRadialInventory } from '../managers/RadialPersistence.js';
import { GameStateManager } from './GameStateManager.js';
import { SoundManager } from './SoundManager.js';
import { ConsentManager } from './ConsentManager.js';
import { AnimationScheduler } from './AnimationScheduler.js';
import { GameInitializer } from './GameInitializer.js';
import { AssetLoader } from './AssetLoader.js';
import { OverlayManager } from '../ui/OverlayManager.js';
import { ZoneTransitionController } from '../controllers/ZoneTransitionController.js';

/**
 * Lightweight service container for centralizing creation and wiring of game services.
 * Keeps the existing constructors intact but moves instantiation out of Game.
 */
export class ServiceContainer {
    constructor(game) {
        this.game = game;
    }

    createCoreServices() {
        // Visual / external services
        this.game.textureManager = new TextureManager();
        this.game.connectionManager = new ConnectionManager();
        this.game.zoneGenerator = new ZoneGenerator(this.game);

        // Entities
        this.game.player = new Player();
        this.game.Enemy = Enemy; // expose class for GameStateManager

        // Managers that depend on game reference
        // NEW: Consolidated inventory system
        this.game.inventoryService = new InventoryService(this.game);
        this.game.itemManager = new ItemManager(this.game);

        // Backward compatibility aliases
        this.game.itemService = this.game.inventoryService;
        this.game.itemUsageHandler = null; // Replaced by ItemEffectStrategy
        this.game.itemUsageManager = null; // Replaced by ItemEffectStrategy

        this.game.inventoryUI = new InventoryUI(this.game, this.game.inventoryService);
        this.game.radialInventoryUI = new RadialInventoryUI(this.game, this.game.inventoryService);

        // Load persisted radial items (if any)
        try { loadRadialInventory(this.game); } catch (e) {}

        this.game.inputManager = new InputManager(this.game, this.game.inventoryService);
        this.game.uiManager = new UIManager(this.game);

        // NEW: Asset loading and overlay management
        this.game.assetLoader = new AssetLoader(this.game);
        this.game.overlayManager = new OverlayManager(this.game);

        // Construct GameInitializer early so it can configure canvas and ctx before
        // any renderer attempts to use game.ctx.
        this.game.gameInitializer = new GameInitializer(this.game);

        this.game.renderManager = new RenderManager(this.game);

        this.game.actionManager = new ActionManager(this.game);
        this.game.consentManager = new ConsentManager(this.game);

        // Systems / utilities
        this.game.animationScheduler = new AnimationScheduler();
        this.game.soundManager = new SoundManager();

        // Managers that may need extra args
        // Create TurnManager to encapsulate enemy-turn state used by combat.
        this.game.turnManager = new TurnManager(this.game);

        this.game.combatManager = new CombatManager(this.game, this.game.turnManager.occupiedTilesThisTurn);
        this.game.interactionManager = new InteractionManager(this.game, this.game.inputManager);

        // Zone management - core managers
        this.game.zoneManager = new ZoneManager(this.game);
        this.game.zoneTransitionManager = new ZoneTransitionManager(this.game, this.game.inputManager);

        // NEW: High-level zone transition controller
        this.game.zoneTransitionController = new ZoneTransitionController(this.game);

        this.game.gameStateManager = new GameStateManager(this.game);

        // assign some cross references preserved from original code
        this.game.player.itemManager = this.game.itemManager;

        // Provide legacy reference for code expecting inventoryManager object, but prefer using itemService/inventoryUI
        this.game.inventoryManager = this.game.inventoryUI; // keep UI reference for legacy callers

        return this;
    }
}
