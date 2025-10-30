// @ts-check

/**
 * @typedef {Object} ZoneCoords
 * @property {number} x - Zone X coordinate
 * @property {number} y - Zone Y coordinate
 * @property {number} dimension - Zone dimension (0=surface, 1=interior, 2=underground)
 * @property {number} [depth] - Underground depth level (for dimension 2)
 */

/**
 * @typedef {Array<Array<*>>} Grid
 */

/**
 * @typedef {Object} ItemManager
 * @property {function(Player, number, number, Grid): void} [handleItemPickup] - Handle item pickup
 */

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
        /** @type {Position} Internal position tracking using Position class */
        this._position = new Position(1, 1);
        /** @type {Position} */
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

        /** @type {ZoneCoords} */
        this.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        /** @type {Set<string>} */
        this.visitedZones = new Set();
        /** @type {Array<string>} */
        this.inventory = [];
        /** @type {Array<string>} Separate inventory for quick radial actions (icons around player) */
        this.radialInventory = []; // items like bombs, horse_icon, bow, bishop_spear, book_of_time_travel
        /** @type {Set<string>} Track player abilities */
        this.abilities = new Set();
        /** @type {string} */
        this.sprite = 'SeparateAnim/Special2';

        /** @type {PlayerStats} */
        this.stats = new PlayerStats(this);
        /** @type {PlayerAnimations} */
        this.animations = new PlayerAnimations(this);
        /** @type {number} track consecutive kills by player */
        this.consecutiveKills = 0;
        /** @type {string|null} e.g. 'attack', 'move' */
        this.lastActionType = null;
        /** @type {string|null} e.g. 'kill', 'miss' */
        this.lastActionResult = null;
        /** @type {ItemManager|null} To be set by Game class */
        this.itemManager = null;

        /** @type {{x: number, y: number}|null} Position object - interact with this tile when reaching adjacent */
        this.interactOnReach = null;
        /** @type {number} 0 == surface, 1 == first underground, 2 == deeper, etc. */
        this.undergroundDepth = 0;
        this.markZoneVisited(0, 0, 0); // Start in surface dimension 0
    }

    /**
     * Moves the player to a new position if valid
     * @param {number} newX - Target X coordinate
     * @param {number} newY - Target Y coordinate
     * @param {Grid} grid - Game grid
     * @param {function(number, number, string): void} [onZoneTransition] - Zone transition callback
     * @returns {boolean} True if move was successful
     */
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
                // Explode the bomb and prevent the move
                // The bomb will launch the player away as part of the explosion
                /** @type {any} */(window).gameInstance.explodeBomb(newX, newY);
                return false; // Explode and launch, don't complete the move
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
                /** @type {any} */(window).gameInstance.interactionManager.zoneManager.handlePitfallTransition(this.x, this.y);
                return true; // Movement was successful, but transition is happening
            }

            this.animations.liftFrames = ANIMATION_CONSTANTS.LIFT_FRAMES; // Start lift animation
            audioManager.playSound('move');

            // Movement interrupts attack combos
            try {
                this.setAction('move');
            } catch (e) {
                errorHandler.handle(e, /** @type {any} */(ErrorSeverity).WARNING, {
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
                    /** @type {any} */(window).gameInstance.startEnemyTurns(); // Chopping takes a turn
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
                    /** @type {any} */(window).gameInstance.startEnemyTurns(); // Smashing takes a turn
                    return false; // Don't move, just attack
                }
            }

            return false; // Can't move
        }
    }

    /**
     * Checks if a position is walkable
     * @param {number} x - X coordinate to check
     * @param {number} y - Y coordinate to check
     * @param {Grid} grid - Game grid
     * @param {number} [fromX] - Starting X (for context, currently unused)
     * @param {number} [fromY] - Starting Y (for context, currently unused)
     * @returns {boolean} True if position is walkable
     */
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

    /**
     * Sets the player's position directly
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {void}
     */
    setPosition(x, y) {
        // Keep previous position for interpolation/hop animations
        this._lastPosition = this._position.clone();

        // Update position
        this._position = new Position(x, y);

        // Emit player moved event
        eventBus.emit(EventTypes.PLAYER_MOVED, this._position.toObject());
    }

    /**
     * Gets the player's current position as a plain object
     * @returns {{x: number, y: number}}
     */
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

    /**
     * Gets the current zone coordinates
     * @returns {ZoneCoords}
     */
    getCurrentZone() {
        return { ...this.currentZone };
    }

    /**
     * Sets the current zone coordinates
     * @param {number} x - Zone X coordinate
     * @param {number} y - Zone Y coordinate
     * @param {number} [dimension] - Zone dimension
     * @returns {void}
     */
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

    /**
     * Marks a zone as visited
     * @param {number} x - Zone X coordinate
     * @param {number} y - Zone Y coordinate
     * @param {number} dimension - Zone dimension
     * @returns {void}
     */
    markZoneVisited(x, y, dimension) {
        // For underground zones, include depth in the saved key so different depths are tracked separately
        const numericDim = Number(dimension);
        const depth = (numericDim === 2)
            ? (this.currentZone && this.currentZone.depth ? this.currentZone.depth : (this.undergroundDepth || 1))
            : undefined;
        const zoneKey = createZoneKey(x, y, numericDim, depth);
        this.visitedZones.add(zoneKey);
    }

    /**
     * Checks if a zone has been visited
     * @param {number} x - Zone X coordinate
     * @param {number} y - Zone Y coordinate
     * @param {number} dimension - Zone dimension
     * @returns {boolean}
     */
    hasVisitedZone(x, y, dimension) {
        const depth = (dimension === 2)
            ? (this.currentZone && this.currentZone.depth ? this.currentZone.depth : (this.undergroundDepth || 1))
            : undefined;
        const zoneKey = createZoneKey(x, y, dimension, depth);
        return this.visitedZones.has(zoneKey);
    }

    /**
     * Gets a copy of all visited zones
     * @returns {Set<string>}
     */
    getVisitedZones() {
        return new Set(this.visitedZones);
    }

    /**
     * Ensures player is on a walkable tile, moves to nearest if not
     * @param {Grid} grid - Game grid
     * @returns {void}
     */
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

    /**
     * Resets the player to initial state
     * @returns {void}
     */
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
    /**
     * Gets current thirst value
     * @returns {number}
     */
    getThirst() {
        return this.stats.getThirst();
    }

    /**
     * Gets current hunger value
     * @returns {number}
     */
    getHunger() {
        return this.stats.getHunger();
    }

    /**
     * Sets thirst value
     * @param {number} value - New thirst value
     * @returns {void}
     */
    setThirst(value) {
        this.stats.setThirst(value);
    }

    /**
     * Sets hunger value
     * @param {number} value - New hunger value
     * @returns {void}
     */
    setHunger(value) {
        this.stats.setHunger(value);
    }

    // Health management (for enemy attacks)
    /**
     * Gets current health value
     * @returns {number}
     */
    getHealth() {
        return this.stats.getHealth();
    }

    /**
     * Sets health value
     * @param {number} value - New health value
     * @returns {void}
     */
    setHealth(value) {
        this.stats.setHealth(value);
    }

    /**
     * Applies damage to player
     * @param {number} [amount=1] - Damage amount
     * @returns {void}
     */
    takeDamage(amount = 1) {
        // Taking damage cancels any consecutive-kill streak
        try {
            this.consecutiveKills = 0;
        } catch (e) {
            errorHandler.handle(e, /** @type {any} */(ErrorSeverity).WARNING, {
                component: 'Player',
                action: 'reset consecutive kills'
            });
        }
        this.stats.takeDamage(amount);
    }

    /**
     * Decreases thirst
     * @param {number} [amount=1] - Amount to decrease
     * @returns {void}
     */
    decreaseThirst(amount = 1) {
        this.stats.decreaseThirst(amount);
    }

    /**
     * Decreases hunger
     * @param {number} [amount=1] - Amount to decrease
     * @returns {void}
     */
    decreaseHunger(amount = 1) {
        this.stats.decreaseHunger(amount);
    }

    /**
     * Restores thirst
     * @param {number} [amount=10] - Amount to restore
     * @returns {void}
     */
    restoreThirst(amount = 10) {
        this.stats.restoreThirst(amount);
    }

    /**
     * Restores hunger
     * @param {number} [amount=10] - Amount to restore
     * @returns {void}
     */
    restoreHunger(amount = 10) {
        this.stats.restoreHunger(amount);
    }

    /**
     * Marks player as dead
     * @returns {void}
     */
    setDead() {
        this.stats.setDead();
    }

    /**
     * Checks if player is dead
     * @returns {boolean}
     */
    isDead() {
        return this.stats.isDead();
    }

    /**
     * Called when player moves to a new zone
     * @returns {void}
     */
    onZoneTransition() {
        // Called when player moves to a new zone
        this.stats.decreaseThirst();
        this.stats.decreaseHunger();
    }

    /**
     * Gets current points
     * @returns {number}
     */
    getPoints() {
        return this.stats.getPoints();
    }

    /**
     * Adds points
     * @param {number} points - Points to add
     * @returns {void}
     */
    addPoints(points) {
        this.stats.addPoints(points);
    }

    /**
     * Sets points
     * @param {number} points - Points to set
     * @returns {void}
     */
    setPoints(points) {
        this.stats.setPoints(points);
    }

    /**
     * Gets spent discoveries count
     * @returns {number}
     */
    getSpentDiscoveries() {
        return this.stats.getSpentDiscoveries();
    }

    /**
     * Sets spent discoveries count
     * @param {number} value - Value to set
     * @returns {void}
     */
    setSpentDiscoveries(value) {
        this.stats.setSpentDiscoveries(value);
    }

    /**
     * Starts bump animation
     * @param {number} deltaX - X direction
     * @param {number} deltaY - Y direction
     * @returns {void}
     */
    startBump(deltaX, deltaY) {
        this.animations.startBump(deltaX, deltaY);
    }

    /**
     * Starts backflip animation
     * @param {number} [frames=20] - Animation frames
     * @returns {void}
     */
    startBackflip(frames = 20) {
        // Visually perform a backflip (rotate sprite)
        this.animations.startBackflip(frames);
    }

    /**
     * Starts attack animation
     * @returns {void}
     */
    startAttackAnimation() {
        this.animations.startAttackAnimation();
    }

    /**
     * Starts action animation
     * @returns {void}
     */
    startActionAnimation() {
        this.animations.startActionAnimation();
    }

    /**
     * Starts smoke animation
     * @returns {void}
     */
    startSmokeAnimation() {
        this.animations.startSmokeAnimation();
    }

    /**
     * Starts splode animation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {void}
     */
    startSplodeAnimation(x, y) {
        this.animations.startSplodeAnimation(x, y);
    }

    /**
     * Updates all animations
     * @returns {void}
     */
    updateAnimations() {
        this.animations.update();
    }

    /**
     * Gets a valid spawn position for items/enemies
     * @param {Object} game - Game instance
     * @param {Grid} game.grid - Game grid
     * @param {Array<{x: number, y: number}>} game.enemies - Enemy list
     * @returns {{x: number, y: number}|null}
     */
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

    /**
     * Sets a position to interact with when reached
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {void}
     */
    setInteractOnReach(x, y) {
        this.interactOnReach = new Position(x, y);
    }

    /**
     * Clears the interact on reach position
     * @returns {void}
     */
    clearInteractOnReach() {
        this.interactOnReach = null;
    }

    /**
     * Sets the current action type
     * @param {string} type - Action type (e.g., 'attack', 'move')
     * @returns {void}
     */
    setAction(type) {
        this.lastActionType = type;
        // Clear lastActionResult unless it's a continuation of attack actions
        if (type !== 'attack') this.lastActionResult = null;
    }
}
