import { TILE_TYPES } from '../core/constants/index.js';
import { getExitDirection } from '../core/utils/transitionUtils.js';
import { getDeltaToDirection, getOffset, isAdjacent } from '../core/utils/DirectionUtils.js';
import audioManager from '../utils/AudioManager.js';
import { GestureDetector } from './GestureDetector.js';
import { PathfindingController } from './PathfindingController.js';
import { KeyboardHandler } from './KeyboardHandler.js';
import { InputStateManager } from './InputStateManager.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { TileRegistry } from '../core/TileRegistry.js';
import { getTileType, isTileObject } from '../utils/TileUtils.js';
import { Position } from '../core/Position.js';

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
    constructor(game, inventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;

        // Initialize specialized modules
        this.gestureDetector = new GestureDetector(game);
        this.pathfindingController = new PathfindingController(game);
        this.keyboardHandler = new KeyboardHandler(game);
        this.stateManager = new InputStateManager(game);

        // Set up inter-module communication
        this._unsubscribers = [];
        this._setupModuleCommunication();

        // Bind event listener methods
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onPointerCancel = this._onPointerCancel.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
    }

    // ========================================
    // INITIALIZATION & SETUP
    // ========================================

    _setupModuleCommunication() {
        // Subscribe to key press events from PathfindingController
        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_KEY_PRESS, (event) => {
                this.handleKeyPress(event);
            })
        );

        // Subscribe to exit reached events from PathfindingController
        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_EXIT_REACHED, ({ x, y }) => {
                this.performExitTap(x, y);
            })
        );

        this.keyboardHandler.setPathExecutionCheckCallback(() => {
            return this.pathfindingController.isExecutingPath;
        });
    }

    setupControls() {
        this.gestureDetector.setupListeners(
            this._onPointerDown,
            this._onPointerMove,
            this._onPointerUp,
            this._onPointerCancel
        );
        this.keyboardHandler.setupListeners();
    }

    destroy() {
        this._unsubscribers?.forEach(unsub => unsub());
        this._unsubscribers = [];
        this.gestureDetector.destroy();
        this.keyboardHandler.destroy();
    }

    // ========================================
    // GESTURE EVENT INTEGRATION
    // ========================================

    _handlePointerRelease(result) {
        if (!result) return;

        if (result.type === 'tap') {
            this.handleTap(result.clientX, result.clientY);
        } else if (result.type === 'swipe') {
            this.handleKeyPress({ key: result.direction, preventDefault: () => {} });
        }
    }

    _onPointerDown(e) {
        return this.gestureDetector._onPointerDown(e);
    }

    _onPointerMove(e) {
        return this.gestureDetector._onPointerMove(e);
    }

    _onPointerUp(e) {
        const result = this.gestureDetector._onPointerUp(e);
        this._handlePointerRelease(result);
        return result;
    }

    _onPointerCancel(e) {
        return this.gestureDetector._onPointerCancel(e);
    }

    _onKeyDown(event) {
        return this.keyboardHandler._onKeyDown(event);
    }

    // ========================================
    // TAP HANDLING - EMIT EVENTS FOR UI LOGIC
    // ========================================

    handleTap(screenX, screenY) {
        // Block input during entrance animation
        if (this.stateManager.isEntranceAnimationActive()) {
            return;
        }

        this.gestureDetector.clearTapTimeout();
        const gridCoords = this.gestureDetector.convertScreenToGrid(screenX, screenY);

        // Emit tap event - let UI handlers decide what to do
        const tapEvent = {
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

        // Show tap feedback
        this.game?.renderManager?.showTapFeedback?.(gridCoords.x, gridCoords.y);

        const clickedPos = Position.from(gridCoords);
        const clickedTile = clickedPos.getTile(this.game.grid);
        const clickedTileType = this.getTileType(clickedTile);
        const enemyAtTile = this.game.enemies.find(enemy => enemy.getPositionObject().equals(clickedPos));

        // Check double tap
        const isDoubleTap = this.gestureDetector.handleDoubleTapLogic(gridCoords, screenX, screenY);

        // Play sound
        this._playTapSound(enemyAtTile, isDoubleTap);

        // Handle gameplay-related taps
        this._handleGameplayTap(gridCoords, clickedTileType, isDoubleTap);
    }

    _playTapSound(enemyAtTile, isDoubleTap) {
        if (enemyAtTile) {
            audioManager.playSound('tap_enemy', { game: this.game });
        } else if (isDoubleTap) {
            audioManager.playSound('double_tap', { game: this.game });
        } else {
            audioManager.playSound('bloop', { game: this.game });
        }
    }

    _handleGameplayTap(gridCoords, clickedTileType, isDoubleTap) {
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
            const portKind = isTileObject(currentTile) ? currentTile.portKind : null;

            // Handle EXIT/PORT tiles immediately on single tap
            if (currentTileType === TILE_TYPES.EXIT) {
                this.performExitTap(gridCoords.x, gridCoords.y);
                return;
            } else if (currentTileType === TILE_TYPES.PORT) {
                this.game.interactionManager.zoneManager.handlePortTransition();
                return;
            }

            // Otherwise emit event for radial menu
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

    _shouldCancelPath(clickedPos, playerPos) {
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

    _handleDoubleTap(gridCoords, clickedTileType) {
        const playerPos = this.game.player.getPositionObject();
        const clickedPos = Position.from(gridCoords);

        if (clickedTileType === TILE_TYPES.EXIT || clickedTileType === TILE_TYPES.PORT) {
            if (playerPos.equals(clickedPos)) {
                // Trigger transition
                if (clickedTileType === TILE_TYPES.EXIT) {
                    this.performExitTap(gridCoords.x, gridCoords.y);
                } else {
                    this.game.interactionManager.zoneManager.handlePortTransition();
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
    // KEY PRESS HANDLING
    // ========================================

    handleKeyPress(event) {
        // Block user input during entrance animation, but allow synthetic key presses from pathfinding
        if (this.stateManager.isEntranceAnimationActive() && !event._synthetic) {
            return;
        }

        const result = this.keyboardHandler.handleKeyPress(event);

        if (!result) return;

        // Cancel path
        if (result.type === 'cancel_path') {
            this.pathfindingController.cancelPathExecution();
            return;
        }

        // Movement
        if (result.type === 'movement') {
            const { newX, newY, currentPos } = result;

            // Combat or movement
            const targetPos = new Position(newX, newY);
            const enemyAtTarget = this.game.enemies.find(enemy => enemy.getPositionObject().equals(targetPos));

            if (enemyAtTarget) {
                // Delegate all combat logic to CombatManager
                this.game.combatManager?.handlePlayerAttack(enemyAtTarget, currentPos);
            } else {
                this.game.incrementBombActions();
                this.game.player.move(newX, newY, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, currentPos.x, currentPos.y);
                });
            }

            // Handle turn completion - managed by TurnManager
            this.game.turnManager?.handleTurnCompletion();

            this.game.updatePlayerPosition();
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
    }

    // ========================================
    // MOVEMENT & INTERACTION
    // ========================================

    executeMovementOrInteraction(gridCoords) {
        const playerPos = this.game.player.getPositionObject();
        const clickedPos = Position.from(gridCoords);
        const handled = this.game.interactionManager.handleTap(gridCoords);

        if (!handled) {
            // Single step if enemies and no auto-path
            const enemiesExist = this.stateManager.hasLivingEnemies();
            const allowAutoPath = this.stateManager.isAutoPathWithEnemiesAllowed();

            if (enemiesExist && !allowAutoPath) {
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

            // Auto-path or direct movement
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

    getTileType(tile) {
        return getTileType(tile);
    }

    convertScreenToGrid(screenX, screenY) {
        return this.gestureDetector.convertScreenToGrid(screenX, screenY);
    }

    isTileInteractive(x, y) {
        const pos = new Position(x, y);
        const tile = pos.getTile(this.game.grid);
        if (!tile) return false;

        const tileType = this.getTileType(tile);
        return TileRegistry.isInteractive(tileType);
    }

    performExitTap(exitX, exitY) {
        const direction = getExitDirection(exitX, exitY);
        if (direction) {
            const ev = { key: direction, preventDefault: () => {}, _synthetic: true };
            this.handleKeyPress(ev);
        }
    }

    handleExitTap(x, y) {
        this.performExitTap(x, y);
        return;  // For test compatibility
    }

    // ========================================
    // LEGACY COMPATIBILITY
    // ========================================

    get isExecutingPath() {
        return this.pathfindingController.isExecutingPath;
    }

    cancelPathExecution() {
        this.pathfindingController.cancelPathExecution();
    }

    findPath(startX, startY, targetX, targetY) {
        return this.pathfindingController.findPath(startX, startY, targetX, targetY);
    }

    executePath(path) {
        this.pathfindingController.executePath(path);
    }

    addShackAtPlayerPosition() {
        return null;
    }

    setupTouchControls() {
        // No-op - pointer events handle all
    }
}
