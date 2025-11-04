/**
 * GameUI
 *
 * Encapsulates all UI-related managers and state including:
 * - UI managers (UIManager, OverlayManager)
 * - Inventory UI (InventoryUI, RadialInventoryUI)
 * - Canvas and rendering contexts
 * - Game state flags (gameStarted, previewMode)
 */
import type { Coordinates } from './PositionTypes';

export class GameUI {
    // Canvas elements and contexts
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    mapCanvas: HTMLCanvasElement | null;
    mapCtx: CanvasRenderingContext2D | null;

    // UI Managers (set by ServiceContainer)
    uiManager: any;
    overlayManager: any;
    inventoryUI: any;
    radialInventoryUI: any;

    // Game state flags
    gameStarted: boolean;
    previewMode: boolean;

    // Player position tracking for UI updates
    _lastPlayerPos: Coordinates | null;

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
    initializeCanvas(canvasId: string = 'gameCanvas', mapCanvasId: string = 'zoneMap'): void {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
        this.ctx = this.canvas?.getContext('2d') || null;
        this.mapCanvas = document.getElementById(mapCanvasId) as HTMLCanvasElement | null;
        this.mapCtx = this.mapCanvas?.getContext('2d') || null;
    }

    /**
     * Update last known player position
     */
    updateLastPlayerPosition(player: any): void {
        try {
            this._lastPlayerPos = player ? { x: player.x, y: player.y } : null;
        } catch (e) {
            this._lastPlayerPos = null;
        }
    }

    /**
     * Check if player has moved since last update
     */
    hasPlayerMoved(player: any): boolean {
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
    reset(): void {
        this.gameStarted = false;
        this.previewMode = false;
        this._lastPlayerPos = null;
    }
}
