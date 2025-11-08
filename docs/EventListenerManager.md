# EventListenerManager - Usage Guide

## Overview

The `EventListenerManager` is a centralized utility for managing DOM event listeners with automatic cleanup. It eliminates code duplication across UI components and prevents memory leaks by tracking and cleaning up all registered listeners.

## Key Features

- **Automatic cleanup** - All listeners are tracked and can be removed with a single call
- **Common patterns** - Pre-built methods for frequent use cases
- **Scoped management** - Each component instance has its own manager
- **Type-safe API** - Full TypeScript support
- **Timeout tracking** - Automatic cleanup of timeouts

## Installation

```typescript
import { EventListenerManager } from "../utils/EventListenerManager";
```

## Basic Usage

### 1. Initialize in Constructor

```typescript
export class MyUIComponent {
  private eventManager: EventListenerManager;

  constructor() {
    this.eventManager = new EventListenerManager();
  }

  cleanup(): void {
    this.eventManager.cleanup();
  }
}
```

### 2. Add Event Listeners

```typescript
// Basic event listener
this.eventManager.add(button, "click", (e) => {
  console.log("Button clicked!");
});

// One-time listener (auto-removes after firing)
this.eventManager.addOnce(button, "click", (e) => {
  console.log("Fired once!");
});
```

### 3. Cleanup

```typescript
// Remove all tracked listeners and timeouts
this.eventManager.cleanup();
```

## Common Patterns

### Button Handling with Clone-and-Replace

The clone-and-replace pattern ensures all old listeners are removed before adding new ones:

```typescript
// Old way (manual clone-and-replace)
const newButton = button.cloneNode(true) as HTMLElement;
button.parentNode!.replaceChild(newButton, button);
newButton.addEventListener("click", handler);

// New way (EventListenerManager)
this.eventManager.setupButton(
  "buttonId",
  (e) => {
    console.log("Button clicked!");
  },
  { once: true }
);
```

### Keyboard Shortcuts

```typescript
// Listen for Escape key
this.eventManager.addKeyboardShortcut("Escape", () => {
  this.closeDialog();
});

// Custom options
this.eventManager.addKeyboardShortcut(
  "Enter",
  (e) => {
    this.submitForm();
  },
  { target: formElement, preventDefault: true }
);
```

### Outside Click Handlers

Perfect for closing overlays when clicking outside:

```typescript
this.eventManager.addOutsideClickHandler(
  overlayElement,
  () => this.closeOverlay(),
  {
    debounceMs: 300, // Ignore clicks within 300ms of opening
    skipElementId: "openButton", // Don't close if clicking this button
    capturePhase: true, // Use capture phase
  }
);
```

### Pointer Event Sequences

For drag interactions and long-press detection:

```typescript
this.eventManager.addPointerSequence(
  element,
  {
    onDown: (e) => {
      console.log("Pointer down");
      this.startPosition = { x: e.clientX, y: e.clientY };
    },
    onMove: (e) => {
      console.log("Pointer moving");
      this.updateDrag(e);
    },
    onUp: (e) => {
      console.log("Pointer up");
      this.finalizeDrag(e);
    },
    onCancel: (e) => {
      console.log("Pointer cancelled");
      this.cancelDrag(e);
    },
  },
  { passive: false }
);
```

### Context Menu Handlers

```typescript
this.eventManager.addContextMenu(
  element,
  (e) => {
    this.showContextMenu(e);
  },
  { preventDefault: true }
);
```

### Timeouts

Timeouts are automatically tracked and cleared on cleanup:

```typescript
this.eventManager.addTimeout(() => {
  console.log("Fired after 1 second");
}, 1000);

// Clear specific timeout
const timeoutId = this.eventManager.addTimeout(() => {}, 1000);
this.eventManager.clearTimeout(timeoutId);
```

### Capture Blocker

Prevent immediate clicks after showing overlays:

```typescript
// Install a 300ms blocker
this.eventManager.installCaptureBlocker(300);

// Allow clicks within specific container
this.eventManager.installCaptureBlocker(300, allowedContainer);
```

### Prevent Click Propagation

Stop clicks from propagating outside an element:

```typescript
this.eventManager.preventClickPropagation(panelInnerElement);
```

## Real-World Examples

### Example 1: BarterWindow

```typescript
export class BarterWindow {
  private eventManager: EventListenerManager;

  constructor(game: Game) {
    this.game = game;
    this.eventManager = new EventListenerManager();
  }

  setupBarterHandlers(): void {
    // Escape key to close
    this.eventManager.addKeyboardShortcut("Escape", () => {
      this.hideBarterWindow();
    });
  }

  private createOfferElement(tradeData: Trade): HTMLDivElement {
    const offerDiv = document.createElement("div");
    // ... create offer UI ...

    const confirmButton =
      offerDiv.querySelector<HTMLButtonElement>(".confirm-trade-btn");
    if (confirmButton) {
      this.eventManager.add(confirmButton, "click", () =>
        this.confirmTrade(tradeData)
      );
    }

    const cancelButton =
      offerDiv.querySelector<HTMLButtonElement>(".cancel-trade-btn");
    if (cancelButton) {
      this.eventManager.add(cancelButton, "click", () =>
        this.hideBarterWindow()
      );
    }

    return offerDiv;
  }

  cleanup(): void {
    this.eventManager.cleanup();
  }
}
```

### Example 2: DialogueManager

```typescript
export class DialogueManager {
  private eventManager: EventListenerManager;

  constructor(game: GameInstance, typewriterController: TypewriterController) {
    this.game = game;
    this.typewriterController = typewriterController;
    this.eventManager = new EventListenerManager();
  }

  private _attachButtonHandler(): void {
    const closeButton = this.messageOverlay?.querySelector(
      ".dialogue-close-button"
    );
    if (closeButton) {
      this.eventManager.add(closeButton, "click", () => {
        import("./Sign.js").then(({ textbox }) => {
          Sign.hideMessageForSign(this.game);
        });
      });
    }
  }

  cleanup(): void {
    this.eventManager.cleanup();
  }
}
```

### Example 3: ConfigPanelManager

```typescript
export class ConfigPanelManager {
  private eventManager: EventListenerManager;

  constructor(game: GameInstance) {
    this.game = game;
    this.eventManager = new EventListenerManager();
  }

  showConfigOverlay(): void {
    // Setup outside click handler
    this.eventManager.addOutsideClickHandler(
      this.configOverlay,
      () => this.hideConfigOverlay(),
      {
        debounceMs: 300,
        skipElementId: "stats-config-button",
        capturePhase: true,
      }
    );

    // Install capture blocker
    this.eventManager.installCaptureBlocker(300);
  }

  hideConfigOverlay(): void {
    // Cleanup all listeners
    this.eventManager.cleanup();
  }

  cleanup(): void {
    this.eventManager.cleanup();
  }
}
```

## API Reference

### Constructor

```typescript
new EventListenerManager();
```

### Methods

#### `add(target, type, listener, options?)`

Add a standard event listener with automatic cleanup tracking.

```typescript
add<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    listener: (ev: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
): void
```

#### `addOnce(target, type, listener, options?)`

Add a one-time event listener that auto-removes after firing.

```typescript
addOnce<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    listener: (ev: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions
): void
```

#### `remove(target, type, listener)`

Remove a specific listener.

```typescript
remove(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject): void
```

#### `cloneAndReplace(element)`

Clone an element and replace it to remove all old listeners.

```typescript
cloneAndReplace<T extends HTMLElement>(element: T): T
```

#### `setupButton(buttonId, handler, options?)`

Setup button handler with clone-and-replace pattern.

```typescript
setupButton(
    buttonId: string,
    handler: (e: MouseEvent) => void,
    options?: { once?: boolean; preventDefault?: boolean }
): HTMLElement | null
```

#### `addKeyboardShortcut(key, handler, options?)`

Setup keyboard shortcut handler.

```typescript
addKeyboardShortcut(
    key: string,
    handler: (e: KeyboardEvent) => void,
    options?: { target?: EventTarget; preventDefault?: boolean }
): void
```

#### `addOutsideClickHandler(overlay, closeCallback, options?)`

Setup outside click handler to close overlays.

```typescript
addOutsideClickHandler(
    overlay: HTMLElement,
    closeCallback: () => void,
    options?: OutsideClickOptions
): void
```

#### `addPointerSequence(element, handlers, options?)`

Setup pointer event sequence.

```typescript
addPointerSequence(
    element: HTMLElement,
    handlers: PointerSequenceHandlers,
    options?: { passive?: boolean }
): void
```

#### `addContextMenu(element, handler, options?)`

Setup context menu handler.

```typescript
addContextMenu(
    element: HTMLElement,
    handler: (e: MouseEvent) => void,
    options?: { preventDefault?: boolean }
): void
```

#### `addTimeout(callback, delay)`

Add a timeout that will be auto-cleared on cleanup.

```typescript
addTimeout(callback: () => void, delay: number): number
```

#### `clearTimeout(timeoutId)`

Clear a specific timeout.

```typescript
clearTimeout(timeoutId: number): void
```

#### `installCaptureBlocker(duration?, allowedContainer?)`

Install a short-lived capture blocker.

```typescript
installCaptureBlocker(duration?: number, allowedContainer?: HTMLElement | null): void
```

#### `preventClickPropagation(element)`

Prevent clicks from propagating outside an element.

```typescript
preventClickPropagation(element: HTMLElement): void
```

#### `cleanup()`

Remove all tracked listeners and clear all timeouts.

```typescript
cleanup(): void
```

#### `getListenerCount()`

Get count of tracked listeners (for debugging).

```typescript
getListenerCount(): number
```

#### `getTimeoutCount()`

Get count of tracked timeouts (for debugging).

```typescript
getTimeoutCount(): number
```

## Best Practices

1. **Always call cleanup()** in component destroy/unmount methods
2. **Create one manager per component instance** - Don't share managers between components
3. **Use the helper methods** - They encapsulate common patterns and reduce errors
4. **Prefer `addOnce`** for one-time events like overlay close buttons
5. **Use `setupButton`** instead of manual clone-and-replace
6. **Track timeouts** using `addTimeout` instead of raw `setTimeout`

## Migration Guide

### Before (Manual Event Management)

```typescript
export class MyComponent {
  private clickHandler: ((e: Event) => void) | null = null;

  setup(): void {
    this.clickHandler = (e) => console.log("clicked");
    document.addEventListener("click", this.clickHandler);
  }

  cleanup(): void {
    if (this.clickHandler) {
      document.removeEventListener("click", this.clickHandler);
    }
    this.clickHandler = null;
  }
}
```

### After (EventListenerManager)

```typescript
export class MyComponent {
  private eventManager: EventListenerManager;

  constructor() {
    this.eventManager = new EventListenerManager();
  }

  setup(): void {
    this.eventManager.add(document, "click", (e) => console.log("clicked"));
  }

  cleanup(): void {
    this.eventManager.cleanup();
  }
}
```

## Debugging

Use the debug methods to inspect the manager state:

```typescript
console.log("Tracked listeners:", this.eventManager.getListenerCount());
console.log("Tracked timeouts:", this.eventManager.getTimeoutCount());
```

## Related Files

- Implementation: [src/utils/EventListenerManager.ts](../src/utils/EventListenerManager.ts)
- Examples:
  - [src/ui/BarterWindow.ts](../src/ui/BarterWindow.ts)
  - [src/ui/InventoryUI.ts](../src/ui/InventoryUI.ts)
  - [src/ui/DialogueManager.ts](../src/ui/DialogueManager.ts)
  - [src/ui/RadialInventoryUI.ts](../src/ui/RadialInventoryUI.ts)
  - [src/ui/ConfigPanelManager.ts](../src/ui/ConfigPanelManager.ts)
