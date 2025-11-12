import { TILE_TYPES } from './constants/index';
import { UI_TIMING_CONSTANTS } from './constants/ui';
import { logger } from './logger';
import { TextBox } from '@ui/textbox';
import { eventBus } from './EventBus';
import { EventTypes } from './EventTypes';
import { isWithinGrid } from '@utils/GridUtils';
import { SaveSerializer } from './SaveSerializer';
import { SaveDeserializer } from './SaveDeserializer';
import { ZoneStateRestorer } from './ZoneStateRestorer';
import { ZoneRepository } from '@repositories/ZoneRepository';
import { boardLoader } from './BoardLoader';
import { createZoneKey } from '@utils/ZoneKeyUtils';
import { resetToNormalMode } from './GameModeManager';
import type { GameContext } from './context/GameContextCore';
import type { PlayerStats } from '@entities/PlayerStats';
import type { Grid, SavedPlayerData as SharedSavedPlayerData, SavedPlayerStats as SharedSavedPlayerStats, SaveGameData as SharedSaveGameData } from './SharedTypes';
import type { Coordinates } from './PositionTypes';

const GAME_STATE_KEY = 'chesse_game_state';
const SAVE_VERSION = 2; // bump if save format changes

export interface SavePayload {
    version: number;
    lastSaved: number;
    state: SharedSaveGameData | SerializedGameState; // Support both new and legacy formats
}

export interface SerializedGameState {
    player: SharedSavedPlayerData;
    playerStats: SharedSavedPlayerStats;
    zones?: Array<[string, ZoneData]>;
    grid?: Grid;
    enemies?: EnemyData[];
    defeatedEnemies?: string[];
    specialZones?: Array<[string, unknown]>;
    messageLog?: string[];
    currentRegion?: string;
    zoneGeneration?: ZoneGenerationData;
    zoneStateManager?: LegacyZoneStateData;
}

export interface ZoneData {
    grid: Grid;
    enemies: EnemyData[];
    discovered: boolean;
    terrainTextures?: Record<string, string>;
    overlayTextures?: Record<string, string>;
    rotations?: Record<string, number>;
    overlayRotations?: Record<string, number>;
    playerSpawn?: Coordinates;
}

export interface EnemyData {
    x: number;
    y: number;
    enemyType: string;
    health: number;
    id: string;
}

export interface ZoneGenerationData {
    zoneCounter: number;
    enemyCounter: number;
    spawnFlags: Record<string, boolean>;
    firstWildsZonePlaced: boolean;
    spawnLocations: Record<string, { x: number; y: number } | null>;
}

export interface LegacyZoneStateData {
    [key: string]: unknown;
}

interface BoardLoaderData {
    size: [number, number];
    terrain: string[];
    features: Record<string, string>;
    overlays?: Record<string, string>;
    rotations?: Record<string, number>;
    overlayRotations?: Record<string, number>;
    signMessages?: Record<string, string>;
    metadata?: {
        dimension?: number;
        playerSpawn?: { x: number; y: number };
    };
}

interface BoardLoaderResult {
    grid: Grid;
    terrainTextures: Record<string, string>;
    overlayTextures: Record<string, string>;
    rotations: Record<string, number>;
    overlayRotations: Record<string, number>;
    playerSpawn?: Coordinates;
    enemies?: EnemyData[];
}

export interface ZoneWithCoordinates {
    x: number;
    y: number;
    dimension: number;
    depth?: number;
}

/**
 * Extended GameContext interface with runtime properties
 * These properties are dynamically added and may not be in the core GameContext type
 */
interface GameContextExtended {
    zoneRepository: ZoneRepository;
    messageLog: string[];
    dialogueState: Map<string, unknown>;
    justEnteredZone: boolean;
    lastExitSide: string | null;
    _newGameSpawnPosition: Coordinates | null;
    _entranceAnimationInProgress: boolean;
    lastSignMessage: string | null;
    displayingMessageForSign: unknown | null;
}

/**
 * Extended Player interface with spentDiscoveries property
 */
interface PlayerExtended {
    spentDiscoveries: number;
}

interface ConfigSettings {
    musicEnabled: boolean;
    sfxEnabled: boolean;
}

export class GameStateManager {
    private game: GameContext;
    private saveDebounceMs: number;
    private _saveTimer: ReturnType<typeof setTimeout> | null;
    private saveIntervalMs: number;
    private _saveIntervalId: ReturnType<typeof setInterval> | null;

    constructor(game: GameContext) {
        this.game = game;
        this.initializeState();
        // Autosave configuration
        this.saveDebounceMs = UI_TIMING_CONSTANTS.SAVE_DEBOUNCE_MS; // debounce writes when many changes happen in quick succession
        this._saveTimer = null;
        this.saveIntervalMs = UI_TIMING_CONSTANTS.SAVE_INTERVAL_MS; // periodic save every 30s
        this._saveIntervalId = null;
    }

    initializeState(): void {
        const gameExt = this.game as unknown as GameContextExtended;

        // Zone management
        gameExt.zoneRepository = new ZoneRepository(); // Centralized zone caching
        (this.game as any).zones = gameExt.zoneRepository.getMap(); // Backward compatibility - provides direct Map access (deprecated)
        this.game.grid = null; // Current zone grid
        // IMPORTANT: Clear array in place to preserve EnemyCollection reference
        if (this.game.enemies) {
            this.game.enemies.length = 0;
        } else {
            this.game.enemies = []; // First initialization
        }
        this.game.defeatedEnemies = new Set(); // Tracks defeated enemy positions: "zoneX,zoneY,enemyX,enemyY"
        this.game.gameStarted = false;
        this.game.currentRegion = null; // Tracks current region name to avoid repeated notifications

        // Enemy wait mechanism for zone entry
        gameExt.justEnteredZone = false; // Flag to skip enemy movements on zone entry

        // Message Log system
        gameExt.messageLog = [];

        // Special zones marked by notes (zoneKey: "x,y" -> items array)
        this.game.specialZones = new Map();

        // NPC dialogue state tracking (maps npcType -> dialogue data with currentMessageIndex)
        gameExt.dialogueState = new Map();

        // Zone transition tracking (used to determine if player is entering from an exit or starting new game)
        gameExt.lastExitSide = null; // null for new games, set during zone transitions
        gameExt._newGameSpawnPosition = null; // Stores exit tile position for entrance animation
    }

    resetGame(): void {
        const gameExt = this.game as unknown as GameContextExtended;
        const playerExt = this.game.player as unknown as PlayerExtended;

        // Preserve config settings
        const prevConfig: ConfigSettings = {
            musicEnabled: this.game.player!.stats && typeof this.game.player!.stats.musicEnabled !== 'undefined' ? this.game.player!.stats.musicEnabled : true,
            sfxEnabled: this.game.player!.stats && typeof this.game.player!.stats.sfxEnabled !== 'undefined' ? this.game.player!.stats.sfxEnabled : true
        };

        // Clear saved state since game over should reset everything
        this.clearSavedState();

        // Reset all game state
        gameExt.zoneRepository.clear();
        this.game.connectionManager!.clear();
        this.game.zoneGenState.reset(); // Reset zone generation state (replaces ZoneStateManager.resetSessionData())
        TextBox.spawnedMessages.clear(); // Reset spawned message tracking
        this.game.specialZones.clear(); // Reset special zones
        gameExt.messageLog = []; // Reset message log
        if (gameExt.dialogueState) {
            gameExt.dialogueState.clear(); // Reset NPC dialogue progression
        }

        // Reset chess mode to normal mode
        resetToNormalMode(this.game);

        this.game.player!.reset();
        // IMPORTANT: Clear the array instead of reassigning to preserve EnemyCollection reference
        if (this.game.enemyCollection) {
            this.game.enemyCollection.clear(false); // Clear without emitting event
        } else {
            this.game.enemies.length = 0; // Fallback if enemyCollection not yet initialized
        }
        this.game.defeatedEnemies = new Set();
        this.game.currentRegion = null; // Reset region tracking
        gameExt.lastSignMessage = null; // Reset textbox message tracking
        gameExt.displayingMessageForSign = null; // Reset textbox message display tracking
        this.game.animationManager!.clearAll(); // Reset all animations
        playerExt.spentDiscoveries = 0; // Reset spent discoveries
        gameExt.lastExitSide = null; // Reset for new game entrance animation
        gameExt._newGameSpawnPosition = null; // Reset entrance animation spawn position

        // Generate starting zone
        this.game.zoneManager!.generateZone();

        // Only set tile if player is within grid bounds (for new games, player may be off-screen)
        const playerY: number = this.game.playerFacade.getY();
        const playerX: number = this.game.playerFacade.getX();
        if (isWithinGrid(playerX, playerY)) {
            this.game.grid![playerY][playerX] = TILE_TYPES.FLOOR;
        }

        // Set initial region
        const initialZone: ZoneWithCoordinates = this.game.playerFacade.getCurrentZone() as ZoneWithCoordinates;
        this.game.currentRegion = this.game.uiManager!.generateRegionName(initialZone.x, initialZone.y);

        // Restore config settings
        if (!this.game.player!.stats) this.game.player!.stats = {} as PlayerStats;
        this.game.player!.stats.musicEnabled = prevConfig.musicEnabled;
        this.game.player!.stats.sfxEnabled = prevConfig.sfxEnabled;

        // Trigger entrance animation for new game BEFORE emitting events
        // This ensures input is blocked before any event handlers could process clicks
        const shouldTriggerEntrance: boolean = !!(this.game.gameInitializer && gameExt._newGameSpawnPosition);
        if (shouldTriggerEntrance) {
            // Pre-emptively block input to prevent race conditions with queued mouse events
            gameExt._entranceAnimationInProgress = true;
        }

        // Emit game reset event instead of calling UI methods directly
        eventBus.emit(EventTypes.GAME_RESET, {
            zone: initialZone,
            regionName: this.game.currentRegion
        });

        // Now trigger the entrance animation (flag already set above)
        if (shouldTriggerEntrance) {
            this.game.gameInitializer!.triggerNewGameEntrance();
        }

        // Ensure background music matches the new starting zone so any previous
        // underground track doesn't continue playing after a respawn/reset.
        try {
            const currentZone = this.game.playerFacade.getCurrentZone() as ZoneWithCoordinates | null;
            const dimension: number = currentZone && typeof currentZone.dimension === 'number'
                ? currentZone.dimension
                : 0;
            // Emit music change event instead of calling soundManager directly
            eventBus.emit(EventTypes.MUSIC_CHANGE, { dimension });
        } catch (e) { /* non-fatal */ }
    }

    addTreasureToInventory(): void {
        // Generate 3-5 random treasure items, respecting inventory limit
        const numItems: number = Math.floor(Math.random() * 3) + 3; // 3 to 5 items
        const treasureTypes: string[] = ['bomb', 'bishop_spear', 'food'];

        for (let i: number = 0; i < numItems; i++) {
            if (this.game.player!.inventory.length >= 6) break; // Stop if inventory is full

            const randomType: string = treasureTypes[Math.floor(Math.random() * treasureTypes.length)];

            if (randomType === 'bomb') {
                this.game.player!.inventory.push({ type: 'bomb' });
                // Emit treasure found event instead of calling UIManager directly
                eventBus.emit(EventTypes.TREASURE_FOUND, {
                    itemType: 'bomb',
                    quantity: 1,
                    message: 'Treasure Found: Bomb added to inventory.'
                });
            } else if (randomType === 'bishop_spear') {
                this.game.player!.inventory.push({ type: 'bishop_spear', uses: 3 });
                eventBus.emit(EventTypes.TREASURE_FOUND, {
                    itemType: 'bishop_spear',
                    quantity: 1,
                    message: 'Treasure Found: Bishop Spear added to inventory.'
                });
            } else if (randomType === 'food' && this.game.availableFoodAssets.length > 0) {
                const randomFood: string = this.game.availableFoodAssets[Math.floor(Math.random() * this.game.availableFoodAssets.length)];
                this.game.player!.inventory.push({ type: 'food', foodType: randomFood });
                eventBus.emit(EventTypes.TREASURE_FOUND, {
                    itemType: 'food',
                    quantity: 1,
                    message: 'Treasure Found: Food added to inventory.'
                });
            }
        }

        // Emit player stats changed event instead of calling UIManager directly
        eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {
            health: this.game.player!.stats.health,
            points: this.game.player!.stats.points,
            hunger: this.game.player!.stats.hunger,
            thirst: this.game.player!.stats.thirst
        });
    }

    // Console command to add bomb to inventory
    addBomb(): void {
        if (this.game.player!.inventory.length < 6) {
            this.game.player!.inventory.push({ type: 'bomb' });
            // Emit player stats changed event instead of calling UIManager directly
            eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {
                health: this.game.player!.stats.health,
                points: this.game.player!.stats.points,
                hunger: this.game.player!.stats.hunger,
                thirst: this.game.player!.stats.thirst
            });
        }
    }

    saveGameState(): void {
        // Public method: schedule a debounced save to avoid blocking main thread
        this.scheduleSave();
    }

    scheduleSave(): void {
        // Cancel any pending save and schedule a new one
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.saveGameStateImmediate(), this.saveDebounceMs);
    }

    saveGameStateImmediate(): void {
        // Immediately write state to storage (used by periodic flush and unload handlers)
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }

        try {
            const gameState: SharedSaveGameData = SaveSerializer.serializeGameState(this.game);

            // Add zone generation state to save
            (gameState as any).zoneGeneration = this.game.zoneGenState.serialize();

            // add metadata
            const payload: SavePayload = {
                version: SAVE_VERSION,
                lastSaved: Date.now(),
                state: gameState
            };

            // Use StorageAdapter (IndexedDB + compression) with requestIdleCallback when available
            const write = async () => {
                try {
                    await this.game.storageAdapter.save(GAME_STATE_KEY, payload);
                } catch (e) {
                    logger.warn('Failed to save with StorageAdapter, trying localStorage fallback:', e);
                    // Emergency fallback to direct localStorage
                    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(payload));
                }
            };

            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    write().catch(e => logger.warn('Failed to save (idle):', e));
                }, { timeout: 2000 });
            } else {
                write().catch(e => logger.warn('Failed to save:', e));
            }
        } catch (error) {
            logger.warn('Failed to save game state:', error);
        }
    }

    async loadGameState(): Promise<boolean> {
        try {
            // Try StorageAdapter first (IndexedDB with compression)
            let payload: SavePayload | null = await this.game.storageAdapter.load(GAME_STATE_KEY);

            // Fallback to localStorage if StorageAdapter didn't find anything
            if (!payload) {
                const savedState: string | null = localStorage.getItem(GAME_STATE_KEY);
                if (!savedState) return false; // No saved state
                payload = JSON.parse(savedState) as SavePayload;
            }

            if (!payload) return false;

            // Support older saves that stored state directly (back-compat)
            // Older saves might not have the wrapper structure
            const gameState: SharedSaveGameData | SerializedGameState = payload && 'state' in payload && payload.state
                ? payload.state
                : payload as unknown as SerializedGameState;
            const version: number = payload && 'version' in payload && payload.version ? payload.version : 1;
            // If version too new, avoid attempting to load incompatible structure
            if (version > SAVE_VERSION) {
                logger.warn('Saved game version is newer than supported. Skipping load.');
                return false;
            }

            // Restore player state
            SaveDeserializer.deserializePlayer(this.game, gameState.player as any);

            // Restore persisted player settings (music/sfx)
            SaveDeserializer.deserializePlayerStats(this.game, gameState.playerStats as any);

            // Restore game state with validation for grid data
            SaveDeserializer.deserializeGameState(this.game, gameState as any);

            // Repair board-based zones that are missing terrain textures (from old saves)
            this._repairBoardZones();

            // Restore current zone's texture and rotation data to zoneGenerator
            this._restoreCurrentZoneTextures();

            // Restore zone generation state (new centralized system)
            if ('zoneGeneration' in gameState && gameState.zoneGeneration) {
                this.game.zoneGenState.deserialize(gameState.zoneGeneration as any);
            } else if ('zoneStateManager' in gameState && gameState.zoneStateManager) {
                // Backward compatibility: migrate from old ZoneStateManager format
                ZoneStateRestorer.restoreZoneState(this.game as any, gameState.zoneStateManager as any);
            }

            return true;
        } catch (error) {
            logger.error('Failed to load game state:', error);
            logger.error('Error stack:', error instanceof Error ? error.stack : undefined);
            // If loading fails, clear corrupted data
            try {
                await this.game.storageAdapter.remove(GAME_STATE_KEY);
            } catch (e) {
                localStorage.removeItem(GAME_STATE_KEY);
            }
            return false;
        }
    }

    async clearSavedState(): Promise<void> {
        try {
            await this.game.storageAdapter.remove(GAME_STATE_KEY);
        } catch (e) {
            // Fallback to localStorage
            localStorage.removeItem(GAME_STATE_KEY);
        }
    }

    // Start periodic autosave
    startAutoSave(): void {
        if (this._saveIntervalId) return;
        this._saveIntervalId = setInterval(() => {
            try {
                this.saveGameStateImmediate();
            } catch (e) {
                logger.warn('Periodic save failed:', e);
            }
        }, this.saveIntervalMs);
    }

    stopAutoSave(): void {
        if (this._saveIntervalId) {
            clearInterval(this._saveIntervalId);
            this._saveIntervalId = null;
        }
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }
    }

    /**
     * Repair board-based zones that are missing terrain textures.
     * This fixes saves created before the InteriorHandler fix.
     */
    private _repairBoardZones(): void {
        const gameExt = this.game as unknown as GameContextExtended;

        // Get all zones from the repository
        const allZones: Array<[string, ZoneData]> = gameExt.zoneRepository.entries();

        for (const [zoneKey, zoneData] of allZones) {
            // Parse the zone key to get coordinates
            // Format: "x,y:dimension" or "x,y:dimension:depth"
            const parts: string[] = zoneKey.split(':');
            const [x, y]: number[] = parts[0].split(',').map(Number);
            const dimension: number = parseInt(parts[1]);

            // Check if this zone should use a board and is missing terrain textures
            const hasBoard: boolean = boardLoader.hasBoard(x, y, dimension);

            if (hasBoard && (!zoneData.terrainTextures || Object.keys(zoneData.terrainTextures).length === 0)) {
                // This zone uses a board but is missing terrain textures - regenerate them
                const boardData: BoardLoaderData | null = boardLoader.getBoardSync(x, y, dimension) as BoardLoaderData | null;
                if (boardData) {
                    const result: BoardLoaderResult = boardLoader.convertBoardToGrid(boardData, this.game.availableFoodAssets) as BoardLoaderResult;
                    // Merge the terrain textures, overlays, rotations, and overlay rotations into the existing zone data
                    zoneData.terrainTextures = result.terrainTextures;
                    zoneData.overlayTextures = result.overlayTextures;
                    zoneData.rotations = result.rotations;
                    zoneData.overlayRotations = result.overlayRotations;
                    // Update playerSpawn if it was missing
                    if (!zoneData.playerSpawn && result.playerSpawn) {
                        zoneData.playerSpawn = result.playerSpawn;
                    }
                    // Update the zone in the repository
                    gameExt.zoneRepository.setByKey(zoneKey, zoneData);
                }
            }
        }
    }

    /**
     * Restore the current zone's terrain textures, overlay textures, rotations, and overlay rotations to zoneGenerator.
     * This ensures custom board tiles are displayed correctly after loading a save.
     */
    private _restoreCurrentZoneTextures(): void {
        if (!this.game.zoneGenerator || !this.game.player) return;

        const gameExt = this.game as unknown as GameContextExtended;
        const playerExt = this.game.player as unknown as PlayerExtended & { undergroundDepth?: number };

        // Get the current zone key based on player's currentZone object
        const currentZone: ZoneWithCoordinates | null = this.game.playerFacade.getCurrentZone() as ZoneWithCoordinates | null;
        if (!currentZone) return;

        const zoneX: number = currentZone.x;
        const zoneY: number = currentZone.y;
        const dimension: number = currentZone.dimension || 0;
        const depth: number = currentZone.depth || (playerExt.undergroundDepth || 1);
        const zoneKey: string = createZoneKey(zoneX, zoneY, dimension, depth);

        // Get the current zone data from repository
        const zoneData: ZoneData | undefined = gameExt.zoneRepository.getByKey(zoneKey);
        if (zoneData) {
            // Apply the zone's texture and rotation data to zoneGenerator
            this.game.zoneGenerator.terrainTextures = zoneData.terrainTextures || {};
            this.game.zoneGenerator.overlayTextures = zoneData.overlayTextures || {};
            this.game.zoneGenerator.rotations = zoneData.rotations || {};
            this.game.zoneGenerator.overlayRotations = zoneData.overlayRotations || {};
        }
    }
}
