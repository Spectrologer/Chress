import { logger } from '../core/logger.js';
import { NoteStack } from './NoteStack.js';
import { RegionNotification } from './RegionNotification.js';
import { OverlayMessageHandler } from './OverlayMessageHandler.js';
import { TypewriterController } from './TypewriterController.js';
import { DialogueManager } from './DialogueManager.js';
import { MessageLog } from './MessageLog.js';
import { PenneMessageHandler } from './PenneMessageHandler.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';

/**
 * Coordinates message display across the application.
 * Delegates to specialized handlers for different message types.
 */
export class MessageManager {
    constructor(game) {
        this.game = game;

        // Initialize specialized handlers
        this.overlayHandler = new OverlayMessageHandler(game);
        this.typewriterController = new TypewriterController(game);
        this.dialogueManager = new DialogueManager(game, this.typewriterController);
        this.messageLog = new MessageLog(game);
        this.penneHandler = new PenneMessageHandler(game, this.overlayHandler);

        // Note stack and region notifications (already extracted)
        this.noteStack = new NoteStack();
        this.regionNotification = new RegionNotification(game);

        // Expose typewriter settings for external configuration
        this.typewriterSpeed = this.typewriterController.typewriterSpeed;
        this.typewriterSfxEnabled = this.typewriterController.typewriterSfxEnabled;

        // Expose audio context references for compatibility
        this._typingAudioContext = null;
        this._typingMasterGain = null;

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event bus listeners
     */
    setupEventListeners() {
        // Listen for UI show message events
        eventBus.on(EventTypes.UI_SHOW_MESSAGE, (data) => {
            const { text, imageSrc, isPersistent, isLargeText, useTypewriter } = data;
            this.showOverlayMessage(text, imageSrc, isPersistent, isLargeText, useTypewriter);
        });

        // Hide persistent messages when player moves (unless it's a sign message)
        eventBus.on(EventTypes.PLAYER_MOVED, (positionData) => {
            if (!this.game.displayingMessageForSign) {
                this.hideOverlayMessage();
            } else {
                // Check if player walked away from NPC
                const playerPos = { x: positionData.x, y: positionData.y };
                const transientState = this.game.transientGameState;

                if (transientState) {
                    const npcPos = transientState.getCurrentNPCPosition();

                    const isAdjacent = transientState.isPlayerAdjacentToNPC(playerPos);

                    if (!isAdjacent) {
                        // Player walked away from NPC, close the message
                        logger.log('Player walked away from NPC, closing message');

                        // Hide sign/dialogue message
                        import('./Sign.js').then(({ Sign }) => {
                            Sign.hideMessageForSign(this.game);
                        });

                        // Clear NPC position tracking
                        transientState.clearCurrentNPCPosition();

                        // Also close barter window if open
                        eventBus.emit(EventTypes.UI_DIALOG_HIDE, { type: 'barter' });
                    }
                }
            }
        });
    }

    // ========================================
    // Overlay Message Methods
    // ========================================

    /**
     * Show overlay message with typewriter effect
     * @param {string} text - HTML text to display
     * @param {string|null} imageSrc - Optional image source
     * @param {boolean} isPersistent - If true, won't auto-hide
     * @param {boolean} isLargeText - If true, applies large-text styling
     * @param {boolean} useTypewriter - If true, uses typewriter effect
     */
    showOverlayMessage(text, imageSrc, isPersistent = false, isLargeText = false, useTypewriter = true) {
        this.showMessage(text, imageSrc, true, isPersistent, isLargeText, useTypewriter);
    }

    /**
     * Show overlay message without typewriter effect
     * @param {string} text - HTML text to display
     * @param {string|null} imageSrc - Optional image source
     */
    showOverlayMessageSilent(text, imageSrc) {
        this.showMessage(text, imageSrc, true, false, false, false);
    }

    /**
     * Generic message display method (backward compatibility)
     * @param {string} text - Message text
     * @param {string|null} imageSrc - Optional image
     * @param {boolean} useOverlay - Use overlay (vs messageBox)
     * @param {boolean} isPersistent - Don't auto-hide
     * @param {boolean} isLargeText - Use large text styling
     * @param {boolean} useTypewriter - Use typewriter effect
     */
    showMessage(text, imageSrc = null, useOverlay = false, isPersistent = false, isLargeText = false, useTypewriter = true) {
        if (!useOverlay) {
            logger.warn('MessageManager.showMessage: useOverlay=false is deprecated');
            return;
        }

        logger.log(`showMessage: "${text}", useTypewriter: ${useTypewriter}`);

        // Determine if we should use typewriter
        const shouldAnimate = useTypewriter && this.typewriterController.typewriterSpeed > 0;

        if (shouldAnimate) {
            // Show with typewriter potential
            this.overlayHandler.show(text, imageSrc, isPersistent, isLargeText, () => {
                // Check if typewriter should run
                const element = document.getElementById('messageOverlay');
                if (this.typewriterController.shouldUseTypewriter(element)) {
                    this.typewriterController.start(element, () => {
                        // Auto-hide after typewriter completes
                        if (!isPersistent) {
                            this.overlayHandler.scheduleAutoHide(2000);
                        }
                    });
                } else {
                    // No typewriter, just schedule auto-hide
                    if (!isPersistent) {
                        this.overlayHandler.scheduleAutoHide(2000);
                    }
                }
            });
        } else {
            // Show without typewriter
            this.overlayHandler.show(text, imageSrc, isPersistent, isLargeText);
        }
    }

    /**
     * Hide overlay message
     */
    hideOverlayMessage() {
        this.overlayHandler.hide();
    }

    // ========================================
    // Dialogue Methods (Signs & NPCs)
    // ========================================

    /**
     * Show sign or NPC dialogue
     * @param {string} text - Dialogue text
     * @param {string|null} imageSrc - Portrait image
     * @param {string|null} name - Character name (null for signs)
     * @param {string|null} buttonText - Custom button text
     */
    showSignMessage(text, imageSrc, name = null, buttonText = null) {
        this.dialogueManager.showDialogue(text, imageSrc, name, buttonText);
    }

    // ========================================
    // Penne-specific Methods
    // ========================================

    /**
     * Show Penne interaction message
     */
    handlePenneInteractionMessage() {
        this.penneHandler.showInteractionMessage();
    }

    /**
     * Hide Penne interaction message
     */
    hidePenneInteractionMessage() {
        this.penneHandler.hideInteractionMessage();
    }

    // ========================================
    // Message Log Methods
    // ========================================

    /**
     * Add a message to the log
     * Shows coordinate confirmation if coordinates found
     * @param {string} message - Message to add
     */
    addMessageToLog(message) {
        const coordinates = this.messageLog.addMessage(message);

        // If coordinates were found, show confirmation
        if (coordinates) {
            this.showOverlayMessage(
                `Coordinates ${coordinates} added to log.`,
                null,
                false, // isPersistent
                false, // isLargeText
                false  // useTypewriter - show immediately
            );
        }
    }

    /**
     * Show the message log UI
     * @deprecated Use messageLog.show() directly
     */
    handleMessageLogClick() {
        this.messageLog.show();
    }

    /**
     * Set up message log button handler
     * @deprecated MessageLog handles this internally
     */
    setupMessageLogButton() {
        // MessageLog now handles its own button setup
        logger.warn('setupMessageLogButton is deprecated - MessageLog handles this internally');
    }

    /**
     * Set up close message log handler
     * @deprecated MessageLog handles this internally
     */
    setupCloseMessageLogHandler() {
        // MessageLog now handles its own close button
        logger.warn('setupCloseMessageLogHandler is deprecated - MessageLog handles this internally');
    }

    // ========================================
    // Note Stack Methods (Delegated)
    // ========================================

    /**
     * Add a small note card to the stacked note container
     * @param {string} text - HTML/text content
     * @param {string|null} imageSrc - Optional thumbnail
     * @param {number} timeout - ms to auto-hide (default 2000)
     * @returns {string} Note ID
     */
    addNoteToStack(text, imageSrc = null, timeout = 2000) {
        return this.noteStack.addNoteToStack(text, imageSrc, timeout);
    }

    /**
     * Remove a note by ID
     * @param {string} id - Note ID
     */
    removeNoteFromStack(id) {
        this.noteStack.removeNoteFromStack(id);
    }

    // ========================================
    // Region Notification Methods (Delegated)
    // ========================================

    /**
     * Show region notification
     * @param {number} zoneX - Zone X coordinate
     * @param {number} zoneY - Zone Y coordinate
     */
    showRegionNotification(zoneX, zoneY) {
        this.regionNotification.showRegionNotification(zoneX, zoneY);
    }

    // ========================================
    // Typewriter Configuration
    // ========================================

    /**
     * Set typewriter speed
     * @param {number} speed - Milliseconds per character
     */
    setTypewriterSpeed(speed) {
        this.typewriterController.setSpeed(speed);
        this.typewriterSpeed = this.typewriterController.typewriterSpeed;
    }

    /**
     * Enable or disable typewriter SFX
     * @param {boolean} enabled
     */
    setTypewriterSfxEnabled(enabled) {
        this.typewriterController.setSfxEnabled(enabled);
        this.typewriterSfxEnabled = this.typewriterController.typewriterSfxEnabled;
    }
}
