import { GRID_SIZE, TILE_TYPES } from './constants/index.js';
import { UI_TIMING_CONSTANTS } from './constants/ui.js';
import { logger } from './logger.ts';
import { Sign } from '../ui/Sign.js';
import { validateLoadedGrid } from '../generators/GeneratorUtils.js';
import { eventBus } from './EventBus.ts';
import { EventTypes } from './EventTypes.ts';
import { ZoneStateManager } from '../generators/ZoneStateManager.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { SaveSerializer } from './SaveSerializer.js';
import { SaveDeserializer } from './SaveDeserializer.js';
import { ZoneStateRestorer } from './ZoneStateRestorer.js';
import { ZoneRepository } from '../repositories/ZoneRepository.js';
import { boardLoader } from './BoardLoader.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';

const GAME_STATE_KEY = 'chress_game_state';
const SAVE_VERSION = 2; // bump if save format changes

export class GameStateManager {
    constructor(game) {
        this.game = game;
        this.initializeState();
        // Autosave configuration
        this.saveDebounceMs = UI_TIMING_CONSTANTS.SAVE_DEBOUNCE_MS; // debounce writes when many changes happen in quick succession
        this._saveTimer = null;
        this.saveIntervalMs = UI_TIMING_CONSTANTS.SAVE_INTERVAL_MS; // periodic save every 30s
        this._saveIntervalId = null;
    }

    initializeState() {
        // Zone management
        this.game.zoneRepository = new ZoneRepository(); // Centralized zone caching
        this.game.zones = this.game.zoneRepository.getMap(); // Backward compatibility - provides direct Map access (deprecated)
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
        this.game.justEnteredZone = false; // Flag to skip enemy movements on zone entry

        // Message Log system
        this.game.messageLog = [];

        // Special zones marked by notes (zoneKey: "x,y" -> items array)
        this.game.specialZones = new Map();

        // NPC dialogue state tracking (maps npcType -> dialogue data with currentMessageIndex)
        this.game.dialogueState = new Map();

        // Zone transition tracking (used to determine if player is entering from an exit or starting new game)
        this.game.lastExitSide = null; // null for new games, set during zone transitions
        this.game._newGameSpawnPosition = null; // Stores exit tile position for entrance animation
    }

    resetGame() {
        // Preserve config settings
        const prevConfig = {
            musicEnabled: this.game.player.stats && typeof this.game.player.stats.musicEnabled !== 'undefined' ? this.game.player.stats.musicEnabled : true,
            sfxEnabled: this.game.player.stats && typeof this.game.player.stats.sfxEnabled !== 'undefined' ? this.game.player.stats.sfxEnabled : true
        };

        // Clear saved state since game over should reset everything
        this.clearSavedState();

        // Reset all game state
        this.game.zoneRepository.clear();
        this.game.connectionManager.clear();
        this.game.zoneGenState.reset(); // Reset zone generation state (replaces ZoneStateManager.resetSessionData())
        Sign.spawnedMessages.clear(); // Reset spawned message tracking
        this.game.specialZones.clear(); // Reset special zones
        this.game.messageLog = []; // Reset message log
        if (this.game.dialogueState) {
            this.game.dialogueState.clear(); // Reset NPC dialogue progression
        }
        this.game.player.reset();
        // IMPORTANT: Clear the array instead of reassigning to preserve EnemyCollection reference
        if (this.game.enemyCollection) {
            this.game.enemyCollection.clear(false); // Clear without emitting event
        } else {
            this.game.enemies.length = 0; // Fallback if enemyCollection not yet initialized
        }
        this.game.defeatedEnemies = new Set();
        this.game.currentRegion = null; // Reset region tracking
        this.game.lastSignMessage = null; // Reset sign message tracking
        this.game.displayingMessageForSign = null; // Reset sign message display tracking
        this.game.animationManager.clearAll(); // Reset all animations
        this.game.player.spentDiscoveries = 0; // Reset spent discoveries
        this.game.lastExitSide = null; // Reset for new game entrance animation
        this.game._newGameSpawnPosition = null; // Reset entrance animation spawn position

        // Generate starting zone
        this.game.zoneManager.generateZone();

        // Only set tile if player is within grid bounds (for new games, player may be off-screen)
        const playerY = this.game.player.y;
        const playerX = this.game.player.x;
        if (isWithinGrid(playerX, playerY)) {
            this.game.grid[playerY][playerX] = TILE_TYPES.FLOOR;
        }

        // Set initial region
        const initialZone = this.game.player.getCurrentZone();
        this.game.currentRegion = this.game.uiManager.generateRegionName(initialZone.x, initialZone.y);

        // Restore config settings
        if (!this.game.player.stats) this.game.player.stats = {};
        this.game.player.stats.musicEnabled = prevConfig.musicEnabled;
        this.game.player.stats.sfxEnabled = prevConfig.sfxEnabled;

        // Trigger entrance animation for new game BEFORE emitting events
        // This ensures input is blocked before any event handlers could process clicks
        const shouldTriggerEntrance = this.game.gameInitializer && this.game._newGameSpawnPosition;
        if (shouldTriggerEntrance) {
            // Pre-emptively block input to prevent race conditions with queued mouse events
            this.game._entranceAnimationInProgress = true;
        }

        // Emit game reset event instead of calling UI methods directly
        eventBus.emit(EventTypes.GAME_RESET, {
            zone: initialZone,
            regionName: this.game.currentRegion
        });

        // Now trigger the entrance animation (flag already set above)
        if (shouldTriggerEntrance) {
            this.game.gameInitializer.triggerNewGameEntrance();
        }

        // Ensure background music matches the new starting zone so any previous
        // underground track doesn't continue playing after a respawn/reset.
        try {
            const dimension = this.game.player.currentZone && typeof this.game.player.currentZone.dimension === 'number'
                ? this.game.player.currentZone.dimension
                : 0;
            // Emit music change event instead of calling soundManager directly
            eventBus.emit(EventTypes.MUSIC_CHANGE, { dimension });
        } catch (e) { /* non-fatal */ }
    }

    addTreasureToInventory() {
        // Generate 3-5 random treasure items, respecting inventory limit
        const numItems = Math.floor(Math.random() * 3) + 3; // 3 to 5 items
        const treasureTypes = ['bomb', 'bishop_spear', 'food'];

        for (let i = 0; i < numItems; i++) {
            if (this.game.player.inventory.length >= 6) break; // Stop if inventory is full

            const randomType = treasureTypes[Math.floor(Math.random() * treasureTypes.length)];

            if (randomType === 'bomb') {
                this.game.player.inventory.push({ type: 'bomb' });
                // Emit treasure found event instead of calling UIManager directly
                eventBus.emit(EventTypes.TREASURE_FOUND, {
                    itemType: 'bomb',
                    quantity: 1,
                    message: 'Treasure Found: Bomb added to inventory.'
                });
            } else if (randomType === 'bishop_spear') {
                this.game.player.inventory.push({ type: 'bishop_spear', uses: 3 });
                eventBus.emit(EventTypes.TREASURE_FOUND, {
                    itemType: 'bishop_spear',
                    quantity: 1,
                    message: 'Treasure Found: Bishop Spear added to inventory.'
                });
            } else if (randomType === 'food' && this.game.availableFoodAssets.length > 0) {
                const randomFood = this.game.availableFoodAssets[Math.floor(Math.random() * this.game.availableFoodAssets.length)];
                this.game.player.inventory.push({ type: 'food', foodType: randomFood });
                eventBus.emit(EventTypes.TREASURE_FOUND, {
                    itemType: 'food',
                    quantity: 1,
                    message: 'Treasure Found: Food added to inventory.'
                });
            }
        }

        // Emit player stats changed event instead of calling UIManager directly
        eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {
            health: this.game.player.health,
            points: this.game.player.points,
            hunger: this.game.player.hunger,
            thirst: this.game.player.thirst
        });
    }

    // Console command to add bomb to inventory
    addBomb() {
        if (this.game.player.inventory.length < 6) {
            this.game.player.inventory.push({ type: 'bomb' });
            // Emit player stats changed event instead of calling UIManager directly
            eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {
                health: this.game.player.health,
                points: this.game.player.points,
                hunger: this.game.player.hunger,
                thirst: this.game.player.thirst
            });
        }
    }

    saveGameState() {
        // Public method: schedule a debounced save to avoid blocking main thread
        this.scheduleSave();
    }

    scheduleSave() {
        // Cancel any pending save and schedule a new one
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.saveGameStateImmediate(), this.saveDebounceMs);
    }

    saveGameStateImmediate() {
        // Immediately write state to storage (used by periodic flush and unload handlers)
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }

        try {
            const gameState = SaveSerializer.serializeGameState(this.game);

            // Add zone generation state to save
            gameState.zoneGeneration = this.game.zoneGenState.serialize();

            // add metadata
            const payload = {
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

    async loadGameState() {
        try {
            // Try StorageAdapter first (IndexedDB with compression)
            let payload = await this.game.storageAdapter.load(GAME_STATE_KEY);

            // Fallback to localStorage if StorageAdapter didn't find anything
            if (!payload) {
                const savedState = localStorage.getItem(GAME_STATE_KEY);
                if (!savedState) return false; // No saved state
                payload = JSON.parse(savedState);
            }

            if (!payload) return false;

            // Support older saves that stored state directly (back-compat)
            const gameState = payload && payload.state ? payload.state : payload;
            const version = payload && payload.version ? payload.version : 1;
            // If version too new, avoid attempting to load incompatible structure
            if (version > SAVE_VERSION) {
                logger.warn('Saved game version is newer than supported. Skipping load.');
                return false;
            }

            // Restore player state
            SaveDeserializer.deserializePlayer(this.game, gameState.player);

            // Restore persisted player settings (music/sfx)
            SaveDeserializer.deserializePlayerStats(this.game, gameState.playerStats);

            // Restore game state with validation for grid data
            SaveDeserializer.deserializeGameState(this.game, gameState);

            // Repair board-based zones that are missing terrain textures (from old saves)
            this._repairBoardZones();

            // Restore current zone's texture and rotation data to zoneGenerator
            this._restoreCurrentZoneTextures();

            // Restore zone generation state (new centralized system)
            if (gameState.zoneGeneration) {
                this.game.zoneGenState.deserialize(gameState.zoneGeneration);
            } else {
                // Backward compatibility: migrate from old ZoneStateManager format
                ZoneStateRestorer.restoreZoneState(this.game, gameState.zoneStateManager);
            }

            return true;
        } catch (error) {
            logger.error('Failed to load game state:', error);
            logger.error('Error stack:', error.stack);
            // If loading fails, clear corrupted data
            try {
                await this.game.storageAdapter.remove(GAME_STATE_KEY);
            } catch (e) {
                localStorage.removeItem(GAME_STATE_KEY);
            }
            return false;
        }
    }

    async clearSavedState() {
        try {
            await this.game.storageAdapter.remove(GAME_STATE_KEY);
        } catch (e) {
            // Fallback to localStorage
            localStorage.removeItem(GAME_STATE_KEY);
        }
    }

    // Start periodic autosave
    startAutoSave() {
        if (this._saveIntervalId) return;
        this._saveIntervalId = setInterval(() => {
            try {
                this.saveGameStateImmediate();
            } catch (e) {
                logger.warn('Periodic save failed:', e);
            }
        }, this.saveIntervalMs);
    }

    stopAutoSave() {
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
     * Repair board-based zones that are missing terrain textures
     * This fixes saves created before the InteriorHandler fix
     * @private
     */
    _repairBoardZones() {
        // Get all zones from the repository
        const allZones = this.game.zoneRepository.entries();

        for (const [zoneKey, zoneData] of allZones) {
            // Parse the zone key to get coordinates
            // Format: "x,y:dimension" or "x,y:dimension:depth"
            const parts = zoneKey.split(':');
            const [x, y] = parts[0].split(',').map(Number);
            const dimension = parseInt(parts[1]);

            // Check if this zone should use a board and is missing terrain textures
            const hasBoard = boardLoader.hasBoard(x, y, dimension);

            if (hasBoard && (!zoneData.terrainTextures || Object.keys(zoneData.terrainTextures).length === 0)) {
                // This zone uses a board but is missing terrain textures - regenerate them
                const boardData = boardLoader.getBoardSync(x, y, dimension);
                if (boardData) {
                    const result = boardLoader.convertBoardToGrid(boardData, this.game.availableFoodAssets);
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
                    this.game.zoneRepository.setByKey(zoneKey, zoneData);
                }
            }
        }
    }

    /**
     * Restore the current zone's terrain textures, overlay textures, rotations, and overlay rotations to zoneGenerator
     * This ensures custom board tiles are displayed correctly after loading a save
     * @private
     */
    _restoreCurrentZoneTextures() {
        if (!this.game.zoneGenerator || !this.game.player) return;

        // Get the current zone key based on player's currentZone object
        const currentZone = this.game.player.currentZone;
        if (!currentZone) return;

        const zoneX = currentZone.x;
        const zoneY = currentZone.y;
        const dimension = currentZone.dimension || 0;
        const depth = currentZone.depth || (this.game.player.undergroundDepth || 1);
        const zoneKey = createZoneKey(zoneX, zoneY, dimension, depth);

        // Get the current zone data from repository
        const zoneData = this.game.zoneRepository.getByKey(zoneKey);
        if (zoneData) {
            // Apply the zone's texture and rotation data to zoneGenerator
            this.game.zoneGenerator.terrainTextures = zoneData.terrainTextures || {};
            this.game.zoneGenerator.overlayTextures = zoneData.overlayTextures || {};
            this.game.zoneGenerator.rotations = zoneData.rotations || {};
            this.game.zoneGenerator.overlayRotations = zoneData.overlayRotations || {};
        }
    }
}
