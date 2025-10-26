import { InputCoordinator } from './InputCoordinator.js';
import { InputUIHandler } from '../ui/InputUIHandler.js';

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
    constructor(game, inventoryService) {
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

    setupControls() {
        this.coordinator.setupControls();
        this.uiHandler.initialize();
    }

    destroy() {
        this.coordinator.destroy();
        this.uiHandler.destroy();
    }

    // ========================================
    // DELEGATE METHODS - Forward to Coordinator
    // ========================================

    handleTap(screenX, screenY) {
        return this.coordinator.handleTap(screenX, screenY);
    }

    handleKeyPress(event) {
        return this.coordinator.handleKeyPress(event);
    }

    executeMovementOrInteraction(gridCoords) {
        return this.coordinator.executeMovementOrInteraction(gridCoords);
    }

    performExitTap(exitX, exitY) {
        return this.coordinator.performExitTap(exitX, exitY);
    }

    handleExitTap(x, y) {
        return this.coordinator.handleExitTap(x, y);
    }

    getTileType(tile) {
        return this.coordinator.getTileType(tile);
    }

    convertScreenToGrid(screenX, screenY) {
        return this.coordinator.convertScreenToGrid(screenX, screenY);
    }

    isTileInteractive(x, y) {
        return this.coordinator.isTileInteractive(x, y);
    }

    // ========================================
    // LEGACY COMPATIBILITY
    // ========================================

    get isExecutingPath() {
        return this.coordinator.isExecutingPath;
    }

    cancelPathExecution() {
        return this.coordinator.cancelPathExecution();
    }

    findPath(startX, startY, targetX, targetY) {
        return this.coordinator.findPath(startX, startY, targetX, targetY);
    }

    executePath(path) {
        return this.coordinator.executePath(path);
    }

    addShackAtPlayerPosition() {
        return this.coordinator.addShackAtPlayerPosition();
    }

    setupTouchControls() {
        return this.coordinator.setupTouchControls();
    }
}
