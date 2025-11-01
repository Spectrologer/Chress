import { BarterWindow } from './BarterWindow.js';
import { StatueInfoWindow } from './StatueInfoWindow.js';
import { ConfigPanelManager } from './ConfigPanelManager.ts';
import { RecordsPanelManager } from './RecordsPanelManager.ts';
import { StatsPanelManager } from './StatsPanelManager.ts';

/**
 * PanelManager
 * Central coordinator for all UI panels and overlays
 * Delegates to specialized managers for each panel type
 */
export class PanelManager {
    constructor(game) {
        this.game = game;

        // Initialize sub-managers
        this.configPanelManager = new ConfigPanelManager(game);
        this.recordsPanelManager = new RecordsPanelManager(game);
        this.statsPanelManager = new StatsPanelManager(game);
        this.barterWindow = new BarterWindow(game);
        this.statueInfoWindow = new StatueInfoWindow(game);

        // Wire up callbacks for cross-panel navigation
        this._wireCallbacks();
    }

    /**
     * Wires up callbacks between managers for cross-panel navigation
     * @private
     */
    _wireCallbacks() {
        // RecordsPanelManager needs to show stats panel when back button is clicked
        this.recordsPanelManager.setShowStatsPanelCallback(() => {
            this.showStatsPanel();
        });

        // StatsPanelManager needs callbacks to open config and records panels
        this.statsPanelManager.setActionCallbacks(
            () => this.showConfigOverlay(),
            () => this.showRecordsOverlay()
        );
    }

    // ========== Config Panel Methods ==========

    /**
     * Shows the configuration overlay
     */
    showConfigOverlay() {
        this.configPanelManager.showConfigOverlay();
    }

    /**
     * Hides the configuration overlay
     */
    hideConfigOverlay() {
        this.configPanelManager.hideConfigOverlay();
    }

    // ========== Records Panel Methods ==========

    /**
     * Shows the records overlay
     */
    showRecordsOverlay() {
        this.recordsPanelManager.showRecordsOverlay(() => this.hideStatsPanel());
    }

    /**
     * Hides the records overlay
     */
    hideRecordsOverlay() {
        this.recordsPanelManager.hideRecordsOverlay();
    }

    // ========== Stats Panel Methods ==========

    /**
     * Shows the stats panel
     */
    showStatsPanel() {
        this.statsPanelManager.showStatsPanel(
            () => this.showConfigOverlay(),
            () => this.showRecordsOverlay()
        );
    }

    /**
     * Hides the stats panel
     */
    hideStatsPanel() {
        this.statsPanelManager.hideStatsPanel();
    }

    /**
     * Checks if the stats panel is open
     * @returns {boolean}
     */
    isStatsPanelOpen() {
        return this.statsPanelManager.isStatsPanelOpen();
    }

    // ========== Barter Window Methods (Delegated) ==========

    /**
     * Sets up barter handlers
     */
    setupBarterHandlers() {
        this.barterWindow.setupBarterHandlers();
        this.statueInfoWindow.setupStatueInfoHandlers();
    }

    /**
     * Shows the barter window
     * @param {string} npcType - The NPC type
     */
    showBarterWindow(npcType) {
        this.barterWindow.showBarterWindow(npcType);
    }

    /**
     * Hides the barter window
     */
    hideBarterWindow() {
        this.barterWindow.hideBarterWindow();
    }

    /**
     * Confirms a trade in the barter window
     */
    confirmTrade() {
        this.barterWindow.confirmTrade();
    }

    // ========== Statue Info Window Methods (Delegated) ==========

    /**
     * Shows the statue info window
     * @param {string} statueType - The statue type
     */
    showStatueInfo(statueType) {
        this.statueInfoWindow.showStatueInfo(statueType);
    }

    /**
     * Hides the statue info window
     */
    hideStatueInfoWindow() {
        this.statueInfoWindow.hideStatueInfoWindow();
    }
}
