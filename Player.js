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
        // Special zone mechanics
        this.smellOranges = false;
        this.smellLemons = false;
        this.bumpOffsetX = 0;
        this.bumpOffsetY = 0;
        this.bumpFrames = 0;
        this.markZoneVisited(0, 0);
    }

    move(newX, newY, grid, onZoneTransition) {
        console.log('Attempting to move from ' + this.x + ',' + this.y + ' to ' + newX + ',' + newY)
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
        
        console.log('Tile at target: ' + grid[newY][newX])
        // Check if the new position is walkable
        console.log('Is walkable: ' + this.isWalkable(newX, newY, grid, this.x, this.y))
        if (this.isWalkable(newX, newY, grid, this.x, this.y)) {
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
                        grid[newY][newX] = TILE_TYPES.FLOOR; // Replace item with floor only if picked up
                    } // If inventory full, can't pick up axe and it remains on ground
                } else if (tile === TILE_TYPES.HAMMER) {
                    if (this.inventory.length < 6) {
                        this.inventory.push({ type: 'hammer' });
                        grid[newY][newX] = TILE_TYPES.FLOOR; // Replace item with floor only if picked up
                    } // If inventory full, can't pick up hammer and it remains on ground
                } else if (tile && tile.type === TILE_TYPES.BISHOP_SPEAR) {
                    if (this.inventory.length < 6) {
                        this.inventory.push({ type: 'bishop_spear', uses: tile.uses });
                        grid[newY][newX] = TILE_TYPES.FLOOR; // Replace item with floor only if picked up
                    } // If inventory full, can't pick up bishop spear and it remains on ground
                } else if (tile === TILE_TYPES.BOMB) {
                    if (this.inventory.length < 6) {
                        this.inventory.push({ type: 'bomb' });
                        grid[newY][newX] = TILE_TYPES.FLOOR; // Replace item with floor only if picked up
                    } // If inventory full, can't pick up spear and it remains on ground
                }
            this.x = newX;
            this.y = newY;

            // Set smells when stepping on scent tiles
            if (tile === TILE_TYPES.ORANGE_FLOOR) {
                this.smellOranges = true;
            } else if (tile === TILE_TYPES.PURPLE_FLOOR) {
                this.smellLemons = true;
            }

            // Check if moved onto grass or shrubbery with axe - cut it
            const hasAxe = this.inventory.some(item => item.type === 'axe');
            if (hasAxe && (tile === TILE_TYPES.GRASS || tile === TILE_TYPES.SHRUBBERY)) {
                // If cutting shrubbery on border, restore exit if it was blocking one
                const isBorder = newX === 0 || newX === GRID_SIZE - 1 || newY === 0 || newY === GRID_SIZE - 1;
                grid[newY][newX] = isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR;
                this.decreaseHunger(); // Cutting costs hunger
            }

            // Check if moved onto rock with hammer - break it
            const hasHammer = this.inventory.some(item => item.type === 'hammer');
            if (hasHammer && tile === TILE_TYPES.ROCK) {
                // Check if this rock is on border and was a blocked exit - restore exit if so
                const isBorder = newY === 0 || newY === GRID_SIZE - 1 || newX === 0 || newX === GRID_SIZE - 1;
                grid[newY][newX] = isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR; // Restore blocked exit if on border
                this.decreaseHunger(2); // Breaking costs 2 hunger
            }

            return true;
        }
        
        return false;
    }

    isWalkable(x, y, grid, fromX = this.x, fromY = this.y) {
        // Check if position is within bounds
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return false;
        }

        const tile = grid[y][x];

        // Signs are not walkable
        if ((tile && tile.type === TILE_TYPES.SIGN) || tile === TILE_TYPES.SIGN) {
            return false;
        }

        // Tinted floor tiles
        if (tile === TILE_TYPES.PINK_FLOOR ||
            tile === TILE_TYPES.ORANGE_FLOOR ||
            tile === TILE_TYPES.PURPLE_FLOOR) {
            return true; // Always walkable
        }

        if (tile === TILE_TYPES.RED_FLOOR) {
            // Can walk if coming from purple or red tile
            const fromTile = grid[fromY][fromX];
            return fromTile === TILE_TYPES.PURPLE_FLOOR || fromTile === TILE_TYPES.RED_FLOOR;
        }

        if (tile === TILE_TYPES.BLUE_FLOOR) {
            // Walkable unless smelling like oranges
            return !this.smellOranges;
        }

        if (tile === TILE_TYPES.GREEN_FLOOR) {
            // Walkable unless smelling like lemons
            return !this.smellLemons;
        }

        if (tile === TILE_TYPES.YELLOW_FLOOR) {
            // Never walkable
            return false;
        }

        // Regular tiles
        // Player can walk on floor, exit, water, food, axe, hammer, spear, note, and lion tiles
        if (tile === TILE_TYPES.FLOOR ||
            tile === TILE_TYPES.EXIT ||
            tile === TILE_TYPES.WATER ||
            tile === TILE_TYPES.AXE ||
            tile === TILE_TYPES.HAMMER ||
            tile === TILE_TYPES.SPEAR ||
            tile === TILE_TYPES.BOMB ||
            (tile && tile.type === TILE_TYPES.FOOD) ||
            (tile && tile.type === TILE_TYPES.NOTE && tile.note) || // Specifically check for a note object
            tile === TILE_TYPES.LION) {
            return true;
        }

        // Check if there's an axe in inventory - allows walking on grass and shrubbery to cut it
        const hasAxe = this.inventory.some(item => item.type === 'axe');
        if (hasAxe && (tile === TILE_TYPES.GRASS || tile === TILE_TYPES.SHRUBBERY)) {
            return true;
        }

        // Check if there's a hammer in inventory - allows walking on rocks to break them
        const hasHammer = this.inventory.some(item => item.type === 'hammer');
        if (hasHammer && tile === TILE_TYPES.ROCK) {
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
    this.inventory = [];
    this.health = 3;
    this.dead = false;
    this.sprite = 'SeparateAnim/Special2';
    this.visitedZones.clear();
    this.smellOranges = false;
    this.smellLemons = false;
    this.bumpOffsetX = 0;
    this.bumpOffsetY = 0;
    this.bumpFrames = 0;
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



    startBump(deltaX, deltaY) {
        // Set initial bump offset (towards the other entity)
        this.bumpOffsetX = deltaX * 24; // Increased from 16 for more impact
        this.bumpOffsetY = deltaY * 24;
        this.bumpFrames = 15; // Increased from 10 for longer animation
    }

    startAttackAnimation() {
        this.attackAnimation = 20; // 20 frames of attack animation
    }

    updateAnimations() {
        if (this.bumpFrames > 0) {
            this.bumpFrames--;
            // Gradually reduce the offset
            this.bumpOffsetX *= 0.85; // Adjusted decay for smoother return
            this.bumpOffsetY *= 0.85;
        }
        if (this.attackAnimation > 0) {
            this.attackAnimation--;
        }
    }
}
