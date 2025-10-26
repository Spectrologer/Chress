import { GRID_SIZE, TILE_TYPES } from './constants.js';
import logger from './logger.js';
import { Sign } from '../ui/Sign.js';
import { validateLoadedGrid } from '../generators/GeneratorUtils.js';
import { eventBus } from './EventBus.js';
import { EventTypes } from './EventTypes.js';
import { ZoneStateManager } from '../generators/ZoneStateManager.js';
import { isWithinGrid } from '../utils/GridUtils.js';

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
        this.game.zones = new Map(); // Stores generated zones by coordinate key
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
        this.game.zones.clear();
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
            const gameState = {
                // Player state
                player: {
                    x: this.game.player.x,
                    y: this.game.player.y,
                    currentZone: this.game.player.currentZone,
                    thirst: this.game.player.getThirst(),
                    hunger: this.game.player.getHunger(),
                    inventory: this.game.player.inventory,
                    abilities: Array.from(this.game.player.abilities),
                    health: this.game.player.getHealth(),
                    dead: this.game.player.dead,
                    sprite: this.game.player.sprite,
                    points: this.game.player.getPoints(),
                    visitedZones: Array.from(this.game.player.visitedZones),
                    spentDiscoveries: this.game.player.getSpentDiscoveries()
                },
                // Player UI/settings (persist toggles - music/sfx)
                playerStats: {
                    musicEnabled: (this.game.player.stats && typeof this.game.player.stats.musicEnabled !== 'undefined') ? !!this.game.player.stats.musicEnabled : true,
                    sfxEnabled: (this.game.player.stats && typeof this.game.player.stats.sfxEnabled !== 'undefined') ? !!this.game.player.stats.sfxEnabled : true,
                    autoPathWithEnemies: (this.game.player.stats && typeof this.game.player.stats.autoPathWithEnemies !== 'undefined') ? !!this.game.player.stats.autoPathWithEnemies : false
                },
                // Game state - save all zones across all dimensions
                zones: Array.from(this.game.zones.entries()),
                grid: this.game.grid,
                enemies: this.game.enemies.map(enemy => ({
                    x: enemy.x,
                    y: enemy.y,
                    enemyType: enemy.enemyType, // Use enemyType property instead of type
                    health: enemy.health,
                    id: enemy.id
                })),
                defeatedEnemies: Array.from(this.game.defeatedEnemies),
                specialZones: Array.from(this.game.specialZones.entries()),
                messageLog: this.game.messageLog,
                currentRegion: this.game.currentRegion,
                bombPlacementMode: this.game.bombPlacementMode,
                bombPlacementPositions: this.game.bombPlacementPositions,
                isInPitfallZone: this.game.isInPitfallZone,
                // Zone state manager counters and flags
                zoneStateManager: {
                    zoneCounter: ZoneStateManager.zoneCounter,
                    enemyCounter: ZoneStateManager.enemyCounter,
                    axeSpawned: ZoneStateManager.axeSpawned,
                    hammerSpawned: ZoneStateManager.hammerSpawned,
                    noteSpawned: ZoneStateManager.noteSpawned,
                    spearSpawned: ZoneStateManager.spearSpawned,
                    horseIconSpawned: ZoneStateManager.horseIconSpawned,
                    penneSpawned: ZoneStateManager.penneSpawned,
                    squigSpawned: ZoneStateManager.squigSpawned,
                    wellSpawned: ZoneStateManager.wellSpawned,
                    deadTreeSpawned: ZoneStateManager.deadTreeSpawned,
                    axeWarningSignPlaced: ZoneStateManager.axeWarningSignPlaced,
                    hammerWarningSignPlaced: ZoneStateManager.hammerWarningSignPlaced,
                    firstFrontierSignPlaced: ZoneStateManager.firstFrontierSignPlaced,
                    axeSpawnZone: ZoneStateManager.axeSpawnZone,
                    hammerSpawnZone: ZoneStateManager.hammerSpawnZone,
                    noteSpawnZone: ZoneStateManager.noteSpawnZone,
                    spearSpawnZone: ZoneStateManager.spearSpawnZone,
                    horseIconSpawnZone: ZoneStateManager.horseIconSpawnZone
                },
                signSpawnedMessages: Array.from(Sign.spawnedMessages)
            };
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
            if (gameState.player) {
                this.game.player.x = gameState.player.x;
                this.game.player.y = gameState.player.y;
                this.game.player.currentZone = gameState.player.currentZone;
                this.game.player.setThirst(gameState.player.thirst);
                this.game.player.setHunger(gameState.player.hunger);
                this.game.player.inventory = gameState.player.inventory;
                this.game.player.abilities = new Set(gameState.player.abilities || []);
                this.game.player.setHealth(gameState.player.health);
                this.game.player.dead = gameState.player.dead;
                this.game.player.sprite = gameState.player.sprite;
                this.game.player.setPoints(gameState.player.points);
                this.game.player.visitedZones = new Set(gameState.player.visitedZones);
                this.game.player.setSpentDiscoveries(gameState.player.spentDiscoveries);
            }

            // Restore persisted player settings (music/sfx)
            if (gameState.playerStats) {
                try {
                    this.game.player.stats = this.game.player.stats || {};
                    this.game.player.stats.musicEnabled = typeof gameState.playerStats.musicEnabled !== 'undefined' ? !!gameState.playerStats.musicEnabled : true;
                    this.game.player.stats.sfxEnabled = typeof gameState.playerStats.sfxEnabled !== 'undefined' ? !!gameState.playerStats.sfxEnabled : true;
                    this.game.player.stats.autoPathWithEnemies = typeof gameState.playerStats.autoPathWithEnemies !== 'undefined' ? !!gameState.playerStats.autoPathWithEnemies : false;

                    // Do NOT call into SoundManager here. Applying audio settings may start
                    // playback or create/resume an AudioContext before a user gesture which
                    // violates autoplay policies. The overlay Start/Continue handlers will
                    // resume the audio context and apply these saved preferences after a
                    // user gesture.
                } catch (e) {}
            }

            // Restore game state with validation for grid data
            this.game.zones = new Map(gameState.zones || []);
            this.game.grid = validateLoadedGrid(gameState.grid);
            this.game.enemies = (gameState.enemies || []).map(e => new this.game.Enemy(e));
            this.game.defeatedEnemies = new Set(gameState.defeatedEnemies || []);
            this.game.specialZones = new Map(gameState.specialZones || []);
            this.game.messageLog = gameState.messageLog || [];
            this.game.currentRegion = gameState.currentRegion || null;
            this.game.bombPlacementMode = gameState.bombPlacementMode || false;
            this.game.bombPlacementPositions = gameState.bombPlacementPositions || [];
            this.game.isInPitfallZone = gameState.isInPitfallZone || false;

            // Restore zone state manager statics
            if (gameState.zoneStateManager) {
                ZoneStateManager.zoneCounter = gameState.zoneStateManager.zoneCounter || 0;
                ZoneStateManager.enemyCounter = gameState.zoneStateManager.enemyCounter || 0;
                ZoneStateManager.axeSpawned = gameState.zoneStateManager.axeSpawned || false;
                ZoneStateManager.hammerSpawned = gameState.zoneStateManager.hammerSpawned || false;
                ZoneStateManager.noteSpawned = gameState.zoneStateManager.noteSpawned || false;
                ZoneStateManager.spearSpawned = gameState.zoneStateManager.spearSpawned || false;
                ZoneStateManager.horseIconSpawned = gameState.zoneStateManager.horseIconSpawned || false;
                ZoneStateManager.penneSpawned = gameState.zoneStateManager.penneSpawned || false;
                ZoneStateManager.squigSpawned = gameState.zoneStateManager.squigSpawned || false;
                ZoneStateManager.wellSpawned = gameState.zoneStateManager.wellSpawned || false;
                ZoneStateManager.deadTreeSpawned = gameState.zoneStateManager.deadTreeSpawned || false;
                ZoneStateManager.axeWarningSignPlaced = gameState.zoneStateManager.axeWarningSignPlaced || false;
                ZoneStateManager.hammerWarningSignPlaced = gameState.zoneStateManager.hammerWarningSignPlaced || false;
                ZoneStateManager.firstFrontierSignPlaced = gameState.zoneStateManager.firstFrontierSignPlaced || false;
                ZoneStateManager.axeSpawnZone = gameState.zoneStateManager.axeSpawnZone || null;
                ZoneStateManager.hammerSpawnZone = gameState.zoneStateManager.hammerSpawnZone || null;
                ZoneStateManager.noteSpawnZone = gameState.zoneStateManager.noteSpawnZone || null;
                ZoneStateManager.spearSpawnZone = gameState.zoneStateManager.spearSpawnZone || null;
                ZoneStateManager.horseIconSpawnZone = gameState.zoneStateManager.horseIconSpawnZone || null;
            }

            // Restore Sign spawned messages
            Sign.spawnedMessages = new Set(gameState.signSpawnedMessages || []);

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
