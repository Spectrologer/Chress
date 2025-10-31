import { logger } from '../core/logger.js';
import { fitTextToContainer } from './TextFitter.js';

/**
 * Manages sign and NPC dialogue display with portraits and buttons.
 * Handles persistent dialogue that requires user interaction to dismiss.
 */
export class DialogueManager {
    constructor(game, typewriterController) {
        this.game = game;
        this.typewriterController = typewriterController;
        this.messageOverlay = document.getElementById('messageOverlay');
    }

    /**
     * Show sign or NPC dialogue message
     * @param {string} text - Dialogue text (HTML)
     * @param {string|null} imageSrc - Portrait image
     * @param {string|null} name - Character name (null for signs)
     * @param {string|null} buttonText - Custom button text
     */
    showDialogue(text, imageSrc, name = null, buttonText = null) {
        // Clear any overlay timeouts to prevent auto-hiding
        this._clearTimeouts();

        // Determine button text
        const btnText = this._getButtonText(name, buttonText);

        // Build dialogue HTML
        this._buildDialogueHTML(text, imageSrc, name, btnText);

        // Attach button event listener
        this._attachButtonHandler();

        // Show overlay
        this.messageOverlay.classList.add('show');

        // Log timing
        try {
            const t = (typeof performance !== 'undefined' && performance.now) ?
                      performance.now() : Date.now();
            logger.log(`Dialogue shown: ${text} -- ts=${t}`);
        } catch (e) {
            logger.log(`Dialogue shown: ${text}`);
        }

        // Start typewriter effect for NPC dialogues
        if (name && this.typewriterController.shouldUseTypewriter(this.messageOverlay)) {
            this.typewriterController.start(this.messageOverlay, () => {
                // Show button after typing completes
                const buttonContainer = this.messageOverlay.querySelector('#dialogue-button-container');
                if (buttonContainer) {
                    buttonContainer.style.display = 'block';
                }
            });
        } else {
            // Signs show immediately without typewriter
            this.typewriterController.stop();
        }
    }

    /**
     * Determine button text based on character
     * @param {string|null} name - Character name
     * @param {string|null} buttonText - Custom button text
     * @returns {string}
     */
    _getButtonText(name, buttonText) {
        if (buttonText) {
            return buttonText;
        }

        if (name) {
            const nameLower = name.toLowerCase();
            if (nameLower === 'crayn') {
                return 'Okay...';
            } else if (nameLower === 'forge') {
                return 'Right...';
            } else {
                return 'Got it';
            }
        }

        // Default for signs
        return 'True';
    }

    /**
     * Build dialogue HTML content
     * @param {string} text - Dialogue text
     * @param {string|null} imageSrc - Portrait image
     * @param {string|null} name - Character name
     * @param {string} btnText - Button text
     */
    _buildDialogueHTML(text, imageSrc, name, btnText) {
        // Add assets/ prefix if imageSrc doesn't already include it
        const imgPath = imageSrc && !imageSrc.startsWith('assets/') ? `assets/${imageSrc}` : imageSrc;

        if (name && imgPath) {
            // NPC dialogue with name and portrait
            this.messageOverlay.innerHTML = /*html*/`
                <span class="character-name" style="font-size: 1.5em; margin-bottom: 10px; display:block; text-align:center;">${name}</span>
                <div class="barter-portrait-container large-portrait" style="margin: 0 auto 10px auto; text-align:center;">
                    <img src="${imgPath}" class="barter-portrait">
                </div>
                <div class="dialogue-text" style="text-align:center;">${text}</div>
                <div id="dialogue-button-container" style="text-align: center; margin-top: 20px; display: none;">
                    <button class="dialogue-close-button" style="padding: 8px 16px; font-size: 1.2em; cursor: pointer; background-color: #8B4513; color: white; border: 2px solid #654321; border-radius: 5px;">${btnText}</button>
                </div>`;
        } else if (imgPath) {
            // Sign with image
            let imgStyle = 'width: 128px; height: auto; max-height: 128px; display: block; margin: 0 auto 10px auto; image-rendering: pixelated;';

            // Special handling for bow asset
            try {
                if (typeof imgPath === 'string' && imgPath.toLowerCase().endsWith('/bow.png')) {
                    imgStyle += ' transform: rotate(-90deg); transform-origin: center center;';
                }
            } catch (e) {}

            this.messageOverlay.innerHTML = /*html*/`
                <img src="${imgPath}" style="${imgStyle}">
                <div class="dialogue-text" style="text-align:center;">${text}</div>
                <div id="dialogue-button-container" style="text-align: center; margin-top: 20px;">
                    <button class="dialogue-close-button" style="padding: 8px 16px; font-size: 1.2em; cursor: pointer; background-color: #8B4513; color: white; border: 2px solid #654321; border-radius: 5px;">${btnText}</button>
                </div>`;
        } else {
            // Sign without image
            this.messageOverlay.innerHTML = /*html*/`
                <div class="dialogue-text" style="text-align:center;">${text}</div>
                <div id="dialogue-button-container" style="text-align: center; margin-top: 20px;">
                    <button class="dialogue-close-button" style="padding: 8px 16px; font-size: 1.2em; cursor: pointer; background-color: #8B4513; color: white; border: 2px solid #654321; border-radius: 5px;">${btnText}</button>
                </div>`;
        }

        // Apply text fitting
        try {
            fitTextToContainer(this.messageOverlay, {
                childSelector: '.dialogue-text',
                minFontSize: 12
            });
        } catch (e) {}
    }

    /**
     * Attach click handler to close button
     */
    _attachButtonHandler() {
        try {
            const closeButton = this.messageOverlay.querySelector('.dialogue-close-button');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    // Import Sign dynamically to avoid circular deps
                    import('./Sign.js').then(({ Sign }) => {
                        Sign.hideMessageForSign(this.game);
                    });
                });
            }
        } catch (e) {
            logger.error('Error attaching dialogue button handler:', e);
        }
    }

    /**
     * Clear any pending overlay timeouts
     */
    _clearTimeouts() {
        // Access the overlay handler's timeout if available
        if (this.game.messageManager && this.game.messageManager.overlayHandler) {
            this.game.messageManager.overlayHandler.clearTimeout();
        }
    }
}

