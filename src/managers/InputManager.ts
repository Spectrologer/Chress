import { InputController } from '@controllers/InputController';
import type { GameContext } from '@core/context';
import type { InventoryService } from './inventory/InventoryService';
import type { AnimationSequence } from '@core/AnimationScheduler';

interface GridCoords {
    x: number;
    y: number;
}

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
    private game: GameContext;
    private inventoryService: InventoryService;
    private controller: InputController;

    constructor(game: GameContext, inventoryService: InventoryService) {
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
    handleTap(screenX: number, screenY: number): void {
        return this.controller.handleTap(screenX, screenY);
    }

    handleKeyPress(event: KeyboardEvent): void {
        // Direct controller call
        return this.controller.handleKeyPress(event);
    }

    findPath(startX: number, startY: number, targetX: number, targetY: number): string[] | null {
        return this.controller.findPath(startX, startY, targetX, targetY);
    }

    executePath(path: string[]): void {
        return this.controller.executePath(path);
    }

    cancelPathExecution(): void {
        return this.controller.cancelPathExecution();
    }

    addShackAtPlayerPosition(): null {
        return this.controller.addShackAtPlayerPosition();
    }

    convertScreenToGrid(x: number, y: number): GridCoords {
        return this.controller.convertScreenToGrid(x, y);
    }

    handleExitTap(x: number, y: number): void {
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

    get currentPathSequence(): AnimationSequence | null {
        return this.controller.pathfindingController.getCurrentPathSequence() as unknown as AnimationSequence | null;
    }

    set currentPathSequence(v: AnimationSequence | null) {
        this.controller.pathfindingController.setCurrentPathSequence(v);
    }

    get currentPathSequenceFallback(): NodeJS.Timeout | null {
        return this.controller.pathfindingController.getCurrentPathSequenceFallback();
    }

    set currentPathSequenceFallback(v: NodeJS.Timeout | null) {
        this.controller.pathfindingController.setCurrentPathSequenceFallback(v);
    }
}
