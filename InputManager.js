import { GRID_SIZE, CANVAS_SIZE, TILE_SIZE, TILE_TYPES, FOOD_ASSETS } from './constants.js';
import { Enemy } from './Enemy.js';
import { Sign } from './Sign.js';

export class InputManager {
    constructor(game) {
        this.game = game;
        this.isExecutingPath = false;
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
        const rect = this.game.canvas.getBoundingClientRect();
        const canvasX = screenX - rect.left;
        const canvasY = screenY - rect.top;

        // Account for canvas scaling
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;

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

        console.log(`Tap at screen: (${screenX}, ${screenY}) -> grid: (${gridCoords.x}, ${gridCoords.y})`);

        // Check if tapped on lion for interaction
        const lionAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.LION;
        console.log(`Checking lion at position (${gridCoords.x}, ${gridCoords.y}):`, this.game.grid[gridCoords.y]?.[gridCoords.x], "TILE_TYPES.LION:", TILE_TYPES.LION, "Is lion:", lionAtPosition);
        if (lionAtPosition) {
            console.log("Lion found at tapped position!");
            // Check if player is adjacent to the lion (including diagonal, but excluding self)
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
            console.log(`Player at (${playerPos.x}, ${playerPos.y}), dx=${dx}, dy=${dy}, isAdjacent=${isAdjacent}`);
            if (isAdjacent) {
                console.log("Player is adjacent, triggering lion interaction");
                this.game.interactWithNPC('Food/meat');
            } else {
                console.log(`Lion interaction attempted but player not adjacent (player at ${playerPos.x},${playerPos.y}, lion at ${gridCoords.x},${gridCoords.y})`);
            }
            return; // Interaction attempted, completion status varies
        }

        // Check if tapped on squig for interaction
        const squigAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.SQUIG;
        console.log(`Checking squig at position (${gridCoords.x}, ${gridCoords.y}):`, this.game.grid[gridCoords.y]?.[gridCoords.x], "TILE_TYPES.SQUIG:", TILE_TYPES.SQUIG, "Is squig:", squigAtPosition);
        if (squigAtPosition) {
            console.log("Squig found at tapped position!");
            // Check if player is adjacent to the squig (including diagonal, but excluding self)
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
            console.log(`Player at (${playerPos.x}, ${playerPos.y}), dx=${dx}, dy=${dy}, isAdjacent=${isAdjacent}`);
            if (isAdjacent) {
                console.log("Player is adjacent, triggering squig interaction");
                this.game.interactWithNPC('Food/nut');
            } else {
                console.log(`Squig interaction attempted but player not adjacent (player at ${playerPos.x},${playerPos.y}, squig at ${gridCoords.x},${gridCoords.y})`);
            }
            return; // Interaction attempted, completion status varies
        }

        // Check if tapped on sign for interaction
        const signTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (signTile && typeof signTile === 'object' && signTile.type === TILE_TYPES.SIGN) {
            // Check if player is adjacent to this sign
            const playerPos = this.game.player.getPosition();
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

            if (isAdjacent) {
                // Check if this is a new message being displayed (not already showing)
                const isAlreadyDisplayed = this.game.displayingMessageForSign &&
                                          this.game.displayingMessageForSign.message === signTile.message;
                const showingNewMessage = !isAlreadyDisplayed;

            // Let Sign class handle the toggle logic
            console.log('Calling Sign.handleClick for sign:', signTile.message);
            Sign.handleClick(signTile, this.game, isAdjacent);

            // Add to log only when first showing the message
            if (showingNewMessage && signTile.message !== this.game.lastSignMessage) {
                this.game.uiManager.addMessageToLog(`A sign reads: "${signTile.message.replace(/<br>/g, ' ')}"`);
                this.game.lastSignMessage = signTile.message;
            }
            }
            return; // Interaction handled
        }

        // Check if player has a bomb and tapped on a wall
        const hasBomb = this.game.player.inventory.some(item => item.type === 'bomb');
        const wallAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.WALL;
        if (hasBomb && wallAtPosition) {
            // Consume bomb and create an exit
            const bombIndex = this.game.player.inventory.findIndex(item => item.type === 'bomb');
            if (bombIndex !== -1) {
                this.game.player.inventory.splice(bombIndex, 1);
                this.game.grid[gridCoords.y][gridCoords.x] = TILE_TYPES.EXIT;
                this.game.updatePlayerStats();
                // Player turn is used, handle enemy moves
                this.game.handleEnemyMovements();
                return;
            }
        }
        // Check if player has bishop spear and if tapped position is diagonal and valid for bishop spear charge
        const bishopSpearItem = this.game.player.inventory.find(item => item.type === 'bishop_spear' && item.uses > 0);
        const enemyAtCoords = this.game.enemies.find(enemy => enemy.x === gridCoords.x && enemy.y === gridCoords.y);
        const targetTile = this.game.grid[gridCoords.y][gridCoords.x];
        const isEmptyTile = !enemyAtCoords && this.game.player.isWalkable(gridCoords.x, gridCoords.y, this.game.grid, playerPos.x, playerPos.y);

        if (bishopSpearItem && (enemyAtCoords || isEmptyTile)) {
            // Calculate direction from player to target
            const dx = gridCoords.x - playerPos.x;
            const dy = gridCoords.y - playerPos.y;

            // Check if diagonal and within range (<=5 tiles)
            if (Math.abs(dx) === Math.abs(dy) && Math.abs(dx) > 0 && Math.abs(dx) <= 5) {
                this.game.performBishopSpearCharge(bishopSpearItem, gridCoords.x, gridCoords.y, enemyAtCoords, dx, dy);
                return; // Charge performed, don't move
            }
        }

        // If player is on an exit tile, check for zone transition gestures
        if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT) {
            const transitionTriggered = this.checkForZoneTransitionGesture(gridCoords, playerPos);
            if (transitionTriggered) {
                return;
            }
        }

        // Check if tapped tile is an exit and player is already on it - trigger zone transition
        if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y &&
            this.game.grid[gridCoords.y][gridCoords.x] === TILE_TYPES.EXIT) {
            this.handleExitTap(gridCoords.x, gridCoords.y);
            return;
        }

        // Find path to target
        const path = this.findPath(playerPos.x, playerPos.y, gridCoords.x, gridCoords.y);

        if (path && path.length > 0) {
            console.log(`Found path with ${path.length} steps:`, path);
            this.executePath(path);
        } else {
            console.log('No valid path found to target');
        }
    }

    // Check if tap gesture should trigger zone transition when player is on exit
    checkForZoneTransitionGesture(tapCoords, playerPos) {
        // If player is on an exit tile and taps outside the grid or on the same edge, trigger transition
        const isOnExit = this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT;
        if (!isOnExit) return false;

        // Check if tap is outside grid boundaries (attempting to go beyond current zone)
        if (tapCoords.x < 0 || tapCoords.x >= GRID_SIZE || tapCoords.y < 0 || tapCoords.y >= GRID_SIZE) {
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        }

        // Check if player is on edge exit and tapping towards that edge
        if (playerPos.y === 0 && tapCoords.y <= playerPos.y) {
            // On top edge, tapping up/same row
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        } else if (playerPos.y === GRID_SIZE - 1 && tapCoords.y >= playerPos.y) {
            // On bottom edge, tapping down/same row
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        } else if (playerPos.x === 0 && tapCoords.x <= playerPos.x) {
            // On left edge, tapping left/same column
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        } else if (playerPos.x === GRID_SIZE - 1 && tapCoords.x >= playerPos.x) {
            // On right edge, tapping right/same column
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        }

        return false;
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
            console.log(`Triggering zone transition via exit at (${exitX}, ${exitY}) direction: ${direction}`);
            // Simulate the key press to trigger zone transition
            this.handleKeyPress({ key: direction, preventDefault: () => {} });
        }
    }

    // Execute path by simulating key presses with timing
    executePath(path) {
        if (this.isExecutingPath) {
            return; // Don't start new path if one is already executing
        }

        this.isExecutingPath = true;
        const stepDelay = 150; // Milliseconds between steps

        let stepIndex = 0;
        const executeStep = () => {
            if (stepIndex < path.length) {
                this.handleKeyPress({ key: path[stepIndex], preventDefault: () => {} });
                stepIndex++;
                setTimeout(executeStep, stepDelay);
            } else {
                this.isExecutingPath = false;

                // Check if player ended up on an exit tile after path completion
                const playerPos = this.game.player.getPosition();
                if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT) {
                    console.log('Player reached exit tile. Tap the exit again to transition zones.');
                }
            }
        };

        executeStep();
    }

    handleKeyPress(event) {
        console.log('Key pressed: ' + event.key);
        if (this.game.player.isDead()) {
            console.log('Player is dead');
            return;
        }
        // When the player acts, hide any open overlay message.
        // This now includes sign messages, which will close upon movement.
        if (this.game.displayingMessageForSign) {
            Sign.hideMessageForSign(this.game);
        } else {
            this.game.hideOverlayMessage();
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
            case 'k':
                // Add axe to inventory for testing
                if (this.game.player.inventory.length < 6) {
                    this.game.player.inventory.push({ type: 'axe' });
                    this.game.updatePlayerStats(); // Refresh inventory display
                }
                return; // Don't move, just add item
            case 'h':
                // Add hammer to inventory for testing
                if (this.game.player.inventory.length < 6) {
                    this.game.player.inventory.push({ type: 'hammer' });
                    this.game.updatePlayerStats(); // Refresh inventory display
                }
                return; // Don't move, just add item
            case 'r':
                // Add bishop spear to inventory for testing
                if (this.game.player.inventory.length < 6) {
                    this.game.player.inventory.push({ type: 'bishop_spear', uses: 3 });
                    this.game.updatePlayerStats(); // Refresh inventory display
                }
                return; // Don't move, just add item
            case 'b':
                // Add bomb to inventory for testing
                if (this.game.player.inventory.length < 6) {
                    this.game.player.inventory.push({ type: 'bomb' });
                    this.game.updatePlayerStats(); // Refresh inventory display
                }
                return; // Don't move, just add item
            case 'p':
                // Debug command to find the puzzle zone if it has spawned
                console.log("The puzzle zone is now a rare random encounter and cannot be teleported to directly.");
                return; // Don't process as movement
            case 'f':
                // Add random food to inventory for testing
                if (this.game.player.inventory.length < 6 && this.game.availableFoodAssets.length > 0) {
                    const randomFood = this.game.availableFoodAssets[Math.floor(Math.random() * this.game.availableFoodAssets.length)];
                    this.game.player.inventory.push({ type: 'food', foodType: randomFood });
                    this.game.updatePlayerStats(); // Refresh inventory display
                }
                return; // Don't process as movement
            case 'n':
                // Add note to inventory for testing
                if (this.game.player.inventory.length < 6) {
                    this.game.player.inventory.push({ type: 'note' });
                    this.game.updatePlayerStats(); // Refresh inventory display
                }
                return; // Don't process as movement
            case 'o':
                // Teleport to a frontier zone for testing
                this.game.player.setCurrentZone(17, 0); // Frontier zone (distance 17+)
                this.game.generateZone();
                // Position player in center of the zone
                const centerX2 = Math.floor(GRID_SIZE / 2);
                const centerY2 = Math.floor(GRID_SIZE / 2);
                this.game.player.setPosition(centerX2, centerY2);
                this.game.player.ensureValidPosition(this.game.grid);
                // Update UI
                this.game.uiManager.updateZoneDisplay();
                this.game.uiManager.updatePlayerPosition();
                this.game.updatePlayerStats();
                break;
            case 'y':
                // Force spawn of whispering canyon for testing
                console.log('Forcing whispering canyon generation...');
                this.game.zoneGenerator.constructor.forceCanyonSpawn = true;
                this.game.player.setCurrentZone(18, 0); // Far frontier zone
                this.game.generateZone();
                this.game.zoneGenerator.constructor.forceCanyonSpawn = false; // Reset for normal gameplay
                // Position player in center of the zone
                const centerXc = Math.floor(GRID_SIZE / 2);
                const centerYc = Math.floor(GRID_SIZE / 2);
                this.game.player.setPosition(centerXc, centerYc);
                this.game.player.ensureValidPosition(this.game.grid);
                // Update UI
                this.game.uiManager.updateZoneDisplay();
                this.game.uiManager.updatePlayerPosition();
                this.game.updatePlayerStats();
                console.log('Teleported to canyon zone. If canyon generated, it will be forced. If not, try again.');
                break;
            case 'j':
                // Jump to food/water room, force spawn if not exists
                if (this.game.zoneGenerator.constructor.foodWaterRoomSpawned && this.game.zoneGenerator.constructor.foodWaterRoomZone) {
                    this.game.player.setCurrentZone(this.game.zoneGenerator.constructor.foodWaterRoomZone.x, this.game.zoneGenerator.constructor.foodWaterRoomZone.y);
                    this.game.generateZone();
                    // Position player in center of the zone
                    const centerXj = Math.floor(GRID_SIZE / 2);
                    const centerYj = Math.floor(GRID_SIZE / 2);
                    this.game.player.setPosition(centerXj, centerYj);
                    this.game.player.ensureValidPosition(this.game.grid);
                    // Update UI
                    this.game.uiManager.updateZoneDisplay();
                    this.game.uiManager.updatePlayerPosition();
                    this.game.updatePlayerStats();
                    console.log(`Teleported to food/water room at (${this.game.zoneGenerator.constructor.foodWaterRoomZone.x}, ${this.game.zoneGenerator.constructor.foodWaterRoomZone.y})`);
                } else {
                    // Force spawn the room at a Wilds zone (e.g., (10, 10))
                    console.log('Food/water room not spawned yet. Forcing spawn at zone (10, 10)...');
                    this.game.zoneGenerator.constructor.forceFoodWaterRoom = true;
                    this.game.player.setCurrentZone(10, 10);
                    this.game.generateZone();
                    this.game.zoneGenerator.constructor.forceFoodWaterRoom = false; // Reset after forcing
                    const centerXj = Math.floor(GRID_SIZE / 2);
                    const centerYj = Math.floor(GRID_SIZE / 2);
                    this.game.player.setPosition(centerXj, centerYj);
                    this.game.player.ensureValidPosition(this.game.grid);
                    this.game.uiManager.updateZoneDisplay();
                    this.game.uiManager.updatePlayerPosition();
                    this.game.updatePlayerStats();
                    console.log('Food/water room forced at (10, 10). You can now use "j" again to return.');
                }
                break;
            case 'l':
                // Spawn a lizardy enemy for testing
                const availableTiles = [];
                for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                        const tile = this.game.grid[y][x];
                        const playerPos = this.game.player.getPosition();
                        const hasEnemy = this.game.enemies.some(e => e.x === x && e.y === y);
                        if ((tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.EXIT) && !hasEnemy && !(x === playerPos.x && y === playerPos.y)) {
                            availableTiles.push({x, y});
                        }
                    }
                }
                if (availableTiles.length > 0) {
                    const spawnPos = availableTiles[Math.floor(Math.random() * availableTiles.length)];
                    const enemyId = Date.now(); // Simple unique ID
                    const newEnemy = new Enemy({x: spawnPos.x, y: spawnPos.y, enemyType: 'lizardy', id: enemyId});
                    this.game.enemies.push(newEnemy);
                    console.log(`Spawned lizardy enemy at (${spawnPos.x}, ${spawnPos.y})`);
                } else {
                    console.log('No available tiles to spawn enemy');
                }
                break;
            case 'x':
                // Spawn a lizardeaux enemy for testing
                const lizardeauxTiles = [];
                for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                        const tile = this.game.grid[y][x];
                        const playerPos = this.game.player.getPosition();
                        const hasEnemy = this.game.enemies.some(e => e.x === x && e.y === y);
                        if ((tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.EXIT) && !hasEnemy && !(x === playerPos.x && y === playerPos.y)) {
                            lizardeauxTiles.push({x, y});
                        }
                    }
                }
                if (lizardeauxTiles.length > 0) {
                    const spawnPos = lizardeauxTiles[Math.floor(Math.random() * lizardeauxTiles.length)];
                    const enemyId = Date.now(); // Simple unique ID
                    const newEnemy = new Enemy({x: spawnPos.x, y: spawnPos.y, enemyType: 'lizardeaux', id: enemyId});
                    this.game.enemies.push(newEnemy);
                    console.log(`Spawned lizardeaux enemy at (${spawnPos.x}, ${spawnPos.y})`);
                } else {
                    console.log('No available tiles to spawn lizardeaux enemy');
                }
                break;
            case 'm':
                // Spawn lion for testing (debug command)
                const lionTiles = [];
                for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                        if (this.game.grid[y][x] === TILE_TYPES.FLOOR) {
                            lionTiles.push({x, y});
                        }
                    }
                }
                if (lionTiles.length > 0) {
                    const spawnPos = lionTiles[Math.floor(Math.random() * lionTiles.length)];
                    this.game.grid[spawnPos.y][spawnPos.x] = TILE_TYPES.LION;
                    console.log(`Debug: Lion spawned at (${spawnPos.x}, ${spawnPos.y})`);
                } else {
                    console.log('No available tiles to spawn lion');
                }
                break;
            case 'u':
                // Spawn squig for testing (debug command)
                const squigTiles = [];
                for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                        if (this.game.grid[y][x] === TILE_TYPES.FLOOR) {
                            squigTiles.push({x, y});
                        }
                    }
                }
                if (squigTiles.length > 0) {
                    const spawnPos = squigTiles[Math.floor(Math.random() * squigTiles.length)];
                    this.game.grid[spawnPos.y][spawnPos.x] = TILE_TYPES.SQUIG;
                    console.log(`Debug: Squig spawned at (${spawnPos.x}, ${spawnPos.y})`);
                } else {
                    console.log('No available tiles to spawn squig');
                }
                break;
            case 't':
                // Spawn sign for testing (debug command)
                const signTiles = [];
                for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                        if (this.game.grid[y][x] === TILE_TYPES.FLOOR) {
                            signTiles.push({x, y});
                        }
                    }
                }
                if (signTiles.length > 0) {
                    const spawnPos = signTiles[Math.floor(Math.random() * signTiles.length)];
                    this.game.grid[spawnPos.y][spawnPos.x] = {
                        type: TILE_TYPES.SIGN,
                        message: "Test sign message - click again to close!"
                    };
                    console.log(`Debug: Sign spawned at (${spawnPos.x}, ${spawnPos.y})`);
                } else {
                    console.log('No available tiles to spawn sign');
                }
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
                    this.game.player.startBump(enemyAtTarget.x - currentPos.x, enemyAtTarget.y - currentPos.y);
                    console.log('Player attacks enemy!');
                    enemyAtTarget.startBump(currentPos.x - enemyAtTarget.x, currentPos.y - enemyAtTarget.y);
                    enemyAtTarget.takeDamage(999); // Ensure enemy is dead
                    console.log('Player defeated enemy!');

                    // Record that this enemy position is defeated to prevent respawning
                    const currentZone = this.game.player.getCurrentZone();
                    this.game.defeatedEnemies.add(`${currentZone.x},${currentZone.y},${enemyAtTarget.x},${enemyAtTarget.y}`);

                    // Remove enemy immediately so it doesn't attack back this turn
                    this.game.enemies = this.game.enemies.filter(e => e !== enemyAtTarget);

                    // Also update the stored zone data to remove the dead enemy from persistence
                    const zoneKey = `${currentZone.x},${currentZone.y}`;
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
