import { GRID_SIZE, TILE_SIZE, CANVAS_SIZE, TILE_TYPES, FOOD_ASSETS } from './constants.js';
import { TextureManager } from './TextureManager.js';
import { ConnectionManager } from './ConnectionManager.js';
import { ZoneGenerator } from './ZoneGenerator.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Sign } from './Sign.js';
import { InputManager } from './InputManager.js';
import { InventoryManager } from './InventoryManager.js';
import { UIManager } from './UIManager.js';
import { RenderManager } from './RenderManager.js';
import { CombatManager } from './CombatManager.js';
import { InteractionManager } from './InteractionManager.js';
import { ZoneManager } from './ZoneManager.js';
import { GameStateManager } from './GameStateManager.js';
import { SoundManager } from './SoundManager.js';

export class GameInitializer {
    constructor(game) {
        this.game = game;
        this.setupCanvasSize();
    }

    setupCanvasSize() {
        // Set internal canvas size to maintain pixel-perfect rendering
        this.game.canvas = document.getElementById('gameCanvas');
        this.game.ctx = this.game.canvas.getContext('2d');
        this.game.mapCanvas = document.getElementById('zoneMap');
        this.game.mapCtx = this.game.mapCanvas.getContext('2d');

        // Set canvas sizes
        this.game.canvas.width = CANVAS_SIZE;
        this.game.canvas.height = CANVAS_SIZE;

        // Set map canvas size dynamically based on CSS
        this.updateMapCanvasSize();

        // Handle resize for responsive design
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    updateMapCanvasSize() {
        // Get the computed style to match CSS sizing
        const computedStyle = window.getComputedStyle(this.game.mapCanvas);
        const cssWidth = parseInt(computedStyle.width);
        const cssHeight = parseInt(computedStyle.height);

        // Set canvas internal size to match CSS display size for crisp rendering
        this.game.mapCanvas.width = cssWidth;
        this.game.mapCanvas.height = cssHeight;

        // Reapply canvas configuration for crisp rendering
        TextureManager.configureCanvas(this.game.mapCtx);
    }

    handleResize() {
        // Update map canvas size on resize
        this.updateMapCanvasSize();
        // Re-render the zone map with new size
        if (this.game.gameStarted) {
            this.game.uiManager.renderZoneMap();
        }
        // Let CSS handle the display size for responsiveness
        // The main canvas internal size stays fixed for pixel-perfect rendering
    }

    async loadAssets() {
        try {
            await this.game.textureManager.loadAssets();
            // Filter food assets to only those that loaded successfully
            this.game.availableFoodAssets = FOOD_ASSETS.filter(foodAsset => {
                const foodKey = foodAsset.replace('.png', '').replace('/', '_');
                return this.game.textureManager.isImageLoaded(foodKey);
            });
            this.startGame();
        } catch (error) {
            console.error('Error loading assets:', error);
            this.game.availableFoodAssets = []; // No foods if loading failed
            this.startGame(); // Start anyway with fallback colors
        }
    }

    startGame() {
        if (this.game.gameStarted) return; // Prevent multiple initializations
        this.game.gameStarted = true;
        this.init();
    }

    init() {
        // Initialize visual effect animations
        this.game.horseChargeAnimations = [];
        // Bomb placement mode
        this.game.bombPlacementMode = false;
        this.game.bombPlacementPositions = [];
        this.game.pendingCharge = null;

        // Try to load saved game state, or generate initial zone if no save exists
        const loaded = this.game.gameStateManager.loadGameState();
        if (!loaded) {
            // Generate initial zone if no saved state
            this.game.generateZone();

            // Ensure player starts on a valid tile, but do not overwrite signs
            const startTile = this.game.grid[this.game.player.y][this.game.player.x];
            if (!startTile || (typeof startTile === 'string' && startTile !== TILE_TYPES.SIGN) || (typeof startTile === 'object' && startTile.type !== TILE_TYPES.SIGN)) {
                this.game.grid[this.game.player.y][this.game.player.x] = TILE_TYPES.FLOOR;
            }

            // Set initial region (starting at 0,0 = "Home")
            const initialZone = this.game.player.getCurrentZone();
            this.game.currentRegion = this.game.uiManager.generateRegionName(initialZone.x, initialZone.y);
        } else {
            // If loaded from save, make sure we're on a valid tile
            // But don't clear the grid since it was loaded from save
            if (this.game.grid) {
                this.game.player.ensureValidPosition(this.game.grid);
                const currentZone = this.game.player.getCurrentZone();
                this.game.currentRegion = this.game.uiManager.generateRegionName(currentZone.x, currentZone.y);
                // Ensure zoneGenerator.grid points to the loaded grid
                this.game.zoneGenerator.grid = this.game.grid;
            } else {
                // Fallback: generate zone if grid wasn't loaded properly
                this.game.generateZone();
                this.game.grid[this.game.player.y][this.game.player.x] = TILE_TYPES.FLOOR;
                const initialZone = this.game.player.getCurrentZone();
                this.game.currentRegion = this.game.uiManager.generateRegionName(initialZone.x, initialZone.y);
            }
        }

        // Set up event listeners
        this.game.inputManager.setupControls();
        this.game.uiManager.setupGameOverHandler();
        this.game.uiManager.setupCloseMessageLogHandler();
        this.game.uiManager.setupMessageLogButton();
        this.game.uiManager.setupBarterHandlers();

        // Save game state before page unload
        window.addEventListener('beforeunload', () => {
            this.game.gameStateManager.saveGameState();
        });

        // Save game state when page becomes hidden (user switches tabs/switches apps)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.game.gameStateManager.saveGameState();
            }
        });

        // Make soundManager global for easy access from other classes
        window.soundManager = this.game.soundManager;

        // Start game loop
        this.game.gameLoop();

        // Expose game instance to console for debugging/cheating
        window.game = this.game;
        window.gameInstance = this.game;

        // Import and expose console commands
        import('./consoleCommands.js').then(module => {
            window.consoleCommands = module.default;
            // Expose individual commands for easier access
            window.tp = (x, y) => module.default.tp(this.game, x, y);
            window.spawnHorseIcon = () => module.default.spawnHorseIcon(this.game);
            window.gotoInterior = () => module.default.gotoInterior(this.game);
            window.gotoWorld = () => module.default.gotoWorld(this.game);
        });

        // Update UI
        this.game.uiManager.updatePlayerPosition();
        this.game.uiManager.updateZoneDisplay();
        this.game.uiManager.updatePlayerStats();
    }

    generateZone() {
        this.game.zoneManager.generateZone();
    }

    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        this.game.zoneManager.transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY);
    }

    resetGame() {
        this.game.gameStateManager.resetGame();
    }
}
