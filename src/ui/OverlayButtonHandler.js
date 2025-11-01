import { logger } from '../core/logger.js';
import { safeCall, safeCallAsync, safeGet } from '../utils/SafeServiceCall.js';

/**
 * OverlayButtonHandler
 *
 * Handles all button interactions on the start overlay.
 * Manages start, continue, config, records, and editor button clicks.
 */
export class OverlayButtonHandler {
    constructor(game, startOverlayController, musicToggle) {
        this.game = game;
        this.startOverlayController = startOverlayController;
        this.musicToggle = musicToggle;
    }

    /**
     * Sets up button click handlers.
     * @param {HTMLElement} overlay
     * @param {boolean} hasSaved
     */
    setupButtonHandlers(overlay, hasSaved) {
        const startBtn = overlay.querySelector('#startButton');
        const continueBtn = overlay.querySelector('#continueButton');
        const configBtn = overlay.querySelector('#configButton');
        const recordsBtn = overlay.querySelector('#recordsButton');
        const zoneEditorBtn = overlay.querySelector('#zoneEditorButton');
        const characterEditorBtn = overlay.querySelector('#characterEditorButton');

        if (startBtn) {
            // Clone and replace to remove any old listeners
            const newStartBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newStartBtn, startBtn);
            newStartBtn.addEventListener('click', () => this.handleStartGame(overlay), { once: true });
        }

        if (continueBtn) {
            // Clone and replace to remove any old listeners
            const newContinueBtn = continueBtn.cloneNode(true);
            continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);

            if (hasSaved) {
                newContinueBtn.addEventListener('click', () => this.handleContinueGame(overlay), { once: true });
            }
        }

        if (configBtn) {
            // Clone and replace to remove any old listeners
            const newConfigBtn = configBtn.cloneNode(true);
            configBtn.parentNode.replaceChild(newConfigBtn, configBtn);
            // Don't use { once: true } for config since it doesn't close the start menu
            newConfigBtn.addEventListener('click', () => this.handleConfig());
        }

        if (recordsBtn) {
            // Clone and replace to remove any old listeners
            const newRecordsBtn = recordsBtn.cloneNode(true);
            recordsBtn.parentNode.replaceChild(newRecordsBtn, recordsBtn);
            // Don't use { once: true } for records since it doesn't close the start menu
            newRecordsBtn.addEventListener('click', () => this.handleRecords());
        }

        if (zoneEditorBtn) {
            // Clone and replace to remove any old listeners
            const newZoneEditorBtn = zoneEditorBtn.cloneNode(true);
            zoneEditorBtn.parentNode.replaceChild(newZoneEditorBtn, zoneEditorBtn);
            // Don't use { once: true } for zone editor since it doesn't close the start menu
            newZoneEditorBtn.addEventListener('click', () => this.handleZoneEditor());
        }

        if (characterEditorBtn) {
            // Clone and replace to remove any old listeners
            const newCharacterEditorBtn = characterEditorBtn.cloneNode(true);
            characterEditorBtn.parentNode.replaceChild(newCharacterEditorBtn, characterEditorBtn);
            // Don't use { once: true } for character editor since it doesn't close the start menu
            newCharacterEditorBtn.addEventListener('click', () => this.handleCharacterEditor());
        }
    }

    /**
     * Handles starting a new game.
     * @param {HTMLElement} overlay
     */
    async handleStartGame(overlay) {
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
     * @param {HTMLElement} overlay
     */
    async handleContinueGame(overlay) {
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
     * Handles opening the zone editor in-app overlay.
     */
    handleZoneEditor() {
        try {
            const overlay = document.getElementById('zoneEditorOverlay');
            const iframe = document.getElementById('zoneEditorFrame');
            const closeButton = document.getElementById('closeZoneEditor');

            if (!overlay || !iframe) {
                logger.error('Zone editor overlay elements not found');
                return;
            }

            // Get base path - use import.meta.env.BASE_URL which comes from Vite config
            const basePath = import.meta.env.BASE_URL;
            const editorPath = `${basePath}tools/zone-editor.html`;

            // Set iframe source
            iframe.src = editorPath;

            // Show the overlay
            overlay.style.display = 'flex';

            // Close handler function
            const closeEditor = () => {
                overlay.style.display = 'none';
                iframe.src = ''; // Clear iframe to stop any running scripts
                // Clean up event listeners
                if (closeButton) {
                    closeButton.removeEventListener('click', closeEditor);
                }
                overlay.removeEventListener('click', overlayClickHandler);
            };

            // Overlay click handler
            const overlayClickHandler = (e) => {
                // Only close if clicking directly on the overlay background, not its children
                if (e.target === overlay) {
                    closeEditor();
                }
            };

            // Set up close button handler
            if (closeButton) {
                closeButton.addEventListener('click', closeEditor);
            }

            // Close on overlay background click
            overlay.addEventListener('click', overlayClickHandler);

        } catch (error) {
            logger.error('Error opening zone editor:', error);
        }
    }

    /**
     * Handles opening the character editor in-app overlay.
     */
    handleCharacterEditor() {
        try {
            const overlay = document.getElementById('characterEditorOverlay');
            const iframe = document.getElementById('characterEditorFrame');
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

            // Close handler function
            const closeEditor = () => {
                overlay.style.display = 'none';
                iframe.src = ''; // Clear iframe to stop any running scripts
                // Clean up event listeners
                if (closeButton) {
                    closeButton.removeEventListener('click', closeEditor);
                }
                overlay.removeEventListener('click', overlayClickHandler);
            };

            // Overlay click handler
            const overlayClickHandler = (e) => {
                // Only close if clicking directly on the overlay background, not its children
                if (e.target === overlay) {
                    closeEditor();
                }
            };

            // Set up close button handler
            if (closeButton) {
                closeButton.addEventListener('click', closeEditor);
            }

            // Close on overlay background click
            overlay.addEventListener('click', overlayClickHandler);
        } catch (error) {
            logger.error('Error opening zone editor:', error);
        }
    }

    /**
     * Handles opening the config menu from the start menu.
     */
    handleConfig() {
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
            const backButton = configOverlay.querySelector('#config-back-button');
            if (backButton) {
                // Clone and replace to ensure clean handler
                const newBackButton = backButton.cloneNode(true);
                backButton.parentNode.replaceChild(newBackButton, backButton);

                newBackButton.addEventListener('click', (e) => {
                    e?.preventDefault?.();
                    e?.stopPropagation?.();
                    configOverlay.classList.remove('show');
                    delete configOverlay.dataset.openedFromStart;
                });
            }

            // Set up overlay click to close
            const handleOverlayClick = (e) => {
                const panel = configOverlay.querySelector('.stats-panel');
                if (!panel || !panel.contains(e.target)) {
                    configOverlay.classList.remove('show');
                    delete configOverlay.dataset.openedFromStart;
                    configOverlay.removeEventListener('click', handleOverlayClick);
                }
            };
            configOverlay.addEventListener('click', handleOverlayClick);
        } catch (error) {
            logger.error('Error opening config from start menu:', error);
        }
    }

    /**
     * Handles opening the records menu from the start menu.
     */
    handleRecords() {
        try {
            const recordsOverlay = document.getElementById('recordsOverlay');
            if (!recordsOverlay) {
                logger.error('Records overlay element not found');
                return;
            }

            // Update record values
            const updateRecordValues = () => {
                const rz = recordsOverlay.querySelector('#record-zones');
                const rp = recordsOverlay.querySelector('#record-points');
                const rc = recordsOverlay.querySelector('#record-combo');

                const zones = parseInt(localStorage.getItem('chress:record:zones') || '0', 10) || 0;
                const points = parseInt(localStorage.getItem('chress:record:points') || '0', 10) || 0;
                const combo = parseInt(localStorage.getItem('chress:record:combo') || '0', 10) || 0;

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
            const backButton = recordsOverlay.querySelector('#records-back-button');
            if (backButton) {
                // Clone and replace to ensure clean handler
                const newBackButton = backButton.cloneNode(true);
                backButton.parentNode.replaceChild(newBackButton, backButton);

                newBackButton.addEventListener('click', (e) => {
                    e?.preventDefault?.();
                    e?.stopPropagation?.();
                    recordsOverlay.classList.remove('show');
                    delete recordsOverlay.dataset.openedFromStart;
                });
            }

            // Set up overlay click to close
            const handleOverlayClick = (e) => {
                const panel = recordsOverlay.querySelector('.stats-panel');
                if (!panel || !panel.contains(e.target)) {
                    recordsOverlay.classList.remove('show');
                    delete recordsOverlay.dataset.openedFromStart;
                    recordsOverlay.removeEventListener('click', handleOverlayClick);
                }
            };
            recordsOverlay.addEventListener('click', handleOverlayClick);
        } catch (error) {
            logger.error('Error opening records from start menu:', error);
        }
    }

    /**
     * Resumes the audio context after user gesture.
     * @returns {Promise<void>}
     */
    async resumeAudioContext() {
        try {
            await safeCallAsync(this.game.soundManager, 'resumeAudioContext');
        } catch (e) {
            logger.error('Error resuming audio context:', e);
        }
    }

    /**
     * Resets the game state (clears saved data).
     */
    resetGameState() {
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
    loadGameState() {
        try {
            safeCall(this.game.gameStateManager, 'loadGameState');
        } catch (e) {
            logger.error('Error loading game state:', e);
        }
    }
}
