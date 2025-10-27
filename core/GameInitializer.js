import { GRID_SIZE, CANVAS_SIZE, TILE_TYPES } from './constants/index.js';
import { logger } from './logger.js';
import { TextureManager } from '../renderers/TextureManager.js';
import { ZoneStateManager } from '../generators/ZoneStateManager.js';
import { eventBus } from './EventBus.js';
import { EventTypes } from './EventTypes.js';
import { errorHandler, ErrorSeverity } from './ErrorHandler.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { safeCall, safeCallAsync, safeGet } from '../utils/SafeServiceCall.js';

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
        // Internal canvas for pixel-perfect rendering
        // Stored in GameUI
        this.game.ui.initializeCanvas('gameCanvas', 'zoneMap');

        // Canvas sizes
        this.game.canvas.width = CANVAS_SIZE;
        this.game.canvas.height = CANVAS_SIZE;

        // Map canvas from CSS
        this.updateMapCanvasSize();

        // Responsive resize
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    updateMapCanvasSize() {
        // Match CSS sizing
        const computedStyle = window.getComputedStyle(this.game.mapCanvas);
        const cssWidth = parseInt(computedStyle.width);
        const cssHeight = parseInt(computedStyle.height);

        // Match CSS for crisp rendering
        this.game.mapCanvas.width = cssWidth;
        this.game.mapCanvas.height = cssHeight;

        // Crisp rendering config
        TextureManager.configureCanvas(this.game.mapCtx);
    }

    handleResize() {
        // Update canvas on resize
        this.updateMapCanvasSize();
        // Re-render zone map
        if (this.game.gameStarted) {
            this.game.uiManager.renderZoneMap();
        }
        // CSS handles display size
        // Main canvas fixed for pixel-perfect
    }

    /**
     * Loads all game assets and sets up the initial game state.
     * Delegates to AssetLoader for asset management and OverlayManager for overlay display.
     */
    async loadAssets() {
        try {
            // Delegate to AssetLoader
            await this.game.assetLoader.loadAssets();

            // Show overlay
            this.game.overlayManager.showStartOverlay();
        } catch (error) {
            logger.error('Error loading assets:', error);
            // Show overlay on failure
            this.game.overlayManager.showStartOverlay();
        }

        // Preview render loop
        // Draws board behind overlay
        if (!this.game.gameStarted) {
            // Temp zone for preview
            if (!this.game.grid) {
                this.game.generateZone();
            }
            this.game.previewMode = true;
            // Start loop (respects preview)
            this.game.gameLoop();
        }
    }


    /**
     * Starts the game after the overlay is dismissed.
     * Prevents multiple initializations and delegates to init().
     */
    startGame() {
        if (this.game.gameStarted) return; // Prevent multiple inits
        this.game.gameStarted = true;
        this.init();
    }

    /**
     * Initializes the game state, event listeners, and UI.
     */
    init() {
        // Initialize transient game state (no longer need scattered flags)
        if (this.game.transientGameState) {
            this.game.transientGameState.resetAll();
        }

        // Load saved state or generate zone
        // Food assets must be ready
        this.game.assetLoader.refreshFoodAssets();

        const loaded = this.game.gameStateManager.loadGameState();
        let isNewGame = false;
        if (!loaded) {
            // No save - generate zone
            isNewGame = true;
            this.game.generateZone();

            // Valid start tile - preserve signs and exits
            // Only check if player is within grid bounds (for new games, player may be off-screen)
            const playerY = this.game.player.y;
            const playerX = this.game.player.x;
            if (isWithinGrid(playerX, playerY)) {
                const startTile = this.game.grid[playerY][playerX];
                // Don't overwrite SIGN or EXIT tiles
                if (!startTile ||
                    (typeof startTile === 'string' && startTile !== TILE_TYPES.SIGN && startTile !== TILE_TYPES.EXIT) ||
                    (typeof startTile === 'object' && startTile.type !== TILE_TYPES.SIGN)) {
                    this.game.grid[playerY][playerX] = TILE_TYPES.FLOOR;
                }
            }

            // Initial region (0,0 = Home)
            const initialZone = this.game.player.getCurrentZone();
            try {
                this.game.currentRegion = this.game.uiManager.generateRegionName(initialZone.x, initialZone.y);
            } catch (error) {
                this.game.currentRegion = 'Home'; // Fallback
            }
        } else {
            // Loaded save - validate tile
            // Don't clear loaded grid
            if (this.game.grid) {
                this.game.player.ensureValidPosition(this.game.grid);
                const currentZone = this.game.player.getCurrentZone();
                this.game.currentRegion = this.game.uiManager.generateRegionName(currentZone.x, currentZone.y);
                // Point to loaded grid
                this.game.zoneGenerator.grid = this.game.grid;
            } else {
                // Fallback if grid failed
                this.game.generateZone();
                // Only set tile if player is within grid bounds
                const playerY = this.game.player.y;
                const playerX = this.game.player.x;
                if (isWithinGrid(playerX, playerY)) {
                    this.game.grid[playerY][playerX] = TILE_TYPES.FLOOR;
                }
                const initialZone = this.game.player.getCurrentZone();
                this.game.currentRegion = this.game.uiManager.generateRegionName(initialZone.x, initialZone.y);
            }
        }

        // Event listeners
        this.setupEventListeners();

        // Audio setup
        this.setupAudio();

        // Start loop
        this.game.gameLoop();

        // Expose to console
        this.exposeToConsole();

        // Update initial UI
        this.game.uiManager.updatePlayerPosition();
        this.game.uiManager.updateZoneDisplay();
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});

        // Trigger cinematic entrance for new games
        if (isNewGame) {
            this.triggerNewGameEntrance();
        }
    }

    /**
     * Triggers the cinematic entrance sequence for new games.
     * Player hops from off-screen onto exit tile, then paths to club entrance.
     */
    triggerNewGameEntrance() {
        // Disable input during entrance animation
        this.game._entranceAnimationInProgress = true;

        // Safety timeout - always re-enable input after max 10 seconds
        const safetyTimeout = setTimeout(() => {
            this.game._entranceAnimationInProgress = false;
        }, 10000);

        // Delay slightly to ensure everything is rendered
        setTimeout(() => {
            try {
                const playerPos = this.game.player.getPosition();
                const currentZone = this.game.player.getCurrentZone();

                // Only trigger for home surface zone (0,0,0,0)
                if (currentZone.x === 0 && currentZone.y === 0 && currentZone.dimension === 0) {
                    // Get the stored spawn position (the exit tile)
                    const exitSpawn = this.game._newGameSpawnPosition;

                    if (!exitSpawn) {
                        clearTimeout(safetyTimeout);
                        this.game._entranceAnimationInProgress = false;
                        return;
                    }

                    // Find the house position - house starts at (3,3)
                    const houseStartX = 3;
                    const houseStartY = 3;
                    // Final target is in front of the house
                    const clubEntranceX = houseStartX + 1; // Middle of house width (4)
                    const clubEntranceY = houseStartY + 3; // Front of house (6)

                    // Stage 1: Path from off-screen to exit tile
                    const pathToExit = this.game.inputManager?.findPath(
                        playerPos.x,
                        playerPos.y,
                        exitSpawn.x,
                        exitSpawn.y
                    );

                    if (!pathToExit || pathToExit.length === 0) {
                        clearTimeout(safetyTimeout);
                        this.game._entranceAnimationInProgress = false;
                        return;
                    }

                    // Execute first hop onto exit tile
                    // Subscribe to completion of first hop
                    const unsubscribeHop = eventBus.on(EventTypes.INPUT_PATH_COMPLETED, () => {
                        unsubscribeHop();

                        // Stage 2: Path from exit tile to club entrance
                        const currentPos = this.game.player.getPosition();
                        const pathToClub = this.game.inputManager?.findPath(
                            currentPos.x,
                            currentPos.y,
                            clubEntranceX,
                            clubEntranceY
                        );

                        if (!pathToClub || pathToClub.length === 0) {
                            clearTimeout(safetyTimeout);
                            this.game._entranceAnimationInProgress = false;
                            return;
                        }

                        // Subscribe to completion of walk to club
                        const unsubscribeWalk = eventBus.on(EventTypes.INPUT_PATH_COMPLETED, () => {
                            unsubscribeWalk();
                            clearTimeout(safetyTimeout);
                            this.game._entranceAnimationInProgress = false;
                        });

                        this.game.inputManager.executePath(pathToClub);
                    });

                    this.game.inputManager.executePath(pathToExit);
                } else {
                    clearTimeout(safetyTimeout);
                    this.game._entranceAnimationInProgress = false;
                }
            } catch (error) {
                logger.error('Error triggering new game entrance:', error);
                clearTimeout(safetyTimeout);
                this.game._entranceAnimationInProgress = false;
            }
        }, 500); // 500ms delay to ensure rendering is complete
    }

    /**
     * Sets up all event listeners for the game.
     */
    setupEventListeners() {
        // Input
        this.game.inputManager.setupControls();

        // UI
        this.game.uiManager.setupGameOverHandler();
        this.game.uiManager.setupBarterHandlers();

        // Autosave
        safeCall(this.game.gameStateManager, 'startAutoSave');

        // Save on unload (mobile & refresh)
        window.addEventListener('pagehide', () => {
            const saved = safeCall(this.game.gameStateManager, 'saveGameStateImmediate');
            if (!saved) {
                safeCall(this.game.gameStateManager, 'saveGameState');
            }
        });

        // Save on hide (tab/app switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                safeCall(this.game.gameStateManager, 'saveGameState');
            }
        });

        // Cross-tab saves
        window.addEventListener('storage', (ev) => {
            if (ev.key === null) return;
            if (ev.key === 'chress_game_state') {
                safeCall(this.game.uiManager, 'addMessageToLog', 'Game state updated in another tab. Your session will keep running with current state.');
            }
        });
    }

    /**
     * Sets up audio and music for the current zone.
     */
    setupAudio() {
        // Global soundManager
        window.soundManager = this.game.soundManager;

        // Resume audio (autoplay policy)
        try {
            safeCallAsync(this.game.soundManager, 'resumeAudioContext').catch(err => {
                if (err) {
                    errorHandler.handle(err, ErrorSeverity.WARNING, {
                        component: 'GameInitializer',
                        action: 'resume audio context on startup'
                    });
                }
            });
        } catch (e) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'GameInitializer',
                action: 'setup audio context'
            });
        }

        // Apply audio settings
        try {
            const currentZone = safeCall(this.game.player, 'getCurrentZone');
            const dimension = safeGet(currentZone, 'dimension', 0);

            // Apply player settings
            const musicEnabled = safeGet(this.game, 'player.stats.musicEnabled', false);
            const sfxEnabled = safeGet(this.game, 'player.stats.sfxEnabled', false);

            safeCall(this.game.soundManager, 'setMusicEnabled', !!musicEnabled);
            safeCall(this.game.soundManager, 'setSfxEnabled', !!sfxEnabled);

            // Zone music
            safeCall(this.game.soundManager, 'setMusicForZone', { dimension });
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

        // Console commands
        errorHandler.try(() => {
            import('./consoleCommands.js')
                .then(module => {
                    window.consoleCommands = module.default;
                    window.tp = (x, y) => module.default.tp(this.game, x, y);
                    window.spawnHorseIcon = () => module.default.spawnHorseIcon(this.game);
                    window.spawnTimedBomb = () => module.default.spawnTimedBomb(this.game);
                    window.gotoInterior = () => module.default.gotoInterior(this.game);
                    window.gotoWorld = () => module.default.gotoWorld(this.game);
                })
                .catch(err => {
                    errorHandler.handle(err, ErrorSeverity.WARNING, {
                        component: 'GameInitializer',
                        action: 'load console commands module'
                    });
                });
        }, {
            component: 'GameInitializer',
            action: 'import consoleCommands',
            severity: ErrorSeverity.WARNING
        });
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
        // Reset session data
        ZoneStateManager.resetSessionData();
        this.game.gameStateManager.resetGame();
    }
}
