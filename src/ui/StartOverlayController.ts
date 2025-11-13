import { logger } from '@core/logger';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { errorHandler, ErrorSeverity } from '@core/ErrorHandler';
import { safeCall, safeCallAsync } from '@utils/SafeServiceCall';
import type { IGame } from '@core/context';

/**
 * StartOverlayController
 *
 * Manages the start overlay display, visibility, and UI setup.
 * Responsible for showing/hiding the overlay and configuring its visual state.
 */
export class StartOverlayController {
    private game: IGame;

    constructor(game: IGame) {
        this.game = game;
    }

    /**
     * Shows the start overlay with appropriate button states.
     * The overlay is already visible from HTML, this just configures it.
     */
    async showStartOverlay(
        configureContinueBtn: (overlay: HTMLElement, hasSaved: boolean) => void,
        setupButtonHandlers: (overlay: HTMLElement, hasSaved: boolean) => void
    ): Promise<void> {
        try {
            logger.debug('[StartOverlayController] showStartOverlay called');
            const overlay = document.getElementById('startOverlay');
            if (!overlay) {
                logger.error('[StartOverlayController] Overlay element not found!');
                return;
            }

            // Overlay is already visible, just ensure it's shown
            overlay.style.display = 'flex';
            overlay.style.visibility = 'visible';
            overlay.setAttribute('aria-hidden', 'false');

            // CRITICAL: Set up button handlers IMMEDIATELY before any async operations
            // This prevents the "double-tap" issue where users click before handlers are ready
            logger.debug('[StartOverlayController] Setting up button handlers FIRST (before async checks)');
            setupButtonHandlers(overlay, false); // Pass false initially, will update continue button state later
            logger.debug('[StartOverlayController] Button handlers registered');

            // Check saved game state (async operation)
            logger.debug('[StartOverlayController] Checking for saved game...');
            const hasSaved = await this.hasSavedGame();
            logger.debug('[StartOverlayController] hasSavedGame result:', hasSaved);

            // Reorder buttons if saved game exists
            if (hasSaved) {
                this.prioritizeContinueButton(overlay);
            }

            // Configure continue button based on saved game state
            configureContinueBtn(overlay, hasSaved);

            // Pre-render UI elements behind the overlay
            this.preRenderUIElements();
        } catch (error) {
            logger.error('Error showing start overlay:', error);
        }
    }

    /**
     * Checks if a saved game exists in IndexedDB or localStorage.
     */
    async hasSavedGame(): Promise<boolean> {
        try {
            // Check StorageAdapter (IndexedDB) first
            if (this.game.storageAdapter) {
                const hasInStorage = await this.game.storageAdapter.has('chesse_game_state');
                if (hasInStorage) return true;
            }

            // Fallback to localStorage check
            return !!(localStorage && localStorage.getItem && localStorage.getItem('chesse_game_state'));
        } catch (e) {
            logger.error('Error checking for saved game:', e);
            return false;
        }
    }

    /**
     * Hides the overlay with animation.
     */
    async hideOverlay(overlay: HTMLElement): Promise<void> {
        try {
            if (typeof window.animateOverlayCurl === 'function') {
                await window.animateOverlayCurl(overlay);
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
    private preRenderUIElements(): void {
        try {
            // Update player stats
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});

            // Render zone map
            safeCall(this.game.uiManager, 'renderZoneMap');

            // Decode player portrait image
            const portraitImg = document.querySelector('.player-portrait') as HTMLImageElement | null;
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
     */
    private prioritizeContinueButton(overlay: HTMLElement): void {
        try {
            const startBtn = overlay.querySelector<HTMLElement>('#startButton');
            const continueBtn = overlay.querySelector<HTMLElement>('#continueButton');

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
     */
    configureContinueButton(overlay: HTMLElement, hasSaved: boolean): void {
        const continueBtn = overlay.querySelector<HTMLButtonElement>('#continueButton');
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
