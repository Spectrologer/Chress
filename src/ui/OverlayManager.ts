import { StartOverlayController } from './StartOverlayController.ts';
import { OverlayButtonHandler } from './OverlayButtonHandler.ts';
import { OverlayMusicToggle } from './OverlayMusicToggle.ts';

interface GameInstance {
    [key: string]: any;
}

/**
 * OverlayManager
 *
 * Coordinates the start overlay display and user interactions.
 * Delegates responsibilities to specialized controllers.
 */
export class OverlayManager {
    private game: GameInstance;
    private startOverlayController: StartOverlayController;
    private musicToggle: OverlayMusicToggle;
    private buttonHandler: OverlayButtonHandler;

    constructor(game: GameInstance) {
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
    showStartOverlay(): void {
        this.startOverlayController.showStartOverlay(
            (overlay, hasSaved) => this.startOverlayController.configureContinueButton(overlay, hasSaved),
            (overlay) => this.musicToggle.setupMusicToggle(overlay),
            (overlay, hasSaved) => this.buttonHandler.setupButtonHandlers(overlay, hasSaved)
        );
    }
}
