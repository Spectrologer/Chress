import logger from '../core/logger.js';

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

        if (startBtn) {
            startBtn.addEventListener('click', () => this.handleStartGame(overlay), { once: true });
        }

        if (continueBtn && hasSaved) {
            continueBtn.addEventListener('click', () => this.handleContinueGame(overlay), { once: true });
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
     * Resumes the audio context after user gesture.
     * @returns {Promise<void>}
     */
    async resumeAudioContext() {
        try {
            if (this.game.soundManager && typeof this.game.soundManager.resumeAudioContext === 'function') {
                await this.game.soundManager.resumeAudioContext();
            }
        } catch (e) {
            logger.error('Error resuming audio context:', e);
        }
    }

    /**
     * Applies the music preference from the overlay toggle.
     */
    applyMusicPreference() {
        try {
            if (this.game.player && this.game.player.stats) {
                this.game.player.stats.musicEnabled = !!this.overlayMusicPref;
            }

            if (this.game.soundManager && typeof this.game.soundManager.setMusicEnabled === 'function') {
                this.game.soundManager.setMusicEnabled(!!this.overlayMusicPref);
            }

            // Apply SFX preference if available
            if (this.game.player && this.game.player.stats && typeof this.game.player.stats.sfxEnabled !== 'undefined') {
                if (this.game.soundManager && typeof this.game.soundManager.setSfxEnabled === 'function') {
                    this.game.soundManager.setSfxEnabled(!!this.game.player.stats.sfxEnabled);
                }
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
            if (this.game.gameStateManager && typeof this.game.gameStateManager.resetGame === 'function') {
                this.game.gameStateManager.resetGame();
            } else if (this.game.gameStateManager && typeof this.game.gameStateManager.clearSavedState === 'function') {
                this.game.gameStateManager.clearSavedState();
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
            if (this.game.gameStateManager && typeof this.game.gameStateManager.loadGameState === 'function') {
                this.game.gameStateManager.loadGameState();
            }
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
            if (this.game.uiManager && typeof this.game.uiManager.updatePlayerStats === 'function') {
                this.game.uiManager.updatePlayerStats();
            }

            // Render zone map
            if (this.game.uiManager && typeof this.game.uiManager.renderZoneMap === 'function') {
                this.game.uiManager.renderZoneMap();
            }

            // Decode player portrait image
            const portraitImg = document.querySelector('.player-portrait');
            if (portraitImg && typeof portraitImg.decode === 'function') {
                portraitImg.decode().catch(() => {});
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
