import { logger } from '../core/logger.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.js';
import { safeCall, safeCallAsync, safeGet } from '../utils/SafeServiceCall.js';

/**
 * OverlayManager
 *
 * Manages the start overlay display and user interactions.
 * Handles continue/start buttons, music preferences, and overlay animations.
 */
export class OverlayManager {
    constructor(game) {
        this.game = game;
        this.overlayMusicPref = true; // Default music preference
    }

    /**
     * Shows the start overlay with appropriate button states.
     */
    showStartOverlay() {
        try {
            const overlay = document.getElementById('startOverlay');
            if (!overlay) return;

            // Hide overlay initially to avoid visual jumps during setup
            overlay.style.visibility = 'hidden';

            // Configure continue button based on saved game state
            const hasSaved = this.hasSavedGame();
            this.configureContinueButton(overlay, hasSaved);

            // Set up music toggle
            this.setupMusicToggle(overlay);

            // Set up button handlers
            this.setupButtonHandlers(overlay, hasSaved);

            // Pre-render UI elements behind the overlay
            this.preRenderUIElements();

            // Reorder buttons if saved game exists
            if (hasSaved) {
                this.prioritizeContinueButton(overlay);
            }

            // Show the overlay
            overlay.style.display = 'flex';
            overlay.style.visibility = 'visible';
            overlay.setAttribute('aria-hidden', 'false');
        } catch (error) {
            logger.error('Error showing start overlay:', error);
        }
    }

    /**
     * Checks if a saved game exists.
     * @returns {boolean}
     */
    hasSavedGame() {
        try {
            return !!(localStorage && localStorage.getItem && localStorage.getItem('chress_game_state'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Configures the continue button state based on save data.
     * @param {HTMLElement} overlay
     * @param {boolean} hasSaved
     */
    configureContinueButton(overlay, hasSaved) {
        const continueBtn = overlay.querySelector('#continueButton');
        if (!continueBtn) return;

        try {
            continueBtn.disabled = !hasSaved;
            if (hasSaved) {
                continueBtn.classList.remove('disabled');
            } else {
                continueBtn.classList.add('disabled');
            }
        } catch (e) {
            logger.error('Error configuring continue button:', e);
        }
    }

    /**
     * Sets up the music toggle functionality.
     * @param {HTMLElement} overlay
     */
    setupMusicToggle(overlay) {
        const overlayMusicToggle = document.getElementById('overlay-music-toggle');
        if (!overlayMusicToggle) return;

        try {
            this.overlayMusicPref = typeof overlayMusicToggle.checked === 'boolean'
                ? overlayMusicToggle.checked
                : true;

            overlayMusicToggle.addEventListener('change', (e) => {
                try {
                    this.overlayMusicPref = !!e.target.checked;
                } catch (err) {
                    logger.error('Error handling music toggle:', err);
                }
            });
        } catch (e) {
            logger.error('Error setting up music toggle:', e);
        }
    }

    /**
     * Sets up button click handlers.
     * @param {HTMLElement} overlay
     * @param {boolean} hasSaved
     */
    setupButtonHandlers(overlay, hasSaved) {
        const startBtn = overlay.querySelector('#startButton');
        const continueBtn = overlay.querySelector('#continueButton');
        const zoneEditorBtn = overlay.querySelector('#zoneEditorButton');

        if (startBtn) {
            // Clone and replace to remove any old listeners
            const newStartBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newStartBtn, startBtn);
            newStartBtn.addEventListener('click', () => this.handleStartGame(overlay), { once: true });
        }

        if (continueBtn) {
            // Clone and replace to remove any old listeners
            const newContinueBtn = continueBtn.cloneNode(true);
            continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);

            if (hasSaved) {
                newContinueBtn.addEventListener('click', () => this.handleContinueGame(overlay), { once: true });
            }
        }

        if (zoneEditorBtn) {
            // Clone and replace to remove any old listeners
            const newZoneEditorBtn = zoneEditorBtn.cloneNode(true);
            zoneEditorBtn.parentNode.replaceChild(newZoneEditorBtn, zoneEditorBtn);
            // Don't use { once: true } for zone editor since it doesn't close the start menu
            newZoneEditorBtn.addEventListener('click', () => this.handleZoneEditor());
        }
    }

    /**
     * Handles starting a new game.
     * @param {HTMLElement} overlay
     */
    async handleStartGame(overlay) {
        try {
            // Exit preview mode to show player
            this.game.previewMode = false;

            // Resume audio context on user gesture
            await this.resumeAudioContext();

            // Apply music preference
            this.applyMusicPreference();

            // Reset the game (clear saved state)
            this.resetGameState();

            // Animate overlay away
            await this.hideOverlay(overlay);

            // Start new game
            this.game.gameInitializer.startGame();
        } catch (error) {
            logger.error('Error handling start game:', error);
            // Still try to start
            try {
                this.game.gameInitializer.startGame();
            } catch (e) {
                logger.error('Fatal error starting game:', e);
            }
        }
    }

    /**
     * Handles continuing a saved game.
     * @param {HTMLElement} overlay
     */
    async handleContinueGame(overlay) {
        try {
            // Exit preview mode
            this.game.previewMode = false;

            // Load saved game state before resuming audio
            this.loadGameState();

            // Resume audio context on user gesture
            await this.resumeAudioContext();

            // Apply music preference (may override saved preference)
            this.applyMusicPreference();

            // Animate overlay away
            await this.hideOverlay(overlay);

            // Start game (will continue from loaded state)
            this.game.gameInitializer.startGame();
        } catch (error) {
            logger.error('Error handling continue game:', error);
            // Still try to start
            try {
                this.game.gameInitializer.startGame();
            } catch (e) {
                logger.error('Fatal error continuing game:', e);
            }
        }
    }

    /**
     * Handles opening the zone editor in-app overlay.
     */
    handleZoneEditor() {
        try {
            const overlay = document.getElementById('zoneEditorOverlay');
            const iframe = document.getElementById('zoneEditorFrame');
            const closeButton = document.getElementById('closeZoneEditor');

            if (!overlay || !iframe) {
                logger.error('Zone editor overlay elements not found');
                return;
            }

            // Get base path for GitHub Pages or local
            const basePath = document.querySelector('base')?.href || window.location.origin + '/';
            const editorPath = 'tools/zone-editor.html';

            // Set iframe source
            iframe.src = new URL(editorPath, basePath).href;

            // Show the overlay
            overlay.style.display = 'flex';

            // Close handler function
            const closeEditor = () => {
                overlay.style.display = 'none';
                iframe.src = ''; // Clear iframe to stop any running scripts
                // Clean up event listeners
                if (closeButton) {
                    closeButton.removeEventListener('click', closeEditor);
                }
                overlay.removeEventListener('click', overlayClickHandler);
            };

            // Overlay click handler
            const overlayClickHandler = (e) => {
                // Only close if clicking directly on the overlay background, not its children
                if (e.target === overlay) {
                    closeEditor();
                }
            };

            // Set up close button handler
            if (closeButton) {
                closeButton.addEventListener('click', closeEditor);
            }

            // Close on overlay background click
            overlay.addEventListener('click', overlayClickHandler);
        } catch (error) {
            logger.error('Error opening zone editor:', error);
        }
    }

    /**
     * Resumes the audio context after user gesture.
     * @returns {Promise<void>}
     */
    async resumeAudioContext() {
        try {
            await safeCallAsync(this.game.soundManager, 'resumeAudioContext');
        } catch (e) {
            logger.error('Error resuming audio context:', e);
        }
    }

    /**
     * Applies the music preference from the overlay toggle.
     */
    applyMusicPreference() {
        try {
            const playerStats = safeGet(this.game, 'player.stats');
            if (playerStats) {
                playerStats.musicEnabled = !!this.overlayMusicPref;
            }

            safeCall(this.game.soundManager, 'setMusicEnabled', !!this.overlayMusicPref);

            // Apply SFX preference if available
            const sfxEnabled = safeGet(this.game, 'player.stats.sfxEnabled');
            if (sfxEnabled !== undefined) {
                safeCall(this.game.soundManager, 'setSfxEnabled', !!sfxEnabled);
            }
        } catch (e) {
            logger.error('Error applying music preference:', e);
        }
    }

    /**
     * Resets the game state (clears saved data).
     */
    resetGameState() {
        try {
            const reset = safeCall(this.game.gameStateManager, 'resetGame');
            if (!reset) {
                safeCall(this.game.gameStateManager, 'clearSavedState');
            }
        } catch (e) {
            logger.error('Error resetting game state:', e);
        }
    }

    /**
     * Loads the saved game state.
     */
    loadGameState() {
        try {
            safeCall(this.game.gameStateManager, 'loadGameState');
        } catch (e) {
            logger.error('Error loading game state:', e);
        }
    }

    /**
     * Hides the overlay with animation.
     * @param {HTMLElement} overlay
     * @returns {Promise<void>}
     */
    async hideOverlay(overlay) {
        try {
            if (typeof animateOverlayCurl === 'function') {
                await animateOverlayCurl(overlay);
            } else {
                overlay.style.display = 'none';
            }
        } catch (e) {
            logger.error('Error hiding overlay:', e);
            try {
                overlay.style.display = 'none';
            } catch (err) {
                // Final fallback
            }
        }
    }

    /**
     * Pre-renders UI elements behind the overlay to avoid pop-in.
     */
    preRenderUIElements() {
        try {
            // Update player stats
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});

            // Render zone map
            safeCall(this.game.uiManager, 'renderZoneMap');

            // Decode player portrait image
            const portraitImg = document.querySelector('.player-portrait');
            if (portraitImg) {
                safeCallAsync(portraitImg, 'decode')?.catch(err => {
                    errorHandler.handle(err, ErrorSeverity.WARNING, {
                        component: 'OverlayManager',
                        action: 'decode player portrait image'
                    });
                });
            }
        } catch (e) {
            logger.error('Error pre-rendering UI elements:', e);
        }
    }

    /**
     * Moves the continue button above the start button for returning players.
     * @param {HTMLElement} overlay
     */
    prioritizeContinueButton(overlay) {
        try {
            const startBtn = overlay.querySelector('#startButton');
            const continueBtn = overlay.querySelector('#continueButton');

            if (continueBtn && startBtn) {
                const parent = startBtn.parentNode;
                if (parent && parent.contains(continueBtn) && parent.contains(startBtn)) {
                    parent.insertBefore(continueBtn, startBtn);
                }
            }
        } catch (e) {
            logger.error('Error prioritizing continue button:', e);
        }
    }
}
