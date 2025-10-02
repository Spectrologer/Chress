import { TILE_TYPES, GRID_SIZE } from './constants.js';

export class Player {
    constructor() {
        this.x = 1;
        this.y = 1;
        this.currentZone = { x: 0, y: 0 };
        this.visitedZones = new Set();
        this.thirst = 50;
        this.hunger = 50;
        this.inventory = [];
        this.dead = false;
        this.sprite = 'SeparateAnim/Special2';
        this.health = 3;  // Player has 3 hearts
        this.attackAnimation = 0; // Frames remaining for attack animation
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
            // Check if there's an item to pick up at the new position
            const tile = grid[newY][newX];
                if (tile === TILE_TYPES.WATER) {
                    if (this.inventory.length < 6) {
                        this.inventory.push({ type: 'water' });
                    } else {
                        this.restoreThirst(10);
                    }
                    grid[newY][newX] = TILE_TYPES.FLOOR; // Replace item with floor
                } else if (tile && tile.type === TILE_TYPES.FOOD) {
                    if (this.inventory.length < 6) {
                        this.inventory.push({ type: 'food', foodType: tile.foodType });
                    } else {
                        this.restoreHunger(10);
                    }
                    grid[newY][newX] = TILE_TYPES.FLOOR; // Replace item with floor
                } else if (tile === TILE_TYPES.AXE) {
                    if (this.inventory.length < 6) {
                        this.inventory.push({ type: 'axe' });
                    } // If inventory full, can't pick up axe (unlike consumables)
                    grid[newY][newX] = TILE_TYPES.FLOOR; // Replace item with floor
                }
            this.x = newX;
            this.y = newY;

            // Check if moved onto grass with axe - cut it
            const hasAxe = this.inventory.some(item => item.type === 'axe');
            if (hasAxe && tile === TILE_TYPES.GRASS) {
                grid[newY][newX] = TILE_TYPES.FLOOR; // Cut the shrubbery
                this.decreaseHunger(); // Cutting costs hunger
            }

            return true;
        }
        
        return false;
    }

    isWalkable(x, y, grid) {
        // Check if position is within bounds
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return false;
        }

        const tile = grid[y][x];

        // Player can walk on floor, exit, water, food, and axe tiles
        if (tile === TILE_TYPES.FLOOR ||
            tile === TILE_TYPES.EXIT ||
            tile === TILE_TYPES.WATER ||
            tile === TILE_TYPES.AXE ||
            (tile && tile.type === TILE_TYPES.FOOD)) {
            return true;
        }

        // Check if there's an axe in inventory - allows walking on grass to cut it
        const hasAxe = this.inventory.some(item => item.type === 'axe');
        if (hasAxe && tile === TILE_TYPES.GRASS) {
            return true;
        }

        return false;
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
                // Coming from bottom, enter at the bottom exit (on the exit tile itself)
                if (connections.south !== null) {
                    this.setPosition(connections.south, GRID_SIZE - 1);
                } else {
                    this.setPosition(Math.floor(GRID_SIZE / 2), GRID_SIZE - 1);
                }
                break;
            case 'bottom':
                // Coming from top, enter at the top exit (on the exit tile itself)
                if (connections.north !== null) {
                    this.setPosition(connections.north, 0);
                } else {
                    this.setPosition(Math.floor(GRID_SIZE / 2), 0);
                }
                break;
            case 'left':
                // Coming from right, enter at the right exit (on the exit tile itself)
                if (connections.east !== null) {
                    this.setPosition(GRID_SIZE - 1, connections.east);
                } else {
                    this.setPosition(GRID_SIZE - 1, Math.floor(GRID_SIZE / 2));
                }
                break;
            case 'right':
                // Coming from left, enter at the left exit (on the exit tile itself)
                if (connections.west !== null) {
                    this.setPosition(0, connections.west);
                } else {
                    this.setPosition(0, Math.floor(GRID_SIZE / 2));
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
    // Place player in front of the house at zone (0,0)
    // House is at (3,3) to (5,5), so place player at (4,7) - centered in front
    this.x = 4;
    this.y = 7;
    this.currentZone = { x: 0, y: 0 };
    this.thirst = 50;
    this.hunger = 50;
    this.health = 3;
    this.dead = false;
    this.sprite = 'SeparateAnim/Special2';
    this.visitedZones.clear();
    this.markZoneVisited(0, 0);
    }

    // Thirst and Hunger management
    getThirst() {
        return this.thirst;
    }

    getHunger() {
        return this.hunger;
    }

    setThirst(value) {
        this.thirst = Math.max(0, Math.min(50, value));
        if (this.thirst === 0) {
            this.setDead();
        }
    }

    setHunger(value) {
        this.hunger = Math.max(0, Math.min(50, value));
        if (this.hunger === 0) {
            this.setDead();
        }
    }

    // Health management (for enemy attacks)
    getHealth() {
        return this.health;
    }

    setHealth(value) {
        this.health = Math.max(0, value);
        if (this.health <= 0) {
            this.setDead();
        }
    }

    takeDamage(amount = 1) {
        this.setHealth(this.health - amount);
    }

    decreaseThirst(amount = 1) {
        this.setThirst(this.thirst - amount);
    }

    decreaseHunger(amount = 1) {
        this.setHunger(this.hunger - amount);
    }

    restoreThirst(amount = 10) {
        this.setThirst(this.thirst + amount);
    }

    restoreHunger(amount = 10) {
        this.setHunger(this.hunger + amount);
    }

    setDead() {
        if (!this.dead) {
            this.dead = true;
            this.sprite = 'SeparateAnim/dead';
        }
    }

    isDead() {
        return this.dead;
    }

    onZoneTransition() {
        // Called when player moves to a new zone
        this.decreaseThirst();
        this.decreaseHunger();
    }

    startAttackAnimation() {
        this.attackAnimation = 10; // 10 frames of attack animation
    }

    updateAnimations() {
        if (this.attackAnimation > 0) {
            this.attackAnimation--;
        }
    }
}
