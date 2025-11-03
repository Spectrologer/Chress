/**
 * PanelEventHandler
 * Shared utilities for panel event handling and interaction management
 */
import { UI_TIMING_CONSTANTS } from '../core/constants/ui';

interface OutsideClickOptions {
    debounceMs?: number;
    skipButtonId?: string | null;
}

export class PanelEventHandler {
    /**
     * Installs a short-lived capturing blocker to prevent immediate pointer events
     * from triggering buttons that were just rendered under the pointer
     */
    static installCaptureBlocker(duration: number = UI_TIMING_CONSTANTS.PANEL_CAPTURE_BLOCKER_DURATION, allowedContainer: HTMLElement | null = null): void {
        const captureHandler = (ev: Event): void => {
            // Allow clicks within the specified container
            if (allowedContainer && allowedContainer.contains(ev.target as Node)) {
                return;
            }
            ev?.preventDefault?.();
            ev?.stopPropagation?.();
        };

        const removeAll = (): void => {
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
     */
    static preventInnerPanelClicks(panelElement: HTMLElement | null): void {
        if (!panelElement) return;

        panelElement.addEventListener('click', (e) => e.stopPropagation());
        panelElement.addEventListener('pointerup', (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            e.stopPropagation();
        });
    }

    /**
     * Clears animation classes and styles from a panel
     */
    static clearAnimations(panelElement: HTMLElement | null): void {
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
     * @returns The handler function (for cleanup)
     */
    static createOutsideClickHandler(overlay: HTMLElement, closeCallback: () => void, options: OutsideClickOptions = {}): (ev: Event) => void {
        const { debounceMs = UI_TIMING_CONSTANTS.PANEL_CAPTURE_BLOCKER_DURATION, skipButtonId = null } = options;
        const openTime = Date.now();

        return (ev: Event): void => {
            const target = ev.target as HTMLElement;

            // Skip if clicking the button that opens this panel
            if (skipButtonId && target?.id === skipButtonId) return;

            // Skip if just opened (debounce)
            const now = Date.now();
            if (now - openTime < debounceMs) return;

            // Check if click is outside the inner panel
            const inner = overlay.querySelector<HTMLElement>('.stats-panel');
            if (!inner || !inner.contains(target)) {
                ev?.preventDefault?.();
                ev?.stopPropagation?.();
                closeCallback();
            }
        };
    }

    /**
     * Sets up audio toggle handlers with proper event handling for touch devices
     * @returns Whether setup was successful
     */
    static setupAudioToggle(toggleId: string, applyStateCallback: (checked: boolean) => void): boolean {
        const toggle = document.getElementById(toggleId) as HTMLInputElement | null;
        if (!toggle) return false;

        toggle.addEventListener('change', (e) => applyStateCallback((e.target as HTMLInputElement).checked));
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
