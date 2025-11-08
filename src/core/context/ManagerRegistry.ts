/**
 * ManagerRegistry - Central registry for all game managers
 *
 * Replaces the sprawling manager properties in GameContext with a
 * type-safe service locator pattern. Provides better encapsulation
 * and clearer dependencies.
 */

import type { TextureManager } from '@renderers/TextureManager';
import type { ConnectionManager } from '@managers/ConnectionManager';
import type { ZoneGenerator } from '@core/ZoneGenerator';
import type { InputManager } from '@managers/InputManager';
import type { RenderManager } from '@renderers/RenderManager';
import type { CombatManager } from '@managers/CombatManager';
import type { InteractionManager } from '@managers/InteractionManager';
import type { ItemManager } from '@managers/ItemManager';
import type { InventoryService } from '@managers/inventory/InventoryService';
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
import type { GridManager } from '@managers/GridManager';
import type { NPCManager } from '@managers/NPCManager';
import type { BombManager } from '@managers/BombManager';
import type { NPCInteractionManager } from '@managers/NPCInteractionManager';
import type { TerrainInteractionManager } from '@managers/TerrainInteractionManager';
import type { ItemRepository } from '@managers/inventory/ItemRepository';
import type { InventoryInteractionHandler } from '@managers/inventory/InventoryInteractionHandler';

/**
 * Manager type mapping for type-safe access
 */
export interface ManagerTypes {
    textureManager: TextureManager;
    connectionManager: ConnectionManager;
    zoneGenerator: ZoneGenerator;
    inputManager: InputManager;
    renderManager: RenderManager;
    combatManager: CombatManager;
    interactionManager: InteractionManager;
    itemManager: ItemManager;
    inventoryService: InventoryService;
    zoneManager: ZoneManager;
    zoneTransitionManager: ZoneTransitionManager;
    zoneTransitionController: ZoneTransitionController;
    actionManager: ActionManager;
    turnManager: TurnManager;
    gameStateManager: GameStateManager;
    animationManager: AnimationManager;
    animationScheduler: AnimationScheduler;
    gameInitializer: GameInitializer;
    assetLoader: AssetLoader;
    gridManager: GridManager;
    npcManager: NPCManager;
    bombManager: BombManager;
    npcInteractionManager: NPCInteractionManager;
    terrainInteractionManager: TerrainInteractionManager;
    itemRepository: ItemRepository;
    inventoryInteractionHandler: InventoryInteractionHandler;
}

/**
 * ManagerRegistry - Type-safe manager container
 */
export class ManagerRegistry {
    private managers: Map<string, any>;

    constructor() {
        this.managers = new Map();
    }

    /**
     * Register a manager with type safety
     */
    register<K extends keyof ManagerTypes>(name: K, manager: ManagerTypes[K]): void {
        this.managers.set(name, manager);
    }

    /**
     * Get a manager with type safety
     */
    get<K extends keyof ManagerTypes>(name: K): ManagerTypes[K] | null {
        return this.managers.get(name) ?? null;
    }

    /**
     * Check if a manager is registered
     */
    has<K extends keyof ManagerTypes>(name: K): boolean {
        return this.managers.has(name);
    }

    /**
     * Unregister a manager
     */
    unregister<K extends keyof ManagerTypes>(name: K): void {
        this.managers.delete(name);
    }

    /**
     * Clear all managers
     */
    clear(): void {
        this.managers.clear();
    }

    /**
     * Get all registered manager names
     */
    getRegisteredNames(): string[] {
        return Array.from(this.managers.keys());
    }
}
