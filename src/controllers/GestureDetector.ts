import { INPUT_CONSTANTS, TILE_TYPES, TILE_SIZE } from '@core/constants/index';
import { getDeltaToDirection } from '@core/utils/DirectionUtils';
import audioManager from '@utils/AudioManager';
import { errorHandler, ErrorSeverity } from '@core/ErrorHandler';
import { getTileType, isTileObject } from '@utils/TypeChecks';

interface PointerInfo {
    startX: number;
    startY: number;
    startTime: number;
    lastTile: { x: number; y: number };
    _radialOpened?: boolean;
    _radialHoverOpened?: boolean;
}

interface GridCoords {
    x: number;
    y: number;
}

interface PointerResult {
    type: 'tap' | 'swipe' | 'radial' | 'none';
    clientX?: number;
    clientY?: number;
    direction?: string;
}

/**
 * GestureDetector - Handles pointer event tracking, tap/hold detection, and double-tap logic
 *
 * Responsibilities:
 * - Track active pointers (mouse/touch)
 * - Detect taps vs swipes
 * - Detect double-taps
 * - Manage hold feedback visual state
 * - Convert screen coordinates to grid coordinates
 */
export class GestureDetector {
    private game: any;

    // Pointer tracking state
    private activePointers: Map<number, PointerInfo>;

    // Tap detection state
    private lastTapTime: number | null;
    private lastTapX: number | null;
    private lastTapY: number | null;
    private lastTapClientX: number | null;
    private lastTapClientY: number | null;
    private tapTimeout: NodeJS.Timeout | null;

    // Audio state
    private _audioResumed: boolean;

    // Bound listener references
    private _onPointerDown: (e: PointerEvent) => void;
    private _onPointerMove: (e: PointerEvent) => void;
    private _onPointerUp: (e: PointerEvent) => PointerResult | undefined;
    private _onPointerCancel: (e: PointerEvent) => void;

    // Stored bound listener references for cleanup
    private _boundPointerDown: ((e: PointerEvent) => void) | null;
    private _boundPointerMove: ((e: PointerEvent) => void) | null;
    private _boundPointerUp: ((e: PointerEvent) => void) | null;
    private _boundPointerCancel: ((e: PointerEvent) => void) | null;

    constructor(game: any) {
        this.game = game;

        // Pointer tracking state
        this.activePointers = new Map();

        // Tap detection state
        this.lastTapTime = null;
        this.lastTapX = null;
        this.lastTapY = null;
        this.lastTapClientX = null;
        this.lastTapClientY = null;
        this.tapTimeout = null;

        // Audio state
        this._audioResumed = false;

        // Bound listener references
        this._boundPointerDown = null;
        this._boundPointerMove = null;
        this._boundPointerUp = null;
        this._boundPointerCancel = null;

        // Bind methods
        this._onPointerDown = this._handlePointerDown.bind(this);
        this._onPointerMove = this._handlePointerMove.bind(this);
        this._onPointerUp = this._handlePointerUp.bind(this);
        this._onPointerCancel = this._handlePointerCancel.bind(this);
    }

    /**
     * Set up pointer event listeners
     * Note: These are called by InputController, which passes bound listeners
     */
    setupListeners(onPointerDown: (e: PointerEvent) => void, onPointerMove: (e: PointerEvent) => void, onPointerUp: (e: PointerEvent) => void, onPointerCancel: (e: PointerEvent) => void): void {
        if (!this.game?.canvas) return;

        this.game.canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
        this.game.canvas.addEventListener('pointermove', onPointerMove, { passive: true });
        this.game.canvas.addEventListener('pointerup', onPointerUp, { passive: true });
        this.game.canvas.addEventListener('pointercancel', onPointerCancel);

        // Store references for cleanup
        this._boundPointerDown = onPointerDown;
        this._boundPointerMove = onPointerMove;
        this._boundPointerUp = onPointerUp;
        this._boundPointerCancel = onPointerCancel;
    }

    /**
     * Remove pointer event listeners
     */
    destroy(): void {
        if (!this.game?.canvas) return;

        if (this._boundPointerDown) this.game.canvas.removeEventListener('pointerdown', this._boundPointerDown);
        if (this._boundPointerMove) this.game.canvas.removeEventListener('pointermove', this._boundPointerMove);
        if (this._boundPointerUp) this.game.canvas.removeEventListener('pointerup', this._boundPointerUp);
        if (this._boundPointerCancel) this.game.canvas.removeEventListener('pointercancel', this._boundPointerCancel);
    }

    // ========================================
    // POINTER EVENT HANDLERS
    // ========================================

    private _handlePointerDown(e: PointerEvent): void {
        // Primary button only
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        this._resumeAudioIfNeeded();

        try {
            (e.target as Element).setPointerCapture?.(e.pointerId);
        } catch (err) {
            // Pointer capture may fail - non-critical
            errorHandler.handle(err, ErrorSeverity.WARNING, {
                component: 'GestureDetector',
                action: 'setPointerCapture'
            });
        }

        const now = Date.now();
        const gridCoords = this._safeConvert(e.clientX, e.clientY);

        this.activePointers.set(e.pointerId, {
            startX: e.clientX,
            startY: e.clientY,
            startTime: now,
            lastTile: gridCoords || { x: 0, y: 0 }
        });

        // Touch on player tile - open radial UI immediately
        try {
            const info = this.activePointers.get(e.pointerId);
            const t = info?.lastTile;
            if (e.pointerType !== 'mouse' && t && this.game?.player) {
                const playerPos = this.game.player.getPosition();
                if (t.x === playerPos.x && t.y === playerPos.y && this.game.radialInventoryUI) {
                    // Normalize tile
                    const currentTile = this.game.grid[playerPos.y]?.[playerPos.x];
                    const currentTileType = getTileType(currentTile);
                    const portKind = isTileObject(currentTile) ? currentTile.portKind : null;

                    // No radial on exit/port
                    if (currentTileType === TILE_TYPES.EXIT ||
                        currentTileType === TILE_TYPES.PORT ||
                        portKind === 'stairdown' ||
                        portKind === 'stairup') {
                        if (this.game.radialInventoryUI.open) {
                            try {
                                this.game.radialInventoryUI.close();
                            } catch (err) {
                                errorHandler.handle(err, ErrorSeverity.ERROR, {
                                    component: 'GestureDetector',
                                    action: 'close radial inventory'
                                });
                            }
                        }
                    } else {
                        try {
                            if (this.game.radialInventoryUI.open) {
                                this.game.radialInventoryUI.close();
                                info._radialOpened = true;
                            } else {
                                this.game.radialInventoryUI.openAtPlayer();
                                info._radialOpened = true;
                            }
                        } catch (err) {
                            errorHandler.handle(err, ErrorSeverity.ERROR, {
                                component: 'GestureDetector',
                                action: 'toggle radial inventory on pointer down'
                            });
                        }
                    }
                }
            }
        } catch (err) {
            errorHandler.handle(err, ErrorSeverity.ERROR, {
                component: 'GestureDetector',
                action: 'handle radial UI on pointer down'
            });
        }

        // Hold feedback - but don't show it for adjacent enemies (would flash attack range before immediate attack)
        const enemyAtInitial = gridCoords
            ? this.game.enemyCollection?.findAt(gridCoords.x, gridCoords.y, true)
            : null;

        if (gridCoords && this.game?.renderManager?.startHoldFeedback) {
            // Check if enemy is adjacent to player
            let shouldShowFeedback = true;
            if (enemyAtInitial && this.game?.player) {
                const playerPos = this.game.player.getPosition();
                const dx = Math.abs(gridCoords.x - playerPos.x);
                const dy = Math.abs(gridCoords.y - playerPos.y);
                const isAdjacent = (dx + dy === 1); // Cardinal adjacency only
                if (isAdjacent) {
                    shouldShowFeedback = false; // Don't show hold feedback for adjacent enemies
                }
            }

            if (shouldShowFeedback) {
                this.game.renderManager.startHoldFeedback(gridCoords.x, gridCoords.y);
            }
        }

        // Bloop if not on enemy
        if (!enemyAtInitial) {
            audioManager.playSound('bloop', { game: this.game });
        }
    }

    private _handlePointerMove(e: PointerEvent): void {
        const info = this.activePointers.get(e.pointerId);
        if (!info) return;

        const gc = this._safeConvert(e.clientX, e.clientY);
        if (!gc) return;

        // Touch hover on player tile - open radial
        try {
            if (e.pointerType !== 'mouse' && this.game?.player && this.game.radialInventoryUI) {
                const playerPos = this.game.player.getPosition();
                if (gc.x === playerPos.x && gc.y === playerPos.y && !info._radialHoverOpened) {
                    const currentTile = this.game.grid[playerPos.y]?.[playerPos.x];
                    if (currentTile !== TILE_TYPES.EXIT && currentTile !== TILE_TYPES.PORT) {
                        try {
                            this.game.radialInventoryUI.openAtPlayer();
                        } catch (err) {
                            errorHandler.handle(err, ErrorSeverity.ERROR, {
                                component: 'GestureDetector',
                                action: 'open radial inventory on hover'
                            });
                        }
                        info._radialHoverOpened = true;
                    }
                }
            }
        } catch (err) {
            errorHandler.handle(err, ErrorSeverity.ERROR, {
                component: 'GestureDetector',
                action: 'handle radial UI on pointer move'
            });
        }

        // Update hold feedback - but don't show it for adjacent enemies
        if (this.game?.renderManager?.startHoldFeedback) {
            const enemyOnGc = this.game.enemyCollection?.findAt(gc.x, gc.y, true);
            let shouldShowFeedback = true;

            if (enemyOnGc && this.game?.player) {
                const playerPos = this.game.player.getPosition();
                const dx = Math.abs(gc.x - playerPos.x);
                const dy = Math.abs(gc.y - playerPos.y);
                const isAdjacent = (dx + dy === 1); // Cardinal adjacency only
                if (isAdjacent) {
                    shouldShowFeedback = false; // Don't show hold feedback for adjacent enemies
                }
            }

            if (shouldShowFeedback) {
                this.game.renderManager.startHoldFeedback(gc.x, gc.y);
            } else {
                // Clear feedback if moving to adjacent enemy
                this.game.renderManager.clearFeedback?.();
            }
        }

        // Bloop on tile change (not on enemy)
        if (info.lastTile.x !== gc.x || info.lastTile.y !== gc.y) {
            const enemyOnGc = this.game.enemyCollection?.findAt(gc.x, gc.y, true);
            if (!enemyOnGc) {
                audioManager.playSound('bloop', { game: this.game });
            }
            info.lastTile = gc;
        }
    }

    private _handlePointerUp(e: PointerEvent): PointerResult | undefined {
        const info = this.activePointers.get(e.pointerId);
        if (!info) return;

        try {
            (e.target as Element).releasePointerCapture?.(e.pointerId);
        } catch (err) {
            // Release capture may fail - non-critical
            errorHandler.handle(err, ErrorSeverity.WARNING, {
                component: 'GestureDetector',
                action: 'releasePointerCapture'
            });
        }

        // Check if we're releasing on an enemy
        const gc = this._safeConvert(e.clientX, e.clientY);
        const enemyAtRelease = gc
            ? this.game.enemyCollection?.findAt(gc.x, gc.y, true)
            : null;

        // If releasing on an enemy, only keep hold feedback if NOT adjacent (to show range preview)
        // If adjacent, clear feedback immediately since it will trigger an attack
        let shouldClearFeedback = !enemyAtRelease;
        if (enemyAtRelease && gc && this.game?.player) {
            const playerPos = this.game.player.getPosition();
            const dx = Math.abs(gc.x - playerPos.x);
            const dy = Math.abs(gc.y - playerPos.y);
            const isAdjacent = (dx + dy === 1); // Cardinal adjacency only
            if (isAdjacent) {
                shouldClearFeedback = true; // Clear feedback for adjacent enemy (immediate attack)
            }
        }

        if (shouldClearFeedback && this.game?.renderManager?.clearFeedback) {
            this.game.renderManager.clearFeedback();
        }

        // Radial opened - suppress tap
        if (info._radialOpened) {
            this.activePointers.delete(e.pointerId);
            return { type: 'radial' };
        }

        // Mouse - trigger tap at release
        if (e.pointerType === 'mouse') {
            this.activePointers.delete(e.pointerId);
            return { type: 'tap', clientX: e.clientX, clientY: e.clientY };
        }

        // Touch - detect tap vs swipe
        const deltaX = e.clientX - info.startX;
        const deltaY = e.clientY - info.startY;
        const touchDuration = Date.now() - info.startTime;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        this.activePointers.delete(e.pointerId);

        // Tap conditions
        if (touchDuration < INPUT_CONSTANTS.MAX_TAP_TIME && distance < INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
            return { type: 'tap', clientX: e.clientX, clientY: e.clientY };
        } else if (touchDuration >= INPUT_CONSTANTS.MAX_TAP_TIME) {
            return { type: 'tap', clientX: e.clientX, clientY: e.clientY };
        } else if (distance > INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
            // Swipe to direction using DirectionUtils
            const direction = getDeltaToDirection(deltaX, deltaY);
            return { type: 'swipe', direction };
        }

        return { type: 'none' };
    }

    private _handlePointerCancel(e: PointerEvent): void {
        if (this.game?.renderManager?.clearFeedback) {
            this.game.renderManager.clearFeedback();
        }
        this.activePointers.delete(e.pointerId);
    }

    // ========================================
    // TAP DETECTION
    // ========================================

    /**
     * Clear any pending tap timeout
     */
    clearTapTimeout(): void {
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
            this.tapTimeout = null;
        }
    }

    /**
     * Set a tap timeout
     */
    setTapTimeout(callback: () => void, delay: number): void {
        this.clearTapTimeout();
        this.tapTimeout = setTimeout(callback, delay);
    }

    /**
     * Check if this tap is a double-tap
     * @returns True if this is a double-tap
     */
    handleDoubleTapLogic(gridCoords: GridCoords, clientX: number, clientY: number): boolean {
        const now = Date.now();
        let isDoubleTap = false;

        if (this.lastTapTime !== null && (now - this.lastTapTime) < INPUT_CONSTANTS.DOUBLE_TAP_TIME) {
            if (this.lastTapX === gridCoords.x && this.lastTapY === gridCoords.y) {
                isDoubleTap = true;
            } else if (this.lastTapClientX !== null && this.lastTapClientY !== null) {
                const dx = clientX - this.lastTapClientX;
                const dy = clientY - this.lastTapClientY;
                const distSq = dx * dx + dy * dy;
                const tol = INPUT_CONSTANTS.DOUBLE_TAP_PIXEL_TOLERANCE || 12;
                if (distSq <= tol * tol) {
                    isDoubleTap = true;
                }
            }
        }

        this.lastTapTime = now;
        this.lastTapX = gridCoords.x;
        this.lastTapY = gridCoords.y;
        this.lastTapClientX = clientX;
        this.lastTapClientY = clientY;

        return isDoubleTap;
    }

    // ========================================
    // COORDINATE CONVERSION
    // ========================================

    convertScreenToGrid(screenX: number, screenY: number): GridCoords {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.game.canvas.getBoundingClientRect();
        const canvasX = (screenX - rect.left) * dpr;
        const canvasY = (screenY - rect.top) * dpr;
        const scaleX = this.game.canvas.width / (rect.width * dpr);
        const scaleY = this.game.canvas.height / (rect.height * dpr);
        const adjustedX = canvasX * scaleX;
        const adjustedY = canvasY * scaleY;
        const size = (this.game && this.game.TILE_SIZE) ? this.game.TILE_SIZE : TILE_SIZE;
        const gridX = Math.floor(adjustedX / size);
        const gridY = Math.floor(adjustedY / size);
        return { x: gridX, y: gridY };
    }

    private _safeConvert(x: number, y: number): GridCoords | null {
        try {
            return this.convertScreenToGrid(x, y);
        } catch (err) {
            // Conversion fails if canvas not ready
            errorHandler.handle(err, ErrorSeverity.WARNING, {
                component: 'GestureDetector',
                action: 'convertScreenToGrid'
            });
            return null;
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    private _resumeAudioIfNeeded(): void {
        if (this._audioResumed) return;
        this._audioResumed = true;
        try {
            if (this.game?.soundManager?.resumeAudioContext) {
                this.game.soundManager.resumeAudioContext();
            }
        } catch (e) {
            // Audio resume may fail - non-critical
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'GestureDetector',
                action: 'resume audio context'
            });
        }
    }
}
