import { GRID_SIZE, TILE_TYPES, INPUT_CONSTANTS, TILE_SIZE } from '../core/constants.js';
import { getExitDirection } from '../core/utils/transitionUtils.js';

export class InteractionController {
    constructor(game, itemUsageManager, keyHandler, exitHandler) {
        this.game = game;
        this.itemUsageManager = itemUsageManager;
        this.keyHandler = keyHandler || null;
        this.exitHandler = exitHandler || null;

        this.isExecutingPath = false;
        this.pathExecutionTimer = null;
        this.cancelPath = false;
        this.currentPathSequence = null;
        this.currentPathSequenceFallback = null;
        this.lastTapTime = null;
        this.lastTapX = null;
        this.lastTapY = null;
        this.lastTapClientX = null;
        this.lastTapClientY = null;
        this.tapTimeout = null;
        this.autoUseNextTransition = null;
        this.lastHighlightedTile = { x: null, y: null };
    }

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

    // BFS pathfinder extracted from InputManager
    findPath(startX, startY, targetX, targetY) {
        if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE) return null;
        const targetTile = this.game.grid[targetY]?.[targetX];
        if ((targetTile && typeof targetTile === 'object' && targetTile.type === TILE_TYPES.SIGN) || targetTile === TILE_TYPES.SIGN) {
            return null;
        }
        if (!this.game.player.isWalkable(targetX, targetY, this.game.grid, startX, startY)) return null;
        if (startX === targetX && startY === targetY) return [];

        const queue = [{x: startX, y: startY, path: []}];
        const visited = new Set([`${startX},${startY}`]);
        const directions = [
            {dx: 0, dy: -1, key: 'arrowup'},
            {dx: 0, dy: 1, key: 'arrowdown'},
            {dx: -1, dy: 0, key: 'arrowleft'},
            {dx: 1, dy: 0, key: 'arrowright'}
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
                    if (newX === targetX && newY === targetY) return newPath;
                    queue.push({x: newX, y: newY, path: newPath});
                }
            }
        }
        return null;
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
                if (distSq <= tol * tol) isDoubleTap = true;
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
        // Normalize: tile can be a number or an object with a .type property
        const tileType = (typeof tile === 'object' && tile.type !== undefined) ? tile.type : tile;

        if (tileType === TILE_TYPES.SIGN) return true;
        if (tileType === TILE_TYPES.LION) return true;
        if (tileType === TILE_TYPES.SQUIG) return true;

        // Treat common NPC tiles as interactive so clicks will auto-path to an adjacent walkable tile
        const npcTypes = [
            TILE_TYPES.PENNE,
            TILE_TYPES.NIB,
            TILE_TYPES.RUNE,
            TILE_TYPES.MARK,
            TILE_TYPES.AXELOTL,
            TILE_TYPES.GOUGE,
            TILE_TYPES.CRAYN,
            TILE_TYPES.FELT,
            TILE_TYPES.FORGE
        ];
        if (npcTypes.includes(tileType)) return true;

        const statueTypes = [
            TILE_TYPES.LIZARDY_STATUE,
            TILE_TYPES.LIZARDO_STATUE,
            TILE_TYPES.LIZARDEAUX_STATUE,
            TILE_TYPES.ZARD_STATUE,
            TILE_TYPES.LAZERD_STATUE,
            TILE_TYPES.LIZORD_STATUE
        ];
        if (statueTypes.includes(tileType)) return true;

        // Include item/statue doodads (stone item statues)
        const itemStatues = [
            TILE_TYPES.BOMB_STATUE,
            TILE_TYPES.SPEAR_STATUE,
            TILE_TYPES.BOW_STATUE,
            TILE_TYPES.HORSE_STATUE,
            TILE_TYPES.BOOK_STATUE,
            TILE_TYPES.SHOVEL_STATUE
        ];
        if (itemStatues.includes(tileType)) return true;

        // Other doodads that should be interactive (e.g., table)
        if (tileType === TILE_TYPES.TABLE) return true;

    // Choppable tiles
        const choppableTypes = [TILE_TYPES.GRASS, TILE_TYPES.SHRUBBERY, TILE_TYPES.ROCK];
        if (choppableTypes.includes(tileType)) return true;
        return false;
    }

    findNearestWalkableAdjacent(targetX, targetY) {
        const directions = [
            {dx: 0, dy: -1},
            {dx: 1, dy: 0},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0}
        ];
        for (const dir of directions) {
            const checkX = targetX + dir.dx;
            const checkY = targetY + dir.dy;
            if (checkX >= 0 && checkX < GRID_SIZE && checkY >= 0 && checkY < GRID_SIZE) {
                if (this.game.player.isWalkable(checkX, checkY, this.game.grid, -1, -1)) return { x: checkX, y: checkY };
            }
        }
        return null;
    }

    executeMovementOrInteraction(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const handled = this.game.interactionManager.handleTap(gridCoords);
        if (!handled) {
            const isInteractive = this.isTileInteractive(gridCoords.x, gridCoords.y);
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
            if (isInteractive && !isAdjacent) {
                const adjacentTile = this.findNearestWalkableAdjacent(gridCoords.x, gridCoords.y);
                if (adjacentTile) {
                    const path = this.findPath(playerPos.x, playerPos.y, adjacentTile.x, adjacentTile.y);
                    if (path && path.length > 0) this.executePath(path);
                }
            } else {
                const path = this.findPath(playerPos.x, playerPos.y, gridCoords.x, gridCoords.y);
                if (path && path.length > 0) this.executePath(path);
            }
        }
    }

    // Perform the actual exit action (dispatches a synthetic key or falls back to internal handler)
    performExitTap(exitX, exitY) {
        const direction = getExitDirection(exitX, exitY);
        if (direction) {
            const ev = { key: direction, preventDefault: () => {}, _synthetic: true };
            if (this.keyHandler) this.keyHandler(ev); else this.handleKeyPress(ev);
        }
    }

    executePath(path) {
        if (this.isExecutingPath) this.cancelPathExecution();
        this.isExecutingPath = true;
        this.cancelPath = false;
        this.currentPathSequence = null;

        // Compute final destination coordinates by simulating the path steps
        try {
            const pos = this.game.player.getPosition();
            let destX = pos.x, destY = pos.y;
            for (const stepKey of path) {
                switch ((stepKey || '').toLowerCase()) {
                    case 'arrowup': case 'w': destY--; break;
                    case 'arrowdown': case 's': destY++; break;
                    case 'arrowleft': case 'a': destX--; break;
                    case 'arrowright': case 'd': destX++; break;
                    default: break;
                }
            }
            // Show a persistent selector at the destination while auto-pathing
            if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
                this.game.renderManager.startHoldFeedback(destX, destY);
            }
        } catch (e) {
            // Non-fatal; if anything goes wrong we simply won't show the persistent selector
        }

        if (this.game.player.stats && this.game.player.stats.verbosePathAnimations) {
            const seq = this.game.animationScheduler.createSequence();
            this.currentPathSequence = seq;
            for (let i = 0; i < path.length; i++) {
                const stepKey = path[i];
                    seq.then(() => {
                    if (this.cancelPath) return;
                    const ev = { key: stepKey, preventDefault: () => {}, _synthetic: true };
                    if (this.keyHandler) this.keyHandler(ev); else this.handleKeyPress(ev);
                }).wait(INPUT_CONSTANTS.LEGACY_PATH_DELAY);
            }

            seq.then(() => {
                if (this.cancelPath) { this.cancelPath = false; this.isExecutingPath = false; return; }
                this.isExecutingPath = false;
                const playerPos = this.game.player.getPosition();
                // Clear persistent selector now that path completed
                try { if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') this.game.renderManager.clearFeedback(); } catch (e) {}
                if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT) {
                    if (this.autoUseNextTransition === 'exit') {
                        if (this.exitHandler) this.exitHandler(playerPos.x, playerPos.y); else this.performExitTap(playerPos.x, playerPos.y);
                        this.autoUseNextTransition = null;
                    }
                } else if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.PORT) {
                    if (this.autoUseNextTransition === 'port') { try { this.game.interactionManager.zoneManager.handlePortTransition(); } catch (e) {} this.autoUseNextTransition = null; }
                }
                if (this.game.player.interactOnReach) {
                    const target = this.game.player.interactOnReach;
                    this.game.player.clearInteractOnReach();
                    this.game.interactionManager.triggerInteractAt(target);
                }
            });

            const startResult = seq.start();
            const fallbackDelay = Math.max(50, path.length * INPUT_CONSTANTS.LEGACY_PATH_DELAY + 50);
            if (startResult && typeof startResult.then === 'function') {
                startResult.then(() => {
                    if (this.currentPathSequence && this.currentPathSequence.id === seq.id) this.currentPathSequence = null;
                    if (this.currentPathSequenceFallback) { clearTimeout(this.currentPathSequenceFallback); this.currentPathSequenceFallback = null; }
                }).catch(() => {
                    if (this.currentPathSequence && this.currentPathSequence.id === seq.id) this.currentPathSequence = null;
                    if (this.currentPathSequenceFallback) { clearTimeout(this.currentPathSequenceFallback); this.currentPathSequenceFallback = null; }
                });
            } else {
                this.currentPathSequenceFallback = setTimeout(() => {
                    if (this.currentPathSequence && this.currentPathSequence.id === seq.id) this.currentPathSequence = null;
                    this.currentPathSequenceFallback = null;
                }, fallbackDelay);
            }
        } else {
            // Stagger execution of path steps so each movement is processed in its own
            // tick. This lets animation and rendering happen between steps and avoids
            // instantaneous synchronous moves that skip frames.
            const stepDelay = Math.max(40, INPUT_CONSTANTS.LEGACY_PATH_DELAY || 50);
            let stepIndex = 0;
            const runNextStep = () => {
                if (this.cancelPath || stepIndex >= path.length) {
                    this.isExecutingPath = false;
                    // Clear persistent selector on completion/cancel
                    try { if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') this.game.renderManager.clearFeedback(); } catch (e) {}
                    // Post-processing after path completes
                    const playerPos = this.game.player.getPosition();
                    if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT) {
                        if (this.autoUseNextExitReach) { if (this.exitHandler) this.exitHandler(playerPos.x, playerPos.y); else this.performExitTap(playerPos.x, playerPos.y); this.autoUseNextExitReach = false; }
                    }
                    if (this.game.player.interactOnReach) {
                        const target = this.game.player.interactOnReach;
                        this.game.player.clearInteractOnReach();
                        this.game.interactionManager.triggerInteractAt(target);
                    }
                    return;
                }

                const ev = { key: path[stepIndex], preventDefault: () => {}, _synthetic: true };
                if (this.keyHandler) this.keyHandler(ev); else this.handleKeyPress(ev);
                stepIndex++;
                // Allow the render loop to process between steps
                setTimeout(() => {
                    requestAnimationFrame(() => runNextStep());
                }, stepDelay);
            };

            this.isExecutingPath = true;
            this.cancelPath = false;
            runNextStep();
        }
    }

    cancelPathExecution() {
        this.cancelPath = true;
        this.isExecutingPath = false;
        // Clear any persistent selector shown for auto-path destination
        try { if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') this.game.renderManager.clearFeedback(); } catch (e) {}
        if (this.currentPathSequence) {
            try { this.game.animationScheduler.cancelSequence(this.currentPathSequence.id); } catch (e) {}
            this.currentPathSequence = null;
        }
        if (this.currentPathSequenceFallback) { clearTimeout(this.currentPathSequenceFallback); this.currentPathSequenceFallback = null; }
    }

    // Main tap entrypoint called by InputBindings
    handleTap(screenX, screenY) {
        if (this.tapTimeout) { clearTimeout(this.tapTimeout); this.tapTimeout = null; }
        const gridCoords = this.convertScreenToGrid(screenX, screenY);
        try { if (this.game && this.game.renderManager && typeof this.game.renderManager.showTapFeedback === 'function') this.game.renderManager.showTapFeedback(gridCoords.x, gridCoords.y); } catch (e) {}

        const clickedTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        const enemyAtTile = this.game.enemies.find(enemy => enemy.x === gridCoords.x && enemy.y === gridCoords.y);
        const playerPos = this.game.player.getPosition();

        // Shovel mode
        if (this.game.shovelMode) {
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
            if (isAdjacent) {
                const success = this.itemUsageManager.useItem(this.game.activeShovel, gridCoords.x, gridCoords.y);
                if (success) { this.game.shovelMode = false; this.game.activeShovel = null; this.game.hideOverlayMessage(); }
            } else {
                this.game.shovelMode = false; this.game.activeShovel = null; this.game.hideOverlayMessage();
            }
            return;
        }

        if (this.game.uiManager.isStatsPanelOpen()) { this.game.uiManager.hideStatsPanel(); return; }

    const isDoubleTap = this.handleDoubleTapLogic(gridCoords, screenX, screenY);
    try { console.debug('[INT] handleTap gridCoords=', gridCoords, 'player=', playerPos, 'isDoubleTap=', isDoubleTap); } catch (e) {}
        try {
            if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                if (enemyAtTile) this.game.soundManager.playSound('tap_enemy');
                else if (isDoubleTap) this.game.soundManager.playSound('double_tap');
                else this.game.soundManager.playSound('bloop');
            }
        } catch (e) {}

    const tile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        // If a pending selection was started by using an item from the radial (selectionType),
        // validate the tapped tile using the combat manager and confirm/cancel accordingly.
        try {
            if (this.game.pendingCharge && this.game.pendingCharge.selectionType) {
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
        // If player tapped their own tile (single tap) - handle transitions or open radial
        if (!isDoubleTap && gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
            try {
                const currentTile = this.game.grid[playerPos.y]?.[playerPos.x];
                // If standing on an exit or port, perform the transition immediately on single tap
                if (currentTile === TILE_TYPES.EXIT) {
                    if (this.exitHandler) this.exitHandler(playerPos.x, playerPos.y); else this.performExitTap(playerPos.x, playerPos.y);
                    return true;
                }
                if (currentTile === TILE_TYPES.PORT) {
                    try { this.game.interactionManager.zoneManager.handlePortTransition(); } catch (e) {}
                    return true;
                }

                // Otherwise, toggle radial UI (if available)
                if (this.game.radialInventoryUI) {
                    console.debug('[INT] toggling radial UI (open?', this.game.radialInventoryUI.open, ')');
                    if (this.game.radialInventoryUI.open) this.game.radialInventoryUI.close(); else this.game.radialInventoryUI.openAtPlayer();
                    return true; // consume tap
                }
            } catch (e) {}
        }
        if (isDoubleTap && (tile === TILE_TYPES.EXIT || tile === TILE_TYPES.PORT)) {
            if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
                if (tile === TILE_TYPES.EXIT) { if (this.exitHandler) this.exitHandler(gridCoords.x, gridCoords.y); else this.performExitTap(gridCoords.x, gridCoords.y); }
                else try { this.game.interactionManager.zoneManager.handlePortTransition(); } catch (e) {}
                return;
            } else {
                this.autoUseNextTransition = (tile === TILE_TYPES.EXIT) ? 'exit' : 'port';
            }
        }

        if (isDoubleTap) {
            if (tile === TILE_TYPES.EXIT || tile === TILE_TYPES.PORT) {
                if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
                    if (tile === TILE_TYPES.EXIT) { if (this.exitHandler) this.exitHandler(gridCoords.x, gridCoords.y); else this.performExitTap(gridCoords.x, gridCoords.y); }
                    else try { this.game.interactionManager.zoneManager.handlePortTransition(); } catch (e) {}
                } else {
                    this.autoUseNextTransition = (tile === TILE_TYPES.EXIT) ? 'exit' : 'port';
                    this.executeMovementOrInteraction(gridCoords);
                }
            } else {
                this.game.player.setInteractOnReach(gridCoords.x, gridCoords.y);
                this.executeMovementOrInteraction(gridCoords);
            }
            return;
        } else {
            this.tapTimeout = setTimeout(() => this.executeMovementOrInteraction(gridCoords), INPUT_CONSTANTS.DOUBLE_TAP_TIME);
        }

        const isClickingDifferentTile = gridCoords.x !== playerPos.x || gridCoords.y !== playerPos.y;
        if (this.isExecutingPath && isClickingDifferentTile) this.cancelPathExecution();
        if (this.isExecutingPath && !isClickingDifferentTile) {
            if (this.game.player.stats.verbosePathAnimations && isClickingDifferentTile) this.cancelPathExecution();
            return;
        }
    }

    // Key press entrypoint (movement & debug hotkeys)
    handleKeyPress(event) {
        if (this.game.isPlayerTurn === false) { this.cancelPathExecution(); return; }
        if (this.game.player.isDead()) return;
        if (this.game.pendingCharge) { this.game.pendingCharge = null; this.game.hideOverlayMessage(); }
        if (!this.isExecutingPath) {
            if (this.game.displayingMessageForSign) Sign.hideMessageForSign(this.game);
            else if (this.game.bombPlacementMode) { this.game.bombPlacementMode = false; this.game.bombPlacementPositions = []; this.game.hideOverlayMessage(); }
            else this.game.hideOverlayMessage();
        }

        const lowerKey = (event.key || '').toLowerCase();
        const movementKeys = ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
        if (!movementKeys.includes(lowerKey)) {
            // Allow hotkeys
            try { if (consoleCommands.handleHotkey(this.game, event.key, event.shiftKey)) { event.preventDefault(); return; } } catch (e) {}
        }

        // developer/debug hotkeys retained
        if (event.key === '9') { this.game.player.addPoints(1); this.game.combatManager.addPointAnimation(this.game.player.x, this.game.player.y, 1); this.game.uiManager.updatePlayerStats(); return; }
        if (event.key === '0') { this.game.consentManager.forceShowConsentBanner(); return; }
        if (event.key === '8') { this.game.player.setSpentDiscoveries(this.game.player.getVisitedZones().size - 999); this.game.uiManager.updateZoneDisplay(); return; }
        if (event.key === '7') { this.game.transitionToZone(9,0,'teleport',this.game.player.x,this.game.player.y); return; }

        const currentPos = this.game.player.getPosition();
        let newX = currentPos.x, newY = currentPos.y;
        switch(event.key.toLowerCase()) {
            case 'w': case 'arrowup': newY--; break;
            case 's': case 'arrowdown': newY++; break;
            case 'a': case 'arrowleft': newX--; break;
            case 'd': case 'arrowright': newX++; break;
            default: return;
        }
        event.preventDefault();

        try {
            if (!event._synthetic) {
                if (this.game && this.game.renderManager && typeof this.game.renderManager.showTapFeedback === 'function') this.game.renderManager.showTapFeedback(newX, newY);
                if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') this.game.soundManager.playSound('bloop');
            }
        } catch (e) {}

    let playerMoved = false;
    const enemyAtTarget = this.game.enemies.find(enemy => enemy.x === newX && enemy.y === newY);
        if (enemyAtTarget) {
            this.game.player.startAttackAnimation();
            this.game.player.startBump(enemyAtTarget.x - currentPos.x, enemyAtTarget.y - currentPos.y);
            enemyAtTarget.startBump(currentPos.x - enemyAtTarget.x, currentPos.y - enemyAtTarget.y);
            // If player has the axe, play the slash SFX (file-backed). Suppress the
            // default 'attack' sound in CombatManager to avoid double-playing.
            try {
                if (this.game.player.abilities.has('axe')) {
                    this.game.soundManager.playSound('slash');
                    // Mark the enemy so CombatManager knows not to play the generic attack SFX
                    enemyAtTarget._suppressAttackSound = true;
                }
            } catch (e) {}
            this.game.combatManager.defeatEnemy(enemyAtTarget);
        } else {
            this.game.incrementBombActions();
            playerMoved = this.game.player.move(newX, newY, this.game.grid, (zoneX, zoneY, exitSide) => {
                this.game.transitionToZone(zoneX, zoneY, exitSide, currentPos.x, currentPos.y);
            });
        }

        if (this.game.justEnteredZone) {
            this.game.justEnteredZone = false;
        } else {
            this.game.startEnemyTurns();
            if (this.game.isInPitfallZone) this.game.pitfallTurnsSurvived++;
        }

        this.game.updatePlayerPosition();
        this.game.updatePlayerStats();
    }
}
