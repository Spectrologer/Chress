import { GRID_SIZE, CANVAS_SIZE, TILE_SIZE, TILE_TYPES, FOOD_ASSETS } from './constants.js';
import { Enemy } from './Enemy.js';
import { Sign } from './Sign.js';
import consoleCommands from './consoleCommands.js';

export class InputManager {
    constructor(game) {
        this.game = game;
        this.isExecutingPath = false;
        this.pathExecutionTimer = null;
        this.cancelPath = false;
        this.lastTapTime = null;
        this.lastTapX = null;
        this.lastTapY = null;
        this.autoUseNextExitReach = false;
    }

    setupControls() {
        // Keyboard controls
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
        const minSwipeDistance = 30;
        const maxTapTime = 300; // Maximum time for a tap (milliseconds)

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
            if (touchDuration < maxTapTime && distance < minSwipeDistance) {
                // Handle tap - convert to grid coordinates and move
                this.handleTap(touch.clientX, touch.clientY);
            }
            // Otherwise, check if it was a swipe gesture
            else if (distance > minSwipeDistance) {
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
    screenToGridCoordinates(screenX, screenY) {
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

    // Handle tap input for movement
    handleTap(screenX, screenY) {
        const gridCoords = this.screenToGridCoordinates(screenX, screenY);
        const playerPos = this.game.player.getPosition();

        // Double tap detection
        const now = Date.now();
        const isDoubleTap = this.lastTapTime !== null && (now - this.lastTapTime) < 300 && this.lastTapX === gridCoords.x && this.lastTapY === gridCoords.y;
        this.lastTapTime = now;
        this.lastTapX = gridCoords.x;
        this.lastTapY = gridCoords.y;

        // Handle double tap on exit tiles
        const tile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (isDoubleTap && tile === TILE_TYPES.EXIT) {
            if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
                // Double tap on current exit: immediately use
                this.handleExitTap(gridCoords.x, gridCoords.y);
                return;
            } else {
                // Double tap on distant exit: move there and auto-use upon reaching
                this.autoUseNextExitReach = true;
            }
        }

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
                    // For double tap, set flag to interact on reach (walk and interact)
                    // For single tap, just walk (don't interact)
                    if (isDoubleTap) {
                        this.game.player.setInteractOnReach(gridCoords.x, gridCoords.y);
                    }
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

    // Execute path by simulating key presses with timing
    executePath(path) {
        if (this.isExecutingPath) {
            // If already executing, cancel the current path to allow interruption
            this.cancelPathExecution();
        }

        this.isExecutingPath = true;
        this.cancelPath = false;
        const stepDelay = 150; // Milliseconds between steps

        let stepIndex = 0;
        const executeStep = () => {
            if (this.cancelPath) {
                this.cancelPath = false;
                this.isExecutingPath = false;
                this.pathExecutionTimer = null;
                return;
            }
            if (stepIndex < path.length) {
                this.handleKeyPress({ key: path[stepIndex], preventDefault: () => {} });
                stepIndex++;
                this.pathExecutionTimer = setTimeout(executeStep, stepDelay);
            } else {
                this.isExecutingPath = false;
                this.pathExecutionTimer = null;

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
        };

        executeStep();
    }

    // Cancel path execution
    cancelPathExecution() {
        if (this.pathExecutionTimer) {
            clearTimeout(this.pathExecutionTimer);
            this.pathExecutionTimer = null;
        }
        this.cancelPath = true;
        this.isExecutingPath = false;
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

    handleKeyPress(event) {
        if (this.game.player.isDead()) {
            return;
        }
        // If moving, cancel any pending charge
        if (this.game.pendingCharge) {
            this.game.pendingCharge = null;
            this.game.hideOverlayMessage();
        }
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

        // Handle hotkey spawning
        if (consoleCommands.handleHotkey(this.game, event.key, event.shiftKey)) {
            event.preventDefault();
            return;
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
                    enemyAtTarget.takeDamage(999); // Ensure enemy is dead

                    // Record that this enemy position is defeated to prevent respawning
                    const currentZone = this.game.player.getCurrentZone();                    
                    this.game.defeatedEnemies.add(`${currentZone.x},${currentZone.y}:${currentZone.dimension}:${enemyAtTarget.id}`);

                    // Remove enemy immediately so it doesn't attack back this turn
                    this.game.enemies = this.game.enemies.filter(e => e !== enemyAtTarget);

                    // Also update the stored zone data to remove the dead enemy from persistence
                    const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
                    if (this.game.zones.has(zoneKey)) {
                        const zoneData = this.game.zones.get(zoneKey);
                        zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemyAtTarget.id);
                        this.game.zones.set(zoneKey, zoneData);
                    }
                    // Enemy movements happen after attacks to simulate turn-based combat
                    this.game.handleEnemyMovements();
                    // Player does not move
                } else {
                    // Normal movement
                    playerMoved = this.game.player.move(newX, newY, this.game.grid, (zoneX, zoneY, exitSide) => {
                        this.game.transitionToZone(zoneX, zoneY, exitSide, currentPos.x, currentPos.y);
                    });
                }

                // Handle enemy movements based on zone entry flag
                if (this.game.justEnteredZone) {
                    this.game.justEnteredZone = false; // Reset flag after skipping enemy movement
                } else if (playerMoved) {
                    this.game.handleEnemyMovements();
                }

                this.game.checkCollisions();
                this.game.checkItemPickup(); // Check for item pickups after movement
                this.game.updatePlayerPosition();
                this.game.updatePlayerStats();
    }


}
