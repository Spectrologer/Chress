/**
 * Game Context Interfaces - Type definitions for the game context
 */

import type { GameWorld } from '../GameWorld';
import type { GameUI } from '../GameUI';
import type { GameAudio } from '../GameAudio';
import type { ZoneGenerationState } from '@state/ZoneGenerationState';
import type { StorageAdapter } from '@state/StorageAdapter';
import type { Coordinates } from '../PositionTypes';
import type { Grid } from '../SharedTypes';
import type { ServiceContainer } from '../ServiceContainer';
import type { AnimationManager } from '../DataContracts';
import type { AnimationScheduler } from '../AnimationScheduler';
import type { GameInitializer } from '../GameInitializer';
import type { AssetLoader } from '../AssetLoader';
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
import type { MessageManager } from '@ui/MessageManager';
import type { PanelManager } from '@ui/PanelManager';
import type { PlayerStatsUI } from '@ui/PlayerStatsUI';
import type { DialogueManager } from '@ui/DialogueManager';
import type { NPCInteractionManager } from '@managers/NPCInteractionManager';
import type { TerrainInteractionManager } from '@managers/TerrainInteractionManager';
import type { ItemRepository } from '@managers/inventory/ItemRepository';
import type { InventoryInteractionHandler } from '@managers/inventory/InventoryInteractionHandler';
import type { InventoryItem } from '@managers/inventory/ItemMetadata';
import type { SoundManager as ISoundManager, SignData } from '../../types/game.js';

export interface Item {
    name?: string;
    type: string;
    uses?: number;
    [key: string]: unknown;
}

export interface ICoordinates {
    x: number;
    y: number;
}

/**
 * Comprehensive Game interface that represents the complete game state and all managers
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
    displayingMessageForSign?: SignData;
    radialInventorySnapshot?: InventoryItem[];
    playerFacade?: PlayerFacade;
    _entranceAnimationInProgress?: boolean;

    // Dynamic properties
    zoneRepository?: Record<string, unknown>;
    messageLog?: string[];
    dialogueState?: Map<string, unknown>;
    lastExitSide?: string | null;
    _newGameSpawnPosition?: Coordinates | null;
    pendingConfirmationAction?: string;
    pendingConfirmationData?: Record<string, unknown>;

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
    Enemy: new (...args: unknown[]) => Enemy;

    // Grid and world data
    grid: Grid | null;
    zones: any; // ZoneFacade in GameContext, Map in other contexts
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
    messageManager?: MessageManager;
    panelManager?: PanelManager;
    playerStatsUI?: PlayerStatsUI;
    dialogueManager?: DialogueManager;

    // Audio
    soundManager: ISoundManager | null;
    consentManager: object | null;

    // Backward compatibility aliases
    itemService: InventoryService | null;
    inventoryManager: InventoryUI | null;
    _lastPlayerPos: ICoordinates | null;

    // Private/internal properties
    _services?: ServiceContainer | null;

    // Index signature for compatibility with GameInstance
    [key: string]: any;

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
