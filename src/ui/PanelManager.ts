import type { IGame } from '@core/GameContext';
import { BarterWindow } from './BarterWindow';
import { StatueInfoWindow } from './StatueInfoWindow';
import { ConfigPanelManager } from './ConfigPanelManager';
import { RecordsPanelManager } from './RecordsPanelManager';
import { StatsPanelManager } from './StatsPanelManager';

/**
 * PanelManager
 * Central coordinator for all UI panels and overlays
 * Delegates to specialized managers for each panel type
 */
export class PanelManager {
    private game: IGame;
    private configPanelManager: ConfigPanelManager;
    private recordsPanelManager: RecordsPanelManager;
    private statsPanelManager: StatsPanelManager;
    private barterWindow: BarterWindow;
    private statueInfoWindow: StatueInfoWindow;

    constructor(game: IGame) {
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
     */
    private _wireCallbacks(): void {
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
    showConfigOverlay(): void {
        this.configPanelManager.showConfigOverlay();
    }

    /**
     * Hides the configuration overlay
     */
    hideConfigOverlay(): void {
        this.configPanelManager.hideConfigOverlay();
    }

    // ========== Records Panel Methods ==========

    /**
     * Shows the records overlay
     */
    showRecordsOverlay(): void {
        this.recordsPanelManager.showRecordsOverlay(() => this.hideStatsPanel());
    }

    /**
     * Hides the records overlay
     */
    hideRecordsOverlay(): void {
        this.recordsPanelManager.hideRecordsOverlay();
    }

    // ========== Stats Panel Methods ==========

    /**
     * Shows the stats panel
     */
    showStatsPanel(): void {
        this.statsPanelManager.showStatsPanel(
            () => this.showConfigOverlay(),
            () => this.showRecordsOverlay()
        );
    }

    /**
     * Hides the stats panel
     */
    hideStatsPanel(): void {
        this.statsPanelManager.hideStatsPanel();
    }

    /**
     * Checks if the stats panel is open
     */
    isStatsPanelOpen(): boolean {
        return this.statsPanelManager.isStatsPanelOpen();
    }

    // ========== Barter Window Methods (Delegated) ==========

    /**
     * Sets up barter handlers
     */
    setupBarterHandlers(): void {
        this.barterWindow.setupBarterHandlers();
        this.statueInfoWindow.setupStatueInfoHandlers();
    }

    /**
     * Shows the barter window
     */
    showBarterWindow(npcType: string): void {
        this.barterWindow.showBarterWindow(npcType);
    }

    /**
     * Hides the barter window
     */
    hideBarterWindow(): void {
        this.barterWindow.hideBarterWindow();
    }

    /**
     * Confirms a trade in the barter window
     */
    confirmTrade(): void {
        this.barterWindow.confirmTrade();
    }

    // ========== Statue Info Window Methods (Delegated) ==========

    /**
     * Shows the statue info window
     */
    showStatueInfo(statueType: string): void {
        this.statueInfoWindow.showStatueInfo(statueType);
    }

    /**
     * Hides the statue info window
     */
    hideStatueInfoWindow(): void {
        this.statueInfoWindow.hideStatueInfoWindow();
    }
}
