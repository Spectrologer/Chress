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
import { PlayerMovement } from './PlayerMovement.js';
import { PlayerAbilities } from './PlayerAbilities.js';
import { PlayerZoneTracking } from './PlayerZoneTracking.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import audioManager from '../utils/AudioManager.js';
import { eventBus } from '../core/EventBus.ts';
import { EventTypes } from '../core/EventTypes.ts';
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.ts';
import { TileRegistry } from '../core/TileRegistry.js';
import { isBomb, isTileType } from '../utils/TileUtils.js';
import GridIterator from '../utils/GridIterator.js';
import { Position } from '../core/Position.ts';

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
        /** @type {PlayerMovement} */
        this.movement = new PlayerMovement(this);
        /** @type {PlayerAbilities} */
        this.abilityManager = new PlayerAbilities(this);
        /** @type {PlayerZoneTracking} */
        this.zoneTracking = new PlayerZoneTracking(this);
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
        this.zoneTracking.markZoneVisited(0, 0, 0); // Start in surface dimension 0
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
        // First try to move
        const moved = this.movement.move(newX, newY, grid, onZoneTransition);

        // If can't move, try using abilities on the target tile
        if (!moved) {
            return this.abilityManager.tryUseAbility(newX, newY, grid);
        }

        return moved;
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
        return this.movement.isWalkable(x, y, grid, fromX, fromY);
    }

    /**
     * Sets the player's position directly
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {void}
     */
    setPosition(x, y) {
        this.movement.setPosition(x, y);
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
        return this.zoneTracking.getCurrentZone();
    }

    /**
     * Sets the current zone coordinates
     * @param {number} x - Zone X coordinate
     * @param {number} y - Zone Y coordinate
     * @param {number} [dimension] - Zone dimension
     * @returns {void}
     */
    setCurrentZone(x, y, dimension = this.currentZone.dimension) {
        this.zoneTracking.setCurrentZone(x, y, dimension);
    }

    /**
     * Marks a zone as visited
     * @param {number} x - Zone X coordinate
     * @param {number} y - Zone Y coordinate
     * @param {number} dimension - Zone dimension
     * @returns {void}
     */
    markZoneVisited(x, y, dimension) {
        this.zoneTracking.markZoneVisited(x, y, dimension);
    }

    /**
     * Checks if a zone has been visited
     * @param {number} x - Zone X coordinate
     * @param {number} y - Zone Y coordinate
     * @param {number} dimension - Zone dimension
     * @returns {boolean}
     */
    hasVisitedZone(x, y, dimension) {
        return this.zoneTracking.hasVisitedZone(x, y, dimension);
    }

    /**
     * Gets a copy of all visited zones
     * @returns {Set<string>}
     */
    getVisitedZones() {
        return this.zoneTracking.getVisitedZones();
    }

    /**
     * Ensures player is on a walkable tile, moves to nearest if not
     * @param {Grid} grid - Game grid
     * @returns {void}
     */
    ensureValidPosition(grid) {
        this.movement.ensureValidPosition(grid);
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
        this.abilityManager.clearAbilities();
        this.sprite = 'SeparateAnim/Special2';
        this.zoneTracking.clearVisitedZones();
        this.stats.reset();
        this.animations.reset();
        this.interactOnReach = null;
        this.zoneTracking.markZoneVisited(0, 0, 0);
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
        this.zoneTracking.onZoneTransition();
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
