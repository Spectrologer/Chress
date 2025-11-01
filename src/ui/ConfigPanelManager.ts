import { PanelEventHandler } from './PanelEventHandler.ts';

interface GameInstance {
    player: any;
    soundManager?: any;
    gameStateManager?: any;
}

/**
 * ConfigPanelManager
 * Manages the configuration overlay (music, SFX, auto-path settings)
 */
export class ConfigPanelManager {
    private game: GameInstance;
    private configOverlay: HTMLElement | null;
    private configHandlersAttached: boolean = false;
    private configOpenTime: number | null = null;
    private _configGlobalHandler: ((ev: Event) => void) | null = null;

    constructor(game: GameInstance) {
        this.game = game;
        this.configOverlay = document.getElementById('configOverlay');
    }

    /**
     * Shows the config overlay with current settings
     */
    showConfigOverlay(): void {
        console.log('[ConfigPanelManager] showConfigOverlay called');
        if (!this.configOverlay) {
            console.error('[ConfigPanelManager] configOverlay element not found!');
            return;
        }

        this.configOpenTime = Date.now();

        // Ensure the overlay inputs reflect current player stats
        this._updateConfigInputs();

        // Make overlay visible
        this.configOverlay.classList.add('show');
        console.log('[ConfigPanelManager] Overlay classList after adding show:', this.configOverlay.classList.toString());
        console.log('[ConfigPanelManager] Overlay display style:', window.getComputedStyle(this.configOverlay).display);

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

        // Remove global click handler
        if (this._configGlobalHandler) {
            document.removeEventListener('pointerdown', this._configGlobalHandler, true);
            this._configGlobalHandler = null;
        }

        this.configOpenTime = null;
    }

    /**
     * Updates config overlay inputs to reflect current game state
     */
    private _updateConfigInputs(): void {
        const music = this.configOverlay?.querySelector<HTMLInputElement>('#music-toggle');
        const sfx = this.configOverlay?.querySelector<HTMLInputElement>('#sfx-toggle');
        const autoPath = this.configOverlay?.querySelector<HTMLInputElement>('#auto-path-enemies-toggle');

        if (music) music.checked = this.game.player.stats.musicEnabled !== false;
        if (sfx) sfx.checked = this.game.player.stats.sfxEnabled !== false;
        if (autoPath) autoPath.checked = !!this.game.player.stats.autoPathWithEnemies;
    }

    /**
     * Sets up global click handler to close overlay on outside clicks
     */
    private _setupGlobalClickHandler(): void {
        if (!this.configOverlay) return;

        // Remove existing handler if present
        if (this._configGlobalHandler) {
            document.removeEventListener('pointerdown', this._configGlobalHandler, true);
            this._configGlobalHandler = null;
        }

        this._configGlobalHandler = PanelEventHandler.createOutsideClickHandler(
            this.configOverlay,
            () => this.hideConfigOverlay(),
            { debounceMs: 300, skipButtonId: 'stats-config-button' }
        );

        document.addEventListener('pointerdown', this._configGlobalHandler, true);
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
            backBtn.addEventListener('click', (e) => {
                e?.preventDefault?.();
                e?.stopPropagation?.();

                // Check if opened from start menu - if so, don't call hideConfigOverlay
                // as the OverlayManager handles closing it directly
                if (!this.configOverlay?.dataset.openedFromStart) {
                    this.hideConfigOverlay();
                }
            });
        }
    }

    /**
     * Sets up audio and auto-path toggle handlers
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

        // Auto-path toggle
        const applyAutoPathState = (checked: boolean): void => {
            this.game.player.stats.autoPathWithEnemies = !!checked;
        };

        // Use the event handler utility for all toggles
        PanelEventHandler.setupAudioToggle('music-toggle', applyMusicState);
        PanelEventHandler.setupAudioToggle('sfx-toggle', applySfxState);
        PanelEventHandler.setupAudioToggle('auto-path-enemies-toggle', applyAutoPathState);
    }
}
