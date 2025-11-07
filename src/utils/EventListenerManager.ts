/**
 * EventListenerManager
 *
 * Centralized utility for managing event listeners with automatic cleanup.
 * Eliminates duplication across UI components and prevents memory leaks.
 *
 * Features:
 * - Automatic cleanup of all registered listeners
 * - Common patterns (outside clicks, keyboard shortcuts, pointer sequences)
 * - Clone-and-replace pattern for button handlers
 * - Scoped management per component instance
 */

interface ListenerEntry {
    target: EventTarget;
    type: string;
    listener: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
}

interface PointerSequenceHandlers {
    onDown?: (e: PointerEvent) => void;
    onMove?: (e: PointerEvent) => void;
    onUp?: (e: PointerEvent) => void;
    onCancel?: (e: PointerEvent) => void;
}

interface OutsideClickOptions {
    debounceMs?: number;
    skipElementId?: string;
    capturePhase?: boolean;
}

export class EventListenerManager {
    private listeners: ListenerEntry[] = [];
    private timeouts: number[] = [];

    /**
     * Add a standard event listener with automatic cleanup tracking
     */
    add<K extends keyof HTMLElementEventMap>(
        target: EventTarget,
        type: K,
        listener: (ev: HTMLElementEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): void;
    add(
        target: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ): void {
        target.addEventListener(type, listener, options);
        this.listeners.push({ target, type, listener, options });
    }

    /**
     * Add a one-time event listener that auto-removes after firing
     */
    addOnce<K extends keyof HTMLElementEventMap>(
        target: EventTarget,
        type: K,
        listener: (ev: HTMLElementEventMap[K]) => void,
        options?: AddEventListenerOptions
    ): void {
        const wrappedListener = (ev: Event): void => {
            listener(ev as HTMLElementEventMap[K]);
            this.remove(target, type, wrappedListener);
        };

        const finalOptions = { ...options, once: true };
        this.add(target, type, wrappedListener, finalOptions);
    }

    /**
     * Remove a specific listener
     */
    remove(
        target: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject
    ): void {
        target.removeEventListener(type, listener);

        const index = this.listeners.findIndex(
            entry => entry.target === target &&
                     entry.type === type &&
                     entry.listener === listener
        );

        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Clone a button element and replace it to remove all old listeners
     * Common pattern in OverlayButtonHandler
     */
    cloneAndReplace<T extends HTMLElement>(element: T): T {
        const clone = element.cloneNode(true) as T;
        element.parentNode?.replaceChild(clone, element);
        return clone;
    }

    /**
     * Setup button handler with clone-and-replace pattern
     */
    setupButton(
        buttonId: string,
        handler: (e: MouseEvent) => void,
        options: { once?: boolean; preventDefault?: boolean } = {}
    ): HTMLElement | null {
        const button = document.getElementById(buttonId);
        if (!button) return null;

        const newButton = this.cloneAndReplace(button);

        const wrappedHandler = (e: MouseEvent): void => {
            if (options.preventDefault !== false) {
                e.preventDefault();
                e.stopPropagation();
            }
            handler(e);
        };

        if (options.once) {
            this.addOnce(newButton, 'click', wrappedHandler);
        } else {
            this.add(newButton, 'click', wrappedHandler);
        }

        return newButton;
    }

    /**
     * Setup keyboard shortcut handler (e.g., Escape key)
     */
    addKeyboardShortcut(
        key: string,
        handler: (e: KeyboardEvent) => void,
        options?: { target?: EventTarget; preventDefault?: boolean }
    ): void {
        const target = options?.target || document;
        const wrappedHandler = (e: KeyboardEvent): void => {
            if (e.key === key) {
                if (options?.preventDefault !== false) {
                    e.preventDefault();
                }
                handler(e);
            }
        };

        this.add(target, 'keydown', wrappedHandler as EventListener);
    }

    /**
     * Setup outside click handler to close overlays
     * Returns the handler function for manual cleanup if needed
     */
    addOutsideClickHandler(
        overlay: HTMLElement,
        closeCallback: () => void,
        options: OutsideClickOptions = {}
    ): void {
        const {
            debounceMs = 300,
            skipElementId = null,
            capturePhase = true
        } = options;

        const openTime = Date.now();

        const handler = (ev: Event): void => {
            const target = ev.target as HTMLElement;

            // Skip if clicking the button that opens this overlay
            if (skipElementId && target?.id === skipElementId) return;

            // Skip if just opened (debounce)
            if (debounceMs > 0 && (Date.now() - openTime < debounceMs)) return;

            // Check if click is outside the inner panel
            const inner = overlay.querySelector<HTMLElement>('.stats-panel');
            if (!inner || !inner.contains(target)) {
                ev?.preventDefault?.();
                ev?.stopPropagation?.();
                closeCallback();
            }
        };

        this.add(document, 'pointerdown', handler as EventListener, { capture: capturePhase });
    }

    /**
     * Setup pointer event sequence (down, move, up, cancel)
     * Common pattern for drag interactions and long-press detection
     */
    addPointerSequence(
        element: HTMLElement,
        handlers: PointerSequenceHandlers,
        options?: { passive?: boolean }
    ): void {
        if (handlers.onDown) {
            this.add(element, 'pointerdown', handlers.onDown as EventListener, {
                passive: options?.passive ?? false
            });
        }

        if (handlers.onMove) {
            this.add(element, 'pointermove', handlers.onMove as EventListener);
        }

        if (handlers.onUp) {
            this.add(element, 'pointerup', handlers.onUp as EventListener);
        }

        if (handlers.onCancel) {
            this.add(element, 'pointercancel', handlers.onCancel as EventListener);
        }
    }

    /**
     * Setup context menu handler (prevent default + custom action)
     */
    addContextMenu(
        element: HTMLElement,
        handler: (e: MouseEvent) => void,
        options?: { preventDefault?: boolean }
    ): void {
        const wrappedHandler = (e: MouseEvent): void => {
            if (options?.preventDefault !== false) {
                e.preventDefault();
            }
            handler(e);
        };

        this.add(element, 'contextmenu', wrappedHandler as EventListener);
    }

    /**
     * Add a timeout that will be auto-cleared on cleanup
     */
    addTimeout(callback: () => void, delay: number): number {
        const timeoutId = window.setTimeout(callback, delay);
        this.timeouts.push(timeoutId);
        return timeoutId;
    }

    /**
     * Clear a specific timeout
     */
    clearTimeout(timeoutId: number): void {
        window.clearTimeout(timeoutId);
        const index = this.timeouts.indexOf(timeoutId);
        if (index !== -1) {
            this.timeouts.splice(index, 1);
        }
    }

    /**
     * Install a short-lived capture blocker to prevent immediate events
     * Useful after showing overlays to prevent accidental clicks
     */
    installCaptureBlocker(
        duration = 300,
        allowedContainer: HTMLElement | null = null
    ): void {
        const captureHandler = (ev: Event): void => {
            // Allow clicks within the specified container
            if (allowedContainer && allowedContainer.contains(ev.target as Node)) {
                return;
            }
            ev?.preventDefault?.();
            ev?.stopPropagation?.();
        };

        const events = ['pointerdown', 'pointerup', 'click', 'mousedown'];

        // Add all event listeners
        events.forEach(eventType => {
            document.addEventListener(eventType, captureHandler, true);
        });

        // Auto-remove after duration
        this.addTimeout(() => {
            events.forEach(eventType => {
                document.removeEventListener(eventType, captureHandler, true);
            });
        }, duration);
    }

    /**
     * Prevent clicks from propagating outside an element
     * Common pattern for panel inner content
     */
    preventClickPropagation(element: HTMLElement): void {
        this.add(element, 'click', (e) => e.stopPropagation());
        this.add(element, 'pointerup', (e) => {
            e?.preventDefault?.();
            e.stopPropagation();
        });
    }

    /**
     * Remove all tracked listeners and clear all timeouts
     * Call this in component cleanup/destroy methods
     */
    cleanup(): void {
        // Remove all event listeners
        for (const { target, type, listener, options } of this.listeners) {
            target.removeEventListener(type, listener, options);
        }
        this.listeners = [];

        // Clear all timeouts
        for (const timeoutId of this.timeouts) {
            window.clearTimeout(timeoutId);
        }
        this.timeouts = [];
    }

    /**
     * Get count of tracked listeners (for debugging)
     */
    getListenerCount(): number {
        return this.listeners.length;
    }

    /**
     * Get count of tracked timeouts (for debugging)
     */
    getTimeoutCount(): number {
        return this.timeouts.length;
    }
}
