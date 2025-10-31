import { logger } from '../core/logger.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.js';
import { safeCall, safeCallAsync } from '../utils/SafeServiceCall.js';

/**
 * StartOverlayController
 *
 * Manages the start overlay display, visibility, and UI setup.
 * Responsible for showing/hiding the overlay and configuring its visual state.
 */
export class StartOverlayController {
    constructor(game) {
        this.game = game;
    }

    /**
     * Shows the start overlay with appropriate button states.
     * @param {Function} configureContinueBtn - Callback to configure continue button
     * @param {Function} setupMusicToggle - Callback to setup music toggle
     * @param {Function} setupButtonHandlers - Callback to setup button handlers
     */
    async showStartOverlay(configureContinueBtn, setupMusicToggle, setupButtonHandlers) {
        try {
            const overlay = document.getElementById('startOverlay');
            if (!overlay) return;

            // Hide overlay initially to avoid visual jumps during setup
            overlay.style.visibility = 'hidden';

            // Configure continue button based on saved game state
            const hasSaved = await this.hasSavedGame();
            configureContinueBtn(overlay, hasSaved);

            // Set up music toggle
            setupMusicToggle(overlay);

            // Set up button handlers
            setupButtonHandlers(overlay, hasSaved);

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
     * Checks if a saved game exists in IndexedDB or localStorage.
     * @returns {Promise<boolean>}
     */
    async hasSavedGame() {
        try {
            // Check StorageAdapter (IndexedDB) first
            if (this.game.storageAdapter) {
                const hasInStorage = await this.game.storageAdapter.has('chress_game_state');
                if (hasInStorage) return true;
            }

            // Fallback to localStorage check
            return !!(localStorage && localStorage.getItem && localStorage.getItem('chress_game_state'));
        } catch (e) {
            logger.error('Error checking for saved game:', e);
            return false;
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
                        component: 'StartOverlayController',
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
}
