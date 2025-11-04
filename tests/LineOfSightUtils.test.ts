import {
    calculateStepDirection,
    getLineType,
    checkLineOfSight,
    checkOrthogonalLineOfSight,
    checkDiagonalLineOfSight,
    checkQueenLineOfSight
} from '@utils/LineOfSightUtils';

describe('LineOfSightUtils', () => {
    // Helper function for walkability checks
    const isWalkable = (x: number, y: number, grid: number[][]) => {
        if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return false;
        return grid[y][x] === 1;
    };

    // Create a simple test grid (1 = walkable, 0 = wall)
    const testGrid = [
        [1, 1, 1, 1, 1],
        [1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1],
        [1, 1, 1, 1, 1]
    ];

    describe('calculateStepDirection', () => {
        test('returns correct offset for East direction', () => {
            const step = calculateStepDirection(5, 5, 8, 5);
            expect(step.stepX).toBe(1);
            expect(step.stepY).toBe(0);
        });

        test('returns correct offset for North direction', () => {
            const step = calculateStepDirection(5, 5, 5, 2);
            expect(step.stepX).toBe(0);
            expect(step.stepY).toBe(-1);
        });

        test('returns correct offset for Southeast direction', () => {
            const step = calculateStepDirection(5, 5, 8, 8);
            expect(step.stepX).toBe(1);
            expect(step.stepY).toBe(1);
        });
    });

    describe('getLineType', () => {
        test('detects orthogonal horizontal line', () => {
            expect(getLineType(5, 5, 8, 5)).toBe('orthogonal');
        });

        test('detects orthogonal vertical line', () => {
            expect(getLineType(5, 5, 5, 8)).toBe('orthogonal');
        });

        test('detects diagonal line', () => {
            expect(getLineType(5, 5, 8, 8)).toBe('diagonal');
        });

        test('returns null for invalid line', () => {
            expect(getLineType(5, 5, 7, 9)).toBe(null);
        });
    });

    describe('checkOrthogonalLineOfSight', () => {
        test('returns true for clear horizontal line', () => {
            const result = checkOrthogonalLineOfSight(0, 0, 4, 0, testGrid, { isWalkable });
            expect(result).toBe(true);
        });

        test('returns false for blocked horizontal line', () => {
            const result = checkOrthogonalLineOfSight(0, 1, 4, 1, testGrid, { isWalkable });
            expect(result).toBe(false);
        });

        test('returns true for clear vertical line', () => {
            const result = checkOrthogonalLineOfSight(0, 0, 0, 4, testGrid, { isWalkable });
            expect(result).toBe(true);
        });

        test('returns false for blocked vertical line', () => {
            const result = checkOrthogonalLineOfSight(1, 0, 1, 4, testGrid, { isWalkable });
            expect(result).toBe(false);
        });

        test('rejects non-orthogonal lines', () => {
            const result = checkOrthogonalLineOfSight(0, 0, 3, 3, testGrid, { isWalkable });
            expect(result).toBe(false);
        });
    });

    describe('checkDiagonalLineOfSight', () => {
        test('returns true for clear diagonal line', () => {
            const result = checkDiagonalLineOfSight(0, 0, 4, 4, testGrid, { isWalkable });
            expect(result).toBe(true);
        });

        test('rejects non-diagonal lines', () => {
            const result = checkDiagonalLineOfSight(0, 0, 4, 0, testGrid, { isWalkable });
            expect(result).toBe(false);
        });
    });

    describe('checkQueenLineOfSight', () => {
        test('allows orthogonal movement', () => {
            const result = checkQueenLineOfSight(0, 0, 4, 0, testGrid, { isWalkable });
            expect(result).toBe(true);
        });

        test('allows diagonal movement', () => {
            const result = checkQueenLineOfSight(0, 0, 4, 4, testGrid, { isWalkable });
            expect(result).toBe(true);
        });

        test('rejects invalid movement directions', () => {
            const result = checkQueenLineOfSight(0, 0, 3, 1, testGrid, { isWalkable });
            expect(result).toBe(false);
        });
    });

    describe('enemy blocking', () => {
        const enemies = [{ x: 2, y: 0 }];

        test('enemy blocks orthogonal line of sight', () => {
            const result = checkOrthogonalLineOfSight(0, 0, 4, 0, testGrid, {
                isWalkable,
                checkEnemies: true,
                enemies
            });
            expect(result).toBe(false);
        });

        test('enemy does not block different line', () => {
            const result = checkOrthogonalLineOfSight(0, 2, 4, 2, testGrid, {
                isWalkable,
                checkEnemies: true,
                enemies
            });
            expect(result).toBe(true);
        });
    });
});
