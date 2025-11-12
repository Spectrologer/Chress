import { logger } from '@core/logger';
import { safeCall, safeCallAsync } from '@utils/SafeServiceCall';
import type { StartOverlayController } from './StartOverlayController';
import type { OverlayMusicToggle } from './OverlayMusicToggle';
import { EventListenerManager } from '@utils/EventListenerManager';

interface GameInstance {
    previewMode: boolean;
    soundManager: any;
    gameStateManager: any;
    gameInitializer: any;
}

/**
 * OverlayButtonHandler
 *
 * Handles all button interactions on the start overlay.
 * Manages start, continue, config, records, and editor button clicks.
 */
export class OverlayButtonHandler {
    private game: GameInstance;
    private startOverlayController: StartOverlayController;
    private musicToggle: OverlayMusicToggle;
    private eventManager: EventListenerManager;

    constructor(game: GameInstance, startOverlayController: StartOverlayController, musicToggle: OverlayMusicToggle) {
        this.game = game;
        this.startOverlayController = startOverlayController;
        this.musicToggle = musicToggle;
        this.eventManager = new EventListenerManager();
    }

    /**
     * Sets up button click handlers.
     */
    setupButtonHandlers(overlay: HTMLElement, hasSaved: boolean): void {
        // Start button - once only
        this.eventManager.setupButton('startButton', () => this.handleStartGame(overlay), { once: true });

        // Continue button - once only, if saved
        if (hasSaved) {
            this.eventManager.setupButton('continueButton', () => this.handleContinueGame(overlay), { once: true });
        }

        // Config button - repeatable
        this.eventManager.setupButton('configButton', () => this.handleConfig(), { once: false });

        // Records button - repeatable
        this.eventManager.setupButton('recordsButton', () => this.handleRecords(), { once: false });

        // board editor button - repeatable
        this.eventManager.setupButton('boardEditorButton', () => this.handleBoardEditor(), { once: false });

        // Character editor button - repeatable
        this.eventManager.setupButton('characterEditorButton', () => this.handleCharacterEditor(), { once: false });
    }

    /**
     * Handles starting a new game.
     */
    async handleStartGame(overlay: HTMLElement): Promise<void> {
        try {
            // Exit preview mode to show player
            this.game.previewMode = false;

            // Resume audio context on user gesture
            await this.resumeAudioContext();

            // Apply music preference
            this.musicToggle.applyMusicPreference();

            // Reset the game (clear saved state)
            this.resetGameState();

            // Animate overlay away
            await this.startOverlayController.hideOverlay(overlay);

            // Start new game
            this.game.gameInitializer.startGame();
        } catch (error) {
            logger.error('Error handling start game:', error);
            // Still try to start
            try {
                this.game.gameInitializer.startGame();
            } catch (e) {
                logger.error('Fatal error starting game:', e);
            }
        }
    }

    /**
     * Handles continuing a saved game.
     */
    async handleContinueGame(overlay: HTMLElement): Promise<void> {
        try {
            // Exit preview mode
            this.game.previewMode = false;

            // Load saved game state before resuming audio
            this.loadGameState();

            // Resume audio context on user gesture
            await this.resumeAudioContext();

            // Apply music preference (may override saved preference)
            this.musicToggle.applyMusicPreference();

            // Animate overlay away
            await this.startOverlayController.hideOverlay(overlay);

            // Start game (will continue from loaded state)
            this.game.gameInitializer.startGame();
        } catch (error) {
            logger.error('Error handling continue game:', error);
            // Still try to start
            try {
                this.game.gameInitializer.startGame();
            } catch (e) {
                logger.error('Fatal error continuing game:', e);
            }
        }
    }

    /**
     * Handles opening the board editor in-app overlay.
     */
    handleBoardEditor(): void {
        try {
            const overlay = document.getElementById('boardEditorOverlay');
            const iframe = document.getElementById('boardEditorFrame') as HTMLIFrameElement | null;
            const closeButton = document.getElementById('closeBoardEditor');

            if (!overlay || !iframe) {
                logger.error('board editor overlay elements not found');
                return;
            }

            // Get base path - use import.meta.env.BASE_URL which comes from Vite config
            const basePath = import.meta.env.BASE_URL;
            const editorPath = `${basePath}tools/board-editor.html`;

            // Set iframe source
            iframe.src = editorPath;

            // Show the overlay
            overlay.style.display = 'flex';

            // Create a separate event manager for this editor instance
            const editorEventManager = new EventListenerManager();

            // Close handler function
            const closeEditor = (): void => {
                overlay.style.display = 'none';
                iframe.src = ''; // Clear iframe to stop any running scripts
                // Clean up only this editor's event listeners
                editorEventManager.cleanup();
            };

            // Overlay click handler
            const overlayClickHandler = (e: MouseEvent): void => {
                // Only close if clicking directly on the overlay background, not its children
                if (e.target === overlay) {
                    closeEditor();
                }
            };

            // Set up close button handler
            if (closeButton) {
                editorEventManager.add(closeButton, 'click', closeEditor);
            }

            // Close on overlay background click
            editorEventManager.add(overlay, 'click', overlayClickHandler);

        } catch (error) {
            logger.error('Error opening board editor:', error);
        }
    }

    /**
     * Handles opening the character editor in-app overlay.
     */
    handleCharacterEditor(): void {
        try {
            const overlay = document.getElementById('characterEditorOverlay');
            const iframe = document.getElementById('characterEditorFrame') as HTMLIFrameElement | null;
            const closeButton = document.getElementById('closeCharacterEditor');

            if (!overlay || !iframe) {
                logger.error('Character editor overlay elements not found');
                return;
            }

            // Get base path - use import.meta.env.BASE_URL which comes from Vite config
            const basePath = import.meta.env.BASE_URL;
            const editorPath = `${basePath}tools/character-editor.html`;

            // Set iframe source
            iframe.src = editorPath;

            // Show the overlay
            overlay.style.display = 'flex';

            // Create a separate event manager for this editor instance
            const editorEventManager = new EventListenerManager();

            // Close handler function
            const closeEditor = (): void => {
                overlay.style.display = 'none';
                iframe.src = ''; // Clear iframe to stop any running scripts
                // Clean up only this editor's event listeners
                editorEventManager.cleanup();
            };

            // Overlay click handler
            const overlayClickHandler = (e: MouseEvent): void => {
                // Only close if clicking directly on the overlay background, not its children
                if (e.target === overlay) {
                    closeEditor();
                }
            };

            // Set up close button handler
            if (closeButton) {
                editorEventManager.add(closeButton, 'click', closeEditor);
            }

            // Close on overlay background click
            editorEventManager.add(overlay, 'click', overlayClickHandler);
        } catch (error) {
            logger.error('Error opening character editor:', error);
        }
    }

    /**
     * Handles opening the config menu from the start menu.
     */
    handleConfig(): void {
        try {
            const configOverlay = document.getElementById('configOverlay');
            if (!configOverlay) {
                logger.error('Config overlay element not found');
                return;
            }

            // Show config overlay
            configOverlay.classList.add('show');

            // Mark that config was opened from start menu
            configOverlay.dataset.openedFromStart = 'true';

            // Set up the config panel manager's back button to return to start menu
            const backButton = configOverlay.querySelector<HTMLElement>('#config-back-button');
            if (backButton) {
                // Remove any existing listeners before adding new ones
                this.eventManager.removeAllListenersFromElement(backButton);

                this.eventManager.add(backButton, 'click', (e: Event) => {
                    e?.preventDefault?.();
                    e?.stopPropagation?.();
                    configOverlay.classList.remove('show');
                    delete configOverlay.dataset.openedFromStart;
                });
            }

            // Set up overlay click to close
            const handleOverlayClick = (e: MouseEvent): void => {
                const panel = configOverlay.querySelector<HTMLElement>('.stats-panel');
                if (!panel || !panel.contains(e.target as Node)) {
                    configOverlay.classList.remove('show');
                    delete configOverlay.dataset.openedFromStart;
                    this.eventManager.cleanup();
                }
            };
            this.eventManager.add(configOverlay, 'click', handleOverlayClick);
        } catch (error) {
            logger.error('Error opening config from start menu:', error);
        }
    }

    /**
     * Handles opening the records menu from the start menu.
     */
    handleRecords(): void {
        try {
            const recordsOverlay = document.getElementById('recordsOverlay');
            if (!recordsOverlay) {
                logger.error('Records overlay element not found');
                return;
            }

            // Update record values
            const updateRecordValues = (): void => {
                const rz = recordsOverlay.querySelector<HTMLElement>('#record-zones');
                const rp = recordsOverlay.querySelector<HTMLElement>('#record-points');
                const rc = recordsOverlay.querySelector<HTMLElement>('#record-combo');

                const zones = parseInt(localStorage.getItem('chesse:record:zones') || '0', 10) || 0;
                const points = parseInt(localStorage.getItem('chesse:record:points') || '0', 10) || 0;
                const combo = parseInt(localStorage.getItem('chesse:record:combo') || '0', 10) || 0;

                if (rz) rz.textContent = String(zones);
                if (rp) rp.textContent = String(points);
                if (rc) rc.textContent = String(combo);
            };

            updateRecordValues();

            // Show records overlay
            recordsOverlay.classList.add('show');

            // Mark that records was opened from start menu
            recordsOverlay.dataset.openedFromStart = 'true';

            // Set up the records panel manager's back button to return to start menu
            const backButton = recordsOverlay.querySelector<HTMLElement>('#records-back-button');
            if (backButton) {
                // Remove any existing listeners before adding new ones
                this.eventManager.removeAllListenersFromElement(backButton);

                this.eventManager.add(backButton, 'click', (e: Event) => {
                    e?.preventDefault?.();
                    e?.stopPropagation?.();
                    recordsOverlay.classList.remove('show');
                    delete recordsOverlay.dataset.openedFromStart;
                });
            }

            // Set up overlay click to close
            const handleOverlayClick = (e: MouseEvent): void => {
                const panel = recordsOverlay.querySelector<HTMLElement>('.stats-panel');
                if (!panel || !panel.contains(e.target as Node)) {
                    recordsOverlay.classList.remove('show');
                    delete recordsOverlay.dataset.openedFromStart;
                    this.eventManager.cleanup();
                }
            };
            this.eventManager.add(recordsOverlay, 'click', handleOverlayClick);
        } catch (error) {
            logger.error('Error opening records from start menu:', error);
        }
    }

    /**
     * Resumes the audio context after user gesture.
     */
    private async resumeAudioContext(): Promise<void> {
        try {
            await safeCallAsync(this.game.soundManager, 'resumeAudioContext');
        } catch (e) {
            logger.error('Error resuming audio context:', e);
        }
    }

    /**
     * Resets the game state (clears saved data).
     */
    private resetGameState(): void {
        try {
            const reset = safeCall(this.game.gameStateManager, 'resetGame');
            if (!reset) {
                safeCall(this.game.gameStateManager, 'clearSavedState');
            }
        } catch (e) {
            logger.error('Error resetting game state:', e);
        }
    }

    /**
     * Loads the saved game state.
     */
    private loadGameState(): void {
        try {
            safeCall(this.game.gameStateManager, 'loadGameState');
        } catch (e) {
            logger.error('Error loading game state:', e);
        }
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the OverlayButtonHandler instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }
}
