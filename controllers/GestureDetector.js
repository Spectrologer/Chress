import { INPUT_CONSTANTS, TILE_TYPES, TILE_SIZE } from '../core/constants/index.js';
import { getDeltaToDirection } from '../core/utils/DirectionUtils.js';
import audioManager from '../utils/AudioManager.js';
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.js';

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
    constructor(game) {
        this.game = game;

        // Pointer tracking state
        this.activePointers = new Map(); // pointerId -> {startX, startY, startTime, lastTile}

        // Tap detection state
        this.lastTapTime = null;
        this.lastTapX = null;
        this.lastTapY = null;
        this.lastTapClientX = null;
        this.lastTapClientY = null;
        this.tapTimeout = null;

        // Audio state
        this._audioResumed = false;

        // Bind methods
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onPointerCancel = this._onPointerCancel.bind(this);
    }

    /**
     * Set up pointer event listeners
     * Note: These are called by InputController, which passes bound listeners
     */
    setupListeners(onPointerDown, onPointerMove, onPointerUp, onPointerCancel) {
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
    destroy() {
        if (!this.game?.canvas) return;

        this.game.canvas.removeEventListener('pointerdown', this._boundPointerDown);
        this.game.canvas.removeEventListener('pointermove', this._boundPointerMove);
        this.game.canvas.removeEventListener('pointerup', this._boundPointerUp);
        this.game.canvas.removeEventListener('pointercancel', this._boundPointerCancel);
    }

    // ========================================
    // POINTER EVENT HANDLERS
    // ========================================

    _onPointerDown(e) {
        // Primary button only
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        this._resumeAudioIfNeeded();

        try {
            e.target.setPointerCapture?.(e.pointerId);
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
            lastTile: gridCoords
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
                    const currentTileType = (typeof currentTile === 'object' && currentTile?.type !== undefined)
                        ? currentTile.type
                        : currentTile;
                    const portKind = (currentTile && typeof currentTile === 'object') ? currentTile.portKind : null;

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

        // Hold feedback
        if (gridCoords && this.game?.renderManager?.startHoldFeedback) {
            this.game.renderManager.startHoldFeedback(gridCoords.x, gridCoords.y);
        }

        // Bloop if not on enemy
        const enemyAtInitial = gridCoords
            ? this.game.enemies.find(en => en.x === gridCoords.x && en.y === gridCoords.y && en.health > 0)
            : null;
        if (!enemyAtInitial) {
            audioManager.playSound('bloop', { game: this.game });
        }
    }

    _onPointerMove(e) {
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

        // Update hold feedback
        if (this.game?.renderManager?.startHoldFeedback) {
            this.game.renderManager.startHoldFeedback(gc.x, gc.y);
        }

        // Bloop on tile change (not on enemy)
        if (info.lastTile.x !== gc.x || info.lastTile.y !== gc.y) {
            const enemyOnGc = this.game.enemies.find(en => en.x === gc.x && en.y === gc.y && en.health > 0);
            if (!enemyOnGc) {
                audioManager.playSound('bloop', { game: this.game });
            }
            info.lastTile = gc;
        }
    }

    _onPointerUp(e) {
        const info = this.activePointers.get(e.pointerId);
        if (!info) return;

        try {
            e.target.releasePointerCapture?.(e.pointerId);
        } catch (err) {
            // Release capture may fail - non-critical
            errorHandler.handle(err, ErrorSeverity.WARNING, {
                component: 'GestureDetector',
                action: 'releasePointerCapture'
            });
        }

        // Clear hold feedback
        if (this.game?.renderManager?.clearFeedback) {
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

    _onPointerCancel(e) {
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
    clearTapTimeout() {
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
            this.tapTimeout = null;
        }
    }

    /**
     * Set a tap timeout
     */
    setTapTimeout(callback, delay) {
        this.clearTapTimeout();
        this.tapTimeout = setTimeout(callback, delay);
    }

    /**
     * Check if this tap is a double-tap
     * @returns {boolean} True if this is a double-tap
     */
    handleDoubleTapLogic(gridCoords, clientX, clientY) {
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

    convertScreenToGrid(screenX, screenY) {
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

    _safeConvert(x, y) {
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

    _resumeAudioIfNeeded() {
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
