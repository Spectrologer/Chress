import { GRID_SIZE, TILE_TYPES } from './constants.js';
import { Sign } from './Sign.js';

const GAME_STATE_KEY = 'chress_game_state';

export class GameStateManager {
    constructor(game) {
        this.game = game;
        this.initializeState();
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
        // Generate 3-5 random treasure items regardless of inventory space
        const numItems = Math.floor(Math.random() * 3) + 3; // 3 to 5 items
        const treasureTypes = ['bomb', 'bishop_spear', 'food'];

        for (let i = 0; i < numItems; i++) {
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

        // Remove excess items beyond inventory limit (6), keeping the most recently added
        if (this.game.player.inventory.length > 6) {
            const excessItems = this.game.player.inventory.length - 6;
            this.game.player.inventory.splice(0, excessItems); // Remove from the beginning
            this.game.uiManager.addMessageToLog(`Inventory overflow: ${excessItems} item(s) were lost.`);
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
        try {
            const gameState = {
                // Player state
                player: {
                    x: this.game.player.x,
                    y: this.game.player.y,
                    currentZone: this.game.player.currentZone,
                    thirst: this.game.player.thirst,
                    hunger: this.game.player.hunger,
                    inventory: this.game.player.inventory,
                    health: this.game.player.health,
                    dead: this.game.player.dead,
                    sprite: this.game.player.sprite,
                    visitedZones: Array.from(this.game.player.visitedZones),
                    smellOranges: this.game.player.smellOranges,
                    smellLemons: this.game.player.smellLemons
                },
                // Game state
                zones: Array.from(this.game.zones.entries()),
                grid: this.game.grid,
                enemies: this.game.enemies.map(enemy => ({
                    x: enemy.x,
                    y: enemy.y,
                    health: enemy.health,
                    type: enemy.type,
                    sprite: enemy.sprite,
                    id: enemy.id
                })),
                defeatedEnemies: Array.from(this.game.defeatedEnemies),
                specialZones: Array.from(this.game.specialZones.entries()),
                messageLog: this.game.messageLog,
                currentRegion: this.game.currentRegion,
                bombPlacementMode: this.game.bombPlacementMode,
                bombPlacementPositions: this.game.bombPlacementPositions,
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
                    puzzleZoneSpawned: this.game.zoneGenerator.constructor.puzzleZoneSpawned,
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

            localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
        } catch (error) {
            console.warn('Failed to save game state:', error);
        }
    }

    loadGameState() {
        try {
            const savedState = localStorage.getItem(GAME_STATE_KEY);
            if (!savedState) return false; // No saved state

            const gameState = JSON.parse(savedState);

            // Restore player state
            if (gameState.player) {
                this.game.player.x = gameState.player.x;
                this.game.player.y = gameState.player.y;
                this.game.player.currentZone = gameState.player.currentZone;
                this.game.player.thirst = gameState.player.thirst;
                this.game.player.hunger = gameState.player.hunger;
                this.game.player.inventory = gameState.player.inventory;
                this.game.player.health = gameState.player.health;
                this.game.player.dead = gameState.player.dead;
                this.game.player.sprite = gameState.player.sprite;
                this.game.player.visitedZones = new Set(gameState.player.visitedZones);
                this.game.player.smellOranges = gameState.player.smellOranges;
                this.game.player.smellLemons = gameState.player.smellLemons;
            }

            // Restore game state
            this.game.zones = new Map(gameState.zones || []);
            this.game.grid = gameState.grid;
            this.game.enemies = (gameState.enemies || []).map(e => new this.game.Enemy(e));
            this.game.defeatedEnemies = new Set(gameState.defeatedEnemies || []);
            this.game.specialZones = new Map(gameState.specialZones || []);
            this.game.messageLog = gameState.messageLog || [];
            this.game.currentRegion = gameState.currentRegion || null;
            this.game.bombPlacementMode = gameState.bombPlacementMode || false;
            this.game.bombPlacementPositions = gameState.bombPlacementPositions || [];

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
                this.game.zoneGenerator.constructor.puzzleZoneSpawned = gameState.zoneStateManager.puzzleZoneSpawned || false;
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
            console.warn('Failed to load game state:', error);
            // If loading fails, clear corrupted data
            localStorage.removeItem(GAME_STATE_KEY);
            return false;
        }
    }

    clearSavedState() {
        localStorage.removeItem(GAME_STATE_KEY);
    }
}
