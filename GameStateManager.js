import { GRID_SIZE, TILE_TYPES } from './constants.js';
import { Sign } from './Sign.js';

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
        this.game.showEnemyAttackRanges = false;

        // Special zones marked by notes (zoneKey: "x,y" -> items array)
        this.game.specialZones = new Map();
    }

    resetGame() {
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
        this.game.showEnemyAttackRanges = false;

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
}
