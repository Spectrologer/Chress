import { InputCoordinator } from './InputCoordinator';
import { InputUIHandler } from '@ui/InputUIHandler';
import { GestureDetector } from './GestureDetector';
import { PathfindingController } from './PathfindingController';
import { KeyboardHandler } from './KeyboardHandler';
import { InputStateManager } from './InputStateManager';
import type { GameContext } from '@core/context';
import type { InventoryService } from '@managers/inventory/InventoryService';

interface GridCoords {
    x: number;
    y: number;
}

/**
 * InputController - Compatibility wrapper for the new input architecture
 *
 * This class maintains backward compatibility with existing code while delegating
 * all functionality to the new architecture:
 * - InputCoordinator: Core input coordination
 * - InputStateManager: State tracking (managed by coordinator)
 * - InputUIHandler: UI-specific input handling
 *
 * Previous responsibilities have been split:
 * - GestureDetector: Pointer events and gesture recognition
 * - PathfindingController: Path finding and execution
 * - KeyboardHandler: Keyboard input processing
 * - InputStateManager: State queries and visual feedback
 * - InputUIHandler: UI interactions (signs, shovel mode, stats, charges, radial menu)
 */
export class InputController {
    private game: GameContext;
    private inventoryService: InventoryService;

    // Architecture components
    public coordinator: InputCoordinator;
    public uiHandler: InputUIHandler;

    // Exposed submodules for backward compatibility
    public gestureDetector: GestureDetector;
    public pathfindingController: PathfindingController;
    public keyboardHandler: KeyboardHandler;
    public stateManager: InputStateManager;

    // Visual feedback compatibility
    public lastHighlightedTile: { x: number | null; y: number | null };

    constructor(game: GameContext, inventoryService: InventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;

        // Initialize new architecture components
        this.coordinator = new InputCoordinator(game, inventoryService);
        this.uiHandler = new InputUIHandler(game, inventoryService);

        // Expose submodules for backward compatibility
        this.gestureDetector = this.coordinator.gestureDetector;
        this.pathfindingController = this.coordinator.pathfindingController;
        this.keyboardHandler = this.coordinator.keyboardHandler;
        this.stateManager = this.coordinator.stateManager;

        // Maintain visual feedback compatibility
        this.lastHighlightedTile = this.stateManager.lastHighlightedTile;
    }

    // ========================================
    // INITIALIZATION & SETUP
    // ========================================

    setupControls(): void {
        this.coordinator.setupControls();
        this.uiHandler.initialize();
    }

    destroy(): void {
        this.coordinator.destroy();
        this.uiHandler.destroy();
    }

    // ========================================
    // DELEGATE METHODS - Forward to Coordinator
    // ========================================

    handleTap(screenX: number, screenY: number): void {
        return this.coordinator.handleTap(screenX, screenY);
    }

    handleKeyPress(event: KeyboardEvent): void {
        return this.coordinator.handleKeyPress(event);
    }

    executeMovementOrInteraction(gridCoords: GridCoords): void {
        return this.coordinator.executeMovementOrInteraction(gridCoords);
    }

    performExitTap(exitX: number, exitY: number): void {
        return this.coordinator.performExitTap(exitX, exitY);
    }

    handleExitTap(x: number, y: number): void {
        return this.coordinator.handleExitTap(x, y);
    }

    getTileType(tile: number | object): number | undefined {
        return this.coordinator.getTileType(tile);
    }

    convertScreenToGrid(screenX: number, screenY: number): GridCoords {
        return this.coordinator.convertScreenToGrid(screenX, screenY);
    }

    isTileInteractive(x: number, y: number): boolean {
        return this.coordinator.isTileInteractive(x, y);
    }

    // ========================================
    // LEGACY COMPATIBILITY
    // ========================================

    get isExecutingPath(): boolean {
        return this.coordinator.isExecutingPath;
    }

    cancelPathExecution(): void {
        return this.coordinator.cancelPathExecution();
    }

    findPath(startX: number, startY: number, targetX: number, targetY: number): string[] | null {
        return this.coordinator.findPath(startX, startY, targetX, targetY);
    }

    executePath(path: string[]): void {
        return this.coordinator.executePath(path);
    }

    addShackAtPlayerPosition(): null {
        return this.coordinator.addShackAtPlayerPosition();
    }

    setupTouchControls(): void {
        return this.coordinator.setupTouchControls();
    }
}
