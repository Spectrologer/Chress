import { GRID_SIZE, CANVAS_SIZE, TILE_SIZE, TILE_TYPES, FOOD_ASSETS, INPUT_CONSTANTS, ANIMATION_CONSTANTS, SIMULATION_CONSTANTS } from '../core/constants.js';
import { Enemy } from '../entities/Enemy.js';
import { Sign } from '../ui/Sign.js';
import consoleCommands from '../core/consoleCommands.js';
import logger from '../core/logger.js';

export class InputManager {
    constructor(game) {
        this.game = game;
        this.isExecutingPath = false;
        this.pathExecutionTimer = null;
        this.cancelPath = false;
        this.lastTapTime = null;
        this.lastTapX = null;
        this.lastTapY = null;
        this.tapTimeout = null;
        this.autoUseNextExitReach = false;
    }

    setupControls() {
        // Keyboard controls - attach to both window and document for cross-browser coverage
        window.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });

        // Mouse controls for desktop (same as tap)
        this.game.canvas.addEventListener('click', (e) => {
            this.handleTap(e.clientX, e.clientY);
        });

        // Touch controls for mobile
        this.setupTouchControls();
    }

    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        this.game.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        });

        this.game.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const touchDuration = Date.now() - touchStartTime;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Check if this was a tap (short duration, small movement)
            if (touchDuration < INPUT_CONSTANTS.MAX_TAP_TIME && distance < INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
                // Handle tap - convert to grid coordinates and move
                this.handleTap(touch.clientX, touch.clientY);
            }
            // Otherwise, check if it was a swipe gesture
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

        // Prevent default touch behaviors
        this.game.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
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
    handleDoubleTapLogic(gridCoords) {
        const now = Date.now();
        const isDoubleTap = this.lastTapTime !== null && (now - this.lastTapTime) < INPUT_CONSTANTS.DOUBLE_TAP_TIME && this.lastTapX === gridCoords.x && this.lastTapY === gridCoords.y;
        this.lastTapTime = now;
        this.lastTapX = gridCoords.x;
        this.lastTapY = gridCoords.y;
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

        // Debug: Log comprehensive tile information on click
        logger.log(`Tile clicked at (${gridCoords.x}, ${gridCoords.y})`);
        const clickedTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        logger.log("Tile data:", clickedTile);
        const enemyAtTile = this.game.enemies.find(enemy => enemy.x === gridCoords.x && enemy.y === gridCoords.y);
        if (enemyAtTile) {
            logger.log("Enemy on tile:", enemyAtTile);
        }

        const playerPos = this.game.player.getPosition();

        // If stats panel is open, close it on any tap
        if (this.game.uiManager.isStatsPanelOpen()) {
            this.game.uiManager.hideStatsPanel();
            return;
        }

        // Check if tapped on player to open stats panel
        // Only allow stats panel if not standing on an exit tile
        const playerTile = this.game.grid[playerPos.y]?.[playerPos.x];
        if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y && playerTile !== TILE_TYPES.EXIT && playerTile !== TILE_TYPES.PORT) {
            this.game.uiManager.showStatsPanel();
            return;
        }

        // Double tap detection and handling
        const isDoubleTap = this.handleDoubleTapLogic(gridCoords);
        const tile = this.game.grid[gridCoords.y]?.[gridCoords.x];

        // Handle double tap on exit tiles
        if (isDoubleTap && tile === TILE_TYPES.EXIT) {
            if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
                // Double tap on current exit: immediately use (allowed even during path execution)
                this.handleExitTap(gridCoords.x, gridCoords.y);
                return;
            } else {
                // Double tap on distant exit: move there and auto-use upon reaching
                this.autoUseNextExitReach = true;
            }
        }

        if (isDoubleTap) {
            this.handleDoubleTap(gridCoords);
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

        if (tile === TILE_TYPES.EXIT) {
            if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
                this.handleExitTap(gridCoords.x, gridCoords.y);
            } else {
                this.autoUseNextExitReach = true;
                this.executeMovementOrInteraction(gridCoords); // Path to the exit
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
        // Determine which direction to move based on exit position
        let direction = '';

        if (exitY === 0) {
            // Top edge exit - move north
            direction = 'arrowup';
        } else if (exitY === GRID_SIZE - 1) {
            // Bottom edge exit - move south
            direction = 'arrowdown';
        } else if (exitX === 0) {
            // Left edge exit - move west
            direction = 'arrowleft';
        } else if (exitX === GRID_SIZE - 1) {
            // Right edge exit - move east
            direction = 'arrowright';
        }

        if (direction) {
            // Simulate the key press to trigger zone transition
            this.handleKeyPress({ key: direction, preventDefault: () => {} });
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

        // Check if verbose animations are enabled
        if (this.game.player.stats.verbosePathAnimations) {
            // Verbose mode: show step-by-step movement with delays that wait for lift animation
            let stepIndex = 0;

            const executeNextStep = () => {
                if (stepIndex >= path.length || this.cancelPath) {
                    if (this.cancelPath) {
                        this.cancelPath = false;
                        this.isExecutingPath = false;
                        return;
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
                    return;
                }

                // Execute the next step
                this.handleKeyPress({ key: path[stepIndex], preventDefault: () => {} });
                stepIndex++;

                // Wait for the lift animation to complete (15 frames) plus a bit extra for visibility
                this.game.animationScheduler.createSequence()
                    .wait(INPUT_CONSTANTS.LEGACY_PATH_DELAY) // Reduced from 250ms for faster pathing
                    .then(() => {
                        executeNextStep(); // Continue to next step
                    })
                    .start();
            };

            executeNextStep(); // Start the sequence
        } else {
            // Instant mode: execute all path steps immediately
            for (let i = 0; i < path.length && !this.cancelPath; i++) {
                this.handleKeyPress({ key: path[i], preventDefault: () => {} });
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
        // The AnimationScheduler will handle cancelling the sequence
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
        if (typeof tile === 'object' && tile.type === 'BOMB') {
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

        // Handle hotkey spawning
        if (consoleCommands.handleHotkey(this.game, event.key, event.shiftKey)) {
            event.preventDefault();
            return;
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

        // Check if player is trying to move onto an enemy tile
                const enemyAtTarget = this.game.enemies.find(enemy => enemy.x === newX && enemy.y === newY);
                let playerMoved = false;

                if (enemyAtTarget) {
                    // Player attacks enemy - simple bump of attacked tile
                    this.game.player.startAttackAnimation();
                    this.game.player.startBump(enemyAtTarget.x - currentPos.x, enemyAtTarget.y - currentPos.y);
                    enemyAtTarget.startBump(currentPos.x - enemyAtTarget.x, currentPos.y - enemyAtTarget.y);
                    this.game.combatManager.defeatEnemy(enemyAtTarget);
                    // Enemy movements happen after attacks to simulate turn-based combat
                    this.game.startEnemyTurns();
                    // Player does not move
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
                }

                // Collision and pickup checks are now handled after the enemy turn sequence finishes
                // this.game.checkCollisions();
                // this.game.checkItemPickup(); 

                this.game.updatePlayerPosition();
                this.game.updatePlayerStats();
    }


}
