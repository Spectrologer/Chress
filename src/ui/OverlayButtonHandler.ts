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
    uiManager: any;
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
            // Resume audio FIRST while we have the user gesture (critical for browser autoplay)
            // Use a direct call without timeout to take advantage of the click event
            try {
                await Promise.race([
                    safeCallAsync(this.game.soundManager, 'resumeAudioContext'),
                    new Promise(resolve => setTimeout(resolve, 100)) // Only wait 100ms max
                ]);
            } catch (e) {
                // Non-critical, continue
            }

            // Exit preview mode to show player immediately
            this.game.previewMode = false;

            // Apply music preference and start music immediately
            this.musicToggle.applyMusicPreference();

            // Start music immediately while we have the user gesture
            if (this.game.soundManager) {
                try {
                    safeCall(this.game.soundManager, 'setMusicForZone', { dimension: 0 });
                } catch (e) {
                    logger.warn('Failed to start music immediately:', e);
                }
            }

            // Start overlay animation immediately for instant visual feedback
            // Don't wait for reset - let it happen during/after animation
            const hidePromise = this.startOverlayController.hideOverlay(overlay);

            // Start reset in background (don't block the animation)
            this.resetGameState().catch(e => logger.error('Reset game error:', e));

            // Wait only for overlay animation
            await hidePromise;

            // Start new game (reset should be complete or nearly complete by now)
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

            // Resume audio context in background (don't await - let it happen asynchronously)
            // This prevents blocking the game start on audio initialization
            this.resumeAudioContext();

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
            // Delegate to ConfigPanelManager to ensure proper initialization
            if (this.game.uiManager?.panelManager) {
                this.game.uiManager.panelManager.showConfigOverlay();

                // Mark that config was opened from start menu for back button behavior
                const configOverlay = document.getElementById('configOverlay');
                if (configOverlay) {
                    configOverlay.dataset.openedFromStart = 'true';
                }
            } else {
                logger.error('UIManager or PanelManager not available');
            }
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
     * Returns immediately - audio will resume in the background.
     */
    private async resumeAudioContext(): Promise<void> {
        try {
            // Add a timeout to prevent hanging indefinitely
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Audio context resume timeout')), 2000)
            );

            const resumePromise = safeCallAsync(this.game.soundManager, 'resumeAudioContext');

            await Promise.race([resumePromise, timeoutPromise]);
        } catch (e) {
            logger.warn('Error/timeout resuming audio context (non-critical):', e);
            // Continue anyway - audio issues shouldn't block game start
        }
    }

    /**
     * Resets the game state (clears saved data).
     */
    private async resetGameState(): Promise<void> {
        try {
            const reset = safeCallAsync(this.game.gameStateManager, 'resetGame');
            if (!reset) {
                await safeCallAsync(this.game.gameStateManager, 'clearSavedState');
            } else {
                await reset;
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
