import type { IGame } from '@core/GameContext';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';

interface MessageManager {
    showSignMessage(message: string, portrait: string | null, name: string | null, buttonText: string | null): void;
    hideOverlayMessage(): void;
    addMessageToLog(messageText: string): void;
    showRegionNotification(x: number, y: number): void;
    showOverlayMessage(text: string, imageSrc: string | null, persistent: boolean, largeText: boolean, useTypewriter: boolean): void;
}

interface PanelManager {
    showBarterWindow(npc: string): void;
    hideBarterWindow(): void;
    showStatueInfo(npc: string): void;
    showStatueInfoWindow?(): void;
    hideStatueInfoWindow(): void;
}

interface UIDialogShowEvent {
    type: 'barter' | 'sign' | 'statue';
    npc?: string;
    message?: string;
    portrait?: string | null;
    name?: string | null;
    buttonText?: string | null;
    category?: string;
    portraitBackground?: string;
    data?: any;
}

interface UIDialogHideEvent {
    type: 'barter' | 'sign' | 'statue';
}

interface UIConfirmationShowEvent {
    message: string;
    action?: string;
    data?: any;
    persistent?: boolean;
    largeText?: boolean;
    useTypewriter?: boolean;
}

interface UIOverlayMessageShowEvent {
    text: string;
    imageSrc?: string | null;
    persistent?: boolean;
    largeText?: boolean;
    useTypewriter?: boolean;
}

interface UIMessageLogEvent {
    text: string;
    category?: string;
    priority?: 'info' | 'warning' | 'error';
    timestamp?: number;
}

interface UIRegionNotificationShowEvent {
    x: number;
    y: number;
    regionName?: string;
}

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
    private game: IGame;
    private messageManager: MessageManager;
    private panelManager: PanelManager;
    private _unsubscribers: Array<() => void>;

    constructor(game: IGame, messageManager: MessageManager, panelManager: PanelManager) {
        this.game = game;
        this.messageManager = messageManager;
        this.panelManager = panelManager;
        this._unsubscribers = [];
        this.setupEventListeners();
    }

    /**
     * Set up all UI event listeners
     * This is the central hub for UI event handling
     */
    private setupEventListeners(): void {
        // Dialog events
        this._unsubscribers.push(
            eventBus.on(EventTypes.UI_DIALOG_SHOW, (data: UIDialogShowEvent) => this.handleDialogShow(data))
        );
        this._unsubscribers.push(
            eventBus.on(EventTypes.UI_DIALOG_HIDE, (data: UIDialogHideEvent) => this.handleDialogHide(data))
        );

        // Confirmation events
        this._unsubscribers.push(
            eventBus.on(EventTypes.UI_CONFIRMATION_SHOW, (data: UIConfirmationShowEvent) => this.handleConfirmationShow(data))
        );
        this._unsubscribers.push(
            eventBus.on(EventTypes.UI_OVERLAY_MESSAGE_SHOW, (data: UIOverlayMessageShowEvent) => this.handleOverlayMessageShow(data))
        );
        this._unsubscribers.push(
            eventBus.on(EventTypes.UI_OVERLAY_MESSAGE_HIDE, () => this.handleOverlayMessageHide())
        );

        // Message events
        this._unsubscribers.push(
            eventBus.on(EventTypes.UI_MESSAGE_LOG, (data: UIMessageLogEvent) => this.handleMessageLog(data))
        );
        this._unsubscribers.push(
            eventBus.on(EventTypes.UI_REGION_NOTIFICATION_SHOW, (data: UIRegionNotificationShowEvent) => this.handleRegionNotification(data))
        );
    }

    /**
    * Handle dialog show events
    */
    private handleDialogShow(data: UIDialogShowEvent): void {
    const { type, npc, message, portrait, name, buttonText, category, portraitBackground } = data;

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
            this.messageManager.showSignMessage(message, portrait || null, name || null, buttonText || null, category, portraitBackground);
            break;

            case 'statue':
                // showStatueInfo takes an npc parameter
                if (data.npc) {
                    this.panelManager.showStatueInfo(data.npc);
                } else {
                    this.panelManager.showStatueInfoWindow?.();
                }
                break;

            default:
                console.warn(`[UIEventCoordinator] Unknown dialog type: ${type}`);
        }
    }

    /**
     * Handle dialog hide events
     */
    private handleDialogHide(data: UIDialogHideEvent): void {
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
     */
    private handleConfirmationShow(data: UIConfirmationShowEvent): void {
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
     */
    private handleOverlayMessageShow(data: UIOverlayMessageShowEvent): void {
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
    private handleOverlayMessageHide(): void {
        this.messageManager.hideOverlayMessage();
    }

    /**
     * Handle message log events
     */
    private handleMessageLog(data: UIMessageLogEvent): void {
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
     */
    private handleRegionNotification(data: UIRegionNotificationShowEvent): void {
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
    destroy(): void {
        this._unsubscribers?.forEach(unsub => unsub());
        this._unsubscribers = [];
    }
}
