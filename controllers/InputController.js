import { TILE_TYPES, INPUT_CONSTANTS } from '../core/constants.js';
import { getExitDirection } from '../core/utils/transitionUtils.js';
import { getDeltaToDirection, getOffset, isAdjacent } from '../core/utils/DirectionUtils.js';
import { Sign } from '../ui/Sign.js';
import audioManager from '../utils/AudioManager.js';
import { GestureDetector } from './GestureDetector.js';
import { PathfindingController } from './PathfindingController.js';
import { KeyboardHandler } from './KeyboardHandler.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { TileRegistry } from '../core/TileRegistry.js';

/**
 * InputController - Thin coordinator layer for unified input management
 *
 * This controller coordinates between three specialized modules:
 * - GestureDetector: Handles pointer events, tap/hold detection
 * - PathfindingController: Manages pathfinding and path execution
 * - KeyboardHandler: Processes keyboard input
 *
 * The InputController is responsible for:
 * - Initializing and coordinating the three modules
 * - Handling high-level tap logic (single/double tap)
 * - Managing game state interactions (shovel mode, stats panel, radial UI)
 * - Coordinating movement and combat actions
 */
export class InputController {
    constructor(game, inventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;

        // Initialize specialized modules
        this.gestureDetector = new GestureDetector(game);
        this.pathfindingController = new PathfindingController(game);
        this.keyboardHandler = new KeyboardHandler(game);

        // Set up inter-module communication
        this._unsubscribers = [];
        this._setupModuleCommunication();

        // Visual feedback
        this.lastHighlightedTile = { x: null, y: null };

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

    /**
     * Set up inter-module communication via event bus
     */
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

    /**
     * Set up all input event listeners
     */
    setupControls() {
        // Pass bound methods to GestureDetector
        this.gestureDetector.setupListeners(
            this._onPointerDown,
            this._onPointerMove,
            this._onPointerUp,
            this._onPointerCancel
        );
        this.keyboardHandler.setupListeners();
    }

    /**
     * Clean up all event listeners and subscriptions
     */
    destroy() {
        // Unsubscribe from event bus
        this._unsubscribers?.forEach(unsub => unsub());
        this._unsubscribers = [];

        this.gestureDetector.destroy();
        this.keyboardHandler.destroy();
    }

    // ========================================
    // GESTURE EVENT INTEGRATION
    // ========================================

    /**
     * Called by GestureDetector when pointer is released
     */
    _handlePointerRelease(result) {
        if (!result) return;

        if (result.type === 'tap') {
            this.handleTap(result.clientX, result.clientY);
        } else if (result.type === 'swipe') {
            this.handleKeyPress({ key: result.direction, preventDefault: () => {} });
        }
    }

    // Delegate to GestureDetector
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
    // TAP HANDLING
    // ========================================

    /**
     * Handle sign message interaction
     * Returns true if handled, false otherwise
     */
    _handleSignMessage(gridCoords) {
        if (this.game.displayingMessageForSign) {
            if (this.isTileInteractive(gridCoords.x, gridCoords.y)) {
                this.game.interactionManager.triggerInteractAt(gridCoords);
                return true;
            } else {
                Sign.hideMessageForSign(this.game);
            }
        }
        return false;
    }

    /**
     * Handle shovel mode interaction
     * Returns true if handled, false otherwise
     */
    _handleShovelMode(gridCoords) {
        if (!this.game.shovelMode) {
            return false;
        }

        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            const success = this.inventoryService.useItem(this.game.activeShovel, {
                targetX: gridCoords.x,
                targetY: gridCoords.y
            });
            if (success) {
                this.game.exitShovelMode();
            }
        } else {
            this.game.exitShovelMode();
        }
        return true;
    }

    /**
     * Handle stats panel closing
     * Returns true if handled, false otherwise
     */
    _handleStatsPanelClose() {
        if (this.game.uiManager.isStatsPanelOpen()) {
            this.game.uiManager.hideStatsPanel();
            return true;
        }
        return false;
    }

    /**
     * Handle charge selection (bishop spear, horse icon, bow)
     * Returns true if handled, false otherwise
     */
    _handleChargeSelection(gridCoords) {
        if (!this.game.pendingCharge?.selectionType) {
            return false;
        }

        const selType = this.game.pendingCharge.selectionType;
        let chargeDetails = null;
        const playerPos = this.game.player.getPosition();

        // Use interactionManager.combatManager (CombatActionManager) for charge validation
        const combatActionManager = this.game.interactionManager?.combatManager;
        if (!combatActionManager) {
            console.error('[InputController] CombatActionManager not available');
            return false;
        }

        // When charge is initiated from radial UI (has selectionType), include radial inventory
        const includeRadial = true;

        if (selType === 'bishop_spear') {
            chargeDetails = combatActionManager.isValidBishopSpearCharge(gridCoords, playerPos, includeRadial);
        } else if (selType === 'horse_icon') {
            chargeDetails = combatActionManager.isValidHorseIconCharge(gridCoords, playerPos, includeRadial);
        } else if (selType === 'bow') {
            chargeDetails = combatActionManager.isValidBowShot(gridCoords, playerPos, includeRadial);
        }

        if (chargeDetails) {
            combatActionManager.confirmPendingCharge(chargeDetails);
        } else {
            combatActionManager.cancelPendingCharge();
        }
        return true;
    }

    /**
     * Handle single tap on player tile (exit/port/radial UI)
     * Returns true if handled, false otherwise
     */
    _handlePlayerTileTap(gridCoords, isDoubleTap) {
        const playerPos = this.game.player.getPosition();

        if (isDoubleTap || gridCoords.x !== playerPos.x || gridCoords.y !== playerPos.y) {
            return false;
        }

        const currentTile = this.game.grid[playerPos.y]?.[playerPos.x];
        const currentTileType = this.getTileType(currentTile);
        const portKind = (currentTile && typeof currentTile === 'object') ? currentTile.portKind : null;

        // Disable radial menu on exit/port tiles to allow transition access
        const isExitOrPort = currentTileType === TILE_TYPES.EXIT ||
                            currentTileType === TILE_TYPES.PORT ||
                            portKind === 'stairdown' ||
                            portKind === 'stairup';

        if (isExitOrPort) {
            // Close radial menu if open
            if (this.game.radialInventoryUI?.open) {
                this.game.radialInventoryUI.close();
            }

            // Trigger transition
            if (currentTileType === TILE_TYPES.EXIT) {
                this.performExitTap(playerPos.x, playerPos.y);
                return true;
            }

            if (currentTileType === TILE_TYPES.PORT) {
                this.game.interactionManager.zoneManager.handlePortTransition();
                return true;
            }
        }

        // Single tap on player tile opens radial menu (if available and not on exit/port)
        if (this.game.radialInventoryUI) {
            if (this.game.radialInventoryUI.open) {
                this.game.radialInventoryUI.close();
            } else {
                this.game.radialInventoryUI.openAtPlayer();
            }
            return true;
        }

        return false;
    }

    /**
     * Handle double tap actions (exit/port path or interact on reach)
     */
    _handleDoubleTap(gridCoords, clickedTileType) {
        const playerPos = this.game.player.getPosition();

        if (clickedTileType === TILE_TYPES.EXIT || clickedTileType === TILE_TYPES.PORT) {
            if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
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

    /**
     * Handle path cancellation logic
     * Returns true if execution should stop, false otherwise
     */
    _handlePathCancellation(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const isClickingDifferentTile = gridCoords.x !== playerPos.x || gridCoords.y !== playerPos.y;

        if (this.pathfindingController.isExecutingPath && isClickingDifferentTile) {
            this.pathfindingController.cancelPathExecution();
        }

        if (this.pathfindingController.isExecutingPath && !isClickingDifferentTile) {
            if (this.game.player.stats.verbosePathAnimations && isClickingDifferentTile) {
                this.pathfindingController.cancelPathExecution();
            }
            return true;
        }

        return false;
    }

    handleTap(screenX, screenY) {
        // Block input during entrance animation
        if (this.game._entranceAnimationInProgress) {
            return;
        }

        this.gestureDetector.clearTapTimeout();

        const gridCoords = this.gestureDetector.convertScreenToGrid(screenX, screenY);

        // Handle sign message
        if (this._handleSignMessage(gridCoords)) {
            return;
        }

        // Tap feedback
        this.game?.renderManager?.showTapFeedback?.(gridCoords.x, gridCoords.y);

        const clickedTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        const clickedTileType = this.getTileType(clickedTile);
        const enemyAtTile = this.game.enemies.find(enemy => enemy.x === gridCoords.x && enemy.y === gridCoords.y);

        // Handle shovel mode
        if (this._handleShovelMode(gridCoords)) {
            return;
        }

        // Close stats panel
        if (this._handleStatsPanelClose()) {
            return;
        }

        // Check double tap
        const isDoubleTap = this.gestureDetector.handleDoubleTapLogic(gridCoords, screenX, screenY);

        // Play sound
        if (enemyAtTile) {
            audioManager.playSound('tap_enemy', { game: this.game });
        } else if (isDoubleTap) {
            audioManager.playSound('double_tap', { game: this.game });
        } else {
            audioManager.playSound('bloop', { game: this.game });
        }

        // Handle charge selection
        if (this._handleChargeSelection(gridCoords)) {
            return true;
        }

        // Single tap on player tile
        if (this._handlePlayerTileTap(gridCoords, isDoubleTap)) {
            return true;
        }

        // Double tap
        if (isDoubleTap) {
            this._handleDoubleTap(gridCoords, clickedTileType);
            return;
        } else {
            // Wait for double tap
            this.gestureDetector.setTapTimeout(() => this.executeMovementOrInteraction(gridCoords), INPUT_CONSTANTS.DOUBLE_TAP_DELAY);
        }

        // Cancel path if different tile
        if (this._handlePathCancellation(gridCoords)) {
            return;
        }
    }

    // ========================================
    // KEY PRESS HANDLING
    // ========================================

    handleKeyPress(event) {
        // Block user input during entrance animation, but allow synthetic key presses from pathfinding
        if (this.game._entranceAnimationInProgress && !event._synthetic) {
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
            let playerMoved = false;
            const enemyAtTarget = this.game.enemies.find(enemy => enemy.x === newX && enemy.y === newY);

            if (enemyAtTarget) {
                // Delegate all combat logic to CombatManager
                this.game.combatManager.handlePlayerAttack(enemyAtTarget, currentPos);
            } else {
                this.game.incrementBombActions();
                playerMoved = this.game.player.move(newX, newY, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, currentPos.x, currentPos.y);
                });
            }

            // Handle turn completion - managed by TurnManager
            this.game.turnManager.handleTurnCompletion();

            this.game.updatePlayerPosition();
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
    }


    // ========================================
    // MOVEMENT & INTERACTION
    // ========================================

    executeMovementOrInteraction(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const handled = this.game.interactionManager.handleTap(gridCoords);

        if (!handled) {
            // Single step if enemies and no auto-path
            const enemiesExist = this.game.enemies?.some(e => e.health > 0);
            const allowAutoPath = !!(this.game.player.stats?.autoPathWithEnemies);

            if (enemiesExist && !allowAutoPath) {
                const dx = gridCoords.x - playerPos.x;
                const dy = gridCoords.y - playerPos.y;

                if (dx === 0 && dy === 0) return;

                // Choose cardinal direction using DirectionUtils
                const stepKey = getDeltaToDirection(dx, dy);
                if (!stepKey) return;

                // Calculate step position using DirectionUtils
                const offset = getOffset(stepKey);
                const stepX = playerPos.x + offset.x;
                const stepY = playerPos.y + offset.y;

                if (this.game.player.isWalkable(stepX, stepY, this.game.grid, playerPos.x, playerPos.y)) {
                    this.executePath([stepKey]);
                }
                return;
            }

            // Auto-path or direct movement
            const isInteractive = this.isTileInteractive(gridCoords.x, gridCoords.y);
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);

            if (isInteractive && !isAdjacent(dx, dy)) {
                const adjacentTile = this.pathfindingController.findNearestWalkableAdjacent(gridCoords.x, gridCoords.y);
                if (adjacentTile) {
                    const path = this.findPath(playerPos.x, playerPos.y, adjacentTile.x, adjacentTile.y);
                    if (path?.length > 0) {
                        this.executePath(path);
                    }
                }
            } else {
                const path = this.findPath(playerPos.x, playerPos.y, gridCoords.x, gridCoords.y);
                if (path?.length > 0) {
                    this.executePath(path);
                }
            }
        }
    }


    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Normalizes a tile to its type value
     * @param {object|number} tile - The tile (can be an object with a type property or a primitive)
     * @returns {number} The tile type value
     */
    getTileType(tile) {
        return (typeof tile === 'object' && tile?.type !== undefined) ? tile.type : tile;
    }

    convertScreenToGrid(screenX, screenY) {
        return this.gestureDetector.convertScreenToGrid(screenX, screenY);
    }

    isTileInteractive(x, y) {
        const tile = this.game.grid[y]?.[x];
        if (!tile) return false;

        const tileType = this.getTileType(tile);

        // Use centralized TileRegistry for all tile interaction checks
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
        // Legacy - may be removed
        return null;
    }

    setupTouchControls() {
        // No-op - pointer events handle all
    }
}
