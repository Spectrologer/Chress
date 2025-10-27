import { TILE_TYPES, GRID_SIZE, UI_CONSTANTS, ZONE_CONSTANTS, ANIMATION_CONSTANTS } from '../core/constants/index.js';
import { PlayerStats } from './PlayerStats.js';
import { PlayerAnimations } from './PlayerAnimations.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import audioManager from '../utils/AudioManager.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.js';
import { TileRegistry } from '../core/TileRegistry.js';
import { isBomb, isTileType } from '../utils/TileUtils.js';
import GridIterator from '../utils/GridIterator.js';
import { Position } from '../core/Position.js';

export class Player {
    constructor() {
        // Internal position tracking using Position class
        this._position = new Position(1, 1);
        this._lastPosition = this._position.clone();

        // Maintain x, y properties for backward compatibility
        Object.defineProperty(this, 'x', {
            get() { return this._position.x; },
            set(value) { this._position.x = value; }
        });
        Object.defineProperty(this, 'y', {
            get() { return this._position.y; },
            set(value) { this._position.y = value; }
        });
        Object.defineProperty(this, 'lastX', {
            get() { return this._lastPosition.x; },
            set(value) { this._lastPosition.x = value; }
        });
        Object.defineProperty(this, 'lastY', {
            get() { return this._lastPosition.y; },
            set(value) { this._lastPosition.y = value; }
        });

        this.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        this.visitedZones = new Set();
        this.inventory = [];
    // Separate inventory for quick radial actions (icons around player)
    this.radialInventory = []; // items like bombs, horse_icon, bow, bishop_spear, book_of_time_travel
        this.abilities = new Set(); // Track player abilities
        this.sprite = 'SeparateAnim/Special2';

        this.stats = new PlayerStats(this);
        this.animations = new PlayerAnimations(this);
    this.consecutiveKills = 0; // track consecutive kills by player
        this.lastActionType = null; // e.g. 'attack', 'move'
        this.lastActionResult = null; // e.g. 'kill', 'miss'
        this.itemManager = null; // To be set by Game class

        this.interactOnReach = null; // Position object - interact with this tile when reaching adjacent
        this.undergroundDepth = 0; // 0 == surface, 1 == first underground, 2 == deeper, etc.
        this.markZoneVisited(0, 0, 0); // Start in surface dimension 0
    }

    move(newX, newY, grid, onZoneTransition) {
        const newPos = new Position(newX, newY);

        // Check if the new position is off-grid while player is on an exit tile
        if (!newPos.isInBounds(GRID_SIZE)) {
            // Only allow off-grid movement if player is currently on an exit tile
            if (isTileType(this._position.getTile(grid), TILE_TYPES.EXIT)) {
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
            // Check if moving to active player-placed bomb (object bomb, not primitive pickup)
            const tile = newPos.getTile(grid);
            if (typeof tile === 'object' && isBomb(tile)) {
                window.gameInstance.explodeBomb(newX, newY);
                return false; // Explode and launch, don't move normally
            }

            // Delegate item pickup logic to ItemManager
            this.itemManager?.handleItemPickup(this, newX, newY, grid);

            // Record previous position so renderer can interpolate movement
            this._lastPosition = this._position.clone();

            // Update position
            this._position = newPos;

            // Emit player moved event
            eventBus.emit(EventTypes.PLAYER_MOVED, this._position.toObject());

            // Check for pitfall trap after moving
            const newTile = this._position.getTile(grid);
            if (isTileType(newTile, TILE_TYPES.PITFALL)) {
                window.gameInstance.interactionManager.zoneManager.handlePitfallTransition(this.x, this.y);
                return true; // Movement was successful, but transition is happening
            }

            this.animations.liftFrames = ANIMATION_CONSTANTS.LIFT_FRAMES; // Start lift animation
            audioManager.playSound('move');

            // Movement interrupts attack combos
            try {
                this.setAction('move');
            } catch (e) {
                errorHandler.handle(e, ErrorSeverity.WARNING, {
                    component: 'Player',
                    action: 'set action to move'
                });
            }

            return true;
        } else {
            // Check if can chop/smash the target tile (only orthogonal adjacent positions)
            const tile = newPos.getTile(grid);
            const isAdjacentOrthogonal = this._position.isAdjacentTo(newPos, false);

            if (isAdjacentOrthogonal) {
                const hasAxe = this.abilities.has('axe');
                if (hasAxe && (isTileType(tile, TILE_TYPES.GRASS) || isTileType(tile, TILE_TYPES.SHRUBBERY))) {
                    // Chop at target position without moving
                    const isBorder = newX === 0 || newX === GRID_SIZE - 1 || newY === 0 || newY === GRID_SIZE - 1;
                    newPos.setTile(grid, isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR);
                    this.stats.decreaseHunger(); // Cutting costs hunger
                    this.animations.startActionAnimation(); // Start action animation
                    this.animations.startBump(newX - this.x, newY - this.y); // Bump towards the chopped tile
                    // Play the slash SFX (file-backed) when chopping shrubbery/grass
                    audioManager.playSound('slash');
                    window.gameInstance.startEnemyTurns(); // Chopping takes a turn
                    return false; // Don't move, just attack
                }

                const hasHammer = this.abilities.has('hammer');
                if (hasHammer && isTileType(tile, TILE_TYPES.ROCK)) {
                    // Break at target position without moving
                    const isBorder = newY === 0 || newY === GRID_SIZE - 1 || newX === 0 || newX === GRID_SIZE - 1;
                    newPos.setTile(grid, isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR);
                    this.stats.decreaseHunger(2); // Breaking costs 2 hunger
                    this.animations.startActionAnimation(); // Start action animation
                    this.animations.startBump(newX - this.x, newY - this.y); // Bump towards the smashed tile
                    audioManager.playSound('smash');
                    window.gameInstance.startEnemyTurns(); // Smashing takes a turn
                    return false; // Don't move, just attack
                }
            }

            return false; // Can't move
        }
    }

    isWalkable(x, y, grid, fromX = this.x, fromY = this.y) {
        const pos = new Position(x, y);

        // Check if position is within bounds
        if (!pos.isInBounds(GRID_SIZE)) {
            return false;
        }

        const tile = pos.getTile(grid);

        // Use centralized TileRegistry for walkability checks
        return TileRegistry.isWalkable(tile);
    }

    setPosition(x, y) {
        // Keep previous position for interpolation/hop animations
        this._lastPosition = this._position.clone();

        // Update position
        this._position = new Position(x, y);

        // Emit player moved event
        eventBus.emit(EventTypes.PLAYER_MOVED, this._position.toObject());
    }

    getPosition() {
        return this._position.toObject();
    }

    /**
     * Gets the internal Position object (useful for Position methods)
     * @returns {Position}
     */
    getPositionObject() {
        return this._position;
    }

    getCurrentZone() {
        return { ...this.currentZone };
    }

    setCurrentZone(x, y, dimension = this.currentZone.dimension) {
        this.currentZone.x = x;
        this.currentZone.y = y;
        // Coerce dimension to a number to avoid cases where saved/loaded
        // state supplies a string ("2"). Default to 0 if coercion fails.
        this.currentZone.dimension = (typeof dimension === 'number') ? dimension : Number(dimension) || 0;
        // Attach depth for underground zones (use coerced numeric value)
        if (Number(this.currentZone.dimension) === 2) {
            // If an explicit depth exists on the zone object, use it; otherwise fallback to player's current depth
            this.currentZone.depth = this.currentZone.depth || (this.undergroundDepth || 1);
        } else {
            this.currentZone.depth = 0;
        }
        // Persist visited using numeric dimension
        this.markZoneVisited(x, y, this.currentZone.dimension);
    }

    markZoneVisited(x, y, dimension) {
        // For underground zones, include depth in the saved key so different depths are tracked separately
        const numericDim = Number(dimension);
        const depth = (numericDim === 2)
            ? (this.currentZone && this.currentZone.depth ? this.currentZone.depth : (this.undergroundDepth || 1))
            : undefined;
        const zoneKey = createZoneKey(x, y, numericDim, depth);
        this.visitedZones.add(zoneKey);
    }

    hasVisitedZone(x, y, dimension) {
        const depth = (dimension === 2)
            ? (this.currentZone && this.currentZone.depth ? this.currentZone.depth : (this.undergroundDepth || 1))
            : undefined;
        const zoneKey = createZoneKey(x, y, dimension, depth);
        return this.visitedZones.has(zoneKey);
    }

    getVisitedZones() {
        return new Set(this.visitedZones);
    }

    ensureValidPosition(grid) {
        // Ensure player is on a walkable tile
        if (!this.isWalkable(this.x, this.y, grid)) {
            // Find nearest walkable tile using Position's positionsWithinRadius
            for (let radius = 1; radius < GRID_SIZE; radius++) {
                const positions = this._position.positionsWithinRadius(radius);
                for (const pos of positions) {
                    if (this.isWalkable(pos.x, pos.y, grid)) {
                        this.setPosition(pos.x, pos.y);
                        return;
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
    this.radialInventory = [];
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
        // Taking damage cancels any consecutive-kill streak
        try {
            this.consecutiveKills = 0;
        } catch (e) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'Player',
                action: 'reset consecutive kills'
            });
        }
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
        return this.stats.getPoints();
    }

    addPoints(points) {
        this.stats.addPoints(points);
    }

    setPoints(points) {
        this.stats.setPoints(points);
    }

    getSpentDiscoveries() {
        return this.stats.getSpentDiscoveries();
    }

    setSpentDiscoveries(value) {
        this.stats.setSpentDiscoveries(value);
    }

    startBump(deltaX, deltaY) {
        this.animations.startBump(deltaX, deltaY);
    }

    startBackflip(frames = 20) {
        // Visually perform a backflip (rotate sprite)
        this.animations.startBackflip(frames);
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
        const playerPos = this.getPosition();
        const availableTiles = GridIterator.findTiles(game.grid, (tile, x, y) => {
            const hasEnemy = game.enemies.some(e => e.x === x && e.y === y);
            return (isTileType(tile, TILE_TYPES.FLOOR) || isTileType(tile, TILE_TYPES.EXIT)) &&
                   !hasEnemy &&
                   !(x === playerPos.x && y === playerPos.y);
        });

        if (availableTiles.length > 0) {
            return availableTiles[Math.floor(Math.random() * availableTiles.length)];
        }
        return null;
    }

    setInteractOnReach(x, y) {
        this.interactOnReach = new Position(x, y);
    }

    clearInteractOnReach() {
        this.interactOnReach = null;
    }

    setAction(type) {
        this.lastActionType = type;
        // Clear lastActionResult unless it's a continuation of attack actions
        if (type !== 'attack') this.lastActionResult = null;
    }
}
