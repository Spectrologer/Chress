import { INPUT_CONSTANTS } from '../core/constants.js';
import { PointerInput } from '../core/PointerInput.js';

export class InputBindings {
    constructor(game, handlers, convertScreenToGrid) {
        this.game = game;
        this.handlers = handlers; // { handleTap, handleKeyPress }
        this.convertScreenToGrid = convertScreenToGrid;
        this.lastHighlightedTile = { x: null, y: null };
        this._audioResumed = false;
    }

    _resumeAudioIfNeeded() {
        if (this._audioResumed) return;
        this._audioResumed = true;
        try {
            if (this.game && this.game.soundManager && typeof this.game.soundManager.resumeAudioContext === 'function') {
                this.game.soundManager.resumeAudioContext();
            }
        } catch (e) {}
    }

    setupControls() {
        // Ensure pointer input is created after canvas is available (GameInitializer sets game.canvas)
        try { if (!this.pointerInput) this.pointerInput = new PointerInput(this.game, this.handlers, this.convertScreenToGrid); } catch (err) {}

        // Keyboard controls
        window.addEventListener('keydown', (event) => {
            this._resumeAudioIfNeeded();
            try { this.handlers.handleKeyPress(event); } catch (e) {}
        });

        // Pointer-based input (preferred). PointerInput helper handles pointerdown/move/up
        // and translates taps/swipes to handlers. We keep a click fallback for compatibility.
        // The PointerInput instance was created in the constructor and will register
        // pointer listeners on the canvas.

        // PointerInput handles pointer events for the canvas. Click fallback removed.
    }

    // Legacy touch controls removed: PointerInput handles pointer events now.
    setupTouchControls() {
        // no-op kept for backward compatibility
    }
}
