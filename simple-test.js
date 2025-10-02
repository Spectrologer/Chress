import { GRID_SIZE, TILE_SIZE, CANVAS_SIZE, TILE_TYPES, TILE_COLORS } from './constants.js';

// Simple test game without texture manager
class SimpleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Simple grid for testing
        this.grid = [];
        this.initGrid();
        
        console.log('Simple game initialized');
        this.render();
    }
    
    initGrid() {
        // Create a simple test grid
        for (let y = 0; y < GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
                    this.grid[y][x] = TILE_TYPES.WALL;
                } else if (Math.random() < 0.1) {
                    this.grid[y][x] = TILE_TYPES.ROCK;
                } else if (Math.random() < 0.1) {
                    this.grid[y][x] = TILE_TYPES.GRASS;
                } else {
                    this.grid[y][x] = TILE_TYPES.FLOOR;
                }
            }
        }
        
        // Add some exits
        this.grid[0][5] = TILE_TYPES.EXIT;
        this.grid[GRID_SIZE-1][7] = TILE_TYPES.EXIT;
        this.grid[3][0] = TILE_TYPES.EXIT;
        this.grid[8][GRID_SIZE-1] = TILE_TYPES.EXIT;
        
        console.log('Grid initialized:', this.grid);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        // Draw grid with basic colors
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tileType = this.grid[y][x];
                this.ctx.fillStyle = TILE_COLORS[tileType];
                this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Add border for visibility
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
        
        // Draw a test player
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(1 * TILE_SIZE + 2, 1 * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        
        console.log('Render complete');
    }
}

// Initialize simple test game
window.addEventListener('load', () => {
    console.log('Page loaded, creating simple game');
    new SimpleGame();
});