import { InputController } from '../controllers/InputController.js';

/**
 * InputManager - Thin facade for backward compatibility
 *
 * Previously delegated to three separate systems:
 * - InputBindings (DOM event setup)
 * - InteractionController (pathfinding, movement)
 * - PointerInput (pointer event handling)
 *
 * Now delegates to a single unified InputController that handles all input
 * responsibilities with pointer events as the primary input method.
 */
export class InputManager {
    constructor(game, inventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;

        // Create controller with callbacks that route through this facade
        // This allows tests to spy on InputManager methods while avoiding recursion
        this.controller = new InputController(
            game,
            inventoryService,
            (ev) => this._internalHandleKeyPress(ev),
            (x, y) => this._internalHandleExitTap(x, y)
        );
    }

    setupControls() { this.controller.setupControls(); }
    setupTouchControls() { this.controller.setupTouchControls(); }
    destroy() { this.controller.destroy(); }

    // Public API methods that can be spied on by tests
    handleTap(screenX, screenY) { return this.controller.handleTap(screenX, screenY); }

    handleKeyPress(event) {
        // Call the controller's actual implementation, not through the callback
        return this.controller.handleKeyPress(event);
    }

    findPath(startX, startY, targetX, targetY) { return this.controller.findPath(startX, startY, targetX, targetY); }
    executePath(path) { return this.controller.executePath(path); }
    cancelPathExecution() { return this.controller.cancelPathExecution(); }
    addShackAtPlayerPosition() { return this.controller.addShackAtPlayerPosition(); }
    convertScreenToGrid(x, y) { return this.controller.convertScreenToGrid(x, y); }

    handleExitTap(x, y) {
        // Call the controller's actual implementation
        return this.controller.handleExitTap(x, y);
    }

    // Internal methods called by controller callbacks (avoid infinite recursion)
    _internalHandleKeyPress(event) {
        // This is called by the controller when executing paths
        // We want to route it back through handleKeyPress so spies work
        return this.handleKeyPress(event);
    }

    _internalHandleExitTap(x, y) {
        // This is called by the controller when handling exits
        // We want to route it back through handleExitTap so spies work
        return this.handleExitTap(x, y);
    }

    // Expose some internal state used by tests/legacy code
    get isExecutingPath() { return this.controller.isExecutingPath; }
    set isExecutingPath(v) { this.controller.isExecutingPath = v; }
    get currentPathSequence() { return this.controller.currentPathSequence; }
    set currentPathSequence(v) { this.controller.currentPathSequence = v; }
    get currentPathSequenceFallback() { return this.controller.currentPathSequenceFallback; }
    set currentPathSequenceFallback(v) { this.controller.currentPathSequenceFallback = v; }
}
