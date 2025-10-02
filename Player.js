import { TILE_TYPES, GRID_SIZE } from './constants.js';

export class Player {
    constructor() {
        this.x = 1;
        this.y = 1;
        this.currentZone = { x: 0, y: 0 };
        this.visitedZones = new Set();
        this.markZoneVisited(0, 0);
    }

    move(newX, newY, grid, onZoneTransition) {
        // Check if the new position is off-grid while player is on an exit tile
        if ((newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE)) {
            // Only allow off-grid movement if player is currently on an exit tile
            if (grid[this.y][this.x] === TILE_TYPES.EXIT) {
                // Determine which zone boundary was crossed and transition
                let newZoneX = this.currentZone.x;
                let newZoneY = this.currentZone.y;
                let exitSide = '';
                
                if (newX < 0) {
                    // Moving left to adjacent zone
                    newZoneX--;
                    exitSide = 'left';
                } else if (newX >= GRID_SIZE) {
                    // Moving right to adjacent zone
                    newZoneX++;
                    exitSide = 'right';
                } else if (newY < 0) {
                    // Moving up to adjacent zone
                    newZoneY--;
                    exitSide = 'top';
                } else if (newY >= GRID_SIZE) {
                    // Moving down to adjacent zone
                    newZoneY++;
                    exitSide = 'bottom';
                }
                
                // Trigger zone transition
                if (onZoneTransition) {
                    onZoneTransition(newZoneX, newZoneY, exitSide);
                }
                return true;
            }
            return false; // Can't move off-grid unless on exit
        }
        
        // Check if the new position is walkable
        if (this.isWalkable(newX, newY, grid)) {
            this.x = newX;
            this.y = newY;
            return true;
        }
        
        return false;
    }

    isWalkable(x, y, grid) {
        // Check if position is within bounds
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return false;
        }
        
        const tileType = grid[y][x];
        
        // Player can walk on floor, grass, and exit tiles
        return tileType === TILE_TYPES.FLOOR || 
               tileType === TILE_TYPES.GRASS || 
               tileType === TILE_TYPES.EXIT;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getCurrentZone() {
        return { ...this.currentZone };
    }

    setCurrentZone(x, y) {
        this.currentZone.x = x;
        this.currentZone.y = y;
        this.markZoneVisited(x, y);
    }

    markZoneVisited(x, y) {
        this.visitedZones.add(`${x},${y}`);
    }

    hasVisitedZone(x, y) {
        return this.visitedZones.has(`${x},${y}`);
    }

    getVisitedZones() {
        return new Set(this.visitedZones);
    }

    positionAfterTransition(exitSide, connectionManager) {
        // Position player based on which exit they used and where the corresponding entrance is
        const connections = connectionManager.getConnections(this.currentZone.x, this.currentZone.y);
        
        if (!connections) {
            // Fallback to center if no connections found
            this.setPosition(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
            return;
        }
        
        switch (exitSide) {
            case 'top':
                // Coming from bottom, enter at the bottom exit if it exists
                if (connections.south !== null) {
                    this.setPosition(connections.south, GRID_SIZE - 2);
                } else {
                    this.setPosition(Math.floor(GRID_SIZE / 2), GRID_SIZE - 2);
                }
                break;
            case 'bottom':
                // Coming from top, enter at the top exit if it exists
                if (connections.north !== null) {
                    this.setPosition(connections.north, 1);
                } else {
                    this.setPosition(Math.floor(GRID_SIZE / 2), 1);
                }
                break;
            case 'left':
                // Coming from right, enter at the right exit if it exists
                if (connections.east !== null) {
                    this.setPosition(GRID_SIZE - 2, connections.east);
                } else {
                    this.setPosition(GRID_SIZE - 2, Math.floor(GRID_SIZE / 2));
                }
                break;
            case 'right':
                // Coming from left, enter at the left exit if it exists
                if (connections.west !== null) {
                    this.setPosition(1, connections.west);
                } else {
                    this.setPosition(1, Math.floor(GRID_SIZE / 2));
                }
                break;
            default:
                // Fallback to center
                this.setPosition(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
                break;
        }
    }

    ensureValidPosition(grid) {
        // Ensure player is on a walkable tile
        if (!this.isWalkable(this.x, this.y, grid)) {
            // Find nearest walkable tile
            for (let radius = 1; radius < GRID_SIZE; radius++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        const checkX = this.x + dx;
                        const checkY = this.y + dy;
                        
                        if (this.isWalkable(checkX, checkY, grid)) {
                            this.setPosition(checkX, checkY);
                            return;
                        }
                    }
                }
            }
        }
    }

    reset() {
        this.x = 1;
        this.y = 1;
        this.currentZone = { x: 0, y: 0 };
        this.visitedZones.clear();
        this.markZoneVisited(0, 0);
    }
}