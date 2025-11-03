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
    private game: any;
    private inventoryService: any;
    private controller: InputController;

    constructor(game: any, inventoryService: any) {
        this.game = game;
        this.inventoryService = inventoryService;

        // Create InputController
        this.controller = new InputController(game, inventoryService);
    }

    setupControls(): void {
        this.controller.setupControls();
    }

    setupTouchControls(): void {
        this.controller.setupTouchControls();
    }

    destroy(): void {
        this.controller.destroy();
    }

    // Public API for tests
    handleTap(screenX: number, screenY: number): any {
        return this.controller.handleTap(screenX, screenY);
    }

    handleKeyPress(event: KeyboardEvent): any {
        // Direct controller call
        return this.controller.handleKeyPress(event);
    }

    findPath(startX: number, startY: number, targetX: number, targetY: number): any {
        return this.controller.findPath(startX, startY, targetX, targetY);
    }

    executePath(path: any): any {
        return this.controller.executePath(path);
    }

    cancelPathExecution(): any {
        return this.controller.cancelPathExecution();
    }

    addShackAtPlayerPosition(): any {
        return this.controller.addShackAtPlayerPosition();
    }

    convertScreenToGrid(x: number, y: number): any {
        return this.controller.convertScreenToGrid(x, y);
    }

    handleExitTap(x: number, y: number): any {
        // Direct controller call
        return this.controller.handleExitTap(x, y);
    }

    // Expose state for tests/legacy
    get isExecutingPath(): boolean {
        return this.controller.pathfindingController.isExecutingPath;
    }

    set isExecutingPath(v: boolean) {
        this.controller.pathfindingController.isExecutingPath = v;
    }

    get currentPathSequence(): any {
        return this.controller.pathfindingController.currentPathSequence;
    }

    set currentPathSequence(v: any) {
        this.controller.pathfindingController.currentPathSequence = v;
    }

    get currentPathSequenceFallback(): any {
        return this.controller.pathfindingController.currentPathSequenceFallback;
    }

    set currentPathSequenceFallback(v: any) {
        this.controller.pathfindingController.currentPathSequenceFallback = v;
    }
}
