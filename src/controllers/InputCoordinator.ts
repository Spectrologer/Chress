import { TILE_TYPES } from '@core/constants/index';
import { getExitDirection } from '@core/utils/TransitionUtils';
import { getDeltaToDirection, isAdjacent } from '@core/utils/DirectionUtils';
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
import { ContentRegistry } from '@core/ContentRegistry';
import { isInChessMode } from '@core/GameModeManager';
import type { GameContext } from '@core/context';
import type { InventoryService } from '@managers/inventory/InventoryService';
import type { TileObject } from '@core/SharedTypes';
import type { Enemy } from '@entities/Enemy';

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
            this.handleKeyPress({ key: result.direction!, preventDefault: () => {} } as KeyboardEvent);
        }
    }

    private _handlePointerDown(e: PointerEvent): void {
        // Completely block all pointer input during enemy turns or entrance animation
        // Early return prevents any gesture tracking from starting
        if (!this.game.isPlayerTurn || this.stateManager.isEntranceAnimationActive()) {
            return;
        }
        return (this.gestureDetector as unknown as { _onPointerDown: (e: PointerEvent) => void })._onPointerDown(e);
    }

    private _handlePointerMove(e: PointerEvent): void {
        // Allow pointer move for visual feedback, but it won't trigger actions
        return (this.gestureDetector as unknown as { _onPointerMove: (e: PointerEvent) => void })._onPointerMove(e);
    }

    private _handlePointerUp(e: PointerEvent): PointerResult | undefined {
        // Completely block all pointer input during enemy turns or entrance animation
        // This prevents tap timeouts from being set and prevents gesture completion
        if (!this.game.isPlayerTurn || this.stateManager.isEntranceAnimationActive()) {
            // Clear any pending tap timeouts to prevent queued actions
            this.gestureDetector.clearTapTimeout();
            // Clear active pointer tracking to reset gesture state
            (this.gestureDetector as any).activePointers?.clear();
            return;
        }
        const result = (this.gestureDetector as unknown as { _onPointerUp: (e: PointerEvent) => PointerResult | undefined })._onPointerUp(e);
        this._handlePointerRelease(result);
        return result;
    }

    private _handlePointerCancel(e: PointerEvent): void {
        return (this.gestureDetector as unknown as { _onPointerCancel: (e: PointerEvent) => void })._onPointerCancel(e);
    }

    private _handleKeyDown(event: KeyboardEvent): void {
        return (this.keyboardHandler as unknown as { _onKeyDown: (e: KeyboardEvent) => void })._onKeyDown(event);
    }

    // ========================================
    // TAP HANDLING - EMIT EVENTS FOR UI LOGIC
    // ========================================

    handleTap(screenX: number, screenY: number): void {
        // Block input during entrance animation
        if (this.stateManager.isEntranceAnimationActive()) {
            this.gestureDetector.clearTapTimeout();
            return;
        }

        // Block input during enemy turns
        if (!this.game.isPlayerTurn) {
            this.gestureDetector.clearTapTimeout();
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
            audioManager.playSound('tap_enemy', { game: this.game });
        } else if (isDoubleTap) {
            audioManager.playSound('double_tap', { game: this.game });
        } else {
            audioManager.playSound('bloop', { game: this.game });
        }
    }

    private _handleGameplayTap(gridCoords: GridCoords, clickedTileType: number | undefined, isDoubleTap: boolean): void {
        // Chess Mode: Handle unit selection and movement
        if (isInChessMode(this.game)) {
            this._handleChessModeClick(gridCoords);
            return;
        }

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
            const portKind = isTileObject(currentTile) ? (currentTile as TileObject).portKind : null;

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
                this.game.interactionManager?.zoneManager.handlePortTransition();
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
            // CRITICAL: Re-check that it's still player turn before executing
            // This prevents queued actions from executing during enemy turns
            // (player could have moved and enemy turns could have started during the 250ms delay)
            if (!this.game.isPlayerTurn || this.stateManager.isEntranceAnimationActive()) {
                // Clear the timeout reference to prevent any further execution
                this.gestureDetector.clearTapTimeout();
                return;
            }
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

    /**
     * Check if a tile type is an NPC that can be interacted with
     * @param tileType - The tile type to check
     * @returns True if the tile is an NPC
     */
    private _isNPCTile(tileType: number | undefined): boolean {
        if (tileType === undefined) {
            return false;
        }
        // Check ContentRegistry for dynamic NPCs
        const npcConfig = ContentRegistry.getNPCByTileType(tileType);
        if (npcConfig) {
            return true;
        }
        // Also check TileRegistry for hardcoded NPCs
        return TileRegistry.NPC_TYPES.includes(tileType);
    }

    /**
     * Check if a tile type is a statue that can be interacted with
     * @param tileType - The tile type to check
     * @returns True if the tile is a statue
     */
    private _isStatueTile(tileType: number | undefined): boolean {
        if (tileType === undefined) {
            return false;
        }
        return TileRegistry.ALL_STATUE_TYPES.includes(tileType);
    }

    /**
     * Check if two positions are adjacent (including diagonals)
     * @param pos1 - First position
     * @param pos2 - Second position
     * @returns True if positions are adjacent
     */
    private _isAdjacentTo(pos1: Position, pos2: Position): boolean {
        const dx = Math.abs(pos1.x - pos2.x);
        const dy = Math.abs(pos1.y - pos2.y);
        return isAdjacent(dx, dy);
    }

    /**
     * Force pathfinding to an interactive tile, bypassing enemy checks
     * Used for double-click interactions with NPCs and terrain
     * @param gridCoords - Target coordinates
     */
    private _forcePathToInteractive(gridCoords: GridCoords): void {
        const playerPos = this.game.player.getPositionObject();
        const clickedPos = Position.from(gridCoords);

        // Find nearest walkable adjacent tile to the target
        const adjacentTile = this.pathfindingController.findNearestWalkableAdjacent(clickedPos.x, clickedPos.y);
        if (adjacentTile) {
            const path = this.findPath(playerPos.x, playerPos.y, adjacentTile.x, adjacentTile.y);
            if (path?.length > 0) {
                this.executePath(path);
            }
        }
    }

    private _handleDoubleTap(gridCoords: GridCoords, clickedTileType: number | undefined): void {
        const playerPos = this.game.player.getPositionObject();
        const clickedPos = Position.from(gridCoords);

        // Handle exits and ports (existing behavior)
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
            return;
        }

        // Handle NPCs - talk immediately if adjacent, otherwise path and talk
        if (this._isNPCTile(clickedTileType)) {
            if (this._isAdjacentTo(playerPos, clickedPos)) {
                // Already adjacent - talk immediately using public triggerInteractAt
                this.game.interactionManager?.triggerInteractAt(gridCoords);
            } else {
                // Not adjacent - path to NPC directly (bypassing enemy check)
                this.game.player.setInteractOnReach(gridCoords.x, gridCoords.y);
                this._forcePathToInteractive(gridCoords);
            }
            return;
        }

        // Handle statues - interact immediately if adjacent, otherwise path and interact
        if (this._isStatueTile(clickedTileType)) {
            if (this._isAdjacentTo(playerPos, clickedPos)) {
                // Already adjacent - interact immediately using public triggerInteractAt
                this.game.interactionManager?.triggerInteractAt(gridCoords);
            } else {
                // Not adjacent - path to statue directly (bypassing enemy check)
                this.game.player.setInteractOnReach(gridCoords.x, gridCoords.y);
                this._forcePathToInteractive(gridCoords);
            }
            return;
        }

        // Handle choppable/breakable terrain - interact if adjacent, otherwise path and interact
        if (clickedTileType !== undefined &&
            (TileRegistry.isChoppable(clickedTileType) || TileRegistry.isBreakable(clickedTileType))) {
            if (this._isAdjacentTo(playerPos, clickedPos)) {
                // Already adjacent - chop/smash immediately using public triggerInteractAt
                this.game.interactionManager?.triggerInteractAt(gridCoords);
            } else {
                // Not adjacent - path to object directly (bypassing enemy check)
                this.game.player.setInteractOnReach(gridCoords.x, gridCoords.y);
                this._forcePathToInteractive(gridCoords);
            }
            return;
        }

        // Default behavior - interact on reach for other interactive objects
        this.game.player.setInteractOnReach(gridCoords.x, gridCoords.y);
        this.executeMovementOrInteraction(gridCoords);
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
            // Skip processing turns during entrance animation
            if (this.stateManager.isEntranceAnimationActive()) {
                this.accumulatedTurns = 0;
                return;
            }

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

        // Block user input during enemy turns, but allow synthetic key presses from pathfinding
        if (!this.game.isPlayerTurn && !(event as any)._synthetic) {
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
        // Block execution if not player turn (safety check for delayed/queued calls)
        if (!this.game.isPlayerTurn || this.stateManager.isEntranceAnimationActive()) {
            return;
        }

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
    // CHESS MODE
    // ========================================

    /**
     * Handle clicking in chess mode - select units or move selected unit
     */
    private _handleChessModeClick(gridCoords: GridCoords): void {
        const { x, y } = gridCoords;
        const clickedEnemy = this.game.enemyCollection?.findAt(x, y, true) as Enemy | null;

        console.log('[Chess] Click at', x, y, 'clicked unit:', clickedEnemy?.enemyType, 'team:', clickedEnemy?.team, 'selectedUnit:', this.game.selectedUnit?.enemyType);

        // If we have a unit selected
        if (this.game.selectedUnit) {
            // Clicking on the same unit - deselect
            if (clickedEnemy === this.game.selectedUnit) {
                console.log('[Chess] Deselecting unit');
                this.game.selectedUnit = null;
                this.game.gameMode.chess.selectedUnit = null;
                return;
            }

            // Check if clicked position is a valid move
            const validMoves = this._getValidMovesForUnit(this.game.selectedUnit);
            console.log('[Chess] Valid moves for', this.game.selectedUnit.enemyType, ':', validMoves);
            const isValidMove = validMoves.some(move => move.x === x && move.y === y);

            if (isValidMove) {
                console.log('[Chess] Moving unit to', x, y);
                // Move the selected unit to the clicked position
                this._moveSelectedUnit(x, y);
            } else {
                console.log('[Chess] Not a valid move');
                // Not a valid move - try to select the clicked unit instead (if friendly)
                if (clickedEnemy && clickedEnemy.team === 'player') {
                    console.log('[Chess] Selecting different unit:', clickedEnemy.enemyType);
                    this.game.selectedUnit = clickedEnemy;
                    this.game.gameMode.chess.selectedUnit = clickedEnemy;
                } else {
                    // Clicked on empty space or enemy - deselect
                    console.log('[Chess] Deselecting (clicked empty or enemy)');
                    this.game.selectedUnit = null;
                    this.game.gameMode.chess.selectedUnit = null;
                }
            }
        } else {
            // No unit selected - try to select a friendly unit
            if (clickedEnemy && clickedEnemy.team === 'player') {
                console.log('[Chess] Selecting unit:', clickedEnemy.enemyType);
                this.game.selectedUnit = clickedEnemy;
                this.game.gameMode.chess.selectedUnit = clickedEnemy;
            } else {
                console.log('[Chess] No friendly unit at this position');
            }
        }
    }

    /**
     * Move the selected unit to the target position
     */
    private _moveSelectedUnit(targetX: number, targetY: number): void {
        if (!this.game.selectedUnit) return;

        const selectedUnit = this.game.selectedUnit;
        const targetEnemy = this.game.enemyCollection?.findAt(targetX, targetY, true) as Enemy | null;

        // If there's an enemy at the target, it will be captured
        if (targetEnemy) {
            // Remove the captured enemy
            this.game.enemyCollection?.remove(targetEnemy);

            // Check for checkmate (king captured)
            if (targetEnemy.enemyType === 'black_lizardo') {
                console.log('[Chess] Player wins! Enemy king captured.');
                // TODO: Show victory message and return to normal mode
            }
        }

        // Move the selected unit
        selectedUnit.x = targetX;
        selectedUnit.y = targetY;

        // Deselect the unit
        this.game.selectedUnit = null;
        this.game.gameMode.chess.selectedUnit = null;

        // End the player's turn (enemy turn will start)
        this.game.turnManager?.handleTurnCompletion();
    }

    /**
     * Get all valid moves for a unit based on its movement pattern
     */
    _getValidMovesForUnit(unit: Enemy | null): Array<{ x: number; y: number }> {
        if (!unit) return [];

        const validMoves: Array<{ x: number; y: number }> = [];
        const { x, y } = unit;
        const grid = this.game.grid;

        // Get the base enemy type (remove 'black_' prefix if present)
        const baseType = unit.enemyType.replace('black_', '');
        console.log('[Chess] Getting valid moves for', unit.enemyType, '(base:', baseType, ') at', x, y, 'team:', unit.team);

        switch (baseType) {
            case 'lizardo': // King - 1 square in any direction
                this._addMovesInDirections(validMoves, x, y, [
                    [0, -1], [0, 1], [-1, 0], [1, 0],  // Cardinal
                    [-1, -1], [-1, 1], [1, -1], [1, 1]  // Diagonal
                ], 1, unit.team);
                break;

            case 'lizardeaux': // Rook - straight lines
                this._addMovesInDirections(validMoves, x, y, [
                    [0, -1], [0, 1], [-1, 0], [1, 0]  // Cardinal only
                ], 99, unit.team);
                break;

            case 'zard': // Bishop - diagonals
                this._addMovesInDirections(validMoves, x, y, [
                    [-1, -1], [-1, 1], [1, -1], [1, 1]  // Diagonal only
                ], 99, unit.team);
                break;

            case 'lazerd': // Queen - any direction
                this._addMovesInDirections(validMoves, x, y, [
                    [0, -1], [0, 1], [-1, 0], [1, 0],  // Cardinal
                    [-1, -1], [-1, 1], [1, -1], [1, 1]  // Diagonal
                ], 99, unit.team);
                break;

            case 'lizord': // Knight - L-shaped
                this._addKnightMoves(validMoves, x, y, unit.team);
                break;

            case 'lizardy': // Pawn
                this._addPawnMoves(validMoves, x, y, unit.team);
                break;
        }

        return validMoves;
    }

    /**
     * Add moves in specified directions up to maxDistance
     */
    private _addMovesInDirections(
        validMoves: Array<{ x: number; y: number }>,
        startX: number,
        startY: number,
        directions: Array<[number, number]>,
        maxDistance: number,
        team: 'player' | 'enemy'
    ): void {
        const grid = this.game.grid;

        for (const [dx, dy] of directions) {
            for (let dist = 1; dist <= maxDistance; dist++) {
                const newX = startX + dx * dist;
                const newY = startY + dy * dist;

                // Check bounds
                if (newX < 0 || newX >= grid[0].length || newY < 0 || newY >= grid.length) {
                    break;
                }

                // Check for walls
                if (grid[newY][newX] === TILE_TYPES.WALL) {
                    break;
                }

                // Check for friendly/enemy units
                const unitAtPos = this.game.enemyCollection?.findAt(newX, newY, true) as Enemy | null;
                if (unitAtPos) {
                    // Can capture enemy units
                    if (unitAtPos.team !== team) {
                        validMoves.push({ x: newX, y: newY });
                    }
                    // Stop - can't move through units
                    break;
                }

                // Empty square - valid move
                validMoves.push({ x: newX, y: newY });
            }
        }
    }

    /**
     * Add knight (L-shaped) moves
     */
    private _addKnightMoves(
        validMoves: Array<{ x: number; y: number }>,
        startX: number,
        startY: number,
        team: 'player' | 'enemy'
    ): void {
        const grid = this.game.grid;
        const knightMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];

        for (const [dx, dy] of knightMoves) {
            const newX = startX + dx;
            const newY = startY + dy;

            // Check bounds
            if (newX < 0 || newX >= grid[0].length || newY < 0 || newY >= grid.length) {
                continue;
            }

            // Check for walls
            if (grid[newY][newX] === TILE_TYPES.WALL) {
                continue;
            }

            // Check for units
            const unitAtPos = this.game.enemyCollection?.findAt(newX, newY, true) as Enemy | null;
            if (unitAtPos) {
                // Can only move to enemy positions (capture)
                if (unitAtPos.team !== team) {
                    validMoves.push({ x: newX, y: newY });
                }
            } else {
                // Empty square - valid move
                validMoves.push({ x: newX, y: newY });
            }
        }
    }

    /**
     * Add pawn moves (forward movement, diagonal captures)
     */
    private _addPawnMoves(
        validMoves: Array<{ x: number; y: number }>,
        startX: number,
        startY: number,
        team: 'player' | 'enemy'
    ): void {
        const grid = this.game.grid;
        // Player pawns move up (negative Y), enemy pawns move down (positive Y)
        const direction = team === 'player' ? -1 : 1;

        // Check if pawn is on starting row (row 7 for player, row 2 for enemy in a 10x10 grid)
        const startingRow = team === 'player' ? 7 : 2;
        const isOnStartingRow = startY === startingRow;
        console.log('[Chess] Pawn at', startX, startY, 'team:', team, 'direction:', direction, 'startRow:', isOnStartingRow);

        // Forward move (1 square)
        const forwardY = startY + direction;
        if (forwardY >= 0 && forwardY < grid.length) {
            if (grid[forwardY][startX] !== TILE_TYPES.WALL) {
                const unitAtPos = this.game.enemyCollection?.findAt(startX, forwardY, true);
                if (!unitAtPos) {
                    // Can only move forward if empty
                    validMoves.push({ x: startX, y: forwardY });

                    // Two-square forward move on first move
                    if (isOnStartingRow) {
                        const forwardY2 = startY + direction * 2;
                        if (forwardY2 >= 0 && forwardY2 < grid.length) {
                            if (grid[forwardY2][startX] !== TILE_TYPES.WALL) {
                                const unitAtPos2 = this.game.enemyCollection?.findAt(startX, forwardY2, true);
                                if (!unitAtPos2) {
                                    validMoves.push({ x: startX, y: forwardY2 });
                                }
                            }
                        }
                    }
                }
            }
        }

        // Diagonal captures
        const captureMoves = [
            [startX - 1, forwardY],  // Left diagonal
            [startX + 1, forwardY]   // Right diagonal
        ];

        for (const [captureX, captureY] of captureMoves) {
            if (captureX < 0 || captureX >= grid[0].length || captureY < 0 || captureY >= grid.length) {
                continue;
            }

            const unitAtPos = this.game.enemyCollection?.findAt(captureX, captureY, true) as Enemy | null;
            console.log('[Chess] Checking diagonal capture at', captureX, captureY, 'unit:', unitAtPos?.enemyType, 'team:', unitAtPos?.team);
            // Can only capture diagonally if there's an enemy
            if (unitAtPos && unitAtPos.team !== team) {
                console.log('[Chess] Adding diagonal capture move to', captureX, captureY);
                validMoves.push({ x: captureX, y: captureY });
            }
        }
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
