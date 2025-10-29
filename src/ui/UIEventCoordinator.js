import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';

/**
 * UIEventCoordinator - Centralized handler for all UI-related events
 *
 * This class decouples game managers from UI components by handling all UI events
 * in one place. Managers emit events, and this coordinator translates them into
 * UI operations.
 *
 * Benefits:
 * - Managers don't need direct references to UIManager
 * - Easier to test (just listen for events)
 * - Clear separation of concerns
 * - Single place to add logging, analytics, etc.
 */
export class UIEventCoordinator {
    constructor(game, messageManager, panelManager) {
        this.game = game;
        this.messageManager = messageManager;
        this.panelManager = panelManager;
        this.setupEventListeners();
    }

    /**
     * Set up all UI event listeners
     * This is the central hub for UI event handling
     */
    setupEventListeners() {
        // Dialog events
        eventBus.on(EventTypes.UI_DIALOG_SHOW, (data) => this.handleDialogShow(data));
        eventBus.on(EventTypes.UI_DIALOG_HIDE, (data) => this.handleDialogHide(data));

        // Confirmation events
        eventBus.on(EventTypes.UI_CONFIRMATION_SHOW, (data) => this.handleConfirmationShow(data));
        eventBus.on(EventTypes.UI_OVERLAY_MESSAGE_SHOW, (data) => this.handleOverlayMessageShow(data));
        eventBus.on(EventTypes.UI_OVERLAY_MESSAGE_HIDE, () => this.handleOverlayMessageHide());

        // Message events
        eventBus.on(EventTypes.UI_MESSAGE_LOG, (data) => this.handleMessageLog(data));
        eventBus.on(EventTypes.UI_REGION_NOTIFICATION_SHOW, (data) => this.handleRegionNotification(data));
    }

    /**
     * Handle dialog show events
     * @param {UIDialogShowEvent} data - Dialog data
     */
    handleDialogShow(data) {
        const { type, npc, message, portrait, name, buttonText } = data;

        switch (type) {
            case 'barter':
                if (!npc) {
                    console.error('[UIEventCoordinator] Barter dialog requires npc property');
                    return;
                }
                this.panelManager.showBarterWindow(npc);
                break;

            case 'sign':
                if (!message) {
                    console.error('[UIEventCoordinator] Sign dialog requires message property');
                    return;
                }
                this.messageManager.showSignMessage(message, portrait, name, buttonText);
                break;

            case 'statue':
                // showStatueInfo takes an npc parameter
                if (data.npc) {
                    this.panelManager.showStatueInfo(data.npc);
                } else {
                    this.panelManager.showStatueInfoWindow();
                }
                break;

            default:
                console.warn(`[UIEventCoordinator] Unknown dialog type: ${type}`);
        }
    }

    /**
     * Handle dialog hide events
     * @param {UIDialogHideEvent} data - Dialog hide data
     */
    handleDialogHide(data) {
        const { type } = data;

        switch (type) {
            case 'barter':
                this.panelManager.hideBarterWindow();
                break;

            case 'statue':
                this.panelManager.hideStatueInfoWindow();
                break;

            case 'sign':
                // Signs use overlay message system
                this.messageManager.hideOverlayMessage();
                break;

            default:
                console.warn(`[UIEventCoordinator] Unknown dialog type to hide: ${type}`);
        }
    }

    /**
     * Handle confirmation show events
     * Confirmations are persistent overlay messages with an associated action
     * @param {UIConfirmationShowEvent} data - Confirmation data
     */
    handleConfirmationShow(data) {
        const {
            message,
            action,
            persistent = true,
            largeText = true,
            useTypewriter = false
        } = data;

        // Store the pending action for later confirmation
        if (action) {
            this.game.pendingConfirmationAction = action;
            this.game.pendingConfirmationData = data.data;
        }

        // Show the confirmation message
        this.messageManager.showOverlayMessage(
            message,
            null, // imageSrc
            persistent,
            largeText,
            useTypewriter
        );
    }

    /**
     * Handle overlay message show events
     * @param {UIOverlayMessageShowEvent} data - Overlay message data
     */
    handleOverlayMessageShow(data) {
        const {
            text,
            imageSrc = null,
            persistent = false,
            largeText = false,
            useTypewriter = true
        } = data;

        this.messageManager.showOverlayMessage(
            text,
            imageSrc,
            persistent,
            largeText,
            useTypewriter
        );
    }

    /**
     * Handle overlay message hide events
     */
    handleOverlayMessageHide() {
        this.messageManager.hideOverlayMessage();
    }

    /**
     * Handle message log events
     * @param {UIMessageLogEvent} data - Message log data
     */
    handleMessageLog(data) {
        const { text, category, priority, timestamp } = data;

        // Add metadata if needed
        let messageText = text;
        if (category && priority === 'error') {
            messageText = `[${category.toUpperCase()}] ${text}`;
        }

        this.messageManager.addMessageToLog(messageText);

        // Could add analytics here
        if (priority === 'error') {
            console.error(`[Game Message] ${messageText}`, { category, timestamp });
        }
    }

    /**
     * Handle region notification events
     * @param {UIRegionNotificationShowEvent} data - Region notification data
     */
    handleRegionNotification(data) {
        const { x, y, regionName } = data;

        // If region name is provided, use it. Otherwise, generate it.
        if (regionName) {
            this.messageManager.showRegionNotification(x, y);
        } else {
            this.messageManager.showRegionNotification(x, y);
        }
    }

    /**
     * Cleanup event listeners
     * Call this when the UI coordinator is destroyed
     */
    destroy() {
        // EventBus.on returns unsubscribe functions, but we're not storing them
        // For now, we rely on the game instance lifecycle
        // In the future, could store unsubscribe functions and call them here
    }
}
