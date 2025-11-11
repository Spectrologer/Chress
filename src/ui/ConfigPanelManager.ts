import { PanelEventHandler } from './PanelEventHandler';
import { EventListenerManager } from '@utils/EventListenerManager';
import { logger } from '@core/logger';

interface GameInstance {
    player: any;
    soundManager?: any;
    gameStateManager?: any;
    playerFacade?: any;
    generateZone?: () => void;
}

/**
 * ConfigPanelManager
 * Manages the configuration overlay (music, SFX, auto-path settings)
 */
export class ConfigPanelManager {
    private game: GameInstance;
    private configOverlay: HTMLElement | null;
    private configHandlersAttached = false;
    private configOpenTime: number | null = null;
    private eventManager: EventListenerManager;

    constructor(game: GameInstance) {
        this.game = game;
        this.configOverlay = document.getElementById('configOverlay');
        this.eventManager = new EventListenerManager();
    }

    /**
     * Shows the config overlay with current settings
     */
    showConfigOverlay(): void {
        logger.log('[ConfigPanelManager] showConfigOverlay called');
        if (!this.configOverlay) {
            logger.error('[ConfigPanelManager] configOverlay element not found!');
            return;
        }

        this.configOpenTime = Date.now();

        // Ensure the overlay inputs reflect current player stats
        this._updateConfigInputs();

        // Make overlay visible
        this.configOverlay.classList.add('show');
        logger.log('[ConfigPanelManager] Overlay classList after adding show:', this.configOverlay.classList.toString());
        logger.log('[ConfigPanelManager] Overlay display style:', window.getComputedStyle(this.configOverlay).display);

        // Show inner panel immediately (animations removed)
        const inner = this.configOverlay.querySelector<HTMLElement>('.stats-panel');
        if (inner) {
            PanelEventHandler.clearAnimations(inner);
        }

        // Set up global click handler to close on outside clicks
        this._setupGlobalClickHandler();

        // Install capture blocker to prevent immediate re-clicks
        PanelEventHandler.installCaptureBlocker(300);

        // Attach handlers once
        if (!this.configHandlersAttached) {
            this._attachConfigHandlers();
            this.configHandlersAttached = true;
        }

        // Always setup the return to museum handler since the button is dynamically added
        this._setupReturnToMuseumHandler();
    }

    /**
     * Hides the config overlay
     */
    hideConfigOverlay(): void {
        if (!this.configOverlay) return;

        const inner = this.configOverlay.querySelector<HTMLElement>('.stats-panel');
        this.configOverlay.classList.remove('show');

        if (inner) {
            PanelEventHandler.clearAnimations(inner);
        }

        // Cleanup all event listeners
        this.eventManager.cleanup();

        this.configOpenTime = null;
    }

    /**
     * Updates config overlay inputs to reflect current game state
     */
    private _updateConfigInputs(): void {
        const music = this.configOverlay?.querySelector<HTMLInputElement>('#music-toggle');
        const sfx = this.configOverlay?.querySelector<HTMLInputElement>('#sfx-toggle');

        if (music) music.checked = this.game.player.stats.musicEnabled !== false;
        if (sfx) sfx.checked = this.game.player.stats.sfxEnabled !== false;

        // Add return to museum button if on a custom board
        this._updateReturnToMuseumButton();
    }

    /**
     * Adds or removes the "Return to Museum" button based on whether we're on a custom board
     */
    private _updateReturnToMuseumButton(): void {
        const CUSTOM_BOARD_DIMENSION = 3;
        const currentZone = this.game.playerFacade?.getCurrentZone?.();
        const isOnCustomBoard = currentZone?.dimension === CUSTOM_BOARD_DIMENSION;
        const hasReturnZone = !!(this.game as any).customBoardReturnZone;

        const configList = this.configOverlay?.querySelector('.config-list');
        if (!configList) return;

        // Remove existing button if present
        const existingButton = configList.querySelector('#return-to-museum-item');
        if (existingButton) {
            existingButton.remove();
        }

        // Add button only if on custom board and there's a return zone
        if (isOnCustomBoard && hasReturnZone) {
            const returnItem = document.createElement('div');
            returnItem.id = 'return-to-museum-item';
            returnItem.className = 'config-item config-button-item';
            returnItem.innerHTML = `
                <button id="return-to-museum-button" class="config-action-button" style="width: 100%; padding: 10px; font-size: 1em; cursor: pointer; background-color: #964253; color: white; border: 2px solid #57294b; border-radius: 5px;">
                    Return to Museum
                </button>
            `;
            configList.appendChild(returnItem);
        }
    }

    /**
     * Sets up global click handler to close overlay on outside clicks
     */
    private _setupGlobalClickHandler(): void {
        if (!this.configOverlay) return;

        this.eventManager.addOutsideClickHandler(
            this.configOverlay,
            () => this.hideConfigOverlay(),
            { debounceMs: 300, skipElementId: 'stats-config-button', capturePhase: true }
        );
    }

    /**
     * Attaches event handlers for config panel controls
     */
    private _attachConfigHandlers(): void {
        // Setup audio and auto-path toggles
        this._setupAudioToggles();

        // Prevent clicks inside the inner panel from closing the overlay
        const cfgPanel = this.configOverlay?.querySelector<HTMLElement>('.stats-panel');
        if (cfgPanel) {
            PanelEventHandler.preventInnerPanelClicks(cfgPanel);
        }

        // Attach back button handler
        const backBtn = this.configOverlay?.querySelector<HTMLButtonElement>('#config-back-button');
        if (backBtn) {
            this.eventManager.add(backBtn, 'click', (e: MouseEvent) => {
                e?.preventDefault?.();
                e?.stopPropagation?.();

                // Check if opened from start menu - if so, don't call hideConfigOverlay
                // as the OverlayManager handles closing it directly
                if (!this.configOverlay?.dataset.openedFromStart) {
                    this.hideConfigOverlay();
                }
            });
        }

        // Setup return to museum button handler (if present)
        this._setupReturnToMuseumHandler();
    }

    /**
     * Sets up the "Return to Museum" button handler
     */
    private _setupReturnToMuseumHandler(): void {
        const returnBtn = this.configOverlay?.querySelector<HTMLButtonElement>('#return-to-museum-button');
        if (returnBtn) {
            this.eventManager.add(returnBtn, 'click', (e: MouseEvent) => {
                e?.preventDefault?.();
                e?.stopPropagation?.();

                // Return to the stored zone
                const returnZone = (this.game as any).customBoardReturnZone;
                if (returnZone && this.game.playerFacade) {
                    logger.info(`[CustomBoard] Returning to zone (${returnZone.x}, ${returnZone.y}) dimension ${returnZone.dimension}`);

                    this.game.playerFacade.setCurrentZone(returnZone.x, returnZone.y);
                    this.game.playerFacade.setZoneDimension(returnZone.dimension);

                    // Clear the return zone and custom board name
                    delete (this.game as any).customBoardReturnZone;
                    delete (this.game as any).customBoardName;

                    // Regenerate the zone
                    if (this.game.generateZone) {
                        this.game.generateZone();
                    }

                    // Close the config overlay
                    this.hideConfigOverlay();
                }
            });
        }
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the ConfigPanelManager instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }

    /**
     * Sets up audio toggle handlers
     */
    private _setupAudioToggles(): void {
        // Music toggle
        const applyMusicState = (checked: boolean): void => {
            this.game.player.stats.musicEnabled = !!checked;
            this.game.soundManager?.setMusicEnabled?.(checked);
            this.game.gameStateManager?.saveGameState?.();
        };

        // SFX toggle
        const applySfxState = (checked: boolean): void => {
            this.game.player.stats.sfxEnabled = !!checked;
            this.game.soundManager?.setSfxEnabled?.(checked);
            this.game.gameStateManager?.saveGameState?.();
        };

        // Use the event handler utility for all toggles
        PanelEventHandler.setupAudioToggle('music-toggle', applyMusicState);
        PanelEventHandler.setupAudioToggle('sfx-toggle', applySfxState);
    }
}
