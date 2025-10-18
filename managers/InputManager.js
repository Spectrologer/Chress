import { GRID_SIZE, CANVAS_SIZE, TILE_SIZE, TILE_TYPES, FOOD_ASSETS, INPUT_CONSTANTS, ANIMATION_CONSTANTS, SIMULATION_CONSTANTS } from '../core/constants.js';
import { Enemy } from '../entities/Enemy.js';
import { Sign } from '../ui/Sign.js';
import consoleCommands from '../core/consoleCommands.js';
import logger from '../core/logger.js';
import { getExitDirection } from '../core/utils/transitionUtils.js';

export class InputManager {
    constructor(game, itemUsageManager) {
        this.game = game;
        this.itemUsageManager = itemUsageManager;
        this.isExecutingPath = false;
        this.pathExecutionTimer = null;
        this.cancelPath = false;
        this.lastTapTime = null;
        this.lastTapX = null;
        this.lastTapY = null;
        // Store last raw client coordinates to allow tolerant double-tap
        // detection in screen space (fixes small rounding/dpr differences)
        this.lastTapClientX = null;
        this.lastTapClientY = null;
        this.tapTimeout = null;
    // Marker for auto-using a transition when the player reaches a special tile.
    // Can be null, 'exit' or 'port'.
    this.autoUseNextTransition = null;
        // Track last tile that produced a selection sound to avoid repeats while holding
        this.lastHighlightedTile = { x: null, y: null };
    }

    setupControls() {
        // Ensure the audio context is resumed on first user gesture (browsers block audio until user interaction)
        this._audioResumed = false;
        const _resumeAudioIfNeeded = () => {
            if (this._audioResumed) return;
            this._audioResumed = true;
            try {
                if (this.game && this.game.soundManager && typeof this.game.soundManager.resumeAudioContext === 'function') {
                    this.game.soundManager.resumeAudioContext();
                }
            } catch (e) {}
        };
        // Keyboard controls - attach to both window and document for cross-browser coverage
        window.addEventListener('keydown', (event) => {
            _resumeAudioIfNeeded();
            this.handleKeyPress(event);
        });
        
        // Mouse controls for desktop (same as tap)
        // Use mousedown/up to support press-and-hold feedback
        this.game.canvas.addEventListener('mousedown', (event) => {
            _resumeAudioIfNeeded();
            // Show hold feedback immediately
            const gridCoords = this.convertScreenToGrid(event.clientX, event.clientY);
            try {
                if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
                    this.game.renderManager.startHoldFeedback(gridCoords.x, gridCoords.y);
                }
                if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                    // Play bloop for initial press unless this tile contains an enemy;
                    // enemy taps get a dedicated sound later and we don't want both.
                    const enemyAtInitial = this.game.enemies.find(e => e.x === gridCoords.x && e.y === gridCoords.y && e.health > 0);
                    if (!enemyAtInitial) {
                        this.game.soundManager.playSound('bloop');
                    }
                    this.lastHighlightedTile.x = gridCoords.x;
                    this.lastHighlightedTile.y = gridCoords.y;
                }
            } catch (e) {}

            // Prepare for potential click if the user releases without moving
            const onMouseMove = (ev) => {
                // Update the hold feedback to follow the mouse while pressed
                try {
                    const gc = this.convertScreenToGrid(ev.clientX, ev.clientY);
                    if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
                        this.game.renderManager.startHoldFeedback(gc.x, gc.y);
                    }
                    // Play bloop if we've moved onto a new tile (skip if the
                    // new tile contains an enemy - enemy taps get a different sound)
                    if (this.lastHighlightedTile.x !== gc.x || this.lastHighlightedTile.y !== gc.y) {
                        if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                            const enemyOnGc = this.game.enemies.find(e => e.x === gc.x && e.y === gc.y && e.health > 0);
                            if (!enemyOnGc) this.game.soundManager.playSound('bloop');
                        }
                        this.lastHighlightedTile.x = gc.x;
                        this.lastHighlightedTile.y = gc.y;
                    }
                } catch (e) {}
            };

            const onMouseUp = (ev) => {
                // Clear hold feedback and treat as a click
                try {
                    if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') {
                        this.game.renderManager.clearFeedback();
                    }
                } catch (e) {}
                this.lastHighlightedTile.x = null;
                this.lastHighlightedTile.y = null;
                this.handleTap(ev.clientX, ev.clientY);
                window.removeEventListener('mouseup', onMouseUp);
                window.removeEventListener('mousemove', onMouseMove);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        // Also support simple click (fallback)
        this.game.canvas.addEventListener('click', (event) => {
            this.handleTap(event.clientX, event.clientY);
        });

        // Touch controls for mobile
        this.setupTouchControls();
    }

    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        // Use non-passive listeners so e.preventDefault() works on mobile browsers
        this.game.canvas.addEventListener('touchstart', (e) => {
            // preventDefault is important to stop double-tap-to-zoom and native gestures
            e.preventDefault();
            // Resume audio on first user gesture
            try { if (typeof _resumeAudioIfNeeded === 'function') _resumeAudioIfNeeded(); } catch (ex) {}
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();

            // Start hold feedback on touch
            try {
                const gridCoords = this.convertScreenToGrid(touch.clientX, touch.clientY);
                if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
                    this.game.renderManager.startHoldFeedback(gridCoords.x, gridCoords.y);
                }
                if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                    const enemyAtInitial = this.game.enemies.find(e => e.x === gridCoords.x && e.y === gridCoords.y && e.health > 0);
                    if (!enemyAtInitial) {
                        this.game.soundManager.playSound('bloop');
                    }
                    this.lastHighlightedTile.x = gridCoords.x;
                    this.lastHighlightedTile.y = gridCoords.y;
                }
            } catch (e) {}
        });
        this.game.canvas.addEventListener('touchend', (e) => {
            // preventDefault to avoid triggering browser gestures
            e.preventDefault();
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const touchDuration = Date.now() - touchStartTime;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Check if this was a tap (short duration, small movement)
            if (touchDuration < INPUT_CONSTANTS.MAX_TAP_TIME && distance < INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
                // Short tap: handle normally
                try {
                    if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') {
                        this.game.renderManager.clearFeedback();
                    }
                } catch (e) {}
                this.handleTap(touch.clientX, touch.clientY);
            }
            // If the user held (long press) and then released (possibly after dragging), treat as a tap at release
            else if (touchDuration >= INPUT_CONSTANTS.MAX_TAP_TIME) {
                try {
                    if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') {
                        this.game.renderManager.clearFeedback();
                    }
                } catch (e) {}
                this.handleTap(touch.clientX, touch.clientY);
            }
            // Otherwise, check if it was a quick swipe gesture (short time but dragged fast)
            else if (distance > INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
                let direction = '';

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    direction = deltaX > 0 ? 'arrowright' : 'arrowleft';
                } else {
                    // Vertical swipe
                    direction = deltaY > 0 ? 'arrowdown' : 'arrowup';
                }

                // Simulate key press
                this.handleKeyPress({ key: direction, preventDefault: () => {} });
            }
        });

        // Prevent default touch behaviors (non-passive)
        this.game.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            // Update hold feedback to the tile under the finger so dragging highlights tiles
            const touch = e.touches[0];
            if (!touch) return;
            try {
                const gc = this.convertScreenToGrid(touch.clientX, touch.clientY);
                if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
                    this.game.renderManager.startHoldFeedback(gc.x, gc.y);
                }
                if (this.lastHighlightedTile.x !== gc.x || this.lastHighlightedTile.y !== gc.y) {
                    if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                        const enemyOnGc = this.game.enemies.find(e => e.x === gc.x && e.y === gc.y && e.health > 0);
                        if (!enemyOnGc) this.game.soundManager.playSound('bloop');
                    }
                    this.lastHighlightedTile.x = gc.x;
                    this.lastHighlightedTile.y = gc.y;
                }
            } catch (err) {}
        }, { passive: false });

        // Ensure we clear feedback if touch is cancelled (e.g. system gesture)
        this.game.canvas.addEventListener('touchcancel', (e) => {
            try {
                if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') {
                    this.game.renderManager.clearFeedback();
                }
                this.lastHighlightedTile.x = null;
                this.lastHighlightedTile.y = null;
            } catch (err) {}
        });
    }

    // Convert screen coordinates to grid coordinates
    convertScreenToGrid(screenX, screenY) {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.game.canvas.getBoundingClientRect();
        const canvasX = (screenX - rect.left) * dpr;
        const canvasY = (screenY - rect.top) * dpr;

        // Account for canvas scaling
        const scaleX = this.game.canvas.width / (rect.width * dpr);
        const scaleY = this.game.canvas.height / (rect.height * dpr);

        const adjustedX = canvasX * scaleX;
        const adjustedY = canvasY * scaleY;

        // Convert to grid coordinates
        const gridX = Math.floor(adjustedX / TILE_SIZE);
        const gridY = Math.floor(adjustedY / TILE_SIZE);

        return { x: gridX, y: gridY };
    }

    // Find path using BFS (Breadth-First Search)
    findPath(startX, startY, targetX, targetY) {
        // Check if target is within bounds and walkable
        if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE) {
            return null;
        }

        // Explicitly make signs unwalkable for pathfinding
        const targetTile = this.game.grid[targetY]?.[targetX];
        if ((targetTile && typeof targetTile === 'object' && targetTile.type === TILE_TYPES.SIGN) || targetTile === TILE_TYPES.SIGN) {
            return null;
        }

        if (!this.game.player.isWalkable(targetX, targetY, this.game.grid, startX, startY)) {
            return null;
        }

        // If already at target, no movement needed
        if (startX === targetX && startY === targetY) {
            return [];
        }

        const queue = [{x: startX, y: startY, path: []}];
        const visited = new Set([`${startX},${startY}`]);
        const directions = [
            {dx: 0, dy: -1, key: 'arrowup'},    // North
            {dx: 0, dy: 1, key: 'arrowdown'},   // South
            {dx: -1, dy: 0, key: 'arrowleft'},  // West
            {dx: 1, dy: 0, key: 'arrowright'}   // East
        ];

        while (queue.length > 0) {
            const current = queue.shift();

            // Check all four directions
            for (const dir of directions) {
                const newX = current.x + dir.dx;
                const newY = current.y + dir.dy;
                const key = `${newX},${newY}`;

                if (visited.has(key)) continue;
                visited.add(key);

                // Check if position is within bounds and walkable
                if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE &&
                    this.game.player.isWalkable(newX, newY, this.game.grid, current.x, current.y)) {

                    const newPath = [...current.path, dir.key];

                    // Check if we reached the target
                    if (newX === targetX && newY === targetY) {
                        return newPath;
                    }

                    queue.push({x: newX, y: newY, path: newPath});
                }
            }
        }

        // No path found
        return null;
    }

    // Extract double-tap detection logic
    // Double-tap detection: compare recent tap time and allow a small
    // pixel tolerance for client coordinates to handle DPR/rounding.
    handleDoubleTapLogic(gridCoords, clientX, clientY) {
        const now = Date.now();

        let isDoubleTap = false;
        if (this.lastTapTime !== null && (now - this.lastTapTime) < INPUT_CONSTANTS.DOUBLE_TAP_TIME) {
            // If last tap was on same grid cell, that's sufficient
            if (this.lastTapX === gridCoords.x && this.lastTapY === gridCoords.y) {
                isDoubleTap = true;
            } else if (this.lastTapClientX !== null && this.lastTapClientY !== null) {
                // Otherwise allow small pixel movement between taps
                const dx = clientX - this.lastTapClientX;
                const dy = clientY - this.lastTapClientY;
                const distSq = dx * dx + dy * dy;
                const tol = INPUT_CONSTANTS.DOUBLE_TAP_PIXEL_TOLERANCE || 12;
                if (distSq <= tol * tol) {
                    isDoubleTap = true;
                }
            }
        }

        // Update last tap tracking
        this.lastTapTime = now;
        this.lastTapX = gridCoords.x;
        this.lastTapY = gridCoords.y;
        this.lastTapClientX = clientX;
        this.lastTapClientY = clientY;

        return isDoubleTap;
    }

    // Handle tap input for movement
    handleTap(screenX, screenY) {
        // Clear any pending single-tap action
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
            this.tapTimeout = null;
        }

        // Calculate grid coordinates first
        const gridCoords = this.convertScreenToGrid(screenX, screenY);

        // Show immediate tap feedback on the render manager (visual depression/highlight)
        try {
            if (this.game && this.game.renderManager && typeof this.game.renderManager.showTapFeedback === 'function') {
                this.game.renderManager.showTapFeedback(gridCoords.x, gridCoords.y);
            }
        } catch (e) {
            // Non-fatal: rendering feedback is best-effort
        }

        // NOTE: selection sound (bloop or double_tap) is played after we
        // detect whether this is a double-tap. This avoids playing the
        // same generic sound for both taps when a double-tap occurs.

        // Debug: Log comprehensive tile information on click
        logger.log(`Tile clicked at (${gridCoords.x}, ${gridCoords.y})`);
        const clickedTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        logger.log("Tile data:", clickedTile);
        const enemyAtTile = this.game.enemies.find(enemy => enemy.x === gridCoords.x && enemy.y === gridCoords.y);
        if (enemyAtTile) {
            logger.log("Enemy on tile:", enemyAtTile);
        }

        const playerPos = this.game.player.getPosition();

        // Handle shovel mode first to intercept any other tap action
        if (this.game.shovelMode) {
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);

            if (isAdjacent) {
                const success = this.itemUsageManager.useItem(this.game.activeShovel, gridCoords.x, gridCoords.y);
                if (success) {
                    // Successfully used shovel, exit shovel mode
                    this.game.shovelMode = false;
                    this.game.activeShovel = null;
                    this.game.hideOverlayMessage();
                }
                // If not successful, the ItemUsageManager shows a message. We stay in shovel mode.
            } else {
                // Clicked a non-adjacent tile, so cancel shovel mode.
                this.game.shovelMode = false;
                this.game.activeShovel = null;
                this.game.hideOverlayMessage();
            }
            return; // End tap handling here, preventing movement.
        }

        // If stats panel is open, close it on any tap
        if (this.game.uiManager.isStatsPanelOpen()) {
            this.game.uiManager.hideStatsPanel();
            return;
        }

        // Double tap detection and handling
    // Use client coordinates to make double-tap detection robust
    // across devices and hosting environments (GH Pages etc.).
    const isDoubleTap = this.handleDoubleTapLogic(gridCoords, screenX, screenY);
        // Play a subtler, distinct sound for double-tap. Single taps get the
        // regular (already-subdued) 'bloop'. If tapping an enemy tile, play
        // a different feedback sound so the player gets clearer audio cues.
        try {
            if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                // If the tapped tile contains an enemy, always play the enemy tap sound
                if (enemyAtTile) {
                    this.game.soundManager.playSound('tap_enemy');
                } else if (isDoubleTap) {
                    this.game.soundManager.playSound('double_tap');
                } else {
                    this.game.soundManager.playSound('bloop');
                }
            }
        } catch (e) {}
        const tile = this.game.grid[gridCoords.y]?.[gridCoords.x];

        // Handle double tap on exit or port tiles
        if (isDoubleTap && (tile === TILE_TYPES.EXIT || tile === TILE_TYPES.PORT)) {
            if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
                // Double tap on current exit/port: immediately use (allowed even during path execution)
                if (tile === TILE_TYPES.EXIT) {
                    this.handleExitTap(gridCoords.x, gridCoords.y);
                } else {
                    // PORT transition handled by ZoneTransitionManager
                    try {
                        this.game.interactionManager.zoneManager.handlePortTransition();
                    } catch (e) {}
                }
                return;
            } else {
                // Double tap on distant exit/port: move there and auto-use upon reaching
                this.autoUseNextTransition = (tile === TILE_TYPES.EXIT) ? 'exit' : 'port';
            }
        }

        if (isDoubleTap) {
            this.handleDoubleTap(gridCoords);
            // We've handled the double-tap by starting movement/interaction.
            // Return early so the cancellation checks below don't immediately
            // cancel the path we just started.
            return;
        } else {
            this.tapTimeout = setTimeout(() => this.executeMovementOrInteraction(gridCoords), INPUT_CONSTANTS.DOUBLE_TAP_TIME);
        }

        // Check if we should interrupt current path execution
        const isClickingDifferentTile = gridCoords.x !== playerPos.x || gridCoords.y !== playerPos.y;
        if (this.isExecutingPath && isClickingDifferentTile) {
            // Always cancel path when clicking a different tile, regardless of verbose mode
            this.cancelPathExecution();
        }

        // Prevent new path execution while a path is currently being executed
        if (this.isExecutingPath && !isClickingDifferentTile) {
            // Allow cancelling current path by re-clicking same tile during verbose mode
            if (this.game.player.stats.verbosePathAnimations && isClickingDifferentTile) {
                this.cancelPathExecution();
            }
            return;
        }
    }

    handleDoubleTap(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const tile = this.game.grid[gridCoords.y]?.[gridCoords.x];

        if (tile === TILE_TYPES.EXIT || tile === TILE_TYPES.PORT) {
            if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
                if (tile === TILE_TYPES.EXIT) {
                    this.handleExitTap(gridCoords.x, gridCoords.y);
                } else {
                    try {
                        this.game.interactionManager.zoneManager.handlePortTransition();
                    } catch (e) {}
                }
            } else {
                this.autoUseNextTransition = (tile === TILE_TYPES.EXIT) ? 'exit' : 'port';
                this.executeMovementOrInteraction(gridCoords); // Path to the exit/port
            }
        } else {
            this.game.player.setInteractOnReach(gridCoords.x, gridCoords.y);
            this.executeMovementOrInteraction(gridCoords); // Path to the interactive tile
        }
    }

    executeMovementOrInteraction(gridCoords) {
        const playerPos = this.game.player.getPosition();

        // Handle grid interaction
        const handled = this.game.interactionManager.handleTap(gridCoords);
        if (!handled) {
            // Check if the tile is interactive but not adjacent
            const isInteractive = this.isTileInteractive(gridCoords.x, gridCoords.y);
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

            if (isInteractive && !isAdjacent) {
                // Find nearest walkable adjacent tile to the target
                const adjacentTile = this.findNearestWalkableAdjacent(gridCoords.x, gridCoords.y);
                if (adjacentTile) {
                    // Path to the adjacent tile
                    const path = this.findPath(playerPos.x, playerPos.y, adjacentTile.x, adjacentTile.y);
                    if (path && path.length > 0) {
                        this.executePath(path);
                    }
                }
            } else {
                // Normal pathfinding for walkable or adjacent interactive tiles
                const path = this.findPath(playerPos.x, playerPos.y, gridCoords.x, gridCoords.y);
                if (path && path.length > 0) {
                    this.executePath(path);
                }
            }
        }
    }

    // Handle tapping on exit tiles to trigger zone transitions
    handleExitTap(exitX, exitY) {
        const direction = getExitDirection(exitX, exitY);

        if (direction) {
            // Simulate the key press to trigger zone transition
            this.handleKeyPress({ key: direction, preventDefault: () => {}, _synthetic: true });
        }
    }

    // Execute path by simulating key presses with timing using AnimationScheduler
    executePath(path) {
        if (this.isExecutingPath) {
            // If already executing, cancel the current path to allow interruption
            this.cancelPathExecution();
        }

        this.isExecutingPath = true;
        this.cancelPath = false;
        // Hold reference to any animation sequence used for path execution so it
        // can be cancelled cleanly by cancelPathExecution.
        this.currentPathSequence = null;

        // Check if verbose animations are enabled
        if (this.game.player.stats.verbosePathAnimations) {
            // Verbose mode: build a single animation sequence to step through the path
            // This prevents overlapping sequences and makes cancellation deterministic.
            const seq = this.game.animationScheduler.createSequence();
            this.currentPathSequence = seq;

            for (let i = 0; i < path.length; i++) {
                const stepKey = path[i];
                seq.then(() => {
                    // If sequence was cancelled, short-circuit
                    if (this.cancelPath) return;
                    this.handleKeyPress({ key: stepKey, preventDefault: () => {}, _synthetic: true });
                }).wait(INPUT_CONSTANTS.LEGACY_PATH_DELAY);
            }

            // Finalize sequence: handle end-of-path state
            seq.then(() => {
                if (this.cancelPath) {
                    this.cancelPath = false;
                    this.isExecutingPath = false;
                    return;
                }

                this.isExecutingPath = false;

                // Check if player ended up on an exit tile after path completion
                const playerPos = this.game.player.getPosition();
                if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT) {
                    if (this.autoUseNextTransition === 'exit') {
                        this.handleExitTap(playerPos.x, playerPos.y);
                        this.autoUseNextTransition = null;
                    }
                } else if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.PORT) {
                    if (this.autoUseNextTransition === 'port') {
                        try {
                            this.game.interactionManager.zoneManager.handlePortTransition();
                        } catch (e) {}
                        this.autoUseNextTransition = null;
                    }
                }

                // Trigger interaction if set (for double tap on interactive tiles)
                if (this.game.player.interactOnReach) {
                    const target = this.game.player.interactOnReach;
                    this.game.player.clearInteractOnReach();
                    this.game.interactionManager.triggerInteractAt(target);
                }
            });

            // Start the sequence and clear reference when complete. The real
            // AnimationSequence.start() returns a Promise; the test mock does
            // not, so handle both cases by using a fallback timer when start()
            // doesn't return a thenable.
            const startResult = seq.start();
            // Compute a safe fallback duration (path steps * delay + margin)
            const fallbackDelay = Math.max(50, path.length * INPUT_CONSTANTS.LEGACY_PATH_DELAY + 50);
            if (startResult && typeof startResult.then === 'function') {
                startResult.then(() => {
                    if (this.currentPathSequence && this.currentPathSequence.id === seq.id) {
                        this.currentPathSequence = null;
                    }
                    if (this.currentPathSequenceFallback) {
                        clearTimeout(this.currentPathSequenceFallback);
                        this.currentPathSequenceFallback = null;
                    }
                }).catch(() => {
                    if (this.currentPathSequence && this.currentPathSequence.id === seq.id) {
                        this.currentPathSequence = null;
                    }
                    if (this.currentPathSequenceFallback) {
                        clearTimeout(this.currentPathSequenceFallback);
                        this.currentPathSequenceFallback = null;
                    }
                });
            } else {
                // Non-promise start: schedule fallback to clear reference
                this.currentPathSequenceFallback = setTimeout(() => {
                    if (this.currentPathSequence && this.currentPathSequence.id === seq.id) {
                        this.currentPathSequence = null;
                    }
                    this.currentPathSequenceFallback = null;
                }, fallbackDelay);
            }
        } else {
            // Instant mode: execute all path steps immediately
            for (let i = 0; i < path.length && !this.cancelPath; i++) {
                this.handleKeyPress({ key: path[i], preventDefault: () => {}, _synthetic: true });
            }

            this.isExecutingPath = false;

            // Check if player ended up on an exit tile after path completion
            const playerPos = this.game.player.getPosition();
            if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT) {
                if (this.autoUseNextExitReach) {
                    this.handleExitTap(playerPos.x, playerPos.y);
                    this.autoUseNextExitReach = false;
                }
            }

            // Trigger interaction if set (for double tap on interactive tiles)
            if (this.game.player.interactOnReach) {
                const target = this.game.player.interactOnReach;
                this.game.player.clearInteractOnReach();
                this.game.interactionManager.triggerInteractAt(target);
            }
        }
    }

    // Cancel path execution
    cancelPathExecution() {
        this.cancelPath = true;
        this.isExecutingPath = false;
        // Cancel any active path sequence created for verbose pathing
        if (this.currentPathSequence) {
            try {
                this.game.animationScheduler.cancelSequence(this.currentPathSequence.id);
            } catch (e) {
                // Best-effort: if cancellation fails, fall back to flagging cancelPath
            }
            this.currentPathSequence = null;
        }
        if (this.currentPathSequenceFallback) {
            clearTimeout(this.currentPathSequenceFallback);
            this.currentPathSequenceFallback = null;
        }
    }

    // Check if a tile at (x,y) is interactive (has interaction logic but may not be walkable)
    isTileInteractive(x, y) {
        const tile = this.game.grid[y]?.[x];
        if (!tile) return false;

        // Signs
        if ((typeof tile === 'object' && tile.type === TILE_TYPES.SIGN) || tile === TILE_TYPES.SIGN) {
            return true;
        }

        // Lions (barter)
        if (tile === TILE_TYPES.LION) {
            return true;
        }

        // Squigs (barter)
        if (tile === TILE_TYPES.SQUIG) {
            return true;
        }

        // Enemy statues (info display)
        const statueTypes = [
            TILE_TYPES.LIZARDY_STATUE,
            TILE_TYPES.LIZARDO_STATUE,
            TILE_TYPES.LIZARDEAUX_STATUE,
            TILE_TYPES.ZARD_STATUE,
            TILE_TYPES.LAZERD_STATUE,
            TILE_TYPES.LIZORD_STATUE
        ];
        if (statueTypes.includes(tile)) {
            return true;
        }

        // Bombs (explode on interaction)
        if (typeof tile === 'object' && tile.type === TILE_TYPES.BOMB) {
            return true;
        }

        // Choppable tiles (grass, shrubbery, rock)
        const choppableTypes = [TILE_TYPES.GRASS, TILE_TYPES.SHRUBBERY, TILE_TYPES.ROCK];
        if (choppableTypes.includes(tile)) {
            return true;
        }

        return false;
    }

    // Find the nearest walkable tile adjacent to (targetX, targetY)
    findNearestWalkableAdjacent(targetX, targetY) {
        const directions = [
            {dx: 0, dy: -1}, // North
            {dx: 1, dy: 0},  // East
            {dx: 0, dy: 1},  // South
            {dx: -1, dy: 0}  // West
        ];

        // Check adjacent tiles in order (try north first, then east, etc.)
        for (const dir of directions) {
            const checkX = targetX + dir.dx;
            const checkY = targetY + dir.dy;

            // Check bounds
            if (checkX >= 0 && checkX < GRID_SIZE && checkY >= 0 && checkY < GRID_SIZE) {
                if (this.game.player.isWalkable(checkX, checkY, this.game.grid, -1, -1)) {
                    return { x: checkX, y: checkY };
                }
            }
        }

        return null; // No adjacent walkable tile found
    }

    addShackAtPlayerPosition() {
        const playerPos = this.game.player.getPosition();
        const x = playerPos.x - 1; // Center the shack relative to player
        const y = playerPos.y - 1;

        // Check if the area is clear (3x3 space needed, with space in front)
        let canPlace = true;
        for (let dy = 0; dy < 3 && canPlace; dy++) {
            for (let dx = 0; dx < 3 && canPlace; dx++) {
                const tileX = x + dx;
                const tileY = y + dy;
                if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) {
                    canPlace = false;
                } else if (this.game.grid[tileY][tileX] !== TILE_TYPES.FLOOR) {
                    canPlace = false;
                }
            }
        }
        // Check space in front (south side, middle bottom)
        const frontX = x + 1;
        const frontY = y + 3;
        if (canPlace && (frontY >= GRID_SIZE || this.game.grid[frontY][frontX] !== TILE_TYPES.FLOOR)) {
            canPlace = false;
        }

        if (canPlace) {
            // Place the 3x3 shack with PORT at middle bottom
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    if (dy === 2 && dx === 1) { // Middle bottom tile
                        this.game.grid[y + dy][x + dx] = TILE_TYPES.PORT; // Entrance
                    } else {
                        this.game.grid[y + dy][x + dx] = TILE_TYPES.SHACK;
                    }
                }
            }
            logger.log(`Shack spawned at player position (${playerPos.x}, ${playerPos.y})`);
        } else {
            logger.log("Cannot place shack here - area not clear");
        }
    }

    handleKeyPress(event) {
        if (this.game.isPlayerTurn === false) {
            this.cancelPathExecution();
            return;
        }

        if (this.game.player.isDead()) {
            return;
        }
        // If moving, cancel any pending charge
        if (this.game.pendingCharge) {
            this.game.pendingCharge = null;
            this.game.hideOverlayMessage();
        }

        // Only hide messages if not auto-pathing, as path execution handles this.
        if (!this.isExecutingPath) {
            // When the player acts, hide any open overlay message.
            // This now includes sign messages, which will close upon movement.
            if (this.game.displayingMessageForSign) {
                Sign.hideMessageForSign(this.game);
            } else if (this.game.bombPlacementMode) {
                // If moving, cancel bomb placement
                this.game.bombPlacementMode = false;
                this.game.bombPlacementPositions = [];
                this.game.hideOverlayMessage();
            } else {
                this.game.hideOverlayMessage();
            }
        }

        // Handle hotkey spawning — but don't treat movement keys as hotkeys.
        // Movement keys (WASD and arrow keys) must always be processed as movement.
        const lowerKey = (event.key || '').toLowerCase();
        const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
        if (!movementKeys.includes(lowerKey)) {
            if (consoleCommands.handleHotkey(this.game, event.key, event.shiftKey)) {
                event.preventDefault();
                return;
            }
        }

        // Debug hotkey for adding points
        if (event.key === '9') {
            this.game.player.addPoints(SIMULATION_CONSTANTS.DEFEAT_DAMAGE);
            this.game.combatManager.addPointAnimation(this.game.player.x, this.game.player.y, SIMULATION_CONSTANTS.DEFEAT_DAMAGE);
            this.game.uiManager.updatePlayerStats();
            return; // Stop further processing
        }

        // Debug hotkey for forcing consent banner display
        if (event.key === '0') {
            this.game.consentManager.forceShowConsentBanner();
            return; // Stop further processing
        }

        // Debug hotkey for adding 999 discoveries
        if (event.key === '8') {
            // Discoveries = visitedZones.size - spentDiscoveries
            // To get 999 discoveries, either add many zones or reduce spentDiscoveries
            // We'll reduce spentDiscoveries (negative number means "discovered" discoveries beyond visited zones)
            this.game.player.setSpentDiscoveries(this.game.player.getVisitedZones().size - 999);
            this.game.uiManager.updateZoneDisplay(); // Update the discoveries display
            return; // Stop further processing
        }

        // Debug hotkey for teleporting to level 3 (Wilds)
        if (event.key === '7') {
            // Teleport to zone (9,0) which is in level 3, and place player in the center.
            this.game.transitionToZone(9, 0, 'teleport', this.game.player.x, this.game.player.y);
            return; // Stop further processing
        }

        const currentPos = this.game.player.getPosition();
        let newX = currentPos.x;
        let newY = currentPos.y;
        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                newY--;
                break;
            case 's':
            case 'arrowdown':
                newY++;
                break;
            case 'a':
            case 'arrowleft':
                newX--;
                break;
            case 'd':
            case 'arrowright':
                newX++;
                break;
            default:
                return;
        }
        event.preventDefault();

        // Show tap/press feedback on the destination tile to mirror touch behavior
        // Skip visual/audio feedback for synthetic events (programmatic movement)
        try {
            if (!event._synthetic) {
                if (this.game && this.game.renderManager && typeof this.game.renderManager.showTapFeedback === 'function') {
                    this.game.renderManager.showTapFeedback(newX, newY);
                }
                if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                    this.game.soundManager.playSound('bloop');
                }
            }
        } catch (e) {
            // Best-effort: rendering feedback should not block input handling
        }

        // Check if player is trying to move onto an enemy tile
                const enemyAtTarget = this.game.enemies.find(enemy => enemy.x === newX && enemy.y === newY);
                let playerMoved = false;

                if (enemyAtTarget) {
                    // Player attacks enemy - simple bump of attacked tile
                    this.game.player.startAttackAnimation();
                    this.game.player.startBump(enemyAtTarget.x - currentPos.x, enemyAtTarget.y - currentPos.y);
                    enemyAtTarget.startBump(currentPos.x - enemyAtTarget.x, currentPos.y - enemyAtTarget.y);
                    this.game.combatManager.defeatEnemy(enemyAtTarget);
                    // Player does not move. Enemy turns will be started once below.
                } else {
                    // A move is an action, so increment bomb timers
                    this.game.incrementBombActions();

                    // Normal movement
                    playerMoved = this.game.player.move(newX, newY, this.game.grid, (zoneX, zoneY, exitSide) => {
                        this.game.transitionToZone(zoneX, zoneY, exitSide, currentPos.x, currentPos.y);
                    });
                }

                // Handle enemy movements based on zone entry flag
                if (this.game.justEnteredZone) {
                    this.game.justEnteredZone = false; // Reset flag after skipping enemy movement
                } else {
                    this.game.startEnemyTurns();

                    // If in a pitfall zone, increment the survival timer
                    if (this.game.isInPitfallZone) {
                        this.game.pitfallTurnsSurvived++;
                    }
                }

                // Collision and pickup checks are now handled after the enemy turn sequence finishes
                // this.game.checkCollisions();
                // this.game.checkItemPickup(); 

                this.game.updatePlayerPosition();
                this.game.updatePlayerStats();
    }


}
