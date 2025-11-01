// @ts-check

/**
 * @typedef {import('./Player.js').ZoneCoords} ZoneCoords
 * @typedef {import('./Player.js').Grid} Grid
 */

import { TILE_TYPES, GRID_SIZE, ANIMATION_CONSTANTS } from '../core/constants/index.js';
import { Position } from '../core/Position.ts';
import { TileRegistry } from '../core/TileRegistry.js';
import { isBomb, isTileType } from '../utils/TileUtils.js';
import audioManager from '../utils/AudioManager.js';
import { eventBus } from '../core/EventBus.ts';
import { EventTypes } from '../core/EventTypes.ts';
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.ts';

/**
 * Handles player movement logic
 */
export class PlayerMovement {
    /**
     * @param {import('./Player.js').Player} player - Player instance
     */
    constructor(player) {
        this.player = player;
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
            if (isTileType(this.player._position.getTile(grid), TILE_TYPES.EXIT)) {
                return this.handleZoneTransition(newX, newY, onZoneTransition);
            }
            return false; // Can't move off-grid unless on exit
        }

        // Check if the new position is walkable
        if (this.isWalkable(newX, newY, grid)) {
            return this.executeMove(newX, newY, grid, newPos);
        } else {
            // Try to use abilities on non-walkable tiles
            return false; // Can't move
        }
    }

    /**
     * Handles zone transition when moving off-grid
     * @param {number} newX - Target X coordinate
     * @param {number} newY - Target Y coordinate
     * @param {function(number, number, string): void} [onZoneTransition] - Zone transition callback
     * @returns {boolean} True if transition was successful
     */
    handleZoneTransition(newX, newY, onZoneTransition) {
        // Determine which zone boundary was crossed and transition
        let newZoneX = this.player.currentZone.x;
        let newZoneY = this.player.currentZone.y;
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

    /**
     * Executes the actual move to a walkable position
     * @param {number} newX - Target X coordinate
     * @param {number} newY - Target Y coordinate
     * @param {Grid} grid - Game grid
     * @param {Position} newPos - New position object
     * @returns {boolean} True if move was successful
     */
    executeMove(newX, newY, grid, newPos) {
        // Check if moving to active player-placed bomb (object bomb, not primitive pickup)
        const tile = newPos.getTile(grid);
        if (typeof tile === 'object' && isBomb(tile)) {
            // Explode the bomb and prevent the move
            // The bomb will launch the player away as part of the explosion
            /** @type {any} */(window).gameInstance.explodeBomb(newX, newY);
            return false; // Explode and launch, don't complete the move
        }

        // Delegate item pickup logic to ItemManager
        this.player.itemManager?.handleItemPickup(this.player, newX, newY, grid);

        // Record previous position so renderer can interpolate movement
        this.player._lastPosition = this.player._position.clone();

        // Update position
        this.player._position = newPos;

        // Emit player moved event
        eventBus.emit(EventTypes.PLAYER_MOVED, this.player._position.toObject());

        // Check for pitfall trap after moving
        const newTile = this.player._position.getTile(grid);
        if (isTileType(newTile, TILE_TYPES.PITFALL)) {
            /** @type {any} */(window).gameInstance.interactionManager.zoneManager.handlePitfallTransition(this.player.x, this.player.y);
            return true; // Movement was successful, but transition is happening
        }

        this.player.animations.liftFrames = ANIMATION_CONSTANTS.LIFT_FRAMES; // Start lift animation
        audioManager.playSound('move');

        // Movement interrupts attack combos
        try {
            this.player.setAction('move');
        } catch (e) {
            errorHandler.handle(e, /** @type {any} */(ErrorSeverity).WARNING, {
                component: 'Player',
                action: 'set action to move'
            });
        }

        return true;
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
    isWalkable(x, y, grid, fromX = this.player.x, fromY = this.player.y) {
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
        this.player._lastPosition = this.player._position.clone();

        // Update position
        this.player._position = new Position(x, y);

        // Emit player moved event
        eventBus.emit(EventTypes.PLAYER_MOVED, this.player._position.toObject());
    }

    /**
     * Ensures player is on a walkable tile, moves to nearest if not
     * @param {Grid} grid - Game grid
     * @returns {void}
     */
    ensureValidPosition(grid) {
        // Ensure player is on a walkable tile
        if (!this.isWalkable(this.player.x, this.player.y, grid)) {
            // Find nearest walkable tile using Position's positionsWithinRadius
            for (let radius = 1; radius < GRID_SIZE; radius++) {
                const positions = this.player._position.positionsWithinRadius(radius);
                for (const pos of positions) {
                    if (this.isWalkable(pos.x, pos.y, grid)) {
                        this.setPosition(pos.x, pos.y);
                        return;
                    }
                }
            }
        }
    }
}
