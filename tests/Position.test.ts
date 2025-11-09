/**
 * Position.test.js
 * Comprehensive unit tests for the Position class
 */

import { Position } from '@core/Position';
import { GRID_SIZE } from '@core/constants/index';

describe('Position', () => {
    // ==========================================
    // Constructor and Factory Methods
    // ==========================================

    describe('constructor', () => {
        it('should create a position with x and y coordinates', () => {
            const pos = new Position(5, 10);
            expect(pos.x).toBe(5);
            expect(pos.y).toBe(10);
        });
    });

    describe('from', () => {
        it('should create a Position from an object', () => {
            const pos = Position.from({ x: 3, y: 7 });
            expect(pos).toBeInstanceOf(Position);
            expect(pos.x).toBe(3);
            expect(pos.y).toBe(7);
        });

        it('should return the same Position if already a Position', () => {
            const original = new Position(3, 7);
            const pos = Position.from(original);
            expect(pos).toBe(original);
        });
    });

    describe('of', () => {
        it('should create a Position from separate x, y parameters', () => {
            const pos = Position.of(2, 4);
            expect(pos.x).toBe(2);
            expect(pos.y).toBe(4);
        });

        it('should create a Position from an object', () => {
            const pos = Position.of({ x: 2, y: 4 });
            expect(pos.x).toBe(2);
            expect(pos.y).toBe(4);
        });
    });

    describe('center', () => {
        it('should create a Position at grid center', () => {
            const pos = Position.center();
            const expected = Math.floor(GRID_SIZE / 2);
            expect(pos.x).toBe(expected);
            expect(pos.y).toBe(expected);
        });

        it('should create a Position at center of custom grid size', () => {
            const pos = Position.center(20);
            expect(pos.x).toBe(10);
            expect(pos.y).toBe(10);
        });
    });

    describe('zero', () => {
        it('should create a Position at origin', () => {
            const pos = Position.zero();
            expect(pos.x).toBe(0);
            expect(pos.y).toBe(0);
        });
    });

    describe('one', () => {
        it('should create a Position at (1, 1)', () => {
            const pos = Position.one();
            expect(pos.x).toBe(1);
            expect(pos.y).toBe(1);
        });
    });

    // ==========================================
    // Equality and Comparison
    // ==========================================

    describe('equals', () => {
        const pos = new Position(5, 10);

        it('should return true for equal Position', () => {
            const other = new Position(5, 10);
            expect(pos.equals(other)).toBe(true);
        });

        it('should return true for equal object', () => {
            expect(pos.equals({ x: 5, y: 10 })).toBe(true);
        });

        it('should return true for equal x, y parameters', () => {
            expect(pos.equals(5, 10)).toBe(true);
        });

        it('should return false for different x', () => {
            const other = new Position(6, 10);
            expect(pos.equals(other)).toBe(false);
        });

        it('should return false for different y', () => {
            const other = new Position(5, 11);
            expect(pos.equals(other)).toBe(false);
        });
    });

    describe('isZero', () => {
        it('should return true for origin', () => {
            const pos = new Position(0, 0);
            expect(pos.isZero()).toBe(true);
        });

        it('should return false for non-origin', () => {
            const pos = new Position(0, 1);
            expect(pos.isZero()).toBe(false);
        });
    });

    // ==========================================
    // Distance Calculations
    // ==========================================

    describe('chebyshevDistance', () => {
        it('should calculate correct distance for horizontal movement', () => {
            const pos = new Position(5, 5);
            const target = new Position(8, 5);
            expect(pos.chebyshevDistance(target)).toBe(3);
        });

        it('should calculate correct distance for vertical movement', () => {
            const pos = new Position(5, 5);
            const target = new Position(5, 8);
            expect(pos.chebyshevDistance(target)).toBe(3);
        });

        it('should calculate correct distance for diagonal movement', () => {
            const pos = new Position(5, 5);
            const target = new Position(8, 8);
            expect(pos.chebyshevDistance(target)).toBe(3);
        });

        it('should calculate correct distance for mixed movement', () => {
            const pos = new Position(5, 5);
            const target = new Position(10, 7);
            expect(pos.chebyshevDistance(target)).toBe(5); // max(5, 2)
        });

        it('should return 0 for same position', () => {
            const pos = new Position(5, 5);
            expect(pos.chebyshevDistance(pos)).toBe(0);
        });
    });

    describe('manhattanDistance', () => {
        it('should calculate correct distance for horizontal movement', () => {
            const pos = new Position(5, 5);
            const target = new Position(8, 5);
            expect(pos.manhattanDistance(target)).toBe(3);
        });

        it('should calculate correct distance for L-shaped movement', () => {
            const pos = new Position(5, 5);
            const target = new Position(8, 7);
            expect(pos.manhattanDistance(target)).toBe(5); // 3 + 2
        });

        it('should return 0 for same position', () => {
            const pos = new Position(5, 5);
            expect(pos.manhattanDistance(pos)).toBe(0);
        });
    });

    describe('euclideanDistance', () => {
        it('should calculate correct distance', () => {
            const pos = new Position(0, 0);
            const target = new Position(3, 4);
            expect(pos.euclideanDistance(target)).toBe(5); // 3-4-5 triangle
        });

        it('should return 0 for same position', () => {
            const pos = new Position(5, 5);
            expect(pos.euclideanDistance(pos)).toBe(0);
        });
    });

    describe('distanceTo', () => {
        it('should use Chebyshev distance by default', () => {
            const pos = new Position(5, 5);
            const target = new Position(8, 7);
            expect(pos.distanceTo(target)).toBe(pos.chebyshevDistance(target));
        });
    });

    // ==========================================
    // Direction and Delta
    // ==========================================

    describe('delta', () => {
        it('should calculate correct delta', () => {
            const pos = new Position(5, 5);
            const target = new Position(8, 3);
            const delta = pos.delta(target);
            expect(delta.dx).toBe(3);
            expect(delta.dy).toBe(-2);
        });

        it('should return zero delta for same position', () => {
            const pos = new Position(5, 5);
            const delta = pos.delta(pos);
            expect(delta.dx).toBe(0);
            expect(delta.dy).toBe(0);
        });
    });

    describe('absDelta', () => {
        it('should calculate absolute delta', () => {
            const pos = new Position(5, 5);
            const target = new Position(2, 8);
            const delta = pos.absDelta(target);
            expect(delta.dx).toBe(3);
            expect(delta.dy).toBe(3);
        });
    });

    describe('directionTo', () => {
        it('should return correct direction for east', () => {
            const pos = new Position(5, 5);
            const target = new Position(8, 5);
            expect(pos.directionTo(target)).toBe('arrowright');
        });

        it('should return correct direction for west', () => {
            const pos = new Position(5, 5);
            const target = new Position(2, 5);
            expect(pos.directionTo(target)).toBe('arrowleft');
        });

        it('should return correct direction for south', () => {
            const pos = new Position(5, 5);
            const target = new Position(5, 8);
            expect(pos.directionTo(target)).toBe('arrowdown');
        });

        it('should return correct direction for north', () => {
            const pos = new Position(5, 5);
            const target = new Position(5, 2);
            expect(pos.directionTo(target)).toBe('arrowup');
        });

        it('should return null for same position', () => {
            const pos = new Position(5, 5);
            expect(pos.directionTo(pos)).toBeNull();
        });
    });

    describe('add', () => {
        it('should add offset using separate parameters', () => {
            const pos = new Position(5, 5);
            const result = pos.add(3, -2);
            expect(result.x).toBe(8);
            expect(result.y).toBe(3);
        });

        it('should add offset using object', () => {
            const pos = new Position(5, 5);
            const result = pos.add({ x: 3, y: -2 });
            expect(result.x).toBe(8);
            expect(result.y).toBe(3);
        });

        it('should not modify original position', () => {
            const pos = new Position(5, 5);
            pos.add(3, -2);
            expect(pos.x).toBe(5);
            expect(pos.y).toBe(5);
        });
    });

    describe('subtract', () => {
        it('should subtract offset using separate parameters', () => {
            const pos = new Position(5, 5);
            const result = pos.subtract(3, -2);
            expect(result.x).toBe(2);
            expect(result.y).toBe(7);
        });

        it('should subtract offset using object', () => {
            const pos = new Position(5, 5);
            const result = pos.subtract({ x: 3, y: -2 });
            expect(result.x).toBe(2);
            expect(result.y).toBe(7);
        });
    });

    // ==========================================
    // Adjacency and Neighbors
    // ==========================================

    describe('isAdjacentTo', () => {
        const pos = new Position(5, 5);

        it('should return true for orthogonal neighbors (8-way)', () => {
            expect(pos.isAdjacentTo(new Position(5, 4))).toBe(true); // North
            expect(pos.isAdjacentTo(new Position(5, 6))).toBe(true); // South
            expect(pos.isAdjacentTo(new Position(4, 5))).toBe(true); // West
            expect(pos.isAdjacentTo(new Position(6, 5))).toBe(true); // East
        });

        it('should return true for diagonal neighbors (8-way)', () => {
            expect(pos.isAdjacentTo(new Position(4, 4))).toBe(true); // NW
            expect(pos.isAdjacentTo(new Position(6, 4))).toBe(true); // NE
            expect(pos.isAdjacentTo(new Position(4, 6))).toBe(true); // SW
            expect(pos.isAdjacentTo(new Position(6, 6))).toBe(true); // SE
        });

        it('should return false for same position', () => {
            expect(pos.isAdjacentTo(pos)).toBe(false);
        });

        it('should return false for distant positions', () => {
            expect(pos.isAdjacentTo(new Position(8, 8))).toBe(false);
        });

        it('should return false for diagonal when allowDiagonal is false', () => {
            expect(pos.isAdjacentTo(new Position(6, 6), false)).toBe(false);
        });

        it('should return true for orthogonal when allowDiagonal is false', () => {
            expect(pos.isAdjacentTo(new Position(5, 6), false)).toBe(true);
        });
    });

    describe('getNeighbors', () => {
        const pos = new Position(5, 5);

        it('should return 8 neighbors by default', () => {
            const neighbors = pos.getNeighbors();
            expect(neighbors).toHaveLength(8);
        });

        it('should return 4 neighbors when allowDiagonal is false', () => {
            const neighbors = pos.getNeighbors(false);
            expect(neighbors).toHaveLength(4);
        });

        it('should return Position instances', () => {
            const neighbors = pos.getNeighbors();
            neighbors.forEach(n => {
                expect(n).toBeInstanceOf(Position);
            });
        });

        it('should include correct orthogonal neighbors', () => {
            const neighbors = pos.getNeighbors(false);
            expect(neighbors.some(n => n.equals(5, 4))).toBe(true); // North
            expect(neighbors.some(n => n.equals(5, 6))).toBe(true); // South
            expect(neighbors.some(n => n.equals(4, 5))).toBe(true); // West
            expect(neighbors.some(n => n.equals(6, 5))).toBe(true); // East
        });
    });

    describe('getValidNeighbors', () => {
        const pos = new Position(5, 5);

        it('should filter neighbors by validator', () => {
            const validator = (p: Position) => p.x > 5;
            const neighbors = pos.getValidNeighbors(validator);
            expect(neighbors.every(n => n.x > 5)).toBe(true);
        });

        it('should return empty array if no valid neighbors', () => {
            const validator = () => false;
            const neighbors = pos.getValidNeighbors(validator);
            expect(neighbors).toHaveLength(0);
        });
    });

    // ==========================================
    // Grid Bounds Validation
    // ==========================================

    describe('isInBounds', () => {
        it('should return true for position within bounds', () => {
            const pos = new Position(5, 5);
            expect(pos.isInBounds(10)).toBe(true);
        });

        it('should return true for position at edge', () => {
            const pos = new Position(0, 0);
            expect(pos.isInBounds(10)).toBe(true);
        });

        it('should return false for negative x', () => {
            const pos = new Position(-1, 5);
            expect(pos.isInBounds(10)).toBe(false);
        });

        it('should return false for x at or beyond grid size', () => {
            const pos = new Position(10, 5);
            expect(pos.isInBounds(10)).toBe(false);
        });

        it('should return false for negative y', () => {
            const pos = new Position(5, -1);
            expect(pos.isInBounds(10)).toBe(false);
        });
    });

    describe('isInInnerBounds', () => {
        it('should return true for position within inner bounds', () => {
            const pos = new Position(5, 5);
            expect(pos.isInInnerBounds(10)).toBe(true);
        });

        it('should return false for position at edge', () => {
            const pos = new Position(0, 5);
            expect(pos.isInInnerBounds(10)).toBe(false);
        });

        it('should return false for position at max edge', () => {
            const pos = new Position(9, 5);
            expect(pos.isInInnerBounds(10)).toBe(false);
        });

        it('should return true for (1, 1)', () => {
            const pos = new Position(1, 1);
            expect(pos.isInInnerBounds(10)).toBe(true);
        });
    });

    describe('clampToBounds', () => {
        it('should not modify position within bounds', () => {
            const pos = new Position(5, 5);
            const clamped = pos.clampToBounds(10);
            expect(clamped.x).toBe(5);
            expect(clamped.y).toBe(5);
        });

        it('should clamp negative x to 0', () => {
            const pos = new Position(-5, 5);
            const clamped = pos.clampToBounds(10);
            expect(clamped.x).toBe(0);
        });

        it('should clamp x beyond bounds', () => {
            const pos = new Position(15, 5);
            const clamped = pos.clampToBounds(10);
            expect(clamped.x).toBe(9);
        });

        it('should clamp y coordinates similarly', () => {
            const pos = new Position(5, -3);
            const clamped = pos.clampToBounds(10);
            expect(clamped.y).toBe(0);
        });
    });

    // ==========================================
    // Grid Access Helpers
    // ==========================================

    describe('getTile', () => {
        const grid = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];

        it('should get correct tile value', () => {
            const pos = new Position(1, 1);
            expect(pos.getTile(grid)).toBe(5);
        });

        it('should return undefined for out of bounds', () => {
            const pos = new Position(10, 10);
            expect(pos.getTile(grid)).toBeUndefined();
        });
    });

    describe('setTile', () => {
        it('should set tile value', () => {
            const grid = [[1, 2], [3, 4]];
            const pos = new Position(1, 0);
            pos.setTile(grid, 99);
            expect(grid[0][1]).toBe(99);
        });

        it('should create row if needed', () => {
            const grid = [];
            const pos = new Position(0, 0);
            pos.setTile(grid, 42);
            expect(grid[0][0]).toBe(42);
        });
    });

    describe('isValidTile', () => {
        const grid = [
            [1, 2, 3],
            [4, 5, 6]
        ];

        it('should return true when validator passes', () => {
            const pos = new Position(1, 1);
            const validator = (tile: number) => tile === 5;
            expect(pos.isValidTile(grid, validator)).toBe(true);
        });

        it('should return false when validator fails', () => {
            const pos = new Position(0, 0);
            const validator = (tile: number) => tile === 5;
            expect(pos.isValidTile(grid, validator)).toBe(false);
        });

        it('should return false for out of bounds', () => {
            const pos = new Position(10, 10);
            const validator = () => true;
            expect(pos.isValidTile(grid, validator)).toBe(false);
        });
    });

    // ==========================================
    // Serialization
    // ==========================================

    describe('toObject', () => {
        it('should convert to plain object', () => {
            const pos = new Position(5, 10);
            const obj = pos.toObject();
            expect(obj).toEqual({ x: 5, y: 10 });
            expect(obj).not.toBeInstanceOf(Position);
        });
    });

    describe('toKey', () => {
        it('should convert to coordinate key', () => {
            const pos = new Position(5, 10);
            expect(pos.toKey()).toBe('5,10');
        });
    });

    describe('fromKey', () => {
        it('should create Position from coordinate key', () => {
            const pos = Position.fromKey('5,10');
            expect(pos.x).toBe(5);
            expect(pos.y).toBe(10);
        });
    });

    describe('toString', () => {
        it('should return coordinate key', () => {
            const pos = new Position(5, 10);
            expect(pos.toString()).toBe('5,10');
        });
    });

    describe('toJSON', () => {
        it('should serialize to plain object', () => {
            const pos = new Position(5, 10);
            const json = JSON.stringify(pos);
            expect(json).toBe('{"x":5,"y":10}');
        });
    });

    // ==========================================
    // Utility Methods
    // ==========================================

    describe('clone', () => {
        it('should create a copy', () => {
            const pos = new Position(5, 10);
            const copy = pos.clone();
            expect(copy).not.toBe(pos);
            expect(copy.x).toBe(pos.x);
            expect(copy.y).toBe(pos.y);
        });
    });

    describe('isSameRow', () => {
        it('should return true for same row', () => {
            const pos = new Position(5, 10);
            const other = new Position(8, 10);
            expect(pos.isSameRow(other)).toBe(true);
        });

        it('should return false for different row', () => {
            const pos = new Position(5, 10);
            const other = new Position(8, 11);
            expect(pos.isSameRow(other)).toBe(false);
        });
    });

    describe('isSameColumn', () => {
        it('should return true for same column', () => {
            const pos = new Position(5, 10);
            const other = new Position(5, 8);
            expect(pos.isSameColumn(other)).toBe(true);
        });

        it('should return false for different column', () => {
            const pos = new Position(5, 10);
            const other = new Position(6, 8);
            expect(pos.isSameColumn(other)).toBe(false);
        });
    });

    describe('isOrthogonalTo', () => {
        it('should return true for same row', () => {
            const pos = new Position(5, 5);
            const other = new Position(8, 5);
            expect(pos.isOrthogonalTo(other)).toBe(true);
        });

        it('should return true for same column', () => {
            const pos = new Position(5, 5);
            const other = new Position(5, 8);
            expect(pos.isOrthogonalTo(other)).toBe(true);
        });

        it('should return false for diagonal', () => {
            const pos = new Position(5, 5);
            const other = new Position(8, 8);
            expect(pos.isOrthogonalTo(other)).toBe(false);
        });
    });

    describe('isDiagonalTo', () => {
        it('should return true for diagonal positions', () => {
            const pos = new Position(5, 5);
            const other = new Position(8, 8);
            expect(pos.isDiagonalTo(other)).toBe(true);
        });

        it('should return false for orthogonal positions', () => {
            const pos = new Position(5, 5);
            const other = new Position(8, 5);
            expect(pos.isDiagonalTo(other)).toBe(false);
        });

        it('should return false for same position', () => {
            const pos = new Position(5, 5);
            expect(pos.isDiagonalTo(pos)).toBe(false);
        });
    });

    describe('lineTo', () => {
        it('should generate horizontal line', () => {
            const pos = new Position(0, 0);
            const target = new Position(3, 0);
            const line = pos.lineTo(target, false, true);
            expect(line.length).toBe(3);
            expect(line[0].equals(1, 0)).toBe(true);
            expect(line[2].equals(3, 0)).toBe(true);
        });

        it('should generate vertical line', () => {
            const pos = new Position(0, 0);
            const target = new Position(0, 3);
            const line = pos.lineTo(target, false, true);
            expect(line.length).toBe(3);
            expect(line[0].equals(0, 1)).toBe(true);
            expect(line[2].equals(0, 3)).toBe(true);
        });

        it('should include start when specified', () => {
            const pos = new Position(0, 0);
            const target = new Position(2, 0);
            const line = pos.lineTo(target, true, true);
            expect(line[0].equals(0, 0)).toBe(true);
        });

        it('should exclude end when specified', () => {
            const pos = new Position(0, 0);
            const target = new Position(2, 0);
            const line = pos.lineTo(target, false, false);
            expect(line.every(p => !p.equals(2, 0))).toBe(true);
        });
    });

    describe('rectangleTo', () => {
        it('should generate rectangle with edges', () => {
            const pos = new Position(0, 0);
            const corner = new Position(2, 2);
            const rect = pos.rectangleTo(corner, true);
            expect(rect.length).toBe(9); // 3x3
        });

        it('should generate rectangle without edges', () => {
            const pos = new Position(0, 0);
            const corner = new Position(2, 2);
            const rect = pos.rectangleTo(corner, false);
            expect(rect.length).toBe(1); // Just center
            expect(rect[0].equals(1, 1)).toBe(true);
        });

        it('should work with reversed corners', () => {
            const pos = new Position(2, 2);
            const corner = new Position(0, 0);
            const rect = pos.rectangleTo(corner, true);
            expect(rect.length).toBe(9);
        });
    });

    describe('positionsWithinRadius', () => {
        it('should generate positions within radius', () => {
            const pos = new Position(5, 5);
            const positions = pos.positionsWithinRadius(1, false);
            expect(positions.length).toBe(8); // 3x3 - center
        });

        it('should include center when specified', () => {
            const pos = new Position(5, 5);
            const positions = pos.positionsWithinRadius(1, true);
            expect(positions.length).toBe(9); // 3x3
            expect(positions.some(p => p.equals(5, 5))).toBe(true);
        });

        it('should generate correct positions for radius 0', () => {
            const pos = new Position(5, 5);
            const positions = pos.positionsWithinRadius(0, false);
            expect(positions.length).toBe(0);
        });

        it('should generate correct positions for radius 2', () => {
            const pos = new Position(5, 5);
            const positions = pos.positionsWithinRadius(2, false);
            expect(positions.length).toBe(24); // 5x5 - center
        });
    });
});
