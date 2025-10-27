/**
 * PositionValidator.js
 *
 * Handles all validation and bounds checking for positions including:
 * - Grid bounds validation
 * - Inner bounds checking (non-edge positions)
 * - Position clamping to valid ranges
 * - Tile validation with custom predicates
 *
 * This is a utility class extracted from Position.js to separate concerns.
 * All methods are static and work with position-like objects {x, y}.
 */

import { GRID_SIZE } from './constants/index.js';

export class PositionValidator {
    // ==========================================
    // Basic Bounds Checking
    // ==========================================

    /**
     * Checks if a position is within the grid bounds
     * @param {{x: number, y: number}} pos - Position to check
     * @param {number} [gridSize=GRID_SIZE] - Grid size to check against
     * @returns {boolean}
     */
    static isInBounds(pos, gridSize = GRID_SIZE) {
        return pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize;
    }

    /**
     * Checks if a position is within the inner bounds (not on the edge)
     * Useful for placement validation where edges are walls
     * @param {{x: number, y: number}} pos - Position to check
     * @param {number} [gridSize=GRID_SIZE] - Grid size to check against
     * @returns {boolean}
     */
    static isInInnerBounds(pos, gridSize = GRID_SIZE) {
        return pos.x >= 1 && pos.x < gridSize - 1 && pos.y >= 1 && pos.y < gridSize - 1;
    }

    /**
     * Checks if a position is at the origin (0, 0)
     * @param {{x: number, y: number}} pos - Position to check
     * @returns {boolean}
     */
    static isZero(pos) {
        return pos.x === 0 && pos.y === 0;
    }

    // ==========================================
    // Position Equality
    // ==========================================

    /**
     * Checks if two positions are equal
     * @param {{x: number, y: number}} pos1 - First position
     * @param {{x: number, y: number}} pos2 - Second position
     * @returns {boolean}
     */
    static equals(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }

    // ==========================================
    // Clamping and Constraints
    // ==========================================

    /**
     * Clamps a position to be within grid bounds
     * @param {{x: number, y: number}} pos - Position to clamp
     * @param {number} [gridSize=GRID_SIZE] - Grid size to clamp to
     * @returns {{x: number, y: number}} New position clamped to bounds
     */
    static clampToBounds(pos, gridSize = GRID_SIZE) {
        return {
            x: Math.max(0, Math.min(gridSize - 1, pos.x)),
            y: Math.max(0, Math.min(gridSize - 1, pos.y))
        };
    }

    // ==========================================
    // Tile Validation
    // ==========================================

    /**
     * Gets the tile at a position from a grid
     * Note: Grid access is always grid[y][x] (row-major order)
     * @param {{x: number, y: number}} pos - Position to get tile from
     * @param {Array<Array>} grid - 2D grid array
     * @returns {*} The tile at this position, or undefined if out of bounds
     */
    static getTile(pos, grid) {
        return grid[pos.y]?.[pos.x];
    }

    /**
     * Checks if a position is a valid tile type in the grid
     * @param {{x: number, y: number}} pos - Position to check
     * @param {Array<Array>} grid - 2D grid array
     * @param {Function} validator - Function that takes (tile) and returns boolean
     * @returns {boolean}
     */
    static isValidTile(pos, grid, validator) {
        const tile = this.getTile(pos, grid);
        return tile !== undefined && validator(tile);
    }

    /**
     * Filters an array of positions to only valid ones
     * @param {Array<{x: number, y: number}>} positions - Array of positions to filter
     * @param {Function} validator - Function that takes (pos) and returns boolean
     * @returns {Array<{x: number, y: number}>} Array of valid positions
     */
    static filterValid(positions, validator) {
        return positions.filter(validator);
    }

    /**
     * Filters positions to only those within bounds
     * @param {Array<{x: number, y: number}>} positions - Array of positions to filter
     * @param {number} [gridSize=GRID_SIZE] - Grid size to check against
     * @returns {Array<{x: number, y: number}>} Array of in-bounds positions
     */
    static filterInBounds(positions, gridSize = GRID_SIZE) {
        return positions.filter(pos => this.isInBounds(pos, gridSize));
    }

    /**
     * Filters positions to only those within inner bounds
     * @param {Array<{x: number, y: number}>} positions - Array of positions to filter
     * @param {number} [gridSize=GRID_SIZE] - Grid size to check against
     * @returns {Array<{x: number, y: number}>} Array of in-inner-bounds positions
     */
    static filterInInnerBounds(positions, gridSize = GRID_SIZE) {
        return positions.filter(pos => this.isInInnerBounds(pos, gridSize));
    }
}
