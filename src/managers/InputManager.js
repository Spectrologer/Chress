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

        // Create InputController
        this.controller = new InputController(game, inventoryService);
    }

    setupControls() { this.controller.setupControls(); }
    setupTouchControls() { this.controller.setupTouchControls(); }
    destroy() { this.controller.destroy(); }

    // Public API for tests
    handleTap(screenX, screenY) { return this.controller.handleTap(screenX, screenY); }

    handleKeyPress(event) {
        // Direct controller call
        return this.controller.handleKeyPress(event);
    }

    findPath(startX, startY, targetX, targetY) { return this.controller.findPath(startX, startY, targetX, targetY); }
    executePath(path) { return this.controller.executePath(path); }
    cancelPathExecution() { return this.controller.cancelPathExecution(); }
    addShackAtPlayerPosition() { return this.controller.addShackAtPlayerPosition(); }
    convertScreenToGrid(x, y) { return this.controller.convertScreenToGrid(x, y); }

    handleExitTap(x, y) {
        // Direct controller call
        return this.controller.handleExitTap(x, y);
    }

    // Expose state for tests/legacy
    get isExecutingPath() { return this.controller.pathfindingController.isExecutingPath; }
    set isExecutingPath(v) { this.controller.pathfindingController.isExecutingPath = v; }
    get currentPathSequence() { return this.controller.pathfindingController.currentPathSequence; }
    set currentPathSequence(v) { this.controller.pathfindingController.currentPathSequence = v; }
    get currentPathSequenceFallback() { return this.controller.pathfindingController.currentPathSequenceFallback; }
    set currentPathSequenceFallback(v) { this.controller.pathfindingController.currentPathSequenceFallback = v; }
}
