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
import { ItemUsageManager } from '../managers/ItemUsageManager.js';
import { ZoneManager } from '../managers/ZoneManager.js';
import { ActionManager } from '../managers/ActionManager.js';
import { TurnManager } from './TurnManager.js';
import { ItemUsageHandler } from '../managers/ItemUsageHandler.js';
import { ItemService } from '../managers/ItemService.js';
import { InventoryUI } from '../managers/InventoryUI.js';
import { RadialInventoryUI } from '../managers/RadialInventoryUI.js';
import { loadRadialInventory } from '../managers/RadialPersistence.js';
import { GameStateManager } from './GameStateManager.js';
import { SoundManager } from './SoundManager.js';
import { ConsentManager } from './ConsentManager.js';
import { AnimationScheduler } from './AnimationScheduler.js';
import { GameInitializer } from './GameInitializer.js';

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
        this.game.itemManager = new ItemManager(this.game);
        // Item usage manager (positional uses like shovel)
        this.game.itemUsageManager = new ItemUsageManager(this.game);
        // New item usage handler (for item effects)
        this.game.itemUsageHandler = new ItemUsageHandler(this.game);
        this.game.itemService = new ItemService(this.game, this.game.itemUsageHandler);
        this.game.inventoryUI = new InventoryUI(this.game, this.game.itemService);
    this.game.radialInventoryUI = new RadialInventoryUI(this.game, this.game.itemService);
    // Load persisted radial items (if any)
    try { loadRadialInventory(this.game); } catch (e) {}
        this.game.itemUsageHandler.game = this.game;
        this.game.inputManager = new InputManager(this.game, this.game.itemUsageManager);
    this.game.uiManager = new UIManager(this.game);

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
        this.game.zoneManager = new ZoneManager(this.game);
        this.game.gameStateManager = new GameStateManager(this.game);

        // assign some cross references preserved from original code
        this.game.player.itemManager = this.game.itemManager;

        // Provide legacy reference for code expecting inventoryManager object, but prefer using itemService/inventoryUI
        this.game.inventoryManager = this.game.inventoryUI; // keep UI reference for legacy callers

        return this;
    }
}
