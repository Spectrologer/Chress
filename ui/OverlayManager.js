import { StartOverlayController } from './StartOverlayController.js';
import { OverlayButtonHandler } from './OverlayButtonHandler.js';
import { OverlayMusicToggle } from './OverlayMusicToggle.js';

/**
 * OverlayManager
 *
 * Coordinates the start overlay display and user interactions.
 * Delegates responsibilities to specialized controllers.
 */
export class OverlayManager {
    constructor(game) {
        this.game = game;

        // Initialize controllers
        this.startOverlayController = new StartOverlayController(game);
        this.musicToggle = new OverlayMusicToggle(game);
        this.buttonHandler = new OverlayButtonHandler(game, this.startOverlayController, this.musicToggle);
    }

    /**
     * Shows the start overlay with appropriate button states.
     * Delegates to the StartOverlayController.
     */
    showStartOverlay() {
        this.startOverlayController.showStartOverlay(
            (overlay, hasSaved) => this.startOverlayController.configureContinueButton(overlay, hasSaved),
            (overlay) => this.musicToggle.setupMusicToggle(overlay),
            (overlay, hasSaved) => this.buttonHandler.setupButtonHandlers(overlay, hasSaved)
        );
    }
}
