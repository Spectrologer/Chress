import { logger } from '@core/logger';
import { fitTextToContainer } from './TextFitter';
import type { TypewriterController } from './TypewriterController';
import { EventListenerManager } from '@utils/EventListenerManager';
import type { IGame } from '@core/context';
import { TextBox } from './textbox';

/**
 * Managestextbox and NPC dialogue display with portraits and buttons.
 * Handles persistent dialogue that requires user interaction to dismiss.
 */
export class DialogueManager {
    private game: IGame;
    private typewriterController: TypewriterController;
    private messageOverlay: HTMLElement | null;
    private eventManager: EventListenerManager;
    private onCloseCallback: (() => void) | null = null;

    constructor(game: IGame, typewriterController: TypewriterController) {
        this.game = game;
        this.typewriterController = typewriterController;
        this.messageOverlay = document.getElementById('messageOverlay');
        this.eventManager = new EventListenerManager();
    }

    /**
    * Showtextbox or NPC dialogue message
    */
    showDialogue(text: string, imageSrc: string | null, name: string | null = null, buttonText: string | null = null, category = 'unknown', portraitBackground?: string, onClose?: () => void): void {
        if (!this.messageOverlay) return;

        // Store the callback
        this.onCloseCallback = onClose || null;

        // Clear any overlay timeouts to prevent auto-hiding
        this._clearTimeouts();

        // Determine button text
        const btnText = this._getButtonText(name, buttonText);

        // Build dialogue HTML
        this._buildDialogueHTML(text, imageSrc, name, btnText, category, portraitBackground);

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
                const buttonContainer = this.messageOverlay!.querySelector<HTMLElement>('#dialogue-button-container');
                if (buttonContainer) {
                    buttonContainer.style.opacity = '1';
                    buttonContainer.style.pointerEvents = 'auto';
                }
            });
        } else {
            // Signs show immediately without typewriter
            this.typewriterController.stop();
        }
    }

    /**
     * Determine button text based on character
     */
    private _getButtonText(name: string | null, buttonText: string | null): string {
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
    */
    private _buildDialogueHTML(text: string, imageSrc: string | null, name: string | null, btnText: string, category: string, portraitBackground?: string): void {
        if (!this.messageOverlay) return;

        // Add assets/ prefix if imageSrc doesn't already include it
        const imgPath = imageSrc && !imageSrc.startsWith('assets/') ? `assets/${imageSrc}` : imageSrc;

        if (name && imgPath) {
        // NPC dialogue with name and portrait in traditional RPG layout (portrait on left)
        this.messageOverlay.innerHTML = /*html*/`
        <div class="dialogue-container">
        <div class="dialogue-main-content">
        <div class="dialogue-portrait-area">
            <div class="barter-portrait-container large-portrait npc-category-${category}">
                <img src="${imgPath}" class="barter-portrait${portraitBackground ? ' custom-matte' : ' matte-1'}" style="image-rendering: pixelated;${portraitBackground ? ` background-color: ${portraitBackground};` : ''}">
            </div>
            <div class="character-name" style="${portraitBackground ? `color: ${portraitBackground};` : ''}">${name}</div>
        </div>
        <div class="dialogue-text" style="text-align: left; font-size: 1.35em; line-height: 1.45; padding: 10px 15px; flex-grow: 1; overflow: auto; max-height: 100%;">${text}</div>
        </div>
        <div id="dialogue-button-container" style="text-align: center; margin-top: 15px; flex-shrink: 0; opacity: 0; pointer-events: none;">
        <button class="dialogue-close-button" style="padding: 10px 20px; font-size: 1.2em; cursor: pointer; background-color: #8B4513; color: white; border: 2px solid #654321; border-radius: 5px;">${btnText}</button>
        </div>
        </div>`;
        } else if (imgPath) {
            //textbox with image
            let imgStyle = 'width: 128px; height: auto; max-height: 128px; display: block; margin: 0 auto 10px auto; image-rendering: pixelated;';

            // Special handling for bow asset
            try {
                if (typeof imgPath === 'string' && imgPath.toLowerCase().endsWith('/bow.png')) {
                    imgStyle += ' transform: rotate(-90deg); transform-origin: center center;';
                }
            } catch (e) {
                logger.warn('[DialogueManager] Failed to check bow asset:', e);
            }

            this.messageOverlay.innerHTML = /*html*/`
                <img src="${imgPath}" style="${imgStyle}">
                <div class="dialogue-text" style="text-align:center;">${text}</div>
                <div id="dialogue-button-container" style="text-align: center; margin-top: 20px;">
                    <button class="dialogue-close-button" style="padding: 8px 16px; font-size: 1.2em; cursor: pointer; background-color: #8B4513; color: white; border: 2px solid #654321; border-radius: 5px;">${btnText}</button>
                </div>`;
        } else {
            //textbox without image
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
        } catch (e) {
            logger.warn('[DialogueManager] Failed to fit text:', e);
        }
    }

    /**
     * Attach click handler to close button
     */
    private _attachButtonHandler(): void {
        try {
            const closeButton = this.messageOverlay?.querySelector('.dialogue-close-button');
            if (closeButton) {
                this.eventManager.add(closeButton, 'click', () => {
                    TextBox.hideMessageForSign(this.game);

                    // Invoke callback after closing dialogue
                    if (this.onCloseCallback) {
                        this.onCloseCallback();
                        this.onCloseCallback = null;
                    }
                });
            }
        } catch (e) {
            logger.error('Error attaching dialogue button handler:', e);
        }
    }

    /**
     * Clear any pending overlay timeouts
     */
    private _clearTimeouts(): void {
        // Access the overlay handler's timeout if available
        if (this.game.messageManager && this.game.messageManager.overlayHandler) {
            this.game.messageManager.overlayHandler.clearTimeout();
        }
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the DialogueManager instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }
}
