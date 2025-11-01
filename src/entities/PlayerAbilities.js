// @ts-check

/**
 * @typedef {import('./Player.js').Grid} Grid
 */

import { TILE_TYPES, GRID_SIZE } from '../core/constants/index.js';
import { Position } from '../core/Position.js';
import { isTileType } from '../utils/TileUtils.js';
import audioManager from '../utils/AudioManager.js';

/**
 * Handles player abilities (axe, hammer, tools)
 */
export class PlayerAbilities {
    /**
     * @param {import('./Player.js').Player} player - Player instance
     */
    constructor(player) {
        this.player = player;
    }

    /**
     * Attempts to use abilities on a target position
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @param {Grid} grid - Game grid
     * @returns {boolean} Always false (abilities don't count as movement)
     */
    tryUseAbility(targetX, targetY, grid) {
        const targetPos = new Position(targetX, targetY);
        const playerPos = this.player._position;
        const tile = targetPos.getTile(grid);

        // Only allow abilities on orthogonally adjacent positions
        const isAdjacentOrthogonal = playerPos.isAdjacentTo(targetPos, false);
        if (!isAdjacentOrthogonal) {
            return false;
        }

        // Try axe on grass/shrubbery
        this.tryChop(targetX, targetY, grid, tile);

        // Try hammer on rocks
        this.trySmash(targetX, targetY, grid, tile);

        // Always return false - abilities don't count as movement
        return false;
    }

    /**
     * Attempts to chop grass/shrubbery with axe
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @param {Grid} grid - Game grid
     * @param {*} tile - Target tile
     * @returns {boolean} True if chopping was performed
     */
    tryChop(targetX, targetY, grid, tile) {
        const hasAxe = this.player.abilities.has('axe');
        if (!hasAxe) {
            return false;
        }

        if (isTileType(tile, TILE_TYPES.GRASS) || isTileType(tile, TILE_TYPES.SHRUBBERY)) {
            // Chop at target position without moving
            const isBorder = targetX === 0 || targetX === GRID_SIZE - 1 || targetY === 0 || targetY === GRID_SIZE - 1;
            const targetPos = new Position(targetX, targetY);
            targetPos.setTile(grid, isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR);

            this.player.stats.decreaseHunger(); // Cutting costs hunger
            this.player.animations.startActionAnimation(); // Start action animation
            this.player.animations.startBump(targetX - this.player.x, targetY - this.player.y); // Bump towards the chopped tile

            // Play the slash SFX (file-backed) when chopping shrubbery/grass
            audioManager.playSound('slash');

            /** @type {any} */(window).gameInstance.startEnemyTurns(); // Chopping takes a turn
            return true;
        }

        return false;
    }

    /**
     * Attempts to smash rocks with hammer
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @param {Grid} grid - Game grid
     * @param {*} tile - Target tile
     * @returns {boolean} True if smashing was performed
     */
    trySmash(targetX, targetY, grid, tile) {
        const hasHammer = this.player.abilities.has('hammer');
        if (!hasHammer) {
            return false;
        }

        if (isTileType(tile, TILE_TYPES.ROCK)) {
            // Break at target position without moving
            const isBorder = targetY === 0 || targetY === GRID_SIZE - 1 || targetX === 0 || targetX === GRID_SIZE - 1;
            const targetPos = new Position(targetX, targetY);
            targetPos.setTile(grid, isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR);

            this.player.stats.decreaseHunger(2); // Breaking costs 2 hunger
            this.player.animations.startActionAnimation(); // Start action animation
            this.player.animations.startBump(targetX - this.player.x, targetY - this.player.y); // Bump towards the smashed tile

            audioManager.playSound('smash');

            /** @type {any} */(window).gameInstance.startEnemyTurns(); // Smashing takes a turn
            return true;
        }

        return false;
    }

    /**
     * Checks if player has a specific ability
     * @param {string} abilityName - Name of the ability
     * @returns {boolean} True if player has the ability
     */
    hasAbility(abilityName) {
        return this.player.abilities.has(abilityName);
    }

    /**
     * Adds an ability to the player
     * @param {string} abilityName - Name of the ability to add
     * @returns {void}
     */
    addAbility(abilityName) {
        this.player.abilities.add(abilityName);
    }

    /**
     * Removes an ability from the player
     * @param {string} abilityName - Name of the ability to remove
     * @returns {void}
     */
    removeAbility(abilityName) {
        this.player.abilities.delete(abilityName);
    }

    /**
     * Clears all abilities
     * @returns {void}
     */
    clearAbilities() {
        this.player.abilities.clear();
    }
}
