import type { IGame } from '@core/context';
import { logger } from '@core/logger';
import { NoteStack } from './NoteStack';
import { RegionNotification } from './RegionNotification';
import { OverlayMessageHandler } from './OverlayMessageHandler';
import { TypewriterController } from './TypewriterController';
import { DialogueManager } from './DialogueManager';
import { MessageLog } from './MessageLog';
import { PenneMessageHandler } from './PenneMessageHandler';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { UI_TIMING_CONSTANTS } from '@core/constants/ui';
import { Position } from '@core/Position';

/**
 * Coordinates message display across the application.
 * Delegates to specialized handlers for different message types.
 */
export class MessageManager {
    private game: IGame;
    public overlayHandler: OverlayMessageHandler;
    public typewriterController: TypewriterController;
    public dialogueManager: DialogueManager;
    public messageLog: MessageLog;
    public penneHandler: PenneMessageHandler;
    public noteStack: NoteStack;
    public regionNotification: RegionNotification;
    public typewriterSpeed: number;
    public typewriterSfxEnabled: boolean;
    public _typingAudioContext: any;
    public _typingMasterGain: any;
    public _currentVoiceSettings: any;
    private _unsubscribers: Array<() => void>;

    constructor(game: IGame) {
        this.game = game;
        this._unsubscribers = [];

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
    private setupEventListeners(): void {
        // Listen for UI show message events
        this._unsubscribers.push(
            eventBus.on(EventTypes.UI_SHOW_MESSAGE, (data: any) => {
                const { text, imageSrc, isPersistent, isLargeText, useTypewriter } = data;
                this.showOverlayMessage(text, imageSrc, isPersistent, isLargeText, useTypewriter);
            })
        );

        // Hide persistent messages when player moves (unless it's a sign message)
        this._unsubscribers.push(
            eventBus.on(EventTypes.PLAYER_MOVED, (positionData: any) => {
                if (!this.game.displayingMessageForSign) {
                    this.hideOverlayMessage();
                } else {
                    // Check if player walked away from NPC
                    const playerPos = { x: positionData.x, y: positionData.y };
                    const transientState = this.game.transientGameState;

                    if (transientState) {
                        const npcPos = transientState.getCurrentNPCPosition();

                        const isAdjacent = transientState.isPlayerAdjacentToNPC(Position.from(playerPos));

                        if (!isAdjacent) {
                            // Player walked away from NPC, close the message
                            logger.log('Player walked away from NPC, closing message');

                            // Hide sign/dialogue message
                            import('./Sign').then(({ Sign }) => {
                                Sign.hideMessageForSign(this.game);
                            });

                            // Clear NPC position tracking
                            transientState.clearCurrentNPCPosition();

                            // Also close barter window if open
                            eventBus.emit(EventTypes.UI_DIALOG_HIDE, { type: 'barter' });
                        }
                    }
                }
            })
        );
    }

    // ========================================
    // Overlay Message Methods
    // ========================================

    /**
     * Show overlay message with typewriter effect
     */
    showOverlayMessage(text: string, imageSrc: string | null = null, isPersistent = false, isLargeText = false, useTypewriter = true): void {
        this.showMessage(text, imageSrc, true, isPersistent, isLargeText, useTypewriter);
    }

    /**
     * Show overlay message without typewriter effect
     */
    showOverlayMessageSilent(text: string, imageSrc: string | null): void {
        this.showMessage(text, imageSrc, true, false, false, false);
    }

    /**
     * Generic message display method (backward compatibility)
     */
    showMessage(text: string, imageSrc: string | null = null, useOverlay = false, isPersistent = false, isLargeText = false, useTypewriter = true): void {
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
                if (element && this.typewriterController.shouldUseTypewriter(element)) {
                    this.typewriterController.start(element, () => {
                        // Auto-hide after typewriter completes
                        if (!isPersistent) {
                            this.overlayHandler.scheduleAutoHide(UI_TIMING_CONSTANTS.NOTE_DEFAULT_TIMEOUT);
                        }
                    });
                } else {
                    // No typewriter, just schedule auto-hide
                    if (!isPersistent) {
                        this.overlayHandler.scheduleAutoHide(UI_TIMING_CONSTANTS.NOTE_DEFAULT_TIMEOUT);
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
    hideOverlayMessage(): void {
        this.overlayHandler.hide();
    }

    // ========================================
    // Dialogue Methods (Signs & NPCs)
    // ========================================

    /**
    * Show sign or NPC dialogue
    */
    showSignMessage(text: string, imageSrc: string | null, name: string | null = null, buttonText: string | null = null, category = 'unknown', portraitBackground?: string): void {
    this.dialogueManager.showDialogue(text, imageSrc, name, buttonText, category, portraitBackground);
    }

    // ========================================
    // Penne-specific Methods
    // ========================================

    /**
     * Show Penne interaction message
     */
    handlePenneInteractionMessage(): void {
        this.penneHandler.showInteractionMessage();
    }

    /**
     * Hide Penne interaction message
     */
    hidePenneInteractionMessage(): void {
        this.penneHandler.hideInteractionMessage();
    }

    // ========================================
    // Message Log Methods
    // ========================================

    /**
     * Add a message to the log
     * Shows coordinate confirmation if coordinates found
     */
    addMessageToLog(message: string): void {
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
    handleMessageLogClick(): void {
        this.messageLog.show();
    }

    /**
     * Set up message log button handler
     * @deprecated MessageLog handles this internally
     */
    setupMessageLogButton(): void {
        // MessageLog now handles its own button setup
        logger.warn('setupMessageLogButton is deprecated - MessageLog handles this internally');
    }

    /**
     * Set up close message log handler
     * @deprecated MessageLog handles this internally
     */
    setupCloseMessageLogHandler(): void {
        // MessageLog now handles its own close button
        logger.warn('setupCloseMessageLogHandler is deprecated - MessageLog handles this internally');
    }

    // ========================================
    // Note Stack Methods (Delegated)
    // ========================================

    /**
     * Add a small note card to the stacked note container
     */
    addNoteToStack(text: string, imageSrc: string | null = null, timeout: number = UI_TIMING_CONSTANTS.NOTE_DEFAULT_TIMEOUT): string {
        return this.noteStack.addNoteToStack(text, imageSrc, timeout);
    }

    /**
     * Remove a note by ID
     */
    removeNoteFromStack(id: string): void {
        this.noteStack.removeNoteFromStack(id);
    }

    // ========================================
    // Region Notification Methods (Delegated)
    // ========================================

    /**
     * Show region notification
     */
    showRegionNotification(zoneX: number, zoneY: number): void {
        this.regionNotification.showRegionNotification(zoneX, zoneY);
    }

    // ========================================
    // Typewriter Configuration
    // ========================================

    /**
     * Set typewriter speed
     */
    setTypewriterSpeed(speed: number): void {
        this.typewriterController.setSpeed(speed);
        this.typewriterSpeed = this.typewriterController.typewriterSpeed;
    }

    /**
     * Enable or disable typewriter SFX
     */
    setTypewriterSfxEnabled(enabled: boolean): void {
        this.typewriterController.setSfxEnabled(enabled);
        this.typewriterSfxEnabled = this.typewriterController.typewriterSfxEnabled;
    }

    /**
     * Cleanup event listeners
     * Call this when destroying the MessageManager instance
     */
    destroy(): void {
        this._unsubscribers?.forEach(unsub => unsub());
        this._unsubscribers = [];
    }
}
