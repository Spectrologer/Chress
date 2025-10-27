/**
 * PositionCalculator.js
 *
 * Handles all mathematical calculations related to positions including:
 * - Distance calculations (Chebyshev, Manhattan, Euclidean)
 * - Delta computations
 * - Line and area generation (Bresenham's algorithm, rectangles, radius)
 * - Direction and alignment checks
 *
 * This is a utility class extracted from Position.js to separate concerns.
 * All methods are static and work with position-like objects {x, y}.
 */

export class PositionCalculator {
    // ==========================================
    // Distance Calculations
    // ==========================================

    /**
     * Calculates Chebyshev distance (8-way grid distance) between two positions
     * This is the standard movement distance in the game.
     * @param {{x: number, y: number}} pos1 - First position
     * @param {{x: number, y: number}} pos2 - Second position
     * @returns {number}
     */
    static chebyshevDistance(pos1, pos2) {
        return Math.max(Math.abs(pos2.x - pos1.x), Math.abs(pos2.y - pos1.y));
    }

    /**
     * Calculates Manhattan distance (4-way grid distance) between two positions
     * @param {{x: number, y: number}} pos1 - First position
     * @param {{x: number, y: number}} pos2 - Second position
     * @returns {number}
     */
    static manhattanDistance(pos1, pos2) {
        return Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y);
    }

    /**
     * Calculates Euclidean distance (straight-line distance) between two positions
     * @param {{x: number, y: number}} pos1 - First position
     * @param {{x: number, y: number}} pos2 - Second position
     * @returns {number}
     */
    static euclideanDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // ==========================================
    // Delta Calculations
    // ==========================================

    /**
     * Gets the delta (difference) between two positions
     * @param {{x: number, y: number}} from - Starting position
     * @param {{x: number, y: number}} to - Target position
     * @returns {{dx: number, dy: number}}
     */
    static delta(from, to) {
        return {
            dx: to.x - from.x,
            dy: to.y - from.y
        };
    }

    /**
     * Gets the absolute delta between two positions
     * @param {{x: number, y: number}} from - Starting position
     * @param {{x: number, y: number}} to - Target position
     * @returns {{dx: number, dy: number}}
     */
    static absDelta(from, to) {
        return {
            dx: Math.abs(to.x - from.x),
            dy: Math.abs(to.y - from.y)
        };
    }

    // ==========================================
    // Adjacency and Alignment
    // ==========================================

    /**
     * Checks if two positions are adjacent (including diagonals)
     * @param {{x: number, y: number}} pos1 - First position
     * @param {{x: number, y: number}} pos2 - Second position
     * @param {boolean} [allowDiagonal=true] - Whether to consider diagonal adjacency
     * @returns {boolean}
     */
    static isAdjacent(pos1, pos2, allowDiagonal = true) {
        const { dx, dy } = this.absDelta(pos1, pos2);
        if (dx === 0 && dy === 0) return false; // Same position

        if (allowDiagonal) {
            return dx <= 1 && dy <= 1;
        } else {
            return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
        }
    }

    /**
     * Checks if two positions are on the same row
     * @param {{x: number, y: number}} pos1 - First position
     * @param {{x: number, y: number}} pos2 - Second position
     * @returns {boolean}
     */
    static isSameRow(pos1, pos2) {
        return pos1.y === pos2.y;
    }

    /**
     * Checks if two positions are on the same column
     * @param {{x: number, y: number}} pos1 - First position
     * @param {{x: number, y: number}} pos2 - Second position
     * @returns {boolean}
     */
    static isSameColumn(pos1, pos2) {
        return pos1.x === pos2.x;
    }

    /**
     * Checks if two positions are orthogonally aligned (same row or column)
     * @param {{x: number, y: number}} pos1 - First position
     * @param {{x: number, y: number}} pos2 - Second position
     * @returns {boolean}
     */
    static isOrthogonal(pos1, pos2) {
        return this.isSameRow(pos1, pos2) || this.isSameColumn(pos1, pos2);
    }

    /**
     * Checks if two positions are diagonally aligned
     * @param {{x: number, y: number}} pos1 - First position
     * @param {{x: number, y: number}} pos2 - Second position
     * @returns {boolean}
     */
    static isDiagonal(pos1, pos2) {
        const { dx, dy } = this.absDelta(pos1, pos2);
        return dx === dy && dx > 0;
    }

    // ==========================================
    // Line and Area Generation
    // ==========================================

    /**
     * Gets all positions in a line from one position to another
     * Uses Bresenham's line algorithm
     * @param {{x: number, y: number}} from - Starting position
     * @param {{x: number, y: number}} to - Target position
     * @param {boolean} [includeStart=false] - Whether to include starting position
     * @param {boolean} [includeEnd=true] - Whether to include ending position
     * @returns {Array<{x: number, y: number}>} Array of positions along the line
     */
    static lineTo(from, to, includeStart = false, includeEnd = true) {
        const positions = [];
        let x0 = from.x;
        let y0 = from.y;
        const x1 = to.x;
        const y1 = to.y;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            const isStart = x0 === from.x && y0 === from.y;
            const isEnd = x0 === x1 && y0 === y1;

            if ((!isStart || includeStart) && (!isEnd || includeEnd)) {
                positions.push({ x: x0, y: y0 });
            }

            if (isEnd) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }

        return positions;
    }

    /**
     * Gets all positions in a rectangular area between two corners
     * @param {{x: number, y: number}} corner1 - First corner of rectangle
     * @param {{x: number, y: number}} corner2 - Opposite corner of rectangle
     * @param {boolean} [includeEdges=true] - Whether to include edge positions
     * @returns {Array<{x: number, y: number}>} Array of positions in the rectangle
     */
    static rectangleBetween(corner1, corner2, includeEdges = true) {
        const positions = [];
        const minX = Math.min(corner1.x, corner2.x);
        const maxX = Math.max(corner1.x, corner2.x);
        const minY = Math.min(corner1.y, corner2.y);
        const maxY = Math.max(corner1.y, corner2.y);

        const startX = includeEdges ? minX : minX + 1;
        const endX = includeEdges ? maxX : maxX - 1;
        const startY = includeEdges ? minY : minY + 1;
        const endY = includeEdges ? maxY : maxY - 1;

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                positions.push({ x, y });
            }
        }

        return positions;
    }

    /**
     * Gets all positions within a radius (Chebyshev distance) of a center position
     * @param {{x: number, y: number}} center - Center position
     * @param {number} radius - Radius to search within
     * @param {boolean} [includeCenter=false] - Whether to include the center position
     * @returns {Array<{x: number, y: number}>} Array of positions within radius
     */
    static positionsWithinRadius(center, radius, includeCenter = false) {
        const positions = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (!includeCenter && dx === 0 && dy === 0) continue;
                positions.push({ x: center.x + dx, y: center.y + dy });
            }
        }
        return positions;
    }

    /**
     * Gets all neighbor offsets for 8-way or 4-way movement
     * @param {boolean} [allowDiagonal=true] - Whether to include diagonal neighbors
     * @returns {Array<{x: number, y: number}>} Array of offset objects
     */
    static getNeighborOffsets(allowDiagonal = true) {
        if (allowDiagonal) {
            return [
                { x: 0, y: -1 },  // North
                { x: 0, y: 1 },   // South
                { x: -1, y: 0 },  // West
                { x: 1, y: 0 },   // East
                { x: -1, y: -1 }, // NW
                { x: 1, y: -1 },  // NE
                { x: -1, y: 1 },  // SW
                { x: 1, y: 1 }    // SE
            ];
        } else {
            return [
                { x: 0, y: -1 },  // North
                { x: 0, y: 1 },   // South
                { x: -1, y: 0 },  // West
                { x: 1, y: 0 }    // East
            ];
        }
    }

    /**
     * Gets all neighbor positions around a center position
     * @param {{x: number, y: number}} center - Center position
     * @param {boolean} [allowDiagonal=true] - Whether to include diagonal neighbors
     * @returns {Array<{x: number, y: number}>} Array of neighbor positions
     */
    static getNeighbors(center, allowDiagonal = true) {
        const offsets = this.getNeighborOffsets(allowDiagonal);
        return offsets.map(offset => ({
            x: center.x + offset.x,
            y: center.y + offset.y
        }));
    }
}
