import { PanelEventHandler } from './PanelEventHandler.js';
import { safeCall } from '../utils/SafeServiceCall.js';

/**
 * StatsPanelManager
 * Manages the main stats panel overlay (portrait, stats, restart button)
 */
export class StatsPanelManager {
    constructor(game) {
        this.game = game;
        this.statsPanelOverlay = document.getElementById('statsPanelOverlay');
        this.statsPanelOpen = false;
        this._showConfigCallback = null;
        this._showRecordsCallback = null;
        this._setupHandlers();
    }

    /**
     * Sets the callbacks for action buttons (config, records)
     * Called by PanelManager during initialization
     * @param {Function} showConfigCallback - Callback to show config overlay
     * @param {Function} showRecordsCallback - Callback to show records overlay
     */
    setActionCallbacks(showConfigCallback, showRecordsCallback) {
        this._showConfigCallback = showConfigCallback;
        this._showRecordsCallback = showRecordsCallback;
        console.log('[StatsPanelManager] Action callbacks set:', !!showConfigCallback, !!showRecordsCallback);
    }

    /**
     * Shows the stats panel with current player stats
     * @param {Function} showConfigCallback - Callback to show config overlay
     * @param {Function} showRecordsCallback - Callback to show records overlay
     */
    showStatsPanel(showConfigCallback, showRecordsCallback) {
        if (!this.statsPanelOverlay) return;

        // Update callbacks if provided (for backwards compatibility)
        // But they should normally be set via setActionCallbacks() during initialization
        if (showConfigCallback) this._showConfigCallback = showConfigCallback;
        if (showRecordsCallback) this._showRecordsCallback = showRecordsCallback;

        // Update stats content (this recreates the buttons via innerHTML)
        this._updateStatsContent();
        console.log('[StatsPanelManager] Stats content updated');

        // Make overlay visible immediately (furl animations removed)
        this.statsPanelOverlay.classList.add('show');
        const inner = this.statsPanelOverlay.querySelector('.stats-panel');
        if (inner) {
            PanelEventHandler.clearAnimations(inner);
        }

        this.statsPanelOpen = true;

        // Update persistent records
        this._updatePersistentRecords();

        // Install capture blocker FIRST to prevent immediate clickthrough from portrait tap
        // This blocks ALL events for 400ms to prevent the portrait tap from triggering buttons
        PanelEventHandler.installCaptureBlocker(400, null);
        console.log('[StatsPanelManager] Initial capture blocker installed');

        // Wire up action buttons AFTER a delay to ensure the capture blocker is active
        // This prevents the portrait tap from immediately triggering the config button
        setTimeout(() => {
            this._wireActionButtons(this._showConfigCallback, this._showRecordsCallback);
            console.log('[StatsPanelManager] Action buttons wired after delay');
        }, 50);
    }

    /**
     * Hides the stats panel
     */
    hideStatsPanel() {
        if (!this.statsPanelOverlay) return;

        const inner = this.statsPanelOverlay.querySelector('.stats-panel');
        if (inner) {
            this.statsPanelOverlay.classList.remove('show');
            PanelEventHandler.clearAnimations(inner);
        } else {
            this.statsPanelOverlay.classList.remove('show');
        }

        this.statsPanelOpen = false;
    }

    /**
     * Returns whether the stats panel is currently open
     * @returns {boolean}
     */
    isStatsPanelOpen() {
        return this.statsPanelOpen;
    }

    /**
     * Updates the stats panel content with current player stats
     * @private
     */
    _updateStatsContent() {
        const statsInfoContainer = this.statsPanelOverlay.querySelector('.stats-main-content .stats-info');
        const enemiesCaptured = this.game.defeatedEnemies ? this.game.defeatedEnemies.size : 0;
        const playerPoints = this.game.player.getPoints();
        const hunger = this.game.player.getHunger();
        const thirst = this.game.player.getThirst();
        const totalDiscoveries = this.game.player.getVisitedZones().size - this.game.player.getSpentDiscoveries();

        statsInfoContainer.innerHTML = `
            <div class="stats-header">
                <div class="stats-header-left">
                    <div class="stats-config">
                        <button id="stats-config-button" class="stats-config-button" title="Config" aria-label="Config">Config ▸</button>
                    </div>
                    <div class="stats-records">
                        <button id="stats-records-button" class="stats-records-button" title="Records" aria-label="Records">
                            <img src="assets/ui/records.png" alt="Records" class="records-icon" aria-hidden="true">
                        </button>
                    </div>
                </div>
                <div class="stats-portrait-container">
                    <img src="assets/protag/faceset.png" alt="Player Portrait" class="player-portrait">
                </div>
                <h2>CHALK</h2>
            </div>
            <div class="stats-list">
                <div class="stat-item"><span class="stat-label">Captures:</span> <span class="stat-value">${enemiesCaptured}</span></div>
                <div class="stat-item"><span class="stat-label">Hunger:</span> <span class="stat-value">${hunger}/50</span></div>
                <div class="stat-item"><span class="stat-label">Thirst:</span> <span class="stat-value">${thirst}/50</span></div>
                <div class="stat-item"><span class="stat-label">Points:</span> <span class="stat-value">${playerPoints}</span></div>
                <div class="stat-item"><span class="stat-label">Discoveries:</span> <span class="stat-value">${totalDiscoveries}</span></div>
            </div>
            <hr class="stats-divider">
            <div class="stats-footer">
                <button id="stats-restart-button" class="stats-restart-button" title="Reset game" aria-label="Reset game">Reset</button>
            </div>
        `;
    }

    /**
     * Updates persistent records in localStorage if current stats exceed saved values
     * @private
     */
    _updatePersistentRecords() {
        const visited = this.game.player.getVisitedZones().size;
        const pointsNow = this.game.player.getPoints();
        const prevZones = parseInt(localStorage.getItem('chress:record:zones') || '0', 10) || 0;
        const prevPoints = parseInt(localStorage.getItem('chress:record:points') || '0', 10) || 0;

        if (visited > prevZones) localStorage.setItem('chress:record:zones', String(visited));
        if (pointsNow > prevPoints) localStorage.setItem('chress:record:points', String(pointsNow));
    }

    /**
     * Wires up action buttons (config, records, restart)
     * @param {Function} showConfigCallback - Callback to show config overlay
     * @param {Function} showRecordsCallback - Callback to show records overlay
     * @private
     */
    _wireActionButtons(showConfigCallback, showRecordsCallback) {
        // Config button - use multiple event types to catch any interaction
        const configButton = this.statsPanelOverlay.querySelector('#stats-config-button');
        console.log('[StatsPanelManager] Config button found:', !!configButton, 'Callback:', !!showConfigCallback);
        console.log('[StatsPanelManager] Config button element:', configButton);

        if (configButton) {
            const handleConfig = (e) => {
                console.log('[StatsPanelManager] Config button event triggered!', e.type);
                e.preventDefault();
                e.stopPropagation();
                if (showConfigCallback) {
                    console.log('[StatsPanelManager] Calling showConfigCallback');
                    showConfigCallback();
                } else {
                    console.error('[StatsPanelManager] No showConfigCallback available!');
                }
            };

            // Remove any existing listeners by cloning and replacing the button
            const newConfigButton = configButton.cloneNode(true);
            configButton.parentNode.replaceChild(newConfigButton, configButton);

            // Add listeners to the new button
            newConfigButton.addEventListener('click', handleConfig, { capture: false });
            newConfigButton.addEventListener('pointerup', handleConfig, { capture: false });
            newConfigButton.addEventListener('touchend', handleConfig, { capture: false });
            console.log('[StatsPanelManager] Config button listeners attached');
        }

        // Records button - use multiple event types to catch any interaction
        const recordsButton = this.statsPanelOverlay.querySelector('#stats-records-button');
        console.log('[StatsPanelManager] Records button found:', !!recordsButton, 'Callback:', !!showRecordsCallback);
        console.log('[StatsPanelManager] Records button element:', recordsButton);

        if (recordsButton) {
            const handleRecords = (e) => {
                console.log('[StatsPanelManager] Records button event triggered!', e.type);
                e.preventDefault();
                e.stopPropagation();
                if (showRecordsCallback) {
                    console.log('[StatsPanelManager] Calling showRecordsCallback');
                    showRecordsCallback();
                } else {
                    console.error('[StatsPanelManager] No showRecordsCallback available!');
                }
            };

            // Remove any existing listeners by cloning and replacing the button
            const newRecordsButton = recordsButton.cloneNode(true);
            recordsButton.parentNode.replaceChild(newRecordsButton, recordsButton);

            // Add listeners to the new button
            newRecordsButton.addEventListener('click', handleRecords, { capture: false });
            newRecordsButton.addEventListener('pointerup', handleRecords, { capture: false });
            newRecordsButton.addEventListener('touchend', handleRecords, { capture: false });
            console.log('[StatsPanelManager] Records button listeners attached');
        }

        // Restart button
        const statsRestartBtn = this.statsPanelOverlay.querySelector('#stats-restart-button');
        if (statsRestartBtn) {
            this._setupRestartButton(statsRestartBtn);
        }
    }

    /**
     * Sets up the restart button with proper event handling
     * @param {HTMLElement} restartBtn - The restart button element
     * @private
     */
    _setupRestartButton(restartBtn) {
        const doRestart = (e) => {
            safeCall(e, 'stopPropagation');
            if (confirm('Are you sure you want to restart the game? All progress will be lost.')) {
                this.hideStatsPanel();
                this.game.resetGame();
                // If the main loop is paused, try to resume it
                try { safeCall(this.game, 'gameLoop'); } catch (err) { /* non-fatal */ }
            }
        };

        // Click handler for mouse/keyboard
        restartBtn.addEventListener('click', doRestart);

        // Pointer handlers for touch devices
        restartBtn.addEventListener('pointerdown', (e) => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
            e.target?.setPointerCapture?.(e.pointerId);
        }, { passive: false });

        restartBtn.addEventListener('pointerup', (e) => {
            e?.preventDefault?.();
            doRestart(e);
            e.target?.releasePointerCapture?.(e.pointerId);
        });
    }

    /**
     * Sets up event handlers for the stats panel
     * @private
     */
    _setupHandlers() {
        if (!this.statsPanelOverlay) return;

        // Close panel when clicking outside (on overlay background)
        this.statsPanelOverlay.addEventListener('click', () => this.hideStatsPanel());
        this.statsPanelOverlay.addEventListener('pointerup', (e) => {
            safeCall(e, 'preventDefault');
            this.hideStatsPanel();
        });

        // Prevent closing when clicking inside the panel
        const statsPanel = this.statsPanelOverlay.querySelector('.stats-panel');
        if (statsPanel) {
            PanelEventHandler.preventInnerPanelClicks(statsPanel);
        }

        // Open panel when clicking on the main player portrait
        this._setupPortraitHandler();
    }

    /**
     * Sets up the player portrait handler to open stats panel
     * @private
     */
    _setupPortraitHandler() {
        const playerPortraitContainer = document.querySelector('.player-portrait-container');
        if (!playerPortraitContainer) return;

        const openStats = (e) => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
            this.showStatsPanel();
        };

        // Use pointerdown to capture interactions earlier on touch devices
        playerPortraitContainer.addEventListener('pointerdown', (e) => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
        }, { passive: false });

        playerPortraitContainer.addEventListener('click', openStats);
        playerPortraitContainer.addEventListener('pointerup', openStats, { passive: false });
    }
}
