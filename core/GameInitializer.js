import { GRID_SIZE, TILE_SIZE, CANVAS_SIZE, TILE_TYPES, FOOD_ASSETS } from './constants.js';
import logger from './logger.js';
import { TextureManager } from '../renderers/TextureManager.js';
import { ConnectionManager } from '../managers/ConnectionManager.js';
import { ZoneGenerator } from './ZoneGenerator.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Sign } from '../ui/Sign.js';
import { InputManager } from '../managers/InputManager.js';
import { InventoryManager } from '../managers/InventoryManager.js';
import { UIManager } from '../ui/UIManager.js';
import { RenderManager } from '../renderers/RenderManager.js';
import { CombatManager } from '../managers/CombatManager.js';
import { InteractionManager } from '../managers/InteractionManager.js';
import { ZoneManager } from '../managers/ZoneManager.js';
import { GameStateManager } from './GameStateManager.js';
import { SoundManager } from './SoundManager.js';
import { ZoneStateManager } from '../generators/ZoneStateManager.js';
import { ConsentManager } from './ConsentManager.js';

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
            // If a saved session exists, auto-start the game so refreshing doesn't force the start panel.
            // Otherwise, show the start panel and mute audio until a user gesture.
            try {
                // If a saved session exists we DO NOT auto-start. Show the start overlay so the
                // user can explicitly tap "continue" to resume. This guarantees any audio
                // playback only begins after a user gesture.
                // const hasSaved = !!localStorage.getItem('chress_game_state');
                // If hasSaved, overlay will show with Continue enabled.
            } catch (e) {}

            // No saved session: do NOT force-mute music here. Music preference should default to ON,
            // but actual playback will be deferred until the user performs a gesture (start/continue).
            // We intentionally avoid calling setMusicEnabled(false) so the default preference remains enabled.
            this.showStartOverlay();
        } catch (error) {
            logger.error('Error loading assets:', error);
            this.game.availableFoodAssets = []; // No foods if loading failed
            // If there's a saved session, start immediately; otherwise show the overlay.
            try {
                // On asset load failure, do not auto-start saved sessions. Show overlay so
                // user can explicitly continue; this prevents music autoplay without user gesture.
            } catch (e) {}
            // On asset load failure, keep existing music preference (default ON). Playback is still
            // deferred until a user gesture (the overlay handlers call resumeAudioContext and then
            // setMusicEnabled based on the overlay toggle or saved preference).
            this.showStartOverlay();
        }

        // After assets are loaded, start a preview render loop.
        // This will draw the board behind the start overlay.
        if (!this.game.gameStarted) {
            // Generate a temporary zone for the preview if no game state is loaded yet.
            // We do this before showing the overlay.
            if (!this.game.grid) {
                this.game.generateZone();
            }
            this.game.previewMode = true;
            // Start the game loop, which will respect previewMode.
            this.game.gameLoop();
        }
    }

    showStartOverlay() {
        try {
            // Find overlay element in DOM
            const overlay = document.getElementById('startOverlay');
            if (!overlay) return;

            // Do not reveal the overlay yet; we'll show it after handlers are attached and
            // previewMode is already enabled, so the board renders without the player.
            // Ensure the overlay is invisible during DOM adjustments to avoid visual jumps
            try { overlay.style.visibility = 'hidden'; } catch (e) {}
            // Configure continue button state based on whether a saved session exists
            const hasSaved = !!(localStorage && localStorage.getItem && localStorage.getItem('chress_game_state'));
            const continueBtn = overlay.querySelector('#continueButton');
            if (continueBtn) {
                try { continueBtn.disabled = !hasSaved; } catch (e) {}
                if (hasSaved) {
                    continueBtn.classList.remove('disabled');
                } else {
                    continueBtn.classList.add('disabled');
                }
            }

            // Synchronize overlay music toggle to a temporary state (don't resume audio yet)
            const overlayMusicToggle = document.getElementById('overlay-music-toggle');
            // Default music on (preference is ON), but playback will wait for user gesture
            let overlayMusicPref = true;
            if (overlayMusicToggle) {
                try { overlayMusicPref = typeof overlayMusicToggle.checked === 'boolean' ? !!overlayMusicToggle.checked : true; } catch (e) {}
                overlayMusicToggle.addEventListener('change', (e) => { try { overlayMusicPref = !!e.target.checked; } catch (err) {} });
            }

            // Start (new session) handler
            const onStart = async () => {
                // Reveal the player (stop preview mode) so the card content can be shown while
                // the start overlay curls away.
                try { this.game.previewMode = false; } catch (e) {}

                // Resume/create AudioContext on user gesture (satisfy autoplay policies)
                try {
                    if (this.game.soundManager && typeof this.game.soundManager.resumeAudioContext === 'function') {
                        await this.game.soundManager.resumeAudioContext();
                    }
                } catch (e) {}

                // Apply overlay music preference (do not start audio until audioContext resumed)
                try {
                    if (this.game.player && this.game.player.stats) {
                        this.game.player.stats.musicEnabled = !!overlayMusicPref;
                    }
                    if (this.game.soundManager && typeof this.game.soundManager.setMusicEnabled === 'function') {
                        this.game.soundManager.setMusicEnabled(!!overlayMusicPref);
                    }
                    // SFX default to enabled unless player has pref saved
                    if (this.game.player && this.game.player.stats && typeof this.game.player.stats.sfxEnabled !== 'undefined') {
                        if (this.game.soundManager && typeof this.game.soundManager.setSfxEnabled === 'function') {
                            this.game.soundManager.setSfxEnabled(!!this.game.player.stats.sfxEnabled);
                        }
                    }
                } catch (e) {}

                // Force-start a NEW game (clear any existing saved state) now that user has interacted
                try {
                    if (this.game.gameStateManager && typeof this.game.gameStateManager.resetGame === 'function') {
                        // resetGame both clears saved state and reinitializes game state
                        this.game.gameStateManager.resetGame();
                        // After resetGame we should call startGame to fully initialize and begin loop
                    } else if (this.game.gameStateManager && typeof this.game.gameStateManager.clearSavedState === 'function') {
                        // best-effort: clear saved state, then start
                        try { this.game.gameStateManager.clearSavedState(); } catch (e) {}
                    }
                } catch (e) {}

                // Animate overlay curling away then start the game. We await the animation so the
                // reveal feels deliberate (like peeling/curling parchment) before the game begins.
                try {
                    if (typeof animateOverlayCurl === 'function') {
                        await animateOverlayCurl(overlay);
                    } else {
                        try { overlay.style.display = 'none'; } catch (e) {}
                    }
                } catch (e) {}

                // Start new game now that user has interacted and overlay is gone
                try { this.startGame(); } catch (e) { /* still try to start */ }
            };

            // Continue (load saved session) handler
            const onContinue = async () => {
                try { this.game.previewMode = false; } catch (e) {}

                // Attempt to load saved game state before resuming audio so persisted audio prefs apply
                try {
                    if (this.game.gameStateManager && typeof this.game.gameStateManager.loadGameState === 'function') {
                        this.game.gameStateManager.loadGameState();
                    }
                } catch (e) {}

                // Resume/create AudioContext on user gesture
                try {
                    if (this.game.soundManager && typeof this.game.soundManager.resumeAudioContext === 'function') {
                        await this.game.soundManager.resumeAudioContext();
                    }
                } catch (e) {}

                // If overlay music toggle exists and user changed it, honor it by overriding saved pref
                try {
                    if (typeof overlayMusicPref !== 'undefined') {
                        if (this.game.player && this.game.player.stats) this.game.player.stats.musicEnabled = !!overlayMusicPref;
                        if (this.game.soundManager && typeof this.game.soundManager.setMusicEnabled === 'function') this.game.soundManager.setMusicEnabled(!!overlayMusicPref);
                    }
                } catch (e) {}

                // Animate overlay curling away then start the game (init will continue from loaded state)
                try {
                    if (typeof animateOverlayCurl === 'function') {
                        await animateOverlayCurl(overlay);
                    } else {
                        try { overlay.style.display = 'none'; } catch (e) {}
                    }
                } catch (e) {}

                // Start game (init will continue from loaded state)
                try { this.startGame(); } catch (e) {}
            };

            // Attach handlers (only button clicks start/continue — no overlay-wide start)
            const startBtn = overlay.querySelector('#startButton');
            // If a saved session exists, move the Continue button above Start so it's
            // visually prioritized for returning players.
            try {
                if (continueBtn && startBtn && hasSaved) {
                    const parent = startBtn.parentNode;
                    if (parent && parent.contains(continueBtn) && parent.contains(startBtn)) {
                        parent.insertBefore(continueBtn, startBtn);
                    }
                }
            } catch (e) {}

            if (startBtn) startBtn.addEventListener('click', onStart, { once: true });
            if (continueBtn && hasSaved) continueBtn.addEventListener('click', onContinue, { once: true });

            // Pre-render player card contents (stats, portrait, minimap) so they are ready
            // behind the start overlay and don't visibly load after the overlay is removed.
            try {
                if (this.game.uiManager && typeof this.game.uiManager.updatePlayerStats === 'function') {
                    try { this.game.uiManager.updatePlayerStats(); } catch (e) {}
                }
                if (this.game.uiManager && typeof this.game.uiManager.renderZoneMap === 'function') {
                    try { this.game.uiManager.renderZoneMap(); } catch (e) {}
                }

                // If portrait image exists, attempt an early decode so it doesn't pop-in after the overlay.
                try {
                    const img = document.querySelector('.player-portrait');
                    if (img && typeof img.decode === 'function') {
                        img.decode().catch(() => {});
                    }
                } catch (e) {}
            } catch (e) {}

            // Now that handlers are attached and the player card is pre-rendered, enable preview
            // mode and reveal the overlay so the board shows as a preview without the player.
            try {
                overlay.style.display = 'flex';
                overlay.style.visibility = 'visible';
            } catch (e) {}
        } catch (e) {}
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
        // Ensure food assets are available before generating any zones
        this.game.availableFoodAssets = FOOD_ASSETS.filter(foodAsset => {
            const foodKey = foodAsset.replace('.png', '').replace('/', '_');
            return this.game.textureManager.isImageLoaded(foodKey);
        });

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

        // Set up event listeners
        this.game.inputManager.setupControls();
        this.game.uiManager.setupGameOverHandler();
        this.game.uiManager.setupCloseMessageLogHandler();
        this.game.uiManager.setupMessageLogButton();
        this.game.uiManager.setupBarterHandlers();

        // Save game state before page unload
        // Start periodic autosave and schedule debounced saves
        if (this.game.gameStateManager && typeof this.game.gameStateManager.startAutoSave === 'function') {
            this.game.gameStateManager.startAutoSave();
        }

        // Use pagehide (fires reliably on mobile & refresh) to flush save immediately
        window.addEventListener('pagehide', () => {
            if (this.game.gameStateManager && typeof this.game.gameStateManager.saveGameStateImmediate === 'function') {
                this.game.gameStateManager.saveGameStateImmediate();
            } else if (this.game.gameStateManager) {
                // Fallback to scheduled save
                this.game.gameStateManager.saveGameState();
            }
        });

        // Save game state when page becomes hidden (user switches tabs/switches apps)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.game.gameStateManager) {
                this.game.gameStateManager.saveGameState();
            }
        });

        // Detect cross-tab save events and notify the user (if UIManager supports notifications)
        window.addEventListener('storage', (ev) => {
            if (ev.key === null) return; // ignore clear events
            if (ev.key === 'chress_game_state') {
                // Another tab updated the save — optionally notify the player
                if (this.game.uiManager && typeof this.game.uiManager.addMessageToLog === 'function') {
                    this.game.uiManager.addMessageToLog('Game state updated in another tab. Your session will keep running with current state.');
                }
            }
        });

        // Make soundManager global for easy access from other classes
        window.soundManager = this.game.soundManager;

        // Try to resume audio context (may be required by browser autoplay policies)
        try {
            if (this.game.soundManager && typeof this.game.soundManager.resumeAudioContext === 'function') {
                this.game.soundManager.resumeAudioContext().catch(() => {});
            }
        } catch (e) {}

        // Ensure music begins based on the current zone (respecting player's musicEnabled setting)
        try {
            const currentZone = this.game.player.getCurrentZone && this.game.player.getCurrentZone();
            const dimension = currentZone && typeof currentZone.dimension === 'number' ? currentZone.dimension : 0;
            // Apply persisted player settings if available
            try {
                if (this.game.player && this.game.player.stats) {
                    if (this.game.soundManager && typeof this.game.soundManager.setMusicEnabled === 'function') {
                        this.game.soundManager.setMusicEnabled(!!this.game.player.stats.musicEnabled);
                    }
                    if (this.game.soundManager && typeof this.game.soundManager.setSfxEnabled === 'function') {
                        this.game.soundManager.setSfxEnabled(!!this.game.player.stats.sfxEnabled);
                    }
                }
            } catch (e) {}

            // Debug: report audio-related state immediately after applying persisted settings
            try {
                if (typeof console !== 'undefined' && console.debug) {
                    console.debug('[AUDIO STARTUP] restored player.stats.musicEnabled=', this.game.player && this.game.player.stats && this.game.player.stats.musicEnabled,
                                  'soundManager.musicEnabled=', this.game.soundManager && this.game.soundManager.musicEnabled,
                                  'soundManager.currentMusicTrack=', this.game.soundManager && this.game.soundManager.currentMusicTrack);
                }
            } catch (e) {}

            if (this.game.soundManager && typeof this.game.soundManager.setMusicForZone === 'function') {
                // Only set music if music setting is enabled (SoundManager handles muting)
                this.game.soundManager.setMusicForZone({ dimension });
            }
        } catch (e) {}
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
        // Reset session-specific static data that doesn't get cleared on a soft reset.
        ZoneStateManager.resetSessionData();

        this.game.gameStateManager.resetGame();
    }
}
