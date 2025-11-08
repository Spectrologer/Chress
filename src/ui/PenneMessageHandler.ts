import type { OverlayMessageHandler } from './OverlayMessageHandler';

interface GameInstance {
    displayingMessageForSign?: any;
}

/**
 * Handles Penne-specific interaction messages.
 * Manages conflicts withtextbox messages.
 */
export class PenneMessageHandler {
    private game: GameInstance;
    private overlayHandler: OverlayMessageHandler;

    constructor(game: GameInstance, overlayHandler: OverlayMessageHandler) {
        this.game = game;
        this.overlayHandler = overlayHandler;
    }

    /**
     * Show Penne interaction message
     * Only shows if no textbox message is currently displayed
     */
    showInteractionMessage(): void {
        // Do not show the Penne message if a textbox message is already displayed
        if (this.game.displayingMessageForSign) {
            return;
        }

        // Show message even if another is showing, to allow it to take priority
        // when both Penne and other NPCs are present
        this.overlayHandler.show(
            '<span class="character-name">Penne</span><br>Give me meat!',
            'assets/fauna/penne.png',
            false, // isPersistent
            false  // isLargeText
        );
    }

    /**
     * Hide Penne interaction message
     * Only hides if not a textbox message
     */
    hideInteractionMessage(): void {
        // Hide the overlay, but only if a textbox message isn't the one being displayed
        if (this.overlayHandler.isShowing() && !this.game.displayingMessageForSign) {
            this.overlayHandler.hide();
        }
    }
}
