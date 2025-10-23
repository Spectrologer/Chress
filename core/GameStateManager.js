import { GRID_SIZE, TILE_TYPES } from './constants.js';
import logger from './logger.js';
import { Sign } from '../ui/Sign.js';
import { validateLoadedGrid } from '../generators/GeneratorUtils.js';

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
        // Clear saved state since game over should reset everything
        this.clearSavedState();

        // Reset all game state
        this.game.zones.clear();
        this.game.connectionManager.clear();
        this.game.zoneGenerator.constructor.zoneCounter = 0; // Reset zone counter for progressive difficulty
        this.game.zoneGenerator.constructor.axeSpawned = false; // Reset axe spawn
        this.game.zoneGenerator.constructor.hammerSpawned = false; // Reset hammer spawn
        this.game.zoneGenerator.constructor.noteSpawned = false; // Reset note spawn
        this.game.zoneGenerator.constructor.spearSpawned = false; // Reset spear spawn
        this.game.zoneGenerator.constructor.lionSpawned = false; // Reset lion spawn
        this.game.zoneGenerator.constructor.squigSpawned = false; // Reset squig spawn
        this.game.zoneGenerator.constructor.foodWaterRoomSpawned = false; // Reset food/water room spawn
        Sign.spawnedMessages.clear(); // Reset spawned message tracking
        this.game.specialZones.clear(); // Reset special zones
        this.game.messageLog = []; // Reset message log
        this.game.player.reset();
        this.game.enemies = [];
        this.game.defeatedEnemies = new Set();
        this.game.currentRegion = null; // Reset region tracking
        this.game.lastSignMessage = null; // Reset sign message tracking
        this.game.displayingMessageForSign = null; // Reset sign message display tracking
        this.game.horseChargeAnimations = []; // Reset horse charge animations
        this.game.player.spentDiscoveries = 0; // Reset spent discoveries

        // Generate starting zone
        this.game.zoneManager.generateZone();
        this.game.grid[this.game.player.y][this.game.player.x] = TILE_TYPES.FLOOR;

        // Set initial region
        const initialZone = this.game.player.getCurrentZone();
        this.game.currentRegion = this.game.uiManager.generateRegionName(initialZone.x, initialZone.y);

        // Update UI
        this.game.uiManager.updatePlayerPosition();
        this.game.uiManager.updateZoneDisplay();
        this.game.uiManager.updatePlayerStats();
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
                this.game.uiManager.addMessageToLog('Treasure Found: Bomb added to inventory.');
            } else if (randomType === 'bishop_spear') {
                this.game.player.inventory.push({ type: 'bishop_spear', uses: 3 });
                this.game.uiManager.addMessageToLog('Treasure Found: Bishop Spear added to inventory.');
            } else if (randomType === 'food' && this.game.availableFoodAssets.length > 0) {
                const randomFood = this.game.availableFoodAssets[Math.floor(Math.random() * this.game.availableFoodAssets.length)];
                this.game.player.inventory.push({ type: 'food', foodType: randomFood });
                this.game.uiManager.addMessageToLog('Treasure Found: Food added to inventory.');
            }
        }

        this.game.uiManager.updatePlayerStats(); // Refresh UI
    }

    // Console command to add bomb to inventory
    addBomb() {
        if (this.game.player.inventory.length < 6) {
            this.game.player.inventory.push({ type: 'bomb' });
            this.game.uiManager.updatePlayerStats();
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
                    zoneCounter: this.game.zoneGenerator.constructor.zoneCounter,
                    enemyCounter: this.game.zoneGenerator.constructor.enemyCounter,
                    axeSpawned: this.game.zoneGenerator.constructor.axeSpawned,
                    hammerSpawned: this.game.zoneGenerator.constructor.hammerSpawned,
                    noteSpawned: this.game.zoneGenerator.constructor.noteSpawned,
                    spearSpawned: this.game.zoneGenerator.constructor.spearSpawned,
                    horseIconSpawned: this.game.zoneGenerator.constructor.horseIconSpawned,
                    lionSpawned: this.game.zoneGenerator.constructor.lionSpawned,
                    squigSpawned: this.game.zoneGenerator.constructor.squigSpawned,
                    wellSpawned: this.game.zoneGenerator.constructor.wellSpawned,
                    deadTreeSpawned: this.game.zoneGenerator.constructor.deadTreeSpawned,
                    axeWarningSignPlaced: this.game.zoneGenerator.constructor.axeWarningSignPlaced,
                    hammerWarningSignPlaced: this.game.zoneGenerator.constructor.hammerWarningSignPlaced,
                    firstFrontierSignPlaced: this.game.zoneGenerator.constructor.firstFrontierSignPlaced,
                    axeSpawnZone: this.game.zoneGenerator.constructor.axeSpawnZone,
                    hammerSpawnZone: this.game.zoneGenerator.constructor.hammerSpawnZone,
                    noteSpawnZone: this.game.zoneGenerator.constructor.noteSpawnZone,
                    spearSpawnZone: this.game.zoneGenerator.constructor.spearSpawnZone,
                    horseIconSpawnZone: this.game.zoneGenerator.constructor.horseIconSpawnZone
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
                this.game.zoneGenerator.constructor.zoneCounter = gameState.zoneStateManager.zoneCounter || 0;
                this.game.zoneGenerator.constructor.enemyCounter = gameState.zoneStateManager.enemyCounter || 0;
                this.game.zoneGenerator.constructor.axeSpawned = gameState.zoneStateManager.axeSpawned || false;
                this.game.zoneGenerator.constructor.hammerSpawned = gameState.zoneStateManager.hammerSpawned || false;
                this.game.zoneGenerator.constructor.noteSpawned = gameState.zoneStateManager.noteSpawned || false;
                this.game.zoneGenerator.constructor.spearSpawned = gameState.zoneStateManager.spearSpawned || false;
                this.game.zoneGenerator.constructor.horseIconSpawned = gameState.zoneStateManager.horseIconSpawned || false;
                this.game.zoneGenerator.constructor.lionSpawned = gameState.zoneStateManager.lionSpawned || false;
                this.game.zoneGenerator.constructor.squigSpawned = gameState.zoneStateManager.squigSpawned || false;
                this.game.zoneGenerator.constructor.wellSpawned = gameState.zoneStateManager.wellSpawned || false;
                this.game.zoneGenerator.constructor.deadTreeSpawned = gameState.zoneStateManager.deadTreeSpawned || false;
                this.game.zoneGenerator.constructor.axeWarningSignPlaced = gameState.zoneStateManager.axeWarningSignPlaced || false;
                this.game.zoneGenerator.constructor.hammerWarningSignPlaced = gameState.zoneStateManager.hammerWarningSignPlaced || false;
                this.game.zoneGenerator.constructor.firstFrontierSignPlaced = gameState.zoneStateManager.firstFrontierSignPlaced || false;
                this.game.zoneGenerator.constructor.axeSpawnZone = gameState.zoneStateManager.axeSpawnZone || null;
                this.game.zoneGenerator.constructor.hammerSpawnZone = gameState.zoneStateManager.hammerSpawnZone || null;
                this.game.zoneGenerator.constructor.noteSpawnZone = gameState.zoneStateManager.noteSpawnZone || null;
                this.game.zoneGenerator.constructor.spearSpawnZone = gameState.zoneStateManager.spearSpawnZone || null;
                this.game.zoneGenerator.constructor.horseIconSpawnZone = gameState.zoneStateManager.horseIconSpawnZone || null;
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
