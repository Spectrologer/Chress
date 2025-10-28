/**
 * PanelEventHandler
 * Shared utilities for panel event handling and interaction management
 */
import { UI_TIMING_CONSTANTS } from '../core/constants/ui.js';

export class PanelEventHandler {
    /**
     * Installs a short-lived capturing blocker to prevent immediate pointer events
     * from triggering buttons that were just rendered under the pointer
     * @param {number} duration - Duration in milliseconds (default: 300ms)
     * @param {HTMLElement} allowedContainer - Optional container element to allow clicks within
     */
    static installCaptureBlocker(duration = UI_TIMING_CONSTANTS.PANEL_CAPTURE_BLOCKER_DURATION, allowedContainer = null) {
        const captureHandler = (ev) => {
            // Allow clicks within the specified container
            if (allowedContainer && allowedContainer.contains(ev.target)) {
                return;
            }
            ev?.preventDefault?.();
            ev?.stopPropagation?.();
        };

        const removeAll = () => {
            document.removeEventListener('pointerdown', captureHandler, true);
            document.removeEventListener('pointerup', captureHandler, true);
            document.removeEventListener('click', captureHandler, true);
            document.removeEventListener('mousedown', captureHandler, true);
        };

        document.addEventListener('pointerdown', captureHandler, true);
        document.addEventListener('pointerup', captureHandler, true);
        document.addEventListener('click', captureHandler, true);
        document.addEventListener('mousedown', captureHandler, true);

        setTimeout(removeAll, duration);
    }

    /**
     * Sets up click prevention for an inner panel element
     * @param {HTMLElement} panelElement - The panel element to prevent clicks on
     */
    static preventInnerPanelClicks(panelElement) {
        if (!panelElement) return;

        panelElement.addEventListener('click', (e) => e.stopPropagation());
        panelElement.addEventListener('pointerup', (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            e.stopPropagation();
        });
    }

    /**
     * Clears animation classes and styles from a panel
     * @param {HTMLElement} panelElement - The panel element to clear
     */
    static clearAnimations(panelElement) {
        if (!panelElement) return;

        panelElement.classList.remove(
            'slide-out-left',
            'slide-in-left',
            'stats-panel-furling',
            'stats-panel-furling-up'
        );
        panelElement.style.transform = '';
        panelElement.style.opacity = '';
    }

    /**
     * Creates a global outside-click handler for closing overlays
     * @param {HTMLElement} overlay - The overlay element
     * @param {Function} closeCallback - Function to call when clicking outside
     * @param {Object} options - Configuration options
     * @param {number} options.debounceMs - Milliseconds to debounce after opening
     * @param {string} options.skipButtonId - Button ID to skip (e.g., the button that opened this)
     * @returns {Function} The handler function (for cleanup)
     */
    static createOutsideClickHandler(overlay, closeCallback, options = {}) {
        const { debounceMs = UI_TIMING_CONSTANTS.PANEL_CAPTURE_BLOCKER_DURATION, skipButtonId = null } = options;
        const openTime = Date.now();

        return (ev) => {
            // Skip if clicking the button that opens this panel
            if (skipButtonId && ev.target?.id === skipButtonId) return;

            // Skip if just opened (debounce)
            const now = Date.now();
            if (now - openTime < debounceMs) return;

            // Check if click is outside the inner panel
            const inner = overlay.querySelector('.stats-panel');
            if (!inner || !inner.contains(ev.target)) {
                ev?.preventDefault?.();
                ev?.stopPropagation?.();
                closeCallback();
            }
        };
    }

    /**
     * Sets up audio toggle handlers with proper event handling for touch devices
     * @param {string} toggleId - The ID of the toggle element
     * @param {Function} applyStateCallback - Callback to apply state changes
     * @returns {boolean} Whether setup was successful
     */
    static setupAudioToggle(toggleId, applyStateCallback) {
        const toggle = document.getElementById(toggleId);
        if (!toggle) return false;

        toggle.addEventListener('change', (e) => applyStateCallback(e.target.checked));
        toggle.addEventListener('click', () => {
            toggle.checked = !toggle.checked;
            applyStateCallback(toggle.checked);
        });
        toggle.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            toggle.checked = !toggle.checked;
            applyStateCallback(toggle.checked);
        }, { passive: false });

        return true;
    }
}
