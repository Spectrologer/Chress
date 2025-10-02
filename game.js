import { GRID_SIZE, TILE_SIZE, CANVAS_SIZE, TILE_TYPES } from './constants.js';
import { TextureManager } from './TextureManager.js';
import { ConnectionManager } from './ConnectionManager.js';
import { ZoneGenerator } from './ZoneGenerator.js';
import { Player } from './Player.js';

// Game state
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.mapCanvas = document.getElementById('zoneMap');
        this.mapCtx = this.mapCanvas.getContext('2d');
        
        // Set canvas sizes
        this.setupCanvasSize();
        
        // Configure canvases for crisp pixel art
        TextureManager.configureCanvas(this.ctx);
        TextureManager.configureCanvas(this.mapCtx);
        
        // Initialize modules
        this.textureManager = new TextureManager();
        this.connectionManager = new ConnectionManager();
        this.zoneGenerator = new ZoneGenerator();
        this.player = new Player();
        
        // Zone management
        this.zones = new Map(); // Stores generated zones by coordinate key
        this.grid = null; // Current zone grid
        this.gameStarted = false;
        
        // Path execution state
        this.isExecutingPath = false;
        
        // Load assets and start game
        this.loadAssets();
    }
    
    setupCanvasSize() {
        // Set internal canvas size to maintain pixel-perfect rendering
        this.canvas.width = CANVAS_SIZE;
        this.canvas.height = CANVAS_SIZE;
        
        // Set map canvas size dynamically based on CSS
        this.updateMapCanvasSize();
        
        // Handle resize for responsive design
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }
    
    updateMapCanvasSize() {
        // Get the computed style to match CSS sizing
        const computedStyle = window.getComputedStyle(this.mapCanvas);
        const cssWidth = parseInt(computedStyle.width);
        const cssHeight = parseInt(computedStyle.height);
        
        // Set canvas internal size to match CSS display size for crisp rendering
        this.mapCanvas.width = cssWidth;
        this.mapCanvas.height = cssHeight;
        
        // Reapply canvas configuration for crisp rendering
        TextureManager.configureCanvas(this.mapCtx);
    }
    
    handleResize() {
        // Update map canvas size on resize
        this.updateMapCanvasSize();
        // Re-render the zone map with new size
        if (this.gameStarted) {
            this.renderZoneMap();
        }
        // Let CSS handle the display size for responsiveness
        // The main canvas internal size stays fixed for pixel-perfect rendering
    }
    
    async loadAssets() {
        try {
            console.log('Starting asset loading...');
            await this.textureManager.loadAssets();
            console.log('All assets loaded successfully');
            console.log('Available images:', Object.keys(this.textureManager.images));
            this.startGame();
        } catch (error) {
            console.error('Error loading assets:', error);
            this.startGame(); // Start anyway with fallback colors
        }
    }
    
    startGame() {
        if (this.gameStarted) return; // Prevent multiple initializations
        this.gameStarted = true;
        this.init();
    }
    
    init() {
        // Generate initial zone
        this.generateZone();
        
        // Ensure player starts on a valid tile
        this.grid[this.player.y][this.player.x] = TILE_TYPES.FLOOR;
        
        // Set up event listeners
        this.setupControls();
        
        // Start game loop
        this.gameLoop();
        
        // Update UI
        this.updatePlayerPosition();
        this.updateZoneDisplay();
        this.updatePlayerStats();
    }
    
    generateZone() {
        const currentZone = this.player.getCurrentZone();
        console.log('Generating zone for:', currentZone);
        
        // Generate chunk connections for current area
        this.connectionManager.generateChunkConnections(currentZone.x, currentZone.y);
        
        // Generate or load the zone
        this.grid = this.zoneGenerator.generateZone(
            currentZone.x, 
            currentZone.y, 
            this.zones, 
            this.connectionManager.zoneConnections
        );
        
        console.log('Generated grid:', this.grid ? `${this.grid.length}x${this.grid[0]?.length}` : 'null');
        
        // Save the generated zone
        const zoneKey = `${currentZone.x},${currentZone.y}`;
        this.zones.set(zoneKey, JSON.parse(JSON.stringify(this.grid)));
    }
    
    transitionToZone(newZoneX, newZoneY, exitSide) {
        // Update player's current zone
        this.player.setCurrentZone(newZoneX, newZoneY);
        
        // Decrease thirst and hunger when moving to a new zone
        this.player.onZoneTransition();
        
        // Generate or load the new zone
        this.generateZone();
        
        // Position player based on which exit they used
        this.player.positionAfterTransition(exitSide, this.connectionManager);
        
        // Ensure player is on a walkable tile
        this.player.ensureValidPosition(this.grid);
        
        // Update UI
        this.updateZoneDisplay();
        this.updatePlayerPosition();
        this.updatePlayerStats();
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });

        // Mouse controls for desktop (same as tap)
        this.canvas.addEventListener('click', (e) => {
            this.handleTap(e.clientX, e.clientY);
        });

        // Touch controls for mobile
        this.setupTouchControls();
    }

    // Convert screen coordinates to grid coordinates
    screenToGridCoordinates(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = screenX - rect.left;
        const canvasY = screenY - rect.top;
        
        // Account for canvas scaling
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
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
        
        if (!this.player.isWalkable(targetX, targetY, this.grid)) {
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
                    this.player.isWalkable(newX, newY, this.grid)) {
                    
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
        const playerPos = this.player.getPosition();
        
        console.log(`Tap at screen: (${screenX}, ${screenY}) -> grid: (${gridCoords.x}, ${gridCoords.y})`);
        
        // If player is on an exit tile, check for zone transition gestures
        if (this.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT) {
            const transitionTriggered = this.checkForZoneTransitionGesture(gridCoords, playerPos);
            if (transitionTriggered) {
                return;
            }
        }
        
        // Check if tapped tile is an exit and player is already on it - trigger zone transition
        if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y && 
            this.grid[gridCoords.y][gridCoords.x] === TILE_TYPES.EXIT) {
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
        const isOnExit = this.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT;
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
                const playerPos = this.player.getPosition();
                if (this.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT) {
                    console.log('Player reached exit tile. Tap the exit again to transition zones.');
                }
            }
        };
        
        executeStep();
    }    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        const minSwipeDistance = 30;
        const maxTapTime = 300; // Maximum time for a tap (milliseconds)
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
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
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
    }
    
    handleKeyPress(event) {
        const currentPos = this.player.getPosition();
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
                return; // Don't prevent default for other keys
        }
        
        // Prevent default behavior for movement keys
        event.preventDefault();
        
        // Attempt to move player
        this.player.move(newX, newY, this.grid, (zoneX, zoneY, exitSide) => {
            this.transitionToZone(zoneX, zoneY, exitSide);
        });
        
        // Update UI
        this.updatePlayerPosition();
        this.updatePlayerStats();
    }
    
    resetGame() {
        // Reset all game state
        this.zones.clear();
        this.connectionManager.clear();
        this.player.reset();
        
        // Generate starting zone
        this.generateZone();
        this.grid[this.player.y][this.player.x] = TILE_TYPES.FLOOR;
        
        // Update UI
        this.updatePlayerPosition();
        this.updateZoneDisplay();
        this.updatePlayerStats();
    }
    
    updatePlayerPosition() {
        const pos = this.player.getPosition();
        document.getElementById('player-pos').textContent = `${pos.x}, ${pos.y}`;
    }
    
    updateZoneDisplay() {
        const zone = this.player.getCurrentZone();
        document.getElementById('current-zone').textContent = `${zone.x}, ${zone.y}`;
        this.renderZoneMap();
    }
    
    updatePlayerStats() {
        // Update thirst bar (💧)
        const thirstPercentage = (this.player.getThirst() / 50) * 100;
        const thirstBar = document.querySelector('.mana-bar .bar-fill');
        if (thirstBar) {
            thirstBar.style.width = `${thirstPercentage}%`;
        }
        // Update hunger bar (🥩)
        const hungerPercentage = (this.player.getHunger() / 50) * 100;
        const hungerBar = document.querySelector('.health-bar .bar-fill');
        if (hungerBar) {
            hungerBar.style.width = `${hungerPercentage}%`;
        }

        // Render inventory items
        const inventoryGrid = document.querySelector('.inventory-grid');
        if (inventoryGrid) {
            // Clear previous items
            inventoryGrid.innerHTML = '';
            this.player.inventory.forEach((item, idx) => {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.style.cursor = 'pointer';
                if (item.type === 'food') {
                    slot.innerHTML = '<span title="Food">🥖</span>';
                } else if (item.type === 'water') {
                    slot.innerHTML = '<span title="Water">💧</span>';
                }
                slot.onclick = () => {
                    if (item.type === 'food') {
                        this.player.restoreHunger(10);
                    } else if (item.type === 'water') {
                        this.player.restoreThirst(10);
                    }
                    this.player.inventory.splice(idx, 1);
                    this.updatePlayerStats();
                };
                inventoryGrid.appendChild(slot);
            });
            // Fill remaining slots
            for (let i = this.player.inventory.length; i < 4; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                inventoryGrid.appendChild(slot);
            }
        }
    }
    
    renderZoneMap() {
        // Get actual canvas size from CSS (responsive)
        const mapSize = Math.min(this.mapCanvas.width, this.mapCanvas.height);
        // Calculate zone size for better visibility: aim for 8-9 zones visible with larger tiles
        const zoneSize = Math.max(18, Math.min(28, Math.floor(mapSize / 8.5)));
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;
        
        // Clear the map with a parchment-like background
        this.mapCtx.fillStyle = '#E6D3A3';  // Warm parchment tone
        this.mapCtx.fillRect(0, 0, mapSize, mapSize);
        
        // Calculate visible range around current zone
        const range = 5; // Show 5 zones in each direction
        const currentZone = this.player.getCurrentZone();
        
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const zoneX = currentZone.x + dx;
                const zoneY = currentZone.y + dy;
                
                const mapX = centerX + dx * zoneSize - zoneSize / 2;
                const mapY = centerY + dy * zoneSize - zoneSize / 2;
                
                // Determine zone color with parchment-friendly palette
                let color = '#C8B99C'; // Unexplored - darker parchment tone
                if (this.player.hasVisitedZone(zoneX, zoneY)) {
                    color = '#B8860B'; // Visited - darker gold
                }
                if (zoneX === currentZone.x && zoneY === currentZone.y) {
                    color = '#CD853F'; // Current - warm brown/gold
                }
                
                // Draw zone square
                this.mapCtx.fillStyle = color;
                this.mapCtx.fillRect(mapX, mapY, zoneSize - 2, zoneSize - 2);
                
                // Draw border with aged ink color
                this.mapCtx.strokeStyle = '#8B4513';  // Saddle brown for ink effect
                this.mapCtx.lineWidth = 1;
                this.mapCtx.strokeRect(mapX, mapY, zoneSize - 2, zoneSize - 2);
                
                // Draw coordinates for current zone
                if (zoneX === currentZone.x && zoneY === currentZone.y) {
                    this.mapCtx.fillStyle = '#2F1B14';  // Dark brown for text
                    this.mapCtx.font = 'bold 9px serif';  // Slightly larger and serif font
                    this.mapCtx.textAlign = 'center';
                    this.mapCtx.fillText(`${zoneX},${zoneY}`, mapX + zoneSize / 2, mapY + zoneSize / 2 + 3);
                }
            }
        }
        
        // Draw center crosshairs with aged ink color
        this.mapCtx.strokeStyle = '#8B4513';  // Matching the border color
        this.mapCtx.lineWidth = 2;  // Slightly thicker for visibility
        this.mapCtx.beginPath();
        this.mapCtx.moveTo(centerX - 6, centerY);
        this.mapCtx.lineTo(centerX + 6, centerY);
        this.mapCtx.moveTo(centerX, centerY - 6);
        this.mapCtx.lineTo(centerX, centerY + 6);
        this.mapCtx.stroke();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        // Draw grid
        this.drawGrid();
        
        // Draw player
        this.drawPlayer();
    }
    
    drawGrid() {
        console.log('Drawing grid with', this.grid ? 'valid grid' : 'null grid');
        if (!this.grid) {
            console.error('Grid is null, cannot render');
            return;
        }
        
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tileType = this.grid[y][x];
                try {
                    this.textureManager.renderTile(this.ctx, x, y, tileType, this.grid);
                } catch (error) {
                    console.error(`Error rendering tile at ${x},${y}:`, error);
                    // Fallback rendering
                    this.ctx.fillStyle = '#ffcb8d';
                    this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
    
    drawPlayer() {
        const pos = this.player.getPosition();
        const playerImage = this.textureManager.getImage('SeparateAnim/Special2');
        
        if (playerImage && playerImage.complete) {
            // Draw the Special2.png image for the player
            this.ctx.drawImage(
                playerImage,
                pos.x * TILE_SIZE, 
                pos.y * TILE_SIZE, 
                TILE_SIZE, 
                TILE_SIZE
            );
        } else {
            // Fallback to colored rectangle if image isn't loaded
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillRect(
                pos.x * TILE_SIZE + 2, 
                pos.y * TILE_SIZE + 2, 
                TILE_SIZE - 4, 
                TILE_SIZE - 4
            );
        }
    }
    
    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    new Game();
});