import { GRID_SIZE, TILE_TYPES, INPUT_CONSTANTS, TILE_SIZE } from '../core/constants.js';
import { getExitDirection } from '../core/utils/transitionUtils.js';
import { Sign } from '../ui/Sign.js';
import audioManager from '../utils/AudioManager.js';

/**
 * InputController - Unified input management system
 *
 * Consolidates three previous input systems into one:
 * - PointerInput.js (mouse/touch via pointer events)
 * - InputBindings.js (keyboard routing and event setup)
 * - InteractionController.js (pathfinding, movement, interactions)
 *
 * This controller is the single source of truth for all player input,
 * using pointer events as the primary input method for both mouse and touch.
 */
export class InputController {
    constructor(game, inventoryService, keyHandler = null, exitHandler = null) {
        this.game = game;
        this.inventoryService = inventoryService;
        this.keyHandler = keyHandler;  // Optional callback for key press events (for testing)
        this.exitHandler = exitHandler;  // Optional callback for exit tap events (for testing)

        // Pointer tracking state
        this.activePointers = new Map(); // pointerId -> {startX, startY, startTime, lastTile}

        // Pathfinding and movement state
        this.isExecutingPath = false;
        this.pathExecutionTimer = null;
        this.cancelPath = false;
        this.currentPathSequence = null;
        this.currentPathSequenceFallback = null;

        // Tap detection state
        this.lastTapTime = null;
        this.lastTapX = null;
        this.lastTapY = null;
        this.lastTapClientX = null;
        this.lastTapClientY = null;
        this.tapTimeout = null;

        // Transition handling
        this.autoUseNextTransition = null;
        this.autoUseNextExitReach = false;

        // Visual feedback
        this.lastHighlightedTile = { x: null, y: null };

        // Audio state
        this._audioResumed = false;

        // Bind methods for event listeners
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
     * Set up all input event listeners
     */
    setupControls() {
        if (!this.game?.canvas) return;

        // Pointer events (unified mouse + touch)
        this.game.canvas.addEventListener('pointerdown', this._onPointerDown, { passive: true });
        this.game.canvas.addEventListener('pointermove', this._onPointerMove, { passive: true });
        this.game.canvas.addEventListener('pointerup', this._onPointerUp, { passive: true });
        this.game.canvas.addEventListener('pointercancel', this._onPointerCancel);

        // Keyboard events
        window.addEventListener('keydown', this._onKeyDown);
    }

    /**
     * Clean up all event listeners
     */
    destroy() {
        if (!this.game?.canvas) return;

        this.game.canvas.removeEventListener('pointerdown', this._onPointerDown);
        this.game.canvas.removeEventListener('pointermove', this._onPointerMove);
        this.game.canvas.removeEventListener('pointerup', this._onPointerUp);
        this.game.canvas.removeEventListener('pointercancel', this._onPointerCancel);
        window.removeEventListener('keydown', this._onKeyDown);
    }

    // ========================================
    // POINTER EVENT HANDLERS
    // ========================================

    _onPointerDown(e) {
        // Only primary button for mouse
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        this._resumeAudioIfNeeded();

        try { e.target.setPointerCapture?.(e.pointerId); } catch (err) {}

        const now = Date.now();
        const gridCoords = this._safeConvert(e.clientX, e.clientY);

        this.activePointers.set(e.pointerId, {
            startX: e.clientX,
            startY: e.clientY,
            startTime: now,
            lastTile: gridCoords
        });

        // If this is a touch and the pointer started on the player's tile, open radial UI immediately
        try {
            const info = this.activePointers.get(e.pointerId);
            const t = info?.lastTile;
            if (e.pointerType !== 'mouse' && t && this.game?.player) {
                const playerPos = this.game.player.getPosition();
                if (t.x === playerPos.x && t.y === playerPos.y && this.game.radialInventoryUI) {
                    // Normalize current tile
                    const currentTile = this.game.grid[playerPos.y]?.[playerPos.x];
                    const currentTileType = (typeof currentTile === 'object' && currentTile?.type !== undefined)
                        ? currentTile.type
                        : currentTile;
                    const portKind = (currentTile && typeof currentTile === 'object') ? currentTile.portKind : null;

                    // If standing on an exit or any port, do not open radial
                    if (currentTileType === TILE_TYPES.EXIT ||
                        currentTileType === TILE_TYPES.PORT ||
                        portKind === 'stairdown' ||
                        portKind === 'stairup') {
                        if (this.game.radialInventoryUI.open) {
                            try { this.game.radialInventoryUI.close(); } catch (err) {}
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
                        } catch (err) {}
                    }
                }
            }
        } catch (err) {}

        // Start hold feedback
        if (gridCoords && this.game?.renderManager?.startHoldFeedback) {
            this.game.renderManager.startHoldFeedback(gridCoords.x, gridCoords.y);
        }

        // Play bloop sound if not on enemy
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

        // If pointer moved onto the player's tile and radial isn't open yet, open it (touch only)
        try {
            if (e.pointerType !== 'mouse' && this.game?.player && this.game.radialInventoryUI) {
                const playerPos = this.game.player.getPosition();
                if (gc.x === playerPos.x && gc.y === playerPos.y && !info._radialHoverOpened) {
                    const currentTile = this.game.grid[playerPos.y]?.[playerPos.x];
                    if (currentTile !== TILE_TYPES.EXIT && currentTile !== TILE_TYPES.PORT) {
                        try { this.game.radialInventoryUI.openAtPlayer(); } catch (err) {}
                        info._radialHoverOpened = true;
                    }
                }
            }
        } catch (err) {}

        // Update hold feedback
        if (this.game?.renderManager?.startHoldFeedback) {
            this.game.renderManager.startHoldFeedback(gc.x, gc.y);
        }

        // Play bloop sound when moving to a different tile (if not on enemy)
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

        try { e.target.releasePointerCapture?.(e.pointerId); } catch (err) {}

        // Clear hold feedback
        if (this.game?.renderManager?.clearFeedback) {
            this.game.renderManager.clearFeedback();
        }

        // If radial UI was opened on pointerdown, suppress normal tap handling
        if (info._radialOpened) {
            this.activePointers.delete(e.pointerId);
            return;
        }

        // For mouse input, always trigger tap at release coordinates
        if (e.pointerType === 'mouse') {
            try { this.handleTap(e.clientX, e.clientY); } catch (err) {}
            this.activePointers.delete(e.pointerId);
            return;
        }

        // For touch input, detect tap vs swipe
        const deltaX = e.clientX - info.startX;
        const deltaY = e.clientY - info.startY;
        const touchDuration = Date.now() - info.startTime;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Tap conditions
        if (touchDuration < INPUT_CONSTANTS.MAX_TAP_TIME && distance < INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
            try { this.handleTap(e.clientX, e.clientY); } catch (err) {}
        } else if (touchDuration >= INPUT_CONSTANTS.MAX_TAP_TIME) {
            try { this.handleTap(e.clientX, e.clientY); } catch (err) {}
        } else if (distance > INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
            // Interpret as swipe -> directional key
            let direction = '';
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                direction = deltaX > 0 ? 'arrowright' : 'arrowleft';
            } else {
                direction = deltaY > 0 ? 'arrowdown' : 'arrowup';
            }
            try { this.handleKeyPress({ key: direction, preventDefault: () => {} }); } catch (err) {}
        }

        this.activePointers.delete(e.pointerId);
    }

    _onPointerCancel(e) {
        if (this.game?.renderManager?.clearFeedback) {
            this.game.renderManager.clearFeedback();
        }
        this.activePointers.delete(e.pointerId);
    }

    // ========================================
    // KEYBOARD EVENT HANDLERS
    // ========================================

    _onKeyDown(event) {
        this._resumeAudioIfNeeded();
        try { this.handleKeyPress(event); } catch (e) {}
    }

    // ========================================
    // TAP HANDLING
    // ========================================

    handleTap(screenX, screenY) {
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
            this.tapTimeout = null;
        }

        const gridCoords = this.convertScreenToGrid(screenX, screenY);

        // Handle displaying message for sign
        if (this.game.displayingMessageForSign) {
            if (this.isTileInteractive(gridCoords.x, gridCoords.y)) {
                this.game.interactionManager.triggerInteractAt(gridCoords);
                return;
            } else {
                Sign.hideMessageForSign(this.game);
            }
        }

        // Show tap feedback
        try {
            if (this.game?.renderManager?.showTapFeedback) {
                this.game.renderManager.showTapFeedback(gridCoords.x, gridCoords.y);
            }
        } catch (e) {}

        const clickedTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        const clickedTileType = (typeof clickedTile === 'object' && clickedTile?.type !== undefined)
            ? clickedTile.type
            : clickedTile;
        const enemyAtTile = this.game.enemies.find(enemy => enemy.x === gridCoords.x && enemy.y === gridCoords.y);
        const playerPos = this.game.player.getPosition();

        // Shovel mode
        if (this.game.shovelMode) {
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
            if (isAdjacent) {
                const success = this.inventoryService.useItem(this.game.activeShovel, {
                    targetX: gridCoords.x,
                    targetY: gridCoords.y
                });
                if (success) {
                    this.game.shovelMode = false;
                    this.game.activeShovel = null;
                    this.game.hideOverlayMessage();
                }
            } else {
                this.game.shovelMode = false;
                this.game.activeShovel = null;
                this.game.hideOverlayMessage();
            }
            return;
        }

        // Close stats panel if open
        if (this.game.uiManager.isStatsPanelOpen()) {
            this.game.uiManager.hideStatsPanel();
            return;
        }

        // Check for double tap
        const isDoubleTap = this.handleDoubleTapLogic(gridCoords, screenX, screenY);

        // Play appropriate sound
        try {
            if (enemyAtTile) {
                audioManager.playSound('tap_enemy', { game: this.game });
            } else if (isDoubleTap) {
                audioManager.playSound('double_tap', { game: this.game });
            } else {
                audioManager.playSound('bloop', { game: this.game });
            }
        } catch (e) {}

        // Handle pending charge selection (spear, horse, bow)
        try {
            if (this.game.pendingCharge?.selectionType) {
                const selType = this.game.pendingCharge.selectionType;
                let chargeDetails = null;
                const playerPosForSel = this.game.player.getPosition();

                if (selType === 'bishop_spear') {
                    chargeDetails = this.game.combatManager.isValidBishopSpearCharge(gridCoords, playerPosForSel);
                } else if (selType === 'horse_icon') {
                    chargeDetails = this.game.combatManager.isValidHorseIconCharge(gridCoords, playerPosForSel);
                } else if (selType === 'bow') {
                    chargeDetails = this.game.combatManager.isValidBowShot(gridCoords, playerPosForSel);
                }

                if (chargeDetails) {
                    this.game.combatManager.confirmPendingCharge(chargeDetails);
                } else {
                    this.game.combatManager.cancelPendingCharge();
                }
                return true;
            }
        } catch (e) {}

        // Handle single tap on player's own tile (not double tap)
        if (!isDoubleTap && gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
            try {
                const currentTile = this.game.grid[playerPos.y]?.[playerPos.x];
                const currentTileType = (typeof currentTile === 'object' && currentTile?.type !== undefined)
                    ? currentTile.type
                    : currentTile;

                // If standing on exit or port, trigger transition immediately on single tap
                if (currentTileType === TILE_TYPES.EXIT) {
                    if (this.exitHandler) {
                        this.exitHandler(playerPos.x, playerPos.y);
                    } else {
                        this.performExitTap(playerPos.x, playerPos.y);
                    }
                    return true;
                }

                if (currentTileType === TILE_TYPES.PORT) {
                    try { this.game.interactionManager.zoneManager.handlePortTransition(); } catch (e) {}
                    return true;
                }

                // Otherwise toggle radial UI
                if (this.game.radialInventoryUI) {
                    if (this.game.radialInventoryUI.open) {
                        this.game.radialInventoryUI.close();
                    } else {
                        this.game.radialInventoryUI.openAtPlayer();
                    }
                    return true;
                }
            } catch (e) {}
        }

        // Handle double tap
        if (isDoubleTap) {
            if (clickedTileType === TILE_TYPES.EXIT || clickedTileType === TILE_TYPES.PORT) {
                if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
                    // Standing on exit/port - trigger transition immediately
                    if (clickedTileType === TILE_TYPES.EXIT) {
                        if (this.exitHandler) {
                            this.exitHandler(gridCoords.x, gridCoords.y);
                        } else {
                            this.performExitTap(gridCoords.x, gridCoords.y);
                        }
                    } else {
                        try { this.game.interactionManager.zoneManager.handlePortTransition(); } catch (e) {}
                    }
                } else {
                    // Not standing on exit/port - path to it and auto-use on arrival
                    this.autoUseNextTransition = (clickedTileType === TILE_TYPES.EXIT) ? 'exit' : 'port';
                    this.executeMovementOrInteraction(gridCoords);
                }
            } else {
                // Double tap on non-transition tile - interact on reach
                this.game.player.setInteractOnReach(gridCoords.x, gridCoords.y);
                this.executeMovementOrInteraction(gridCoords);
            }
            return;
        } else {
            // Delay to wait for potential double tap
            this.tapTimeout = setTimeout(() => this.executeMovementOrInteraction(gridCoords), INPUT_CONSTANTS.DOUBLE_TAP_TIME);
        }

        // Cancel path execution if clicking different tile
        const isClickingDifferentTile = gridCoords.x !== playerPos.x || gridCoords.y !== playerPos.y;
        if (this.isExecutingPath && isClickingDifferentTile) {
            this.cancelPathExecution();
        }
        if (this.isExecutingPath && !isClickingDifferentTile) {
            if (this.game.player.stats.verbosePathAnimations && isClickingDifferentTile) {
                this.cancelPathExecution();
            }
            return;
        }
    }

    // ========================================
    // KEY PRESS HANDLING
    // ========================================

    handleKeyPress(event) {
        if (this.game.isPlayerTurn === false) {
            this.cancelPathExecution();
            return;
        }
        if (this.game.player.isDead()) return;

        // Clear pending states
        if (this.game.pendingCharge) {
            this.game.pendingCharge = null;
            this.game.hideOverlayMessage();
        }

        if (!this.isExecutingPath) {
            if (this.game.displayingMessageForSign) {
                Sign.hideMessageForSign(this.game);
            } else if (this.game.bombPlacementMode) {
                this.game.bombPlacementMode = false;
                this.game.bombPlacementPositions = [];
                this.game.hideOverlayMessage();
            } else {
                this.game.hideOverlayMessage();
            }
        }

        const lowerKey = (event.key || '').toLowerCase();
        const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

        // Allow hotkeys
        if (!movementKeys.includes(lowerKey)) {
            try {
                if (window.consoleCommands?.handleHotkey?.(this.game, event.key, event.shiftKey)) {
                    event.preventDefault();
                    return;
                }
            } catch (e) {}
        }

        // Debug hotkeys
        if (event.key === '9') {
            this.game.player.addPoints(1);
            this.game.combatManager.addPointAnimation(this.game.player.x, this.game.player.y, 1);
            this.game.uiManager.updatePlayerStats();
            return;
        }
        if (event.key === '0') {
            this.game.consentManager.forceShowConsentBanner();
            return;
        }
        if (event.key === '8') {
            this.game.player.setSpentDiscoveries(this.game.player.getVisitedZones().size - 999);
            this.game.uiManager.updateZoneDisplay();
            return;
        }
        if (event.key === '7') {
            this.game.transitionToZone(9, 0, 'teleport', this.game.player.x, this.game.player.y);
            return;
        }

        // Calculate new position
        const currentPos = this.game.player.getPosition();
        let newX = currentPos.x, newY = currentPos.y;

        switch (event.key.toLowerCase()) {
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
            case 'k':
                try { this.game.player.startBackflip(); } catch (e) {}
                return;
            default:
                return;
        }

        event.preventDefault();

        // Show feedback for manual key press (not synthetic)
        try {
            if (!event._synthetic) {
                if (this.game?.renderManager?.showTapFeedback) {
                    this.game.renderManager.showTapFeedback(newX, newY);
                }
                audioManager.playSound('bloop', { game: this.game });
            }
        } catch (e) {}

        // Handle combat or movement
        let playerMoved = false;
        const enemyAtTarget = this.game.enemies.find(enemy => enemy.x === newX && enemy.y === newY);

        if (enemyAtTarget) {
            this.game.player.startAttackAnimation();
            enemyAtTarget.startBump(currentPos.x - enemyAtTarget.x, currentPos.y - enemyAtTarget.y);

            try { this.game.player.setAction('attack'); } catch (e) {}

            // Play axe slash sound if player has axe
            if (this.game.player.abilities?.has?.('axe')) {
                audioManager.playSound('slash', { game: this.game });
                enemyAtTarget._suppressAttackSound = true;
            }

            const result = this.game.combatManager.defeatEnemy(enemyAtTarget, 'player');
            if (result?.defeated) {
                if (result.consecutiveKills >= 2) {
                    this.game.player.startBackflip();
                } else {
                    this.game.player.startBump(enemyAtTarget.x - currentPos.x, enemyAtTarget.y - currentPos.y);
                }
            }
        } else {
            this.game.incrementBombActions();
            playerMoved = this.game.player.move(newX, newY, this.game.grid, (zoneX, zoneY, exitSide) => {
                this.game.transitionToZone(zoneX, zoneY, exitSide, currentPos.x, currentPos.y);
            });
        }

        // Handle free turns after zone entry
        if (typeof this.game.justEnteredZoneCount === 'number' && this.game.justEnteredZoneCount > 0) {
            this.game.justEnteredZoneCount = Math.max(0, this.game.justEnteredZoneCount - 1);
            if (this.game.justEnteredZoneCount === 0) {
                this.game.justEnteredZone = false;
                delete this.game.justEnteredZoneCount;
            }
        } else if (this.game.justEnteredZone) {
            this.game.justEnteredZone = false;
        } else {
            this.game.startEnemyTurns();
            if (this.game.isInPitfallZone) {
                this.game.pitfallTurnsSurvived++;
            }
        }

        this.game.updatePlayerPosition();
        this.game.updatePlayerStats();
    }

    // ========================================
    // PATHFINDING
    // ========================================

    findPath(startX, startY, targetX, targetY) {
        if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE) {
            return null;
        }

        const targetTile = this.game.grid[targetY]?.[targetX];
        if ((targetTile && typeof targetTile === 'object' && targetTile.type === TILE_TYPES.SIGN) ||
            targetTile === TILE_TYPES.SIGN) {
            return null;
        }

        // Check for enemy at target
        const enemyAtTarget = this.game.enemies?.find(e => e.x === targetX && e.y === targetY && e.health > 0);
        if (enemyAtTarget) {
            if (!(this.game.player.stats?.autoPathWithEnemies)) {
                return null;
            }
        } else {
            if (!this.game.player.isWalkable(targetX, targetY, this.game.grid, startX, startY)) {
                return null;
            }
        }

        if (startX === targetX && startY === targetY) {
            return [];
        }

        // BFS pathfinding
        const queue = [{ x: startX, y: startY, path: [] }];
        const visited = new Set([`${startX},${startY}`]);
        const directions = [
            { dx: 0, dy: -1, key: 'arrowup' },
            { dx: 0, dy: 1, key: 'arrowdown' },
            { dx: -1, dy: 0, key: 'arrowleft' },
            { dx: 1, dy: 0, key: 'arrowright' }
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            for (const dir of directions) {
                const newX = current.x + dir.dx;
                const newY = current.y + dir.dy;
                const key = `${newX},${newY}`;

                if (visited.has(key)) continue;
                visited.add(key);

                if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE &&
                    this.game.player.isWalkable(newX, newY, this.game.grid, current.x, current.y)) {
                    const newPath = [...current.path, dir.key];
                    if (newX === targetX && newY === targetY) {
                        return newPath;
                    }
                    queue.push({ x: newX, y: newY, path: newPath });
                }
            }
        }

        return null;
    }

    // ========================================
    // MOVEMENT & INTERACTION
    // ========================================

    executeMovementOrInteraction(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const handled = this.game.interactionManager.handleTap(gridCoords);

        if (!handled) {
            // Restrict to single step if enemies exist and auto-path disabled
            const enemiesExist = this.game.enemies?.some(e => e.health > 0);
            const allowAutoPath = !!(this.game.player.stats?.autoPathWithEnemies);

            if (enemiesExist && !allowAutoPath) {
                const dx = gridCoords.x - playerPos.x;
                const dy = gridCoords.y - playerPos.y;

                if (dx === 0 && dy === 0) return;

                // Choose primary cardinal direction
                let stepKey = null;
                if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
                    stepKey = dx > 0 ? 'arrowright' : 'arrowleft';
                } else if (dy !== 0) {
                    stepKey = dy > 0 ? 'arrowdown' : 'arrowup';
                }

                if (!stepKey) return;

                const stepX = playerPos.x + (stepKey === 'arrowright' ? 1 : stepKey === 'arrowleft' ? -1 : 0);
                const stepY = playerPos.y + (stepKey === 'arrowdown' ? 1 : stepKey === 'arrowup' ? -1 : 0);

                if (this.game.player.isWalkable(stepX, stepY, this.game.grid, playerPos.x, playerPos.y)) {
                    this.executePath([stepKey]);
                }
                return;
            }

            // Auto-path to interactive tiles or direct movement
            const isInteractive = this.isTileInteractive(gridCoords.x, gridCoords.y);
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

            if (isInteractive && !isAdjacent) {
                const adjacentTile = this.findNearestWalkableAdjacent(gridCoords.x, gridCoords.y);
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

    executePath(path) {
        if (this.isExecutingPath) {
            this.cancelPathExecution();
        }

        this.isExecutingPath = true;
        this.cancelPath = false;
        this.currentPathSequence = null;

        // Compute final destination for visual feedback
        try {
            const pos = this.game.player.getPosition();
            let destX = pos.x, destY = pos.y;
            for (const stepKey of path) {
                switch ((stepKey || '').toLowerCase()) {
                    case 'arrowup': case 'w': destY--; break;
                    case 'arrowdown': case 's': destY++; break;
                    case 'arrowleft': case 'a': destX--; break;
                    case 'arrowright': case 'd': destX++; break;
                }
            }
            if (this.game?.renderManager?.startHoldFeedback) {
                this.game.renderManager.startHoldFeedback(destX, destY);
            }
        } catch (e) {}

        // Execute path with animation scheduling
        if (this.game.player.stats?.verbosePathAnimations) {
            this._executePathWithScheduler(path);
        } else {
            this._executePathImmediate(path);
        }
    }

    _executePathWithScheduler(path) {
        const seq = this.game.animationScheduler.createSequence();
        this.currentPathSequence = seq;

        for (let i = 0; i < path.length; i++) {
            const stepKey = path[i];
            seq.then(() => {
                if (this.cancelPath) return;
                const ev = { key: stepKey, preventDefault: () => {}, _synthetic: true };
                if (this.keyHandler) {
                    this.keyHandler(ev);
                } else {
                    this.handleKeyPress(ev);
                }
            }).wait(INPUT_CONSTANTS.LEGACY_PATH_DELAY);
        }

        seq.then(() => {
            if (this.cancelPath) {
                this.cancelPath = false;
                this.isExecutingPath = false;
                return;
            }
            this.isExecutingPath = false;
            this._handlePathCompletion();
        });

        const startResult = seq.start();
        const fallbackDelay = Math.max(50, path.length * INPUT_CONSTANTS.LEGACY_PATH_DELAY + 50);

        if (startResult && typeof startResult.then === 'function') {
            startResult.then(() => {
                if (this.currentPathSequence?.id === seq.id) {
                    this.currentPathSequence = null;
                }
                if (this.currentPathSequenceFallback) {
                    clearTimeout(this.currentPathSequenceFallback);
                    this.currentPathSequenceFallback = null;
                }
            }).catch(() => {
                if (this.currentPathSequence?.id === seq.id) {
                    this.currentPathSequence = null;
                }
                if (this.currentPathSequenceFallback) {
                    clearTimeout(this.currentPathSequenceFallback);
                    this.currentPathSequenceFallback = null;
                }
            });
        } else {
            this.currentPathSequenceFallback = setTimeout(() => {
                if (this.currentPathSequence?.id === seq.id) {
                    this.currentPathSequence = null;
                }
                this.currentPathSequenceFallback = null;
            }, fallbackDelay);
        }
    }

    _executePathImmediate(path) {
        const stepDelay = Math.max(40, INPUT_CONSTANTS.LEGACY_PATH_DELAY || 50);
        let stepIndex = 0;

        const runNextStep = () => {
            if (this.cancelPath || stepIndex >= path.length) {
                this.isExecutingPath = false;
                this._handlePathCompletion();
                return;
            }

            const ev = { key: path[stepIndex], preventDefault: () => {}, _synthetic: true };
            if (this.keyHandler) {
                this.keyHandler(ev);
            } else {
                this.handleKeyPress(ev);
            }
            stepIndex++;

            // Schedule next step with delay
            if (stepIndex < path.length) {
                setTimeout(() => {
                    requestAnimationFrame(() => runNextStep());
                }, stepDelay);
            } else {
                // Path complete
                setTimeout(() => {
                    this.isExecutingPath = false;
                    this._handlePathCompletion();
                }, stepDelay);
            }
        };

        this.isExecutingPath = true;
        this.cancelPath = false;
        runNextStep();  // Execute first step immediately
    }

    _handlePathCompletion() {
        try {
            if (this.game?.renderManager?.clearFeedback) {
                this.game.renderManager.clearFeedback();
            }
        } catch (e) {}

        const playerPos = this.game.player.getPosition();

        try {
            const landedTile = this.game.grid[playerPos.y]?.[playerPos.x];
            const landedTileType = (typeof landedTile === 'object' && landedTile?.type !== undefined)
                ? landedTile.type
                : landedTile;

            if (landedTileType === TILE_TYPES.EXIT) {
                if (this.autoUseNextExitReach || this.autoUseNextTransition === 'exit') {
                    if (this.exitHandler) {
                        this.exitHandler(playerPos.x, playerPos.y);
                    } else {
                        this.performExitTap(playerPos.x, playerPos.y);
                    }
                    this.autoUseNextExitReach = false;
                    this.autoUseNextTransition = null;
                }
            }

            if (landedTileType === TILE_TYPES.PORT) {
                if (this.autoUseNextTransition === 'port') {
                    try {
                        this.game.interactionManager.zoneManager.handlePortTransition();
                    } catch (e) {}
                    this.autoUseNextTransition = null;
                }
            }
        } catch (e) {}

        // Handle interact on reach
        if (this.game.player.interactOnReach) {
            const target = this.game.player.interactOnReach;
            this.game.player.clearInteractOnReach();
            this.game.interactionManager.triggerInteractAt(target);
        }
    }

    cancelPathExecution() {
        this.cancelPath = true;
        this.isExecutingPath = false;

        try {
            if (this.game?.renderManager?.clearFeedback) {
                this.game.renderManager.clearFeedback();
            }
        } catch (e) {}

        if (this.currentPathSequence) {
            try {
                this.game.animationScheduler.cancelSequence(this.currentPathSequence.id);
            } catch (e) {}
            this.currentPathSequence = null;
        }

        if (this.currentPathSequenceFallback) {
            clearTimeout(this.currentPathSequenceFallback);
            this.currentPathSequenceFallback = null;
        }
    }

    // ========================================
    // HELPER METHODS
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
            return null;
        }
    }

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

    isTileInteractive(x, y) {
        const tile = this.game.grid[y]?.[x];
        if (!tile) return false;

        const tileType = (typeof tile === 'object' && tile.type !== undefined) ? tile.type : tile;

        if (tileType === TILE_TYPES.SIGN || tileType === TILE_TYPES.LION || tileType === TILE_TYPES.SQUIG) {
            return true;
        }

        const npcTypes = [
            TILE_TYPES.PENNE, TILE_TYPES.NIB, TILE_TYPES.RUNE, TILE_TYPES.MARK,
            TILE_TYPES.AXELOTL, TILE_TYPES.GOUGE, TILE_TYPES.CRAYN, TILE_TYPES.FELT,
            TILE_TYPES.FORGE
        ];

        const statueTypes = [
            TILE_TYPES.LIZARDY_STATUE, TILE_TYPES.LIZARDO_STATUE, TILE_TYPES.LIZARDEAUX_STATUE,
            TILE_TYPES.ZARD_STATUE, TILE_TYPES.LAZERD_STATUE, TILE_TYPES.LIZORD_STATUE
        ];

        const itemStatues = [
            TILE_TYPES.BOMB_STATUE, TILE_TYPES.SPEAR_STATUE, TILE_TYPES.BOW_STATUE,
            TILE_TYPES.HORSE_STATUE, TILE_TYPES.BOOK_STATUE, TILE_TYPES.SHOVEL_STATUE
        ];

        const choppableTypes = [TILE_TYPES.GRASS, TILE_TYPES.SHRUBBERY, TILE_TYPES.ROCK];

        return npcTypes.includes(tileType) ||
               statueTypes.includes(tileType) ||
               itemStatues.includes(tileType) ||
               tileType === TILE_TYPES.TABLE ||
               choppableTypes.includes(tileType);
    }

    findNearestWalkableAdjacent(targetX, targetY) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];

        for (const dir of directions) {
            const checkX = targetX + dir.dx;
            const checkY = targetY + dir.dy;
            if (checkX >= 0 && checkX < GRID_SIZE && checkY >= 0 && checkY < GRID_SIZE) {
                if (this.game.player.isWalkable(checkX, checkY, this.game.grid, -1, -1)) {
                    return { x: checkX, y: checkY };
                }
            }
        }

        return null;
    }

    performExitTap(exitX, exitY) {
        const direction = getExitDirection(exitX, exitY);
        if (direction) {
            const ev = { key: direction, preventDefault: () => {}, _synthetic: true };
            if (this.keyHandler) {
                this.keyHandler(ev);
            } else {
                this.handleKeyPress(ev);
            }
        }
    }

    handleExitTap(x, y) {
        this.performExitTap(x, y);
        return;  // For compatibility with tests that expect a return value
    }

    addShackAtPlayerPosition() {
        // Legacy method - may be removed if not used
        return null;
    }

    _resumeAudioIfNeeded() {
        if (this._audioResumed) return;
        this._audioResumed = true;
        try {
            if (this.game?.soundManager?.resumeAudioContext) {
                this.game.soundManager.resumeAudioContext();
            }
        } catch (e) {}
    }

    // Legacy method for backward compatibility
    setupTouchControls() {
        // No-op - pointer events handle both mouse and touch
    }
}
