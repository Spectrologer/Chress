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
        console.log('[GameInitializer] loadAssets() called');
        try {
            // Delegate to AssetLoader
            console.log('[GameInitializer] Starting asset loading...');
            await this.game.assetLoader.loadAssets();
            console.log('[GameInitializer] Asset loading complete');

            // Show overlay
            this.game.overlayManager.showStartOverlay();
        } catch (error) {
            logger.error('Error loading assets:', error);
            // Show overlay on failure
            this.game.overlayManager.showStartOverlay();
        }

        // Preview render loop
        // Draws board behind overlay
        console.log('[GameInitializer] Checking if preview setup is needed...');
        console.log(`[GameInitializer] gameStarted=${this.game.gameStarted}, grid=${!!this.game.grid}`);
        if (!this.game.gameStarted) {
            // Temp zone for preview
            console.log('[GameInitializer] Game not started, setting up preview');
            if (!this.game.grid) {
                console.log('[GameInitializer] Grid is null, attempting to load or generate');
                try {
                    // Try to load saved game first to show last board
                    console.log('[GameInitializer] Attempting to load saved game...');
                    const hasSavedGame = await this.game.gameStateManager.loadGameState();
                    console.log(`[GameInitializer] Load saved game result: ${hasSavedGame}`);
                    if (!hasSavedGame) {
                        // No saved game, generate surface zone (0,0 dimension 0) for preview
                        console.log('[Preview] No saved game, generating surface zone 0,0 for preview');

                        // Ensure player is at surface zone (0,0 dimension 0)
                        this.game.player.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
                        console.log(`[Preview] Set player zone to surface: (0,0,0)`);

                        this.game.generateZone();

                        // Verify grid was created
                        if (!this.game.grid) {
                            logger.error('[Preview] Zone generation failed - grid is null');
                        } else {
                            const playerPos = this.game.player.getPosition();
                            const zone = this.game.player.getCurrentZone();
                            console.log(`[Preview] Zone generated successfully - grid exists, player at (${playerPos.x},${playerPos.y}), zone (${zone.x},${zone.y},${zone.dimension})`);
                            console.log(`[Preview] Terrain textures: ${Object.keys(this.game.zoneGenerator?.terrainTextures || {}).length} entries`);
                        }
                    } else {
                        console.log('[Preview] Loaded saved game for preview');
                    }
                } catch (error) {
                    logger.error('[Preview] Error during preview zone generation:', error);
                    // Attempt fallback generation
                    try {
                        this.game.generateZone();
                    } catch (fallbackError) {
                        logger.error('[Preview] Fallback generation also failed:', fallbackError);
                    }
                }
            } else {
                console.log('[GameInitializer] Grid already exists, skipping generation');
            }

            // Only start game loop if grid was successfully created
            if (this.game.grid) {
                this.game.previewMode = true;
                // Start loop (respects preview)
                console.log('[Preview] Starting game loop in preview mode');
                this.game.gameLoop();
            } else {
                logger.error('[Preview] Cannot start game loop - grid is null after generation attempts');
            }
        } else {
            console.log('[GameInitializer] Game already started, skipping preview setup');
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

        // Check if game was already loaded during preview (to avoid double loading)
        let loaded = this.game.grid !== null && this.game.grid !== undefined;
        if (!loaded) {
            loaded = this.game.gameStateManager.loadGameState();
        }
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
                const startTile = this.game.gridManager.getTile(playerX, playerY);
                // Don't overwrite SIGN or EXIT tiles
                if (!startTile ||
                    (typeof startTile === 'string' && startTile !== TILE_TYPES.SIGN && startTile !== TILE_TYPES.EXIT) ||
                    (typeof startTile === 'object' && startTile.type !== TILE_TYPES.SIGN)) {
                    this.game.gridManager.setTile(playerX, playerY, TILE_TYPES.FLOOR);
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
                    this.game.gridManager.setTile(playerX, playerY, TILE_TYPES.FLOOR);
                }
                const initialZone = this.game.player.getCurrentZone();
                this.game.currentRegion = this.game.uiManager.generateRegionName(initialZone.x, initialZone.y);
            }
        }

        // Initialize AnimationCoordinator to handle animation events
        this.game.animationCoordinator = this.game._services.get('animationCoordinator');

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
        logger.debug(`[Entrance] triggerNewGameEntrance called`);
        // Disable input during entrance animation (may already be set by resetGame)
        if (!this.game._entranceAnimationInProgress) {
            this.game._entranceAnimationInProgress = true;
        }

        // Disable pointer events on canvas to prevent any mouse clicks from interfering
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.style.pointerEvents = 'none';
        }

        // Helper to re-enable everything
        const enableInput = () => {
            this.game._entranceAnimationInProgress = false;
            if (gameCanvas) {
                gameCanvas.style.pointerEvents = 'auto';
            }
        };

        // Safety timeout - always re-enable input after max 10 seconds
        const safetyTimeout = setTimeout(() => {
            logger.warn(`[Entrance] Safety timeout triggered - re-enabling input`);
            enableInput();
        }, 10000);

        // Delay slightly to ensure everything is rendered
        setTimeout(() => {
            try {
                const playerPos = this.game.player.getPosition();
                const currentZone = this.game.player.getCurrentZone();
                logger.debug(`[Entrance] Player at (${playerPos.x},${playerPos.y}), zone (${currentZone.x},${currentZone.y},${currentZone.dimension})`);

                // Only trigger for home surface zone (0,0,0,0)
                if (currentZone.x === 0 && currentZone.y === 0 && currentZone.dimension === 0) {
                    // Get the stored spawn position (the exit tile)
                    const exitSpawn = this.game._newGameSpawnPosition;
                    logger.debug(`[Entrance] Exit spawn position: ${exitSpawn ? `(${exitSpawn.x},${exitSpawn.y})` : 'null'}`);

                    if (!exitSpawn) {
                        logger.error(`[Entrance] No _newGameSpawnPosition found - aborting entrance animation`);
                        clearTimeout(safetyTimeout);
                        enableInput();
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
                        enableInput();
                        return;
                    }

                    // Execute first hop onto exit tile
                    // Subscribe to completion of first hop
                    const unsubscribeHop = eventBus.on(EventTypes.INPUT_PATH_COMPLETED, () => {
                        // Verify player is at exit tile before continuing
                        const currentPos = this.game.player.getPosition();
                        const atExitTile = currentPos.x === exitSpawn.x && currentPos.y === exitSpawn.y;

                        if (!atExitTile) {
                            logger.warn(`[Entrance] Stage 1 path completed but player not at exit tile (${exitSpawn.x},${exitSpawn.y}). Player at (${currentPos.x},${currentPos.y}). Ignoring event.`);
                            return; // Don't unsubscribe, wait for correct completion
                        }

                        unsubscribeHop();
                        logger.debug(`[Entrance] Stage 1 complete - hopped to exit tile`);

                        // Stage 2: Path from exit tile to club entrance
                        logger.debug(`[Entrance] Stage 2 - finding path from (${currentPos.x},${currentPos.y}) to club entrance (${clubEntranceX},${clubEntranceY})`);
                        const pathToClub = this.game.inputManager?.findPath(
                            currentPos.x,
                            currentPos.y,
                            clubEntranceX,
                            clubEntranceY
                        );

                        if (!pathToClub || pathToClub.length === 0) {
                            logger.error(`[Entrance] Failed to find path to club entrance! pathToClub=${pathToClub}`);
                            clearTimeout(safetyTimeout);
                            enableInput();
                            return;
                        }

                        logger.debug(`[Entrance] Found path to club with ${pathToClub.length} steps, executing...`);

                        // Subscribe to completion of walk to club
                        const unsubscribeWalk = eventBus.on(EventTypes.INPUT_PATH_COMPLETED, () => {
                            // Verify player reached club entrance
                            const finalPos = this.game.player.getPosition();
                            const atClubEntrance = finalPos.x === clubEntranceX && finalPos.y === clubEntranceY;

                            if (!atClubEntrance) {
                                logger.warn(`[Entrance] Stage 2 path completed but player not at club entrance (${clubEntranceX},${clubEntranceY}). Player at (${finalPos.x},${finalPos.y}). Ignoring event.`);
                                return; // Don't unsubscribe, wait for correct completion
                            }

                            unsubscribeWalk();
                            logger.debug(`[Entrance] Stage 2 complete - reached club entrance`);
                            clearTimeout(safetyTimeout);
                            enableInput();
                        });

                        this.game.inputManager.executePath(pathToClub);
                    });

                    logger.debug(`[Entrance] Starting entrance animation - executing path to exit tile`);
                    this.game.inputManager.executePath(pathToExit);
                } else {
                    clearTimeout(safetyTimeout);
                    enableInput();
                }
            } catch (error) {
                logger.error('Error triggering new game entrance:', error);
                clearTimeout(safetyTimeout);
                enableInput();
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
        this.game.zoneGenState.reset(); // Use instance method (replaces ZoneStateManager.resetSessionData())
        this.game.gameStateManager.resetGame();
    }
}
