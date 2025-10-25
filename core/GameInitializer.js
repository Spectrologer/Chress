import { GRID_SIZE, CANVAS_SIZE, TILE_TYPES } from './constants.js';
import logger from './logger.js';
import { TextureManager } from '../renderers/TextureManager.js';
import { ZoneStateManager } from '../generators/ZoneStateManager.js';

/**
 * GameInitializer
 *
 * Responsible for bootstrapping the game:
 * - Canvas setup and configuration
 * - Coordinating asset loading via AssetLoader
 * - Coordinating overlay display via OverlayManager
 * - Initializing game state and event listeners
 *
 * This class focuses on the bootstrap process only. Asset loading, overlay management,
 * and zone transitions are delegated to specialized classes.
 */
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

    /**
     * Loads all game assets and sets up the initial game state.
     * Delegates to AssetLoader for asset management and OverlayManager for overlay display.
     */
    async loadAssets() {
        try {
            // Delegate asset loading to AssetLoader
            await this.game.assetLoader.loadAssets();

            // Show the start overlay (managed by OverlayManager)
            this.game.overlayManager.showStartOverlay();
        } catch (error) {
            logger.error('Error loading assets:', error);
            // Still show overlay even if assets fail
            this.game.overlayManager.showStartOverlay();
        }

        // After assets are loaded, start a preview render loop.
        // This will draw the board behind the start overlay.
        if (!this.game.gameStarted) {
            // Generate a temporary zone for the preview if no game state is loaded yet.
            if (!this.game.grid) {
                this.game.generateZone();
            }
            this.game.previewMode = true;
            // Start the game loop, which will respect previewMode.
            this.game.gameLoop();
        }
    }


    /**
     * Starts the game after the overlay is dismissed.
     * Prevents multiple initializations and delegates to init().
     */
    startGame() {
        if (this.game.gameStarted) return; // Prevent multiple initializations
        this.game.gameStarted = true;
        this.init();
    }

    /**
     * Initializes the game state, event listeners, and UI.
     */
    init() {
        // Bomb placement mode
        this.game.bombPlacementMode = false;
        this.game.bombPlacementPositions = [];
        this.game.pendingCharge = null;

        // Try to load saved game state, or generate initial zone if no save exists
        // Ensure food assets are available before generating any zones
        this.game.assetLoader.refreshFoodAssets();

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
            try {
                this.game.currentRegion = this.game.uiManager.generateRegionName(initialZone.x, initialZone.y);
            } catch (error) {
                this.game.currentRegion = 'Home'; // Fallback
            }
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

        // Set up event listeners for UI and input
        this.setupEventListeners();

        // Set up audio and music for the current zone
        this.setupAudio();

        // Start the game loop
        this.game.gameLoop();

        // Expose game instance to console for debugging
        this.exposeToConsole();

        // Update UI to reflect initial state
        this.game.uiManager.updatePlayerPosition();
        this.game.uiManager.updateZoneDisplay();
        this.game.uiManager.updatePlayerStats();
    }

    /**
     * Sets up all event listeners for the game.
     */
    setupEventListeners() {
        // Input controls
        this.game.inputManager.setupControls();

        // UI handlers
        this.game.uiManager.setupGameOverHandler();
        this.game.uiManager.setupCloseMessageLogHandler();
        this.game.uiManager.setupMessageLogButton();
        this.game.uiManager.setupBarterHandlers();

        // Start periodic autosave
        if (this.game.gameStateManager && typeof this.game.gameStateManager.startAutoSave === 'function') {
            this.game.gameStateManager.startAutoSave();
        }

        // Save on page unload (fires reliably on mobile & refresh)
        window.addEventListener('pagehide', () => {
            if (this.game.gameStateManager && typeof this.game.gameStateManager.saveGameStateImmediate === 'function') {
                this.game.gameStateManager.saveGameStateImmediate();
            } else if (this.game.gameStateManager) {
                this.game.gameStateManager.saveGameState();
            }
        });

        // Save when page becomes hidden (tab/app switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.game.gameStateManager) {
                this.game.gameStateManager.saveGameState();
            }
        });

        // Detect cross-tab save events
        window.addEventListener('storage', (ev) => {
            if (ev.key === null) return;
            if (ev.key === 'chress_game_state') {
                if (this.game.uiManager && typeof this.game.uiManager.addMessageToLog === 'function') {
                    this.game.uiManager.addMessageToLog('Game state updated in another tab. Your session will keep running with current state.');
                }
            }
        });
    }

    /**
     * Sets up audio and music for the current zone.
     */
    setupAudio() {
        // Make soundManager globally accessible
        window.soundManager = this.game.soundManager;

        // Try to resume audio context (browser autoplay policies)
        try {
            if (this.game.soundManager && typeof this.game.soundManager.resumeAudioContext === 'function') {
                this.game.soundManager.resumeAudioContext().catch(() => {});
            }
        } catch (e) {
            logger.error('Error resuming audio context:', e);
        }

        // Apply persisted audio settings and start zone music
        try {
            const currentZone = this.game.player.getCurrentZone && this.game.player.getCurrentZone();
            const dimension = currentZone && typeof currentZone.dimension === 'number' ? currentZone.dimension : 0;

            // Apply persisted player settings
            if (this.game.player && this.game.player.stats) {
                if (this.game.soundManager && typeof this.game.soundManager.setMusicEnabled === 'function') {
                    this.game.soundManager.setMusicEnabled(!!this.game.player.stats.musicEnabled);
                }
                if (this.game.soundManager && typeof this.game.soundManager.setSfxEnabled === 'function') {
                    this.game.soundManager.setSfxEnabled(!!this.game.player.stats.sfxEnabled);
                }
            }

            // Debug logging
            if (typeof console !== 'undefined' && console.debug) {
                console.debug('[AUDIO STARTUP] restored player.stats.musicEnabled=', this.game.player && this.game.player.stats && this.game.player.stats.musicEnabled,
                              'soundManager.musicEnabled=', this.game.soundManager && this.game.soundManager.musicEnabled,
                              'soundManager.currentMusicTrack=', this.game.soundManager && this.game.soundManager.currentMusicTrack);
            }

            // Set music for the current zone
            if (this.game.soundManager && typeof this.game.soundManager.setMusicForZone === 'function') {
                this.game.soundManager.setMusicForZone({ dimension });
            }
        } catch (e) {
            logger.error('Error setting up zone music:', e);
        }
    }

    /**
     * Exposes game instance and console commands for debugging.
     */
    exposeToConsole() {
        window.game = this.game;
        window.gameInstance = this.game;

        // Import and expose console commands
        import('./consoleCommands.js').then(module => {
            window.consoleCommands = module.default;
            window.tp = (x, y) => module.default.tp(this.game, x, y);
            window.spawnHorseIcon = () => module.default.spawnHorseIcon(this.game);
            window.gotoInterior = () => module.default.gotoInterior(this.game);
            window.gotoWorld = () => module.default.gotoWorld(this.game);
        }).catch(err => logger.error('Error loading console commands:', err));
    }

    /**
     * Generates the current zone.
     * Delegates to ZoneTransitionController.
     */
    generateZone() {
        this.game.zoneTransitionController.generateZone();
    }

    /**
     * Transitions to a new zone.
     * Delegates to ZoneTransitionController.
     */
    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        this.game.zoneTransitionController.transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY);
    }

    /**
     * Resets the entire game state.
     */
    resetGame() {
        // Reset session-specific static data that doesn't get cleared on a soft reset.
        ZoneStateManager.resetSessionData();
        this.game.gameStateManager.resetGame();
    }
}
