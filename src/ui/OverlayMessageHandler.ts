import { logger } from '../core/logger';
import { fitTextToContainer } from './TextFitter';
import { EventListenerManager } from '../utils/EventListenerManager';

interface GameInstance {
    displayingMessageForSign?: any;
    animationScheduler: any;
    transientGameState?: any;
}

/**
 * Handles overlay message display with auto-hide functionality.
 * Manages temporary and persistent overlay messages.
 */
export class OverlayMessageHandler {
    private game: GameInstance;
    private messageOverlay: HTMLElement | null;
    private currentOverlayTimeout: number | null = null;
    private eventManager: EventListenerManager;

    constructor(game: GameInstance) {
        this.game = game;
        this.messageOverlay = document.getElementById('messageOverlay');
        this.eventManager = new EventListenerManager();

        // Set up click handler
        if (this.messageOverlay) {
            this.eventManager.add(this.messageOverlay, 'pointerdown', () => {
                if (!this.messageOverlay?.classList.contains('show')) return;

                if (this.game.displayingMessageForSign) {
                    // Import Sign dynamically to avoid circular deps
                    import('./Sign').then(({ Sign }) => {
                        Sign.hideMessageForSign(this.game);
                    });
                }
            });
        }
    }

    /**
     * Show an overlay message with optional image
     */
    show(text: string, imageSrc: string | null = null, isPersistent: boolean = false, isLargeText: boolean = false, onComplete: (() => void) | null = null): void {
        if (!this.messageOverlay) return;

        logger.log(`OverlayMessageHandler.show: "${text}", imageSrc: ${imageSrc}, isPersistent: ${isPersistent}`);

        let displayText = text;
        if (!displayText || displayText.trim() === '') {
            displayText = '[No message found for this note]';
            logger.warn('Note message is empty or undefined:', text);
        }

        // Clear any existing timeout
        this.clearTimeout();

        // Build HTML content
        if (imageSrc) {
            let imgStyle = 'width: 128px; height: auto; max-height: 128px; display: block; margin: 0 auto 10px auto; image-rendering: pixelated;';

            // Special handling for bow asset
            try {
                if (typeof imageSrc === 'string' && imageSrc.toLowerCase().endsWith('/bow.png')) {
                    imgStyle += ' transform: rotate(-90deg); transform-origin: center center;';
                }
            } catch (e) {}

            this.messageOverlay.innerHTML = `<img src="${imageSrc}" style="${imgStyle}"><div class="dialogue-text">${displayText}</div>`;
        } else {
            this.messageOverlay.innerHTML = `<div class="dialogue-text">${displayText}</div>`;
        }

        // Apply text fitting
        try {
            fitTextToContainer(this.messageOverlay, {
                childSelector: '.dialogue-text',
                minFontSize: 12
            });
        } catch (e) {}

        // Apply large text styling
        if (isLargeText) {
            this.messageOverlay.classList.add('large-text');
        } else {
            this.messageOverlay.classList.remove('large-text');
        }

        // Show overlay
        this.messageOverlay.classList.add('show');
        this.messageOverlay.classList.add('sign-dialogue');

        logger.log("Overlay message shown");

        // Call completion callback
        if (onComplete) {
            onComplete();
        }

        // Schedule auto-hide if not persistent
        if (!isPersistent) {
            this.scheduleAutoHide(2000);
        }
    }

    /**
     * Schedule auto-hide after a delay
     */
    scheduleAutoHide(delay: number): void {
        this.clearTimeout();

        this.game.animationScheduler.createSequence()
            .wait(delay)
            .then(() => {
                if (this.messageOverlay?.classList.contains('show')) {
                    this.hide();
                    logger.log("Auto-hiding overlay message due to timeout.");
                }
            })
            .start();
    }

    /**
     * Hide the overlay message
     */
    hide(): void {
        // Don't hide if there's a pending charge (check transientGameState)
        if (this.game.transientGameState && this.game.transientGameState.hasPendingCharge()) {
            return;
        }

        if (this.messageOverlay?.classList.contains('show')) {
            this.messageOverlay.classList.remove('show');

            // Remove sign-specific styling
            try {
                this.messageOverlay.classList.remove('sign-dialogue');
            } catch (e) {}

            logger.log("Hiding overlay message.");
        }

        this.clearTimeout();
    }

    /**
     * Clear any pending timeout
     */
    clearTimeout(): void {
        if (this.currentOverlayTimeout) {
            clearTimeout(this.currentOverlayTimeout);
            this.currentOverlayTimeout = null;
        }
    }

    /**
     * Check if overlay is currently showing
     */
    isShowing(): boolean {
        return this.messageOverlay?.classList.contains('show') || false;
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the OverlayMessageHandler instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }
}
