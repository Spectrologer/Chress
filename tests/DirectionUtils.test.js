import { getOffset, getDeltaToDirection, isValidDirection, getAllDirections } from '@core/utils/DirectionUtils';

describe('DirectionUtils', () => {
    describe('getOffset', () => {
        test('returns correct offset for arrowright', () => {
            expect(getOffset('arrowright')).toEqual({ x: 1, y: 0 });
        });

        test('returns correct offset for arrowleft', () => {
            expect(getOffset('arrowleft')).toEqual({ x: -1, y: 0 });
        });

        test('returns correct offset for arrowdown', () => {
            expect(getOffset('arrowdown')).toEqual({ x: 0, y: 1 });
        });

        test('returns correct offset for arrowup', () => {
            expect(getOffset('arrowup')).toEqual({ x: 0, y: -1 });
        });

        test('is case insensitive', () => {
            expect(getOffset('ARROWRIGHT')).toEqual({ x: 1, y: 0 });
            expect(getOffset('ArrowLeft')).toEqual({ x: -1, y: 0 });
        });

        test('returns zero offset for invalid direction', () => {
            expect(getOffset('invalid')).toEqual({ x: 0, y: 0 });
            expect(getOffset('')).toEqual({ x: 0, y: 0 });
        });
    });

    describe('getDeltaToDirection', () => {
        test('returns arrowright for positive dx when |dx| > |dy|', () => {
            expect(getDeltaToDirection(5, 2)).toBe('arrowright');
        });

        test('returns arrowleft for negative dx when |dx| > |dy|', () => {
            expect(getDeltaToDirection(-5, 2)).toBe('arrowleft');
        });

        test('returns arrowdown for positive dy when |dy| > |dx|', () => {
            expect(getDeltaToDirection(2, 5)).toBe('arrowdown');
        });

        test('returns arrowup for negative dy when |dy| > |dx|', () => {
            expect(getDeltaToDirection(2, -5)).toBe('arrowup');
        });

        test('prioritizes horizontal when deltas are equal (positive)', () => {
            expect(getDeltaToDirection(4, 4)).toBe('arrowright');
        });

        test('prioritizes horizontal when deltas are equal (negative)', () => {
            expect(getDeltaToDirection(-4, -4)).toBe('arrowleft');
        });

        test('prioritizes horizontal when deltas are equal (mixed)', () => {
            expect(getDeltaToDirection(4, -4)).toBe('arrowright');
        });

        test('returns null when both deltas are 0', () => {
            expect(getDeltaToDirection(0, 0)).toBe(null);
        });

        test('handles single axis movement', () => {
            expect(getDeltaToDirection(3, 0)).toBe('arrowright');
            expect(getDeltaToDirection(-3, 0)).toBe('arrowleft');
            expect(getDeltaToDirection(0, 3)).toBe('arrowdown');
            expect(getDeltaToDirection(0, -3)).toBe('arrowup');
        });
    });

    describe('isValidDirection', () => {
        test('returns true for valid arrow directions', () => {
            expect(isValidDirection('arrowup')).toBe(true);
            expect(isValidDirection('arrowdown')).toBe(true);
            expect(isValidDirection('arrowleft')).toBe(true);
            expect(isValidDirection('arrowright')).toBe(true);
        });

        test('is case insensitive', () => {
            expect(isValidDirection('ARROWUP')).toBe(true);
            expect(isValidDirection('ArrowDown')).toBe(true);
        });

        test('returns false for invalid directions', () => {
            expect(isValidDirection('w')).toBe(false);
            expect(isValidDirection('a')).toBe(false);
            expect(isValidDirection('invalid')).toBe(false);
            expect(isValidDirection('')).toBe(false);
        });
    });

    describe('getAllDirections', () => {
        test('returns all four arrow directions', () => {
            const directions = getAllDirections();
            expect(directions).toHaveLength(4);
            expect(directions).toContain('arrowup');
            expect(directions).toContain('arrowdown');
            expect(directions).toContain('arrowleft');
            expect(directions).toContain('arrowright');
        });
    });

    describe('Integration: replaces old ternary logic', () => {
        test('getDeltaToDirection + getOffset replaces old coordinate calculation', () => {
            const playerPos = { x: 10, y: 10 };
            const targetPos = { x: 15, y: 12 };

            const dx = targetPos.x - playerPos.x;  // 5
            const dy = targetPos.y - playerPos.y;  // 2

            // Old way (verbose ternaries):
            // stepKey = dx > 0 ? 'arrowright' : 'arrowleft'
            // stepX = playerPos.x + (stepKey === 'arrowright' ? 1 : stepKey === 'arrowleft' ? -1 : 0)

            // New way (clean):
            const stepKey = getDeltaToDirection(dx, dy);
            const offset = getOffset(stepKey);
            const stepX = playerPos.x + offset.x;
            const stepY = playerPos.y + offset.y;

            expect(stepKey).toBe('arrowright');
            expect(stepX).toBe(11);
            expect(stepY).toBe(10);
        });
    });
});
