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
        
        // Load assets and start game
        this.loadAssets();
    }
    
    setupCanvasSize() {
        // Set internal canvas size to maintain pixel-perfect rendering
        this.canvas.width = CANVAS_SIZE;
        this.canvas.height = CANVAS_SIZE;
        this.mapCanvas.width = 120;
        this.mapCanvas.height = 120;
        
        // Handle resize for responsive design
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }
    
    handleResize() {
        // Let CSS handle the display size for responsiveness
        // The canvas internal size stays fixed for pixel-perfect rendering
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
        
        // Generate or load the new zone
        this.generateZone();
        
        // Position player based on which exit they used
        this.player.positionAfterTransition(exitSide, this.connectionManager);
        
        // Ensure player is on a walkable tile
        this.player.ensureValidPosition(this.grid);
        
        // Update UI
        this.updateZoneDisplay();
        this.updatePlayerPosition();
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });
        
        // Touch controls for mobile
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 30;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            
            // Determine if this was a swipe gesture
            if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
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
    
    renderZoneMap() {
        const mapSize = 120;
        const zoneSize = 12; // Size of each zone square on the map
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;
        
        // Clear the map
        this.mapCtx.fillStyle = '#222222';
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
                
                // Determine zone color
                let color = '#444444'; // Unexplored
                if (this.player.hasVisitedZone(zoneX, zoneY)) {
                    color = '#87CEEB'; // Visited
                }
                if (zoneX === currentZone.x && zoneY === currentZone.y) {
                    color = '#FFD700'; // Current
                }
                
                // Draw zone square
                this.mapCtx.fillStyle = color;
                this.mapCtx.fillRect(mapX, mapY, zoneSize - 1, zoneSize - 1);
                
                // Draw border
                this.mapCtx.strokeStyle = '#666666';
                this.mapCtx.lineWidth = 1;
                this.mapCtx.strokeRect(mapX, mapY, zoneSize - 1, zoneSize - 1);
                
                // Draw coordinates for current zone
                if (zoneX === currentZone.x && zoneY === currentZone.y) {
                    this.mapCtx.fillStyle = '#000000';
                    this.mapCtx.font = '6px monospace';
                    this.mapCtx.textAlign = 'center';
                    this.mapCtx.fillText(`${zoneX},${zoneY}`, mapX + zoneSize / 2, mapY + zoneSize / 2 + 2);
                }
            }
        }
        
        // Draw center crosshairs
        this.mapCtx.strokeStyle = '#4a9eff';
        this.mapCtx.lineWidth = 1;
        this.mapCtx.beginPath();
        this.mapCtx.moveTo(centerX - 3, centerY);
        this.mapCtx.lineTo(centerX + 3, centerY);
        this.mapCtx.moveTo(centerX, centerY - 3);
        this.mapCtx.lineTo(centerX, centerY + 3);
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
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(
            pos.x * TILE_SIZE + 2, 
            pos.y * TILE_SIZE + 2, 
            TILE_SIZE - 4, 
            TILE_SIZE - 4
        );
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