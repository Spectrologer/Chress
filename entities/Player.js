import { TILE_TYPES, GRID_SIZE, UI_CONSTANTS, ZONE_CONSTANTS, ANIMATION_CONSTANTS } from '../core/constants.js';
import { PlayerStats } from './PlayerStats.js';
import { PlayerAnimations } from './PlayerAnimations.js';

export class Player {
    constructor() {
        this.x = 1;
        this.y = 1;
        this.currentZone = { x: 0, y: 0, dimension: 0 };
        this.visitedZones = new Set();
        this.inventory = [];
        this.abilities = new Set(); // Track player abilities
        this.sprite = 'SeparateAnim/Special2';

        this.stats = new PlayerStats(this);
        this.animations = new PlayerAnimations(this);
        this.itemManager = null; // To be set by Game class

        this.interactOnReach = null; // {x, y} - interact with this tile when reaching adjacent        
        this.markZoneVisited(0, 0, 0); // Start in dimension 0
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
        if (this.isWalkable(newX, newY, grid, this.x, this.y)) {
            // Check if moving to active player-set bomb
            const tile = grid[newY][newX];
            if (tile && typeof tile === 'object' && tile.type === TILE_TYPES.BOMB) {
                window.gameInstance.explodeBomb(newX, newY);
                return false; // Explode and launch, don't move normally
            }

            // Delegate item pickup logic to ItemManager
            this.itemManager?.handleItemPickup(this, newX, newY, grid);

            this.x = newX;
            this.y = newY;

            this.animations.liftFrames = ANIMATION_CONSTANTS.LIFT_FRAMES; // Start lift animation
            window.soundManager?.playSound('move');

            return true;
        } else {
            // Check if can chop/smash the target tile (only orthogonal adjacent positions)
            const tile = grid[newY][newX];
            const deltaX = Math.abs(newX - this.x);
            const deltaY = Math.abs(newY - this.y);
            const isAdjacentOrthogonal = (deltaX === 1 && deltaY === 0) || (deltaX === 0 && deltaY === 1);

            if (isAdjacentOrthogonal) {
                const hasAxe = this.abilities.has('axe');
                if (hasAxe && (tile === TILE_TYPES.GRASS || tile === TILE_TYPES.SHRUBBERY)) {
                    // Chop at target position without moving
                    const isBorder = newX === 0 || newX === GRID_SIZE - 1 || newY === 0 || newY === GRID_SIZE - 1;
                    grid[newY][newX] = isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR;
                    this.stats.decreaseHunger(); // Cutting costs hunger
                    this.animations.startActionAnimation(); // Start action animation
                    this.animations.startBump(newX - this.x, newY - this.y); // Bump towards the chopped tile
                    window.soundManager?.playSound('chop');
                    window.gameInstance.startEnemyTurns(); // Chopping takes a turn
                    return false; // Don't move, just attack
                }

                const hasHammer = this.inventory.some(item => item.type === 'hammer');
                if (hasHammer && tile === TILE_TYPES.ROCK) {
                    // Break at target position without moving
                    const isBorder = newY === 0 || newY === GRID_SIZE - 1 || newX === 0 || newX === GRID_SIZE - 1;
                    grid[newY][newX] = isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR;
                    this.stats.decreaseHunger(2); // Breaking costs 2 hunger
                    this.animations.startActionAnimation(); // Start action animation
                    this.animations.startBump(newX - this.x, newY - this.y); // Bump towards the smashed tile
                    window.soundManager?.playSound('smash');
                    window.gameInstance.startEnemyTurns(); // Smashing takes a turn
                    return false; // Don't move, just attack
                }
            }

            return false; // Can't move
        }
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

        // Regular tiles
        // Player can walk on floor, exit, water, food, axe, hammer, bishop spear, horse icon, bomb, note, heart, and port tiles
        if (tile === TILE_TYPES.FLOOR ||
            tile === TILE_TYPES.EXIT ||
            tile === TILE_TYPES.WATER ||
            tile === TILE_TYPES.AXE ||
            tile === TILE_TYPES.HAMMER ||
            (tile && tile.type === TILE_TYPES.BISHOP_SPEAR) ||
            (tile && tile.type === TILE_TYPES.HORSE_ICON) ||
            tile === TILE_TYPES.BOMB ||
            (tile && tile.type === TILE_TYPES.FOOD) || // Note items are just the tile type number
            tile === TILE_TYPES.NOTE ||
            tile === TILE_TYPES.HEART ||
            (tile && tile.type === TILE_TYPES.BOOK_OF_TIME_TRAVEL) ||
            (tile && tile.type === TILE_TYPES.BOW) ||
            tile === TILE_TYPES.CISTERN ||
            tile === TILE_TYPES.PORT) {
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

    setCurrentZone(x, y, dimension = this.currentZone.dimension) {
        this.currentZone.x = x;
        this.currentZone.y = y;
        this.currentZone.dimension = dimension;
        this.markZoneVisited(x, y, dimension);
    }

    markZoneVisited(x, y, dimension) {
        this.visitedZones.add(`${x},${y}:${dimension}`);
    }

    hasVisitedZone(x, y, dimension) {
        return this.visitedZones.has(`${x},${y}:${dimension}`);
    }

    getVisitedZones() {
        return new Set(this.visitedZones);
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
    this.x = ZONE_CONSTANTS.PLAYER_SPAWN_POSITION.x;
    this.y = ZONE_CONSTANTS.PLAYER_SPAWN_POSITION.y;
    this.currentZone = { x: 0, y: 0, dimension: 0 };
    this.inventory = [];
    this.abilities.clear();
    this.sprite = 'SeparateAnim/Special2';
    this.visitedZones.clear();
    this.stats.reset();
    this.animations.reset();
    this.interactOnReach = null;
    this.markZoneVisited(0, 0, 0);
    }

    // Thirst and Hunger management
    getThirst() {
        return this.stats.getThirst();
    }

    getHunger() {
        return this.stats.getHunger();
    }

    setThirst(value) {
        this.stats.setThirst(value);
    }

    setHunger(value) {
        this.stats.setHunger(value);
    }

    // Health management (for enemy attacks)
    getHealth() {
        return this.stats.getHealth();
    }

    setHealth(value) {
        this.stats.setHealth(value);
    }

    takeDamage(amount = 1) {
        this.stats.takeDamage(amount);
    }

    decreaseThirst(amount = 1) {
        this.stats.decreaseThirst(amount);
    }

    decreaseHunger(amount = 1) {
        this.stats.decreaseHunger(amount);
    }

    restoreThirst(amount = 10) {
        this.stats.restoreThirst(amount);
    }

    restoreHunger(amount = 10) {
        this.stats.restoreHunger(amount);
    }

    setDead() {
        this.stats.setDead();
    }

    isDead() {
        return this.stats.isDead();
    }

    onZoneTransition() {
        // Called when player moves to a new zone
        this.stats.decreaseThirst();
        this.stats.decreaseHunger();
    }

    getPoints() {
        return this.stats.points;
    }

    addPoints(points) {
        this.stats.points += points;
    }

    startBump(deltaX, deltaY) {
        this.animations.startBump(deltaX, deltaY);
    }

    startAttackAnimation() {
        this.animations.startAttackAnimation();
    }

    startActionAnimation() {
        this.animations.startActionAnimation();
    }

    startSmokeAnimation() {
        this.animations.startSmokeAnimation();
    }

    startSplodeAnimation(x, y) {
        this.animations.startSplodeAnimation(x, y);
    }

    updateAnimations() {
        this.animations.update();
    }

    getValidSpawnPosition(game) {
        const availableTiles = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = game.grid[y][x];
                const playerPos = this.getPosition();
                const hasEnemy = game.enemies.some(e => e.x === x && e.y === y);
                if ((tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.EXIT) && !hasEnemy && !(x === playerPos.x && y === playerPos.y)) {
                    availableTiles.push({x, y});
                }
            }
        }
        if (availableTiles.length > 0) {
            return availableTiles[Math.floor(Math.random() * availableTiles.length)];
        }
        return null;
    }

    setInteractOnReach(x, y) {
        this.interactOnReach = { x, y };
    }

    clearInteractOnReach() {
        this.interactOnReach = null;
    }
}
