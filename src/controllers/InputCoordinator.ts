import { TILE_TYPES } from '@core/constants/index';
import { getExitDirection } from '@core/utils/TransitionUtils';
import { getDeltaToDirection, getOffset, isAdjacent } from '@core/utils/DirectionUtils';
import audioManager from '@utils/AudioManager';
import { GestureDetector } from './GestureDetector';
import { PathfindingController } from './PathfindingController';
import { KeyboardHandler } from './KeyboardHandler';
import { InputStateManager } from './InputStateManager';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { TileRegistry } from '@core/TileRegistry';
import { getTileType, isTileObject } from '@utils/TileUtils';
import { Position } from '@core/Position';
import type { GameContext } from '@core/GameContext';
import type { InventoryService } from '@managers/inventory/InventoryService';

interface GridCoords {
    x: number;
    y: number;
}

interface TapEvent {
    gridCoords: GridCoords;
    screenX: number;
    screenY: number;
    handled: boolean;
}

interface KeyPressResult {
    type: 'cancel_path' | 'movement';
    newX?: number;
    newY?: number;
    currentPos?: Position;
}

interface PointerResult {
    type: 'tap' | 'swipe';
    clientX?: number;
    clientY?: number;
    direction?: string;
}

/**
 * InputCoordinator - Thin coordination layer for input management
 *
 * This coordinator:
 * - Initializes and coordinates GestureDetector, PathfindingController, KeyboardHandler
 * - Delegates state queries to InputStateManager
 * - Emits events for UI-related actions instead of directly calling UI methods
 * - Handles core movement and combat coordination
 */
export class InputCoordinator {
    private game: GameContext;
    private inventoryService: InventoryService;

    // Specialized modules
    public gestureDetector: GestureDetector;
    public pathfindingController: PathfindingController;
    public keyboardHandler: KeyboardHandler;
    public stateManager: InputStateManager;

    // Track accumulated turns during path execution
    private accumulatedTurns: number;

    // Event unsubscribers
    private _unsubscribers: (() => void)[];

    // Bound event listener methods
    private _onPointerDown: (e: PointerEvent) => void;
    private _onPointerMove: (e: PointerEvent) => void;
    private _onPointerUp: (e: PointerEvent) => void;
    private _onPointerCancel: (e: PointerEvent) => void;
    private _onKeyDown: (event: KeyboardEvent) => void;

    constructor(game: GameContext, inventoryService: InventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;

        // Initialize specialized modules
        this.gestureDetector = new GestureDetector(game);
        this.pathfindingController = new PathfindingController(game);
        this.keyboardHandler = new KeyboardHandler(game);
        this.stateManager = new InputStateManager(game);

        // Track accumulated turns during path execution
        this.accumulatedTurns = 0;

        // Set up inter-module communication
        this._unsubscribers = [];
        this._setupModuleCommunication();

        // Bind event listener methods
        this._onPointerDown = this._handlePointerDown.bind(this);
        this._onPointerMove = this._handlePointerMove.bind(this);
        this._onPointerUp = this._handlePointerUp.bind(this);
        this._onPointerCancel = this._handlePointerCancel.bind(this);
        this._onKeyDown = this._handleKeyDown.bind(this);
    }

    // ========================================
    // INITIALIZATION & SETUP
    // ========================================

    private _setupModuleCommunication(): void {
        // Subscribe to key press events from PathfindingController
        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_KEY_PRESS, (event: KeyboardEvent) => {
                this.handleKeyPress(event);
            })
        );

        // Subscribe to exit reached events from PathfindingController
        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_EXIT_REACHED, ({ x, y }: { x: number; y: number }) => {
                this.performExitTap(x, y);
            })
        );

        // Subscribe to path execution events
        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_PATH_STARTED, () => {
                this.accumulatedTurns = 0;
            })
        );

        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_PATH_COMPLETED, () => {
                this._processAccumulatedTurns();
            })
        );

        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_PATH_CANCELLED, () => {
                this._processAccumulatedTurns();
            })
        );

        this.keyboardHandler.setPathExecutionCheckCallback(() => {
            return this.pathfindingController.isExecutingPath;
        });
    }

    setupControls(): void {
        this.gestureDetector.setupListeners(
            this._onPointerDown,
            this._onPointerMove,
            this._onPointerUp,
            this._onPointerCancel
        );
        this.keyboardHandler.setupListeners();
    }

    destroy(): void {
        this._unsubscribers?.forEach(unsub => unsub());
        this._unsubscribers = [];
        this.gestureDetector.destroy();
        this.keyboardHandler.destroy();
    }

    // ========================================
    // GESTURE EVENT INTEGRATION
    // ========================================

    private _handlePointerRelease(result: PointerResult | undefined): void {
        if (!result) return;

        if (result.type === 'tap') {
            this.handleTap(result.clientX!, result.clientY!);
        } else if (result.type === 'swipe') {
            this.handleKeyPress({ key: result.direction!, preventDefault: () => {} } as any);
        }
    }

    private _handlePointerDown(e: PointerEvent): void {
        return (this.gestureDetector as any)._onPointerDown(e);
    }

    private _handlePointerMove(e: PointerEvent): void {
        return (this.gestureDetector as any)._onPointerMove(e);
    }

    private _handlePointerUp(e: PointerEvent): void {
        const result = (this.gestureDetector as any)._onPointerUp(e);
        this._handlePointerRelease(result);
        return result;
    }

    private _handlePointerCancel(e: PointerEvent): void {
        return (this.gestureDetector as any)._onPointerCancel(e);
    }

    private _handleKeyDown(event: KeyboardEvent): void {
        return (this.keyboardHandler as any)._onKeyDown(event);
    }

    // ========================================
    // TAP HANDLING - EMIT EVENTS FOR UI LOGIC
    // ========================================

    handleTap(screenX: number, screenY: number): void {
        // Block input during entrance animation
        if (this.stateManager.isEntranceAnimationActive()) {
            return;
        }

        this.gestureDetector.clearTapTimeout();
        const gridCoords = this.gestureDetector.convertScreenToGrid(screenX, screenY);

        // Emit tap event - let UI handlers decide what to do
        const tapEvent: TapEvent = {
            gridCoords,
            screenX,
            screenY,
            handled: false
        };

        eventBus.emit(EventTypes.INPUT_TAP, tapEvent);

        // If UI handled it, we're done
        if (tapEvent.handled) {
            return;
        }

        const clickedPos = Position.from(gridCoords);
        const clickedTile = clickedPos.getTile(this.game.grid);
        const clickedTileType = this.getTileType(clickedTile);

        // Use enemyCollection to find enemies
        const enemyAtTile = this.game.enemyCollection?.findAt(gridCoords.x, gridCoords.y, true);

        // Show tap feedback - if not on enemy, clear any hold feedback and show transient feedback
        if (!enemyAtTile) {
            this.game?.renderManager?.clearFeedback?.();
            this.game?.renderManager?.showTapFeedback?.(gridCoords.x, gridCoords.y);
        } else {
            // If on enemy and adjacent (will trigger immediate attack), clear feedback
            const playerPos = this.game.player.getPosition();
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx + dy === 1); // Cardinal adjacency only
            if (isAdjacent) {
                this.game?.renderManager?.clearFeedback?.();
            }
            // If not adjacent, leave hold feedback to show attack range preview
        }

        // Check double tap
        const isDoubleTap = this.gestureDetector.handleDoubleTapLogic(gridCoords, screenX, screenY);

        // Play sound
        this._playTapSound(enemyAtTile, isDoubleTap);

        // Handle gameplay-related taps
        this._handleGameplayTap(gridCoords, clickedTileType, isDoubleTap);
    }

    private _playTapSound(enemyAtTile: object | null, isDoubleTap: boolean): void {
        if (enemyAtTile) {
            audioManager.playSound('tap_enemy', { game: this.game as any });
        } else if (isDoubleTap) {
            audioManager.playSound('double_tap', { game: this.game as any });
        } else {
            audioManager.playSound('bloop', { game: this.game as any });
        }
    }

    private _handleGameplayTap(gridCoords: GridCoords, clickedTileType: number | undefined, isDoubleTap: boolean): void {
        const playerPos = this.game.player.getPositionObject();
        const clickedPos = Position.from(gridCoords);

        // Cancel path if different tile clicked
        if (this._shouldCancelPath(clickedPos, playerPos)) {
            return;
        }

        // Single tap on player tile
        if (!isDoubleTap && playerPos.equals(clickedPos)) {
            const currentTile = playerPos.getTile(this.game.grid);
            const currentTileType = getTileType(currentTile);
            const portKind = isTileObject(currentTile) ? (currentTile as any).portKind : null;

            // console.log('[InputCoordinator] Single tap on player tile:', {
            //     currentTileType,
            //     portKind,
            //     isExit: currentTileType === TILE_TYPES.EXIT,
            //     isPort: currentTileType === TILE_TYPES.PORT
            // });

            // Handle EXIT/PORT tiles immediately on single tap
            if (currentTileType === TILE_TYPES.EXIT) {
                this.performExitTap(gridCoords.x, gridCoords.y);
                return;
            } else if (currentTileType === TILE_TYPES.PORT) {
                (this.game.interactionManager as any).zoneManager.handlePortTransition();
                return;
            }

            // Otherwise emit event for radial menu
            // console.log('[InputCoordinator] Emitting INPUT_PLAYER_TILE_TAP event');
            eventBus.emit(EventTypes.INPUT_PLAYER_TILE_TAP, {
                gridCoords,
                tileType: currentTileType,
                portKind
            });
            return;
        }

        // Double tap
        if (isDoubleTap) {
            this._handleDoubleTap(gridCoords, clickedTileType);
            return;
        }

        // Wait for double tap before executing movement
        this.gestureDetector.setTapTimeout(() => {
            this.executeMovementOrInteraction(gridCoords);
        }, 250); // DOUBLE_TAP_DELAY
    }

    private _shouldCancelPath(clickedPos: Position, playerPos: Position): boolean {
        const isClickingDifferentTile = !playerPos.equals(clickedPos);

        if (this.pathfindingController.isExecutingPath && isClickingDifferentTile) {
            this.pathfindingController.cancelPathExecution();
        }

        if (this.pathfindingController.isExecutingPath && !isClickingDifferentTile) {
            if (this.stateManager.hasVerbosePathAnimations() && isClickingDifferentTile) {
                this.pathfindingController.cancelPathExecution();
            }
            return true;
        }

        return false;
    }

    private _handleDoubleTap(gridCoords: GridCoords, clickedTileType: number | undefined): void {
        const playerPos = this.game.player.getPositionObject();
        const clickedPos = Position.from(gridCoords);

        if (clickedTileType === TILE_TYPES.EXIT || clickedTileType === TILE_TYPES.PORT) {
            if (playerPos.equals(clickedPos)) {
                // Trigger transition
                if (clickedTileType === TILE_TYPES.EXIT) {
                    this.performExitTap(gridCoords.x, gridCoords.y);
                } else {
                    (this.game.interactionManager as any).zoneManager.handlePortTransition();
                }
            } else {
                // Path to exit/port
                this.pathfindingController.autoUseNextTransition = (clickedTileType === TILE_TYPES.EXIT) ? 'exit' : 'port';
                this.executeMovementOrInteraction(gridCoords);
            }
        } else {
            // Interact on reach
            this.game.player.setInteractOnReach(gridCoords.x, gridCoords.y);
            this.executeMovementOrInteraction(gridCoords);
        }
    }

    // ========================================
    // TURN ACCUMULATION
    // ========================================

    /**
     * Process accumulated turns after path execution completes
     * This ensures enemies get the correct number of turns equal to player moves
     */
    private _processAccumulatedTurns(): void {
        if (this.accumulatedTurns > 0) {
            // Process exactly the number of turns that accumulated
            for (let i = 0; i < this.accumulatedTurns; i++) {
                this.game.turnManager?.handleTurnCompletion();
            }
            this.accumulatedTurns = 0;
        }
    }

    // ========================================
    // KEY PRESS HANDLING
    // ========================================

    handleKeyPress(event: KeyboardEvent): void {
        // Block user input during entrance animation, but allow synthetic key presses from pathfinding
        if (this.stateManager.isEntranceAnimationActive() && !(event as any)._synthetic) {
            return;
        }

        const result: KeyPressResult | null = this.keyboardHandler.handleKeyPress(event);

        if (!result) return;

        // Cancel path
        if (result.type === 'cancel_path') {
            this.pathfindingController.cancelPathExecution();
            return;
        }

        // Movement
        if (result.type === 'movement') {
            const { newX, newY, currentPos } = result;

            // Combat or movement - use enemyCollection to properly filter living enemies
            const targetPos = new Position(newX!, newY!);
            const enemyAtTarget = this.game.enemyCollection?.findAt(newX!, newY!, true);

            if (enemyAtTarget) {
                // Delegate all combat logic to CombatManager
                this.game.combatManager?.handlePlayerAttack(enemyAtTarget, currentPos);
            } else {
                this.game.incrementBombActions();
                this.game.player.move(newX!, newY!, this.game.gridManager as any, (zoneX: number, zoneY: number, exitSide: string) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, currentPos.x, currentPos.y);
                });
            }

            // Handle turn completion - defer if executing path
            if (this.pathfindingController.isExecutingPath) {
                // Accumulate turns during path execution
                this.accumulatedTurns++;
            } else {
                // Process turn immediately for direct input
                this.game.turnManager?.handleTurnCompletion();
            }

            this.game.updatePlayerPosition();
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
    }

    // ========================================
    // MOVEMENT & INTERACTION
    // ========================================

    executeMovementOrInteraction(gridCoords: GridCoords): void {
        const playerPos = this.game.player.getPositionObject();
        const clickedPos = Position.from(gridCoords);
        const handled = this.game.interactionManager.handleTap(gridCoords);

        if (!handled) {
            // Disable autopathing entirely when enemies are present
            const enemiesExist = this.stateManager.hasLivingEnemies();

            if (enemiesExist) {
                // Only allow single-step movement when enemies exist
                if (playerPos.equals(clickedPos)) return;

                // Choose cardinal direction using DirectionUtils
                const { dx, dy } = playerPos.delta(clickedPos);
                const stepKey = getDeltaToDirection(dx, dy);
                if (!stepKey) return;

                // Calculate step position using Position
                const stepPos = playerPos.move(stepKey);

                if (this.game.player.isWalkable(stepPos.x, stepPos.y, this.game.grid, playerPos.x, playerPos.y)) {
                    this.executePath([stepKey]);
                }
                return;
            }

            // Auto-path or direct movement (only when no enemies)
            const isInteractive = this.isTileInteractive(clickedPos.x, clickedPos.y);

            if (isInteractive && !playerPos.isAdjacentTo(clickedPos)) {
                const adjacentTile = this.pathfindingController.findNearestWalkableAdjacent(clickedPos.x, clickedPos.y);
                if (adjacentTile) {
                    const path = this.findPath(playerPos.x, playerPos.y, adjacentTile.x, adjacentTile.y);
                    if (path?.length > 0) {
                        this.executePath(path);
                    }
                }
            } else {
                const path = this.findPath(playerPos.x, playerPos.y, clickedPos.x, clickedPos.y);
                if (path?.length > 0) {
                    this.executePath(path);
                }
            }
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    getTileType(tile: number | object): number | undefined {
        return getTileType(tile as any);
    }

    convertScreenToGrid(screenX: number, screenY: number): GridCoords {
        return this.gestureDetector.convertScreenToGrid(screenX, screenY);
    }

    isTileInteractive(x: number, y: number): boolean {
        const pos = new Position(x, y);
        const tile = pos.getTile(this.game.grid);
        if (!tile) return false;

        const tileType = this.getTileType(tile);
        return TileRegistry.isInteractive(tileType as number);
    }

    performExitTap(exitX: number, exitY: number): void {
        const direction = getExitDirection(exitX, exitY);
        if (direction) {
            const ev = { key: direction, preventDefault: () => {}, _synthetic: true } as any;
            this.handleKeyPress(ev as KeyboardEvent);
        }
    }

    handleExitTap(x: number, y: number): void {
        this.performExitTap(x, y);
        return;  // For test compatibility
    }

    // ========================================
    // LEGACY COMPATIBILITY
    // ========================================

    get isExecutingPath(): boolean {
        return this.pathfindingController.isExecutingPath;
    }

    cancelPathExecution(): void {
        this.pathfindingController.cancelPathExecution();
    }

    findPath(startX: number, startY: number, targetX: number, targetY: number): string[] | null {
        return this.pathfindingController.findPath(startX, startY, targetX, targetY);
    }

    executePath(path: string[]): void {
        this.pathfindingController.executePath(path);
    }

    addShackAtPlayerPosition(): null {
        return null;
    }

    setupTouchControls(): void {
        // No-op - pointer events handle all
    }
}
