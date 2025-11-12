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
    private aboutOverlay: HTMLElement | null;
    private configHandlersAttached = false;
    private configOpenTime: number | null = null;
    private eventManager: EventListenerManager;
    private aboutEventManager: EventListenerManager;

    constructor(game: GameInstance) {
        this.game = game;
        this.configOverlay = document.getElementById('configOverlay');
        this.aboutOverlay = document.getElementById('aboutOverlay');
        this.eventManager = new EventListenerManager();
        this.aboutEventManager = new EventListenerManager();
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
        // Allow clicks within the config panel
        PanelEventHandler.installCaptureBlocker(300, inner);

        // Attach handlers once
        if (!this.configHandlersAttached) {
            this._attachConfigHandlers();
            this.configHandlersAttached = true;
        }
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

        // Cleanup only transient event listeners (outside click handler)
        // Keep button handlers since they're permanent
        this.eventManager.cleanup();

        // Reset handlers attached flag so they can be re-attached next time
        this.configHandlersAttached = false;

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
            this.eventManager.preventClickPropagation(cfgPanel);
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

        // Attach About button handler - register it on the button directly, not the panel
        const aboutBtn = this.configOverlay?.querySelector<HTMLButtonElement>('#about-button');
        if (aboutBtn) {
            this.eventManager.add(aboutBtn, 'click', (e: MouseEvent) => {
                logger.log('[ConfigPanelManager] About button clicked!');
                e?.preventDefault?.();
                e?.stopPropagation?.();
                this.showAboutOverlay();
            });
        }
    }

    /**
     * Shows the About overlay
     */
    showAboutOverlay(): void {
        logger.log('[ConfigPanelManager] showAboutOverlay called');
        if (!this.aboutOverlay) {
            logger.error('[ConfigPanelManager] aboutOverlay element not found!');
            return;
        }

        // Make overlay visible
        this.aboutOverlay.classList.add('show');

        // Show inner panel immediately (animations removed)
        const inner = this.aboutOverlay.querySelector<HTMLElement>('.about-modal');
        if (inner) {
            PanelEventHandler.clearAnimations(inner);
            PanelEventHandler.preventInnerPanelClicks(inner);
        }

        // Install capture blocker to prevent immediate re-clicks
        // Allow clicks within the about modal
        PanelEventHandler.installCaptureBlocker(300, inner);

        // Setup close button handler
        const closeBtn = this.aboutOverlay.querySelector<HTMLButtonElement>('#about-close-button');
        if (closeBtn) {
            this.aboutEventManager.add(closeBtn, 'click', (e: MouseEvent) => {
                e?.preventDefault?.();
                e?.stopPropagation?.();
                this.hideAboutOverlay();
            });
        }

        // Set up click outside to close
        this.aboutEventManager.addOutsideClickHandler(
            this.aboutOverlay,
            () => this.hideAboutOverlay(),
            { debounceMs: 300, capturePhase: true }
        );
    }

    /**
     * Hides the About overlay
     */
    hideAboutOverlay(): void {
        if (!this.aboutOverlay) return;

        const inner = this.aboutOverlay.querySelector<HTMLElement>('.about-modal');
        this.aboutOverlay.classList.remove('show');

        if (inner) {
            PanelEventHandler.clearAnimations(inner);
        }

        // Cleanup event listeners
        this.aboutEventManager.cleanup();
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the ConfigPanelManager instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
        this.aboutEventManager.cleanup();
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
