import { logger } from '../core/logger.js';
import { fitTextToContainer } from './TextFitter.js';

/**
 * Handles overlay message display with auto-hide functionality.
 * Manages temporary and persistent overlay messages.
 */
export class OverlayMessageHandler {
    constructor(game) {
        this.game = game;
        this.messageOverlay = document.getElementById('messageOverlay');
        this.currentOverlayTimeout = null;

        // Set up click handler
        this.messageOverlay.addEventListener('pointerdown', () => {
            if (!this.messageOverlay.classList.contains('show')) return;

            if (this.game.displayingMessageForSign) {
                // Import Sign dynamically to avoid circular deps
                import('./Sign.js').then(({ Sign }) => {
                    Sign.hideMessageForSign(this.game);
                });
            }
        });
    }

    /**
     * Show an overlay message with optional image
     * @param {string} text - HTML text to display
     * @param {string|null} imageSrc - Optional image source
     * @param {boolean} isPersistent - If true, won't auto-hide
     * @param {boolean} isLargeText - If true, applies large-text styling
     * @param {function|null} onComplete - Callback after display is ready
     */
    show(text, imageSrc = null, isPersistent = false, isLargeText = false, onComplete = null) {
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
     * @param {number} delay - Milliseconds to wait before hiding
     */
    scheduleAutoHide(delay) {
        this.clearTimeout();

        this.game.animationScheduler.createSequence()
            .wait(delay)
            .then(() => {
                if (this.messageOverlay.classList.contains('show')) {
                    this.hide();
                    logger.log("Auto-hiding overlay message due to timeout.");
                }
            })
            .start();
    }

    /**
     * Hide the overlay message
     */
    hide() {
        // Don't hide if there's a pending charge
        if (this.game.pendingCharge) {
            return;
        }

        if (this.messageOverlay.classList.contains('show')) {
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
    clearTimeout() {
        if (this.currentOverlayTimeout) {
            clearTimeout(this.currentOverlayTimeout);
            this.currentOverlayTimeout = null;
        }
    }

    /**
     * Check if overlay is currently showing
     */
    isShowing() {
        return this.messageOverlay.classList.contains('show');
    }
}
