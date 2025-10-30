// @ts-check

/**
 * @typedef {Object} Coordinates
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} Delta
 * @property {number} dx - Delta X
 * @property {number} dy - Delta Y
 */

/**
 * @typedef {Object} Offset
 * @property {number} x - X offset
 * @property {number} y - Y offset
 */

/**
 * @callback PositionPredicate
 * @param {Position} pos - Position to validate
 * @returns {boolean}
 */

/**
 * @typedef {Array<Array<*>>} Grid
 */

/**
 * @typedef {Object} GridManager
 * @property {(x: number, y: number) => *} getTile - Get tile at position
 * @property {(x: number, y: number, value: *) => void} setTile - Set tile at position
 */

/**
 * Position.js
 *
 * A robust position abstraction that handles all position-related operations
 * in the Chress codebase. Provides a consistent API while maintaining backward
 * compatibility with existing {x, y} object patterns.
 *
 * Key Features:
 * - Direct .x and .y property access for backward compatibility
 * - Distance calculations (Chebyshev, Manhattan, Euclidean)
 * - Direction and adjacency utilities
 * - Immutable operations (returns new Position instances)
 * - Grid coordinate validation
 * - Serialization support for events and storage
 *
 * This class now delegates to PositionCalculator and PositionValidator
 * for mathematical operations and validation logic.
 */

import { getOffset, getDeltaToDirection } from './utils/DirectionUtils.js';
import { GRID_SIZE } from './constants/index.js';
import { PositionCalculator } from './PositionCalculator.js';
import { PositionValidator } from './PositionValidator.js';

// Re-export the utility classes for convenience
export { PositionCalculator, PositionValidator };

export class Position {
    /**
     * Creates a new Position instance.
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    constructor(x, y) {
        /** @type {number} */
        this.x = x;
        /** @type {number} */
        this.y = y;
    }

    // ==========================================
    // Static Factory Methods
    // ==========================================

    /**
     * Creates a Position from an object with x and y properties
     * @param {Coordinates|Position} obj - Object with x and y properties
     * @returns {Position}
     */
    static from(obj) {
        if (obj instanceof Position) return obj;
        return new Position(obj.x, obj.y);
    }

    /**
     * Creates a Position from separate x, y parameters or an object
     * @param {number|Coordinates} xOrObj - X coordinate or object
     * @param {number} [y] - Y coordinate (if first param is number)
     * @returns {Position}
     */
    static of(xOrObj, y) {
        if (typeof xOrObj === 'object') {
            return Position.from(xOrObj);
        }
        return new Position(xOrObj, /** @type {number} */(y));
    }

    /**
     * Creates a Position at the grid center
     * @param {number} [gridSize=GRID_SIZE] - Grid size to use
     * @returns {Position}
     */
    static center(gridSize = GRID_SIZE) {
        const center = Math.floor(gridSize / 2);
        return new Position(center, center);
    }

    /**
     * Creates a Position at the origin (0, 0)
     * @returns {Position}
     */
    static zero() {
        return new Position(0, 0);
    }

    /**
     * Creates a Position at (1, 1) - common starting position
     * @returns {Position}
     */
    static one() {
        return new Position(1, 1);
    }

    // ==========================================
    // Equality and Comparison
    // ==========================================

    /**
     * Checks if this position equals another position
     * @param {Position|Coordinates|number} xOrPos - Position, object, or x coordinate
     * @param {number} [y] - Y coordinate (if first param is number)
     * @returns {boolean}
     */
    equals(xOrPos, y) {
        if (typeof xOrPos === 'number') {
            return PositionValidator.equals(this, { x: xOrPos, y: /** @type {number} */(y) });
        }
        return PositionValidator.equals(this, xOrPos);
    }

    /**
     * Checks if this position is at the origin
     * @returns {boolean}
     */
    isZero() {
        return PositionValidator.isZero(this);
    }

    // ==========================================
    // Distance Calculations
    // ==========================================

    /**
     * Calculates Chebyshev distance (8-way grid distance) to another position
     * This is the standard movement distance in the game.
     * @param {Position|Coordinates} other - Target position
     * @returns {number}
     */
    chebyshevDistance(other) {
        return PositionCalculator.chebyshevDistance(this, other);
    }

    /**
     * Calculates Manhattan distance (4-way grid distance) to another position
     * @param {Position|Coordinates} other - Target position
     * @returns {number}
     */
    manhattanDistance(other) {
        return PositionCalculator.manhattanDistance(this, other);
    }

    /**
     * Calculates Euclidean distance (straight-line distance) to another position
     * @param {Position|Coordinates} other - Target position
     * @returns {number}
     */
    euclideanDistance(other) {
        return PositionCalculator.euclideanDistance(this, other);
    }

    /**
     * Alias for chebyshevDistance - the default movement distance in the game
     * @param {Position|Coordinates} other - Target position
     * @returns {number}
     */
    distanceTo(other) {
        return this.chebyshevDistance(other);
    }

    // ==========================================
    // Direction and Delta
    // ==========================================

    /**
     * Gets the delta (difference) between this position and another
     * @param {Position|Coordinates} other - Target position
     * @returns {Delta}
     */
    delta(other) {
        return PositionCalculator.delta(this, other);
    }

    /**
     * Gets the absolute delta between this position and another
     * @param {Position|Coordinates} other - Target position
     * @returns {Delta}
     */
    absDelta(other) {
        return PositionCalculator.absDelta(this, other);
    }

    /**
     * Gets the direction string from this position to another
     * @param {Position|Coordinates} other - Target position
     * @returns {string|null} Direction string (e.g., 'arrowright') or null if same position
     */
    directionTo(other) {
        const { dx, dy } = this.delta(other);
        return getDeltaToDirection(dx, dy);
    }

    /**
     * Creates a new position by moving in a direction
     * @param {string} direction - Direction string (e.g., 'arrowright', 'w', 'north')
     * @param {number} [distance=1] - How far to move
     * @returns {Position} New position after moving
     */
    move(direction, distance = 1) {
        const offset = getOffset(direction);
        return new Position(
            this.x + offset.x * distance,
            this.y + offset.y * distance
        );
    }

    /**
     * Creates a new position by adding an offset
     * @param {number|Offset} dxOrOffset - Delta x or offset object
     * @param {number} [dy] - Delta y (if first param is number)
     * @returns {Position}
     */
    add(dxOrOffset, dy) {
        if (typeof dxOrOffset === 'object') {
            return new Position(this.x + dxOrOffset.x, this.y + dxOrOffset.y);
        }
        return new Position(this.x + dxOrOffset, this.y + /** @type {number} */(dy));
    }

    /**
     * Creates a new position by subtracting an offset
     * @param {number|Offset} dxOrOffset - Delta x or offset object
     * @param {number} [dy] - Delta y (if first param is number)
     * @returns {Position}
     */
    subtract(dxOrOffset, dy) {
        if (typeof dxOrOffset === 'object') {
            return new Position(this.x - dxOrOffset.x, this.y - dxOrOffset.y);
        }
        return new Position(this.x - dxOrOffset, this.y - /** @type {number} */(dy));
    }

    // ==========================================
    // Adjacency and Neighbors
    // ==========================================

    /**
     * Checks if another position is adjacent to this one (including diagonals)
     * @param {Position|Coordinates} other - Position to check
     * @param {boolean} [allowDiagonal=true] - Whether to consider diagonal adjacency
     * @returns {boolean}
     */
    isAdjacentTo(other, allowDiagonal = true) {
        return PositionCalculator.isAdjacent(this, other, allowDiagonal);
    }

    /**
     * Gets all adjacent positions (8-way or 4-way)
     * @param {boolean} [allowDiagonal=true] - Whether to include diagonal neighbors
     * @returns {Position[]} Array of adjacent positions
     */
    getNeighbors(allowDiagonal = true) {
        const neighbors = PositionCalculator.getNeighbors(this, allowDiagonal);
        return neighbors.map(pos => new Position(pos.x, pos.y));
    }

    /**
     * Gets neighbors filtered by a validation function
     * @param {PositionPredicate} validator - Function that takes (pos) and returns boolean
     * @param {boolean} [allowDiagonal=true] - Whether to include diagonal neighbors
     * @returns {Position[]} Array of valid adjacent positions
     */
    getValidNeighbors(validator, allowDiagonal = true) {
        return this.getNeighbors(allowDiagonal).filter((/** @type {Position} */ pos) => validator(pos));
    }

    // ==========================================
    // Grid Bounds Validation
    // ==========================================

    /**
     * Checks if this position is within the grid bounds
     * @param {number} [gridSize=GRID_SIZE] - Grid size to check against
     * @returns {boolean}
     */
    isInBounds(gridSize = GRID_SIZE) {
        return PositionValidator.isInBounds(this, gridSize);
    }

    /**
     * Checks if this position is within the inner bounds (not on the edge)
     * Useful for placement validation where edges are walls
     * @param {number} [gridSize=GRID_SIZE] - Grid size to check against
     * @returns {boolean}
     */
    isInInnerBounds(gridSize = GRID_SIZE) {
        return PositionValidator.isInInnerBounds(this, gridSize);
    }

    /**
     * Clamps this position to be within grid bounds
     * @param {number} [gridSize=GRID_SIZE] - Grid size to clamp to
     * @returns {Position} New position clamped to bounds
     */
    clampToBounds(gridSize = GRID_SIZE) {
        const clamped = PositionValidator.clampToBounds(this, gridSize);
        return new Position(clamped.x, clamped.y);
    }

    // ==========================================
    // Grid Access Helpers
    // ==========================================

    /**
     * Gets the tile at this position from a grid or gridManager
     * Note: Grid access is always grid[y][x] (row-major order)
     * @param {Grid|GridManager} gridOrManager - 2D grid array or GridManager instance
     * @returns {*} The tile at this position, or undefined if out of bounds
     */
    getTile(gridOrManager) {
        // Support both GridManager and raw grid arrays
        if (gridOrManager && typeof /** @type {any} */(gridOrManager).getTile === 'function') {
            return /** @type {GridManager} */(gridOrManager).getTile(this.x, this.y);
        }
        return PositionValidator.getTile(this, /** @type {Grid} */(gridOrManager));
    }

    /**
     * Sets the tile at this position in a grid or gridManager
     * @param {Grid|GridManager} gridOrManager - 2D grid array or GridManager instance
     * @param {*} value - Value to set
     * @returns {void}
     */
    setTile(gridOrManager, value) {
        // Support both GridManager and raw grid arrays
        const anyGrid = /** @type {any} */(gridOrManager);
        if (gridOrManager && typeof anyGrid.setTile === 'function') {
            anyGrid.setTile(this.x, this.y, value);
            return;
        }
        const grid = /** @type {Grid} */(gridOrManager);
        if (!grid[this.y]) {
            grid[this.y] = [];
        }
        grid[this.y][this.x] = value;
    }

    /**
     * Checks if this position is a valid tile type in the grid
     * @param {Grid} grid - 2D grid array
     * @param {(tile: *) => boolean} validator - Function that takes (tile) and returns boolean
     * @returns {boolean}
     */
    isValidTile(grid, validator) {
        return PositionValidator.isValidTile(this, grid, validator);
    }

    // ==========================================
    // Serialization
    // ==========================================

    /**
     * Converts this position to a plain object
     * Useful for events, serialization, and compatibility with existing code
     * @returns {Coordinates}
     */
    toObject() {
        return { x: this.x, y: this.y };
    }

    /**
     * Converts this position to a coordinate key for hashing
     * Format: "x,y"
     * @returns {string}
     */
    toKey() {
        return `${this.x},${this.y}`;
    }

    /**
     * Creates a Position from a coordinate key
     * @param {string} key - Key in format "x,y"
     * @returns {Position}
     */
    static fromKey(key) {
        const [x, y] = key.split(',').map(Number);
        return new Position(x, y);
    }

    /**
     * String representation (same as toKey for convenient interpolation)
     * @returns {string}
     */
    toString() {
        return this.toKey();
    }

    /**
     * JSON serialization
     * @returns {Coordinates}
     */
    toJSON() {
        return this.toObject();
    }

    // ==========================================
    // Utility Methods
    // ==========================================

    /**
     * Creates a copy of this position
     * @returns {Position}
     */
    clone() {
        return new Position(this.x, this.y);
    }

    /**
     * Checks if this position is on the same row as another
     * @param {Position|Coordinates} other - Position to compare
     * @returns {boolean}
     */
    isSameRow(other) {
        return PositionCalculator.isSameRow(this, other);
    }

    /**
     * Checks if this position is on the same column as another
     * @param {Position|Coordinates} other - Position to compare
     * @returns {boolean}
     */
    isSameColumn(other) {
        return PositionCalculator.isSameColumn(this, other);
    }

    /**
     * Checks if this position is orthogonally aligned with another
     * (same row or same column)
     * @param {Position|Coordinates} other - Position to compare
     * @returns {boolean}
     */
    isOrthogonalTo(other) {
        return PositionCalculator.isOrthogonal(this, other);
    }

    /**
     * Checks if this position is diagonally aligned with another
     * @param {Position|Coordinates} other - Position to compare
     * @returns {boolean}
     */
    isDiagonalTo(other) {
        return PositionCalculator.isDiagonal(this, other);
    }

    /**
     * Gets all positions in a line from this position to another
     * Uses Bresenham's line algorithm
     * @param {Position|Coordinates} target - Target position
     * @param {boolean} [includeStart=false] - Whether to include starting position
     * @param {boolean} [includeEnd=true] - Whether to include ending position
     * @returns {Position[]} Array of positions along the line
     */
    lineTo(target, includeStart = false, includeEnd = true) {
        const positions = PositionCalculator.lineTo(this, target, includeStart, includeEnd);
        return positions.map(pos => new Position(pos.x, pos.y));
    }

    /**
     * Gets all positions in a rectangular area
     * @param {Position|Coordinates} corner - Opposite corner of rectangle
     * @param {boolean} [includeEdges=true] - Whether to include edge positions
     * @returns {Position[]} Array of positions in the rectangle
     */
    rectangleTo(corner, includeEdges = true) {
        const positions = PositionCalculator.rectangleBetween(this, corner, includeEdges);
        return positions.map(pos => new Position(pos.x, pos.y));
    }

    /**
     * Gets all positions within a radius (Chebyshev distance)
     * @param {number} radius - Radius to search within
     * @param {boolean} [includeCenter=false] - Whether to include this position
     * @returns {Position[]} Array of positions within radius
     */
    positionsWithinRadius(radius, includeCenter = false) {
        const positions = PositionCalculator.positionsWithinRadius(this, radius, includeCenter);
        return positions.map(pos => new Position(pos.x, pos.y));
    }
}
