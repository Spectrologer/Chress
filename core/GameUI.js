/**
 * GameUI
 *
 * Encapsulates all UI-related managers and state including:
 * - UI managers (UIManager, OverlayManager)
 * - Inventory UI (InventoryUI, RadialInventoryUI)
 * - Canvas and rendering contexts
 * - Game state flags (gameStarted, previewMode)
 */
export class GameUI {
    constructor() {
        // Canvas elements and contexts
        this.canvas = null;
        this.ctx = null;
        this.mapCanvas = null;
        this.mapCtx = null;

        // UI Managers (set by ServiceContainer)
        this.uiManager = null;
        this.overlayManager = null;
        this.inventoryUI = null;
        this.radialInventoryUI = null;

        // Game state flags
        this.gameStarted = false;
        this.previewMode = false;

        // Player position tracking for UI updates
        this._lastPlayerPos = null;
    }

    /**
     * Initialize canvas references
     */
    initializeCanvas(canvasId = 'gameCanvas', mapCanvasId = 'zoneMap') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas?.getContext('2d');
        this.mapCanvas = document.getElementById(mapCanvasId);
        this.mapCtx = this.mapCanvas?.getContext('2d');
    }

    /**
     * Update last known player position
     */
    updateLastPlayerPosition(player) {
        try {
            this._lastPlayerPos = player ? { x: player.x, y: player.y } : null;
        } catch (e) {
            this._lastPlayerPos = null;
        }
    }

    /**
     * Check if player has moved since last update
     */
    hasPlayerMoved(player) {
        try {
            const cur = player ? { x: player.x, y: player.y } : null;
            const last = this._lastPlayerPos;
            return !last || !cur || last.x !== cur.x || last.y !== cur.y;
        } catch (e) {
            return false;
        }
    }

    /**
     * Reset UI state (for new game)
     */
    reset() {
        this.gameStarted = false;
        this.previewMode = false;
        this._lastPlayerPos = null;
    }
}
