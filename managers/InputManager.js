import { InputBindings } from './InputBindings.js';
import { InteractionController } from './InteractionController.js';

// Thin facade preserving the original InputManager public API while delegating
// responsibilities to InputBindings (DOM + normalized events) and
// InteractionController (pathfinding, movement, executing paths).
export class InputManager {
    constructor(game, itemUsageManager) {
        this.game = game;
        this.itemUsageManager = itemUsageManager;

    // Pass a key handler so path execution and exit handling route through
    // this InputManager.handleKeyPress (allows tests to spy on it). Also pass
    // an exit handler so double-tap exit logic can call back into the facade
    // and be observable by tests.
    this.interaction = new InteractionController(game, itemUsageManager, (ev) => this.handleKeyPress(ev), (x, y) => this.handleExitTap(x, y));
        this.bindings = new InputBindings(game, {
            // Route input bindings through the facade so tests and callers
            // spying on InputManager.handleTap/handleKeyPress observe events.
            handleTap: (x, y) => this.handleTap(x, y),
            handleKeyPress: (ev) => this.handleKeyPress(ev)
        }, (sx, sy) => this.interaction.convertScreenToGrid(sx, sy));
    }

    setupControls() { this.bindings.setupControls(); }
    setupTouchControls() { this.bindings.setupTouchControls && this.bindings.setupTouchControls(); }

    // Re-export commonly-used methods/fields so other modules/tests keep working
    handleTap(screenX, screenY) { return this.interaction.handleTap(screenX, screenY); }
    handleKeyPress(event) { return this.interaction.handleKeyPress(event); }
    findPath(startX, startY, targetX, targetY) { return this.interaction.findPath(startX, startY, targetX, targetY); }
    executePath(path) { return this.interaction.executePath(path); }
    cancelPathExecution() { return this.interaction.cancelPathExecution(); }
    addShackAtPlayerPosition() { return this.interaction.addShackAtPlayerPosition && this.interaction.addShackAtPlayerPosition(); }
    convertScreenToGrid(x, y) { return this.interaction.convertScreenToGrid(x, y); }
    // Keep a facade method that tests can spy on. Delegate the actual
    // behavior to the controller's performExitTap to avoid recursion.
    handleExitTap(x, y) { this.interaction.performExitTap(x, y); return; }

    // Expose some internal state used by tests/legacy code
    get isExecutingPath() { return this.interaction.isExecutingPath; }
    set isExecutingPath(v) { this.interaction.isExecutingPath = v; }
    get currentPathSequence() { return this.interaction.currentPathSequence; }
    set currentPathSequence(v) { this.interaction.currentPathSequence = v; }
    get currentPathSequenceFallback() { return this.interaction.currentPathSequenceFallback; }
    set currentPathSequenceFallback(v) { this.interaction.currentPathSequenceFallback = v; }
}
