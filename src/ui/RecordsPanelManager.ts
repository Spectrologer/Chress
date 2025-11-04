import { PanelEventHandler } from './PanelEventHandler';
import { EventListenerManager } from '@utils/EventListenerManager';

interface GameInstance {
    [key: string]: any;
}

/**
 * RecordsPanelManager
 * Manages the records overlay (zones, points, combo high scores)
 */
export class RecordsPanelManager {
    private game: GameInstance;
    private recordsOverlay: HTMLElement | null;
    private recordsOpenTime: number | null = null;
    private _recordsHandlerAttached: boolean = false;
    private _showStatsPanelCallback?: () => void;
    private eventManager: EventListenerManager;

    constructor(game: GameInstance) {
        this.game = game;
        this.recordsOverlay = document.getElementById('recordsOverlay');
        this.eventManager = new EventListenerManager();
    }

    /**
     * Shows the records overlay with current record values
     */
    showRecordsOverlay(hideStatsPanelCallback?: () => void): void {
        console.log('[RecordsPanelManager] showRecordsOverlay called');
        if (!this.recordsOverlay) {
            console.error('[RecordsPanelManager] recordsOverlay element not found!');
            return;
        }

        // Hide the stats panel when showing records
        if (hideStatsPanelCallback) {
            hideStatsPanelCallback();
        }

        this.recordsOpenTime = Date.now();

        // Populate record values from localStorage
        this._updateRecordValues();

        // Make overlay visible
        this.recordsOverlay.classList.add('show');
        console.log('[RecordsPanelManager] Overlay classList after adding show:', this.recordsOverlay.classList.toString());
        console.log('[RecordsPanelManager] Overlay display style:', window.getComputedStyle(this.recordsOverlay).display);

        // Install capture blocker to prevent immediate re-clicks
        PanelEventHandler.installCaptureBlocker(300);

        // Attach event handlers once
        if (!this._recordsHandlerAttached) {
            this._attachRecordsHandlers();
            this._recordsHandlerAttached = true;
        }

        // Set up global click handler (with slight delay)
        this._setupGlobalClickHandler();
    }

    /**
     * Hides the records overlay
     */
    hideRecordsOverlay(): void {
        if (!this.recordsOverlay) return;

        this.recordsOverlay.classList.remove('show');

        // Cleanup all event listeners
        this.eventManager.cleanup();

        this.recordsOpenTime = null;
    }

    /**
     * Updates record overlay values from localStorage
     */
    private _updateRecordValues(): void {
        const rz = this.recordsOverlay?.querySelector<HTMLElement>('#record-zones');
        const rp = this.recordsOverlay?.querySelector<HTMLElement>('#record-points');
        const rc = this.recordsOverlay?.querySelector<HTMLElement>('#record-combo');

        const zones = parseInt(localStorage.getItem('chress:record:zones') || '0', 10) || 0;
        const points = parseInt(localStorage.getItem('chress:record:points') || '0', 10) || 0;
        const combo = parseInt(localStorage.getItem('chress:record:combo') || '0', 10) || 0;

        if (rz) rz.textContent = String(zones);
        if (rp) rp.textContent = String(points);
        if (rc) rc.textContent = String(combo);
    }

    /**
     * Sets up global click handler to close overlay on outside clicks
     */
    private _setupGlobalClickHandler(): void {
        if (!this.recordsOverlay) return;

        this.eventManager.addOutsideClickHandler(
            this.recordsOverlay,
            () => this.hideRecordsOverlay(),
            { debounceMs: 300, capturePhase: true }
        );
    }

    /**
     * Attaches event handlers for records panel controls
     */
    private _attachRecordsHandlers(): void {
        // Prevent clicks inside the inner panel from closing the overlay
        const panel = this.recordsOverlay?.querySelector<HTMLElement>('.stats-panel');
        if (panel) {
            PanelEventHandler.preventInnerPanelClicks(panel);
        }

        // Close on overlay background click
        if (this.recordsOverlay) {
            this.eventManager.add(this.recordsOverlay, 'click', (e: MouseEvent) => {
                const inner = this.recordsOverlay?.querySelector('.stats-panel');
                if (!inner || !inner.contains(e.target as Node)) {
                    this.hideRecordsOverlay();
                }
            });
        }

        // Wire up the back button
        const backButton = this.recordsOverlay?.querySelector<HTMLButtonElement>('#records-back-button');
        if (backButton) {
            this.eventManager.add(backButton, 'click', (e: MouseEvent) => {
                if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

                // Check if opened from start menu - if so, don't call hideRecordsOverlay
                // as the OverlayManager handles closing it directly
                if (!this.recordsOverlay?.dataset.openedFromStart) {
                    this.hideRecordsOverlay();
                    // Callback to show stats panel again would be passed from parent
                    if (this._showStatsPanelCallback) {
                        this._showStatsPanelCallback();
                    }
                }
                e.preventDefault();
                e.stopPropagation();
            });
        }
    }

    /**
     * Sets the callback for showing stats panel (called when back button is clicked)
     */
    setShowStatsPanelCallback(callback: () => void): void {
        this._showStatsPanelCallback = callback;
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the RecordsPanelManager instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }
}
