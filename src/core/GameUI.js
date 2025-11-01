// @ts-check

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
        /** @type {HTMLCanvasElement | null} */
        this.canvas = null;

        /** @type {CanvasRenderingContext2D | null} */
        this.ctx = null;

        /** @type {HTMLCanvasElement | null} */
        this.mapCanvas = null;

        /** @type {CanvasRenderingContext2D | null} */
        this.mapCtx = null;

        // UI Managers (set by ServiceContainer)
        /** @type {any} */
        this.uiManager = null;

        /** @type {any} */
        this.overlayManager = null;

        /** @type {any} */
        this.inventoryUI = null;

        /** @type {any} */
        this.radialInventoryUI = null;

        // Game state flags
        /** @type {boolean} */
        this.gameStarted = false;

        /** @type {boolean} */
        this.previewMode = false;

        // Player position tracking for UI updates
        /** @type {{x: number, y: number} | null} */
        this._lastPlayerPos = null;
    }

    /**
     * Initialize canvas references
     * @param {string} [canvasId]
     * @param {string} [mapCanvasId]
     * @returns {void}
     */
    initializeCanvas(canvasId = 'gameCanvas', mapCanvasId = 'zoneMap') {
        this.canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById(canvasId));
        this.ctx = this.canvas?.getContext('2d') || null;
        this.mapCanvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById(mapCanvasId));
        this.mapCtx = this.mapCanvas?.getContext('2d') || null;
    }

    /**
     * Update last known player position
     * @param {any} player
     * @returns {void}
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
     * @param {any} player
     * @returns {boolean}
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
     * @returns {void}
     */
    reset() {
        this.gameStarted = false;
        this.previewMode = false;
        this._lastPlayerPos = null;
    }
}
