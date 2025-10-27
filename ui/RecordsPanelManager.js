import { PanelEventHandler } from './PanelEventHandler.js';

/**
 * RecordsPanelManager
 * Manages the records overlay (zones, points, combo high scores)
 */
export class RecordsPanelManager {
    constructor(game) {
        this.game = game;
        this.recordsOverlay = document.getElementById('recordsOverlay');
        this.recordsOpenTime = null;
        this._recordsGlobalHandler = null;
        this._recordsHandlerAttached = false;
    }

    /**
     * Shows the records overlay with current record values
     * @param {Function} hideStatsPanelCallback - Callback to hide stats panel
     */
    showRecordsOverlay(hideStatsPanelCallback) {
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
    hideRecordsOverlay() {
        if (!this.recordsOverlay) return;

        this.recordsOverlay.classList.remove('show');

        // Remove global click handler
        if (this._recordsGlobalHandler) {
            document.removeEventListener('pointerdown', this._recordsGlobalHandler, true);
            this._recordsGlobalHandler = null;
        }

        this.recordsOpenTime = null;
    }

    /**
     * Updates record overlay values from localStorage
     * @private
     */
    _updateRecordValues() {
        const rz = this.recordsOverlay.querySelector('#record-zones');
        const rp = this.recordsOverlay.querySelector('#record-points');
        const rc = this.recordsOverlay.querySelector('#record-combo');

        const zones = parseInt(localStorage.getItem('chress:record:zones') || '0', 10) || 0;
        const points = parseInt(localStorage.getItem('chress:record:points') || '0', 10) || 0;
        const combo = parseInt(localStorage.getItem('chress:record:combo') || '0', 10) || 0;

        if (rz) rz.textContent = String(zones);
        if (rp) rp.textContent = String(points);
        if (rc) rc.textContent = String(combo);
    }

    /**
     * Sets up global click handler to close overlay on outside clicks
     * @private
     */
    _setupGlobalClickHandler() {
        // Remove existing handler if present
        if (this._recordsGlobalHandler) {
            document.removeEventListener('pointerdown', this._recordsGlobalHandler, true);
            this._recordsGlobalHandler = null;
        }

        this._recordsGlobalHandler = PanelEventHandler.createOutsideClickHandler(
            this.recordsOverlay,
            () => this.hideRecordsOverlay(),
            { debounceMs: 300 }
        );

        // Add with slight delay to prevent immediate closure
        setTimeout(() => {
            document.addEventListener('pointerdown', this._recordsGlobalHandler, true);
        }, 0);
    }

    /**
     * Attaches event handlers for records panel controls
     * @private
     */
    _attachRecordsHandlers() {
        // Prevent clicks inside the inner panel from closing the overlay
        const panel = this.recordsOverlay.querySelector('.stats-panel');
        if (panel) {
            PanelEventHandler.preventInnerPanelClicks(panel);
        }

        // Close on overlay background click
        this.recordsOverlay.addEventListener('click', (e) => {
            const inner = this.recordsOverlay.querySelector('.stats-panel');
            if (!inner || !inner.contains(e.target)) {
                this.hideRecordsOverlay();
            }
        });

        // Wire up the back button
        const backButton = this.recordsOverlay.querySelector('#records-back-button');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

                // Check if opened from start menu - if so, don't call hideRecordsOverlay
                // as the OverlayManager handles closing it directly
                if (!this.recordsOverlay.dataset.openedFromStart) {
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
     * @param {Function} callback - Callback to show stats panel
     */
    setShowStatsPanelCallback(callback) {
        this._showStatsPanelCallback = callback;
    }
}
