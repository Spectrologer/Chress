import { StartOverlayController } from './StartOverlayController';
import { OverlayButtonHandler } from './OverlayButtonHandler';
import { OverlayMusicToggle } from './OverlayMusicToggle';

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
            (overlay, hasSaved) => this.buttonHandler.setupButtonHandlers(overlay, hasSaved)
        );
    }
}
