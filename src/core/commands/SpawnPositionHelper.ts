import { GRID_SIZE, TILE_TYPES } from '../constants/index.js';
import GridIterator from '../../utils/GridIterator.js';

/**
 * SpawnPositionHelper - Utilities for finding valid spawn positions
 *
 * Extracted from consoleCommands.js to separate concerns.
 */
export class SpawnPositionHelper {
    /**
     * Find a random available passable tile
     * @param {Object} game - Game instance
     * @returns {{x: number, y: number}|undefined} Position or undefined
     */
    static findSpawnPosition(game) {
        // Find all valid spawn positions
        const availablePositions = GridIterator.findTiles(
            game.grid,
            (tile, x, y) => this.isValidSpawnPosition(game, x, y)
        );

        if (availablePositions.length === 0) {
            return undefined;
        }

        // Pick a random available position
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        return { x: availablePositions[randomIndex].x, y: availablePositions[randomIndex].y };
    }

    /**
     * Check if a position is valid for spawning
     * @param {Object} game - Game instance
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Whether position is valid
     */
    static isValidSpawnPosition(game, x, y) {
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return false;
        }

        const walkable = game.player.isWalkable(x, y, game.grid);

        // Check if any enemy is at position
        const enemyHere = game.enemies.some(enemy => enemy.x === x && enemy.y === y);

        return walkable && !enemyHere;
    }

    /**
     * Find position for 3x3 shack + front space
     * @param {Object} game - Game instance
     * @returns {{x: number, y: number}|undefined} Position or undefined
     */
    static findShackSpawnPosition(game) {
        // Find all valid shack positions
        const availablePositions = GridIterator.findTiles(
            game.grid,
            (tile, x, y) => this.isValidShackPosition(game, x, y),
            { startY: 1, endY: GRID_SIZE - 4, startX: 1, endX: GRID_SIZE - 3 }
        );

        if (availablePositions.length === 0) {
            return undefined;
        }

        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        return { x: availablePositions[randomIndex].x, y: availablePositions[randomIndex].y };
    }

    /**
     * Check if a position is valid for a 3x3 shack
     * @param {Object} game - Game instance
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Whether position is valid
     */
    static isValidShackPosition(game, x, y) {
        // Check 3x3 area
        for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 3; dx++) {
                const tileX = x + dx;
                const tileY = y + dy;
                if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) {
                    return false;
                }
                const tile = game.gridManager.getTile(tileX, tileY);
                if (tile !== TILE_TYPES.FLOOR) {
                    return false;
                }
                if (game.enemies.some(enemy => enemy.x === tileX && enemy.y === tileY)) {
                    return false;
                }
            }
        }

        // Check front space (south of shack, middle)
        const frontX = x + 1;
        const frontY = y + 3;
        if (frontY >= GRID_SIZE) return false;
        const frontTile = game.gridManager.getTile(frontX, frontY);
        if (frontTile !== TILE_TYPES.FLOOR) {
            return false;
        }
        if (game.enemies.some(enemy => enemy.x === frontX && enemy.y === frontY)) {
            return false;
        }

        return true;
    }

    /**
     * Find position for 1x2 vertical cistern
     * @param {Object} game - Game instance
     * @returns {{x: number, y: number}|undefined} Position or undefined
     */
    static findCisternSpawnPosition(game) {
        // Find all valid cistern positions
        const availablePositions = GridIterator.findTiles(
            game.grid,
            (tile, x, y) => this.isValidCisternPosition(game, x, y),
            { startY: 1, endY: GRID_SIZE - 2, startX: 1, endX: GRID_SIZE - 1 }
        );

        if (availablePositions.length === 0) {
            return undefined;
        }

        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        return { x: availablePositions[randomIndex].x, y: availablePositions[randomIndex].y };
    }

    /**
     * Check if a position is valid for a 1x2 cistern
     * @param {Object} game - Game instance
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Whether position is valid
     */
    static isValidCisternPosition(game, x, y) {
        // Check 1x2 vertical area
        for (let dy = 0; dy < 2; dy++) {
            const tileX = x;
            const tileY = y + dy;
            if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) {
                return false;
            }
            if (game.gridManager.getTile(tileX, tileY) !== TILE_TYPES.FLOOR) {
                return false;
            }
        }
        return true;
    }
}
