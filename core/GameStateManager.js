import { GRID_SIZE, TILE_TYPES } from './constants/index.js';
import { logger } from './logger.js';
import { Sign } from '../ui/Sign.js';
import { validateLoadedGrid } from '../generators/GeneratorUtils.js';
import { eventBus } from './EventBus.js';
import { EventTypes } from './EventTypes.js';
import { ZoneStateManager } from '../generators/ZoneStateManager.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { SaveSerializer } from './SaveSerializer.js';
import { SaveDeserializer } from './SaveDeserializer.js';
import { ZoneStateRestorer } from './ZoneStateRestorer.js';
import { ZoneRepository } from '../repositories/ZoneRepository.js';

const GAME_STATE_KEY = 'chress_game_state';
const SAVE_VERSION = 2; // bump if save format changes

export class GameStateManager {
    constructor(game) {
        this.game = game;
        this.initializeState();
        // Autosave configuration
        this.saveDebounceMs = 750; // debounce writes when many changes happen in quick succession
        this._saveTimer = null;
        this.saveIntervalMs = 30000; // periodic save every 30s
        this._saveIntervalId = null;
    }

    initializeState() {
        // Zone management
        this.game.zoneRepository = new ZoneRepository(); // Centralized zone caching
        this.game.zones = this.game.zoneRepository.getMap(); // Backward compatibility - provides direct Map access (deprecated)
        this.game.grid = null; // Current zone grid
        this.game.enemies = []; // Current zone enemies
        this.game.defeatedEnemies = new Set(); // Tracks defeated enemy positions: "zoneX,zoneY,enemyX,enemyY"
        this.game.gameStarted = false;
        this.game.currentRegion = null; // Tracks current region name to avoid repeated notifications

        // Enemy wait mechanism for zone entry
        this.game.justEnteredZone = false; // Flag to skip enemy movements on zone entry

        // Message Log system
        this.game.messageLog = [];

        // Special zones marked by notes (zoneKey: "x,y" -> items array)
        this.game.specialZones = new Map();
    }

    resetGame() {
        // Preserve config settings
        const prevConfig = {
            musicEnabled: this.game.player.stats && typeof this.game.player.stats.musicEnabled !== 'undefined' ? this.game.player.stats.musicEnabled : true,
            sfxEnabled: this.game.player.stats && typeof this.game.player.stats.sfxEnabled !== 'undefined' ? this.game.player.stats.sfxEnabled : true,
            autoPathWithEnemies: this.game.player.stats && typeof this.game.player.stats.autoPathWithEnemies !== 'undefined' ? this.game.player.stats.autoPathWithEnemies : false
        };

        // Clear saved state since game over should reset everything
        this.clearSavedState();

        // Reset all game state
        this.game.zoneRepository.clear();
        this.game.connectionManager.clear();
        ZoneStateManager.resetSessionData(); // Reset all zone generation state
        Sign.spawnedMessages.clear(); // Reset spawned message tracking
        this.game.specialZones.clear(); // Reset special zones
        this.game.messageLog = []; // Reset message log
        this.game.player.reset();
        this.game.enemies = [];
        this.game.defeatedEnemies = new Set();
        this.game.currentRegion = null; // Reset region tracking
        this.game.lastSignMessage = null; // Reset sign message tracking
        this.game.displayingMessageForSign = null; // Reset sign message display tracking
        this.game.animationManager.clearAll(); // Reset all animations
        this.game.player.spentDiscoveries = 0; // Reset spent discoveries

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
        this.game.player.stats.autoPathWithEnemies = prevConfig.autoPathWithEnemies;

        // Emit game reset event instead of calling UI methods directly
        eventBus.emit(EventTypes.GAME_RESET, {
            zone: initialZone,
            regionName: this.game.currentRegion
        });

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
        // Immediately write state to localStorage (used by periodic flush and unload handlers)
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }

        try {
            const gameState = SaveSerializer.serializeGameState(this.game);

            // add metadata
            const payload = {
                version: SAVE_VERSION,
                lastSaved: Date.now(),
                state: gameState
            };

            // Try to use requestIdleCallback when available to avoid jank
            const write = () => localStorage.setItem(GAME_STATE_KEY, JSON.stringify(payload));
            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    try { write(); } catch (e) { logger.warn('Failed to save (idle):', e); }
                }, { timeout: 2000 });
            } else {
                write();
            }
        } catch (error) {
            logger.warn('Failed to save game state:', error);
        }
    }

    loadGameState() {
        try {
            const savedState = localStorage.getItem(GAME_STATE_KEY);
            if (!savedState) return false; // No saved state

            const payload = JSON.parse(savedState);
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

            // Restore zone state manager statics
            ZoneStateRestorer.restoreZoneState(gameState.zoneStateManager);

            // Restore Sign spawned messages
            SaveDeserializer.deserializeSignMessages(gameState.signSpawnedMessages);

            return true;
        } catch (error) {
            logger.warn('Failed to load game state:', error);
            // If loading fails, clear corrupted data
            localStorage.removeItem(GAME_STATE_KEY);
            return false;
        }
    }

    clearSavedState() {
        localStorage.removeItem(GAME_STATE_KEY);
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
}
