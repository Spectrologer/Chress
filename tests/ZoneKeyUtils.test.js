import { createZoneKey, parseZoneKey, isValidZoneKey } from '../utils/ZoneKeyUtils.js';

describe('ZoneKeyUtils', () => {
    describe('createZoneKey', () => {
        test('creates surface zone key without depth', () => {
            const key = createZoneKey(0, 0, 0);
            expect(key).toBe('0,0:0');
        });

        test('creates interior zone key without depth', () => {
            const key = createZoneKey(1, 2, 1);
            expect(key).toBe('1,2:1');
        });

        test('creates underground zone key with default depth', () => {
            const key = createZoneKey(0, 0, 2);
            expect(key).toBe('0,0:2:z-1');
        });

        test('creates underground zone key with specified depth', () => {
            const key = createZoneKey(0, 0, 2, 3);
            expect(key).toBe('0,0:2:z-3');
        });

        test('creates zone key with negative coordinates', () => {
            const key = createZoneKey(-5, -10, 0);
            expect(key).toBe('-5,-10:0');
        });

        test('creates underground zone key with large depth', () => {
            const key = createZoneKey(10, 20, 2, 99);
            expect(key).toBe('10,20:2:z-99');
        });
    });

    describe('parseZoneKey', () => {
        test('parses surface zone key', () => {
            const result = parseZoneKey('0,0:0');
            expect(result).toEqual({ x: 0, y: 0, dimension: 0, depth: null });
        });

        test('parses interior zone key', () => {
            const result = parseZoneKey('1,2:1');
            expect(result).toEqual({ x: 1, y: 2, dimension: 1, depth: null });
        });

        test('parses underground zone key with depth', () => {
            const result = parseZoneKey('0,0:2:z-1');
            expect(result).toEqual({ x: 0, y: 0, dimension: 2, depth: 1 });
        });

        test('parses underground zone key with large depth', () => {
            const result = parseZoneKey('10,20:2:z-99');
            expect(result).toEqual({ x: 10, y: 20, dimension: 2, depth: 99 });
        });

        test('parses zone key with negative coordinates', () => {
            const result = parseZoneKey('-5,-10:0');
            expect(result).toEqual({ x: -5, y: -10, dimension: 0, depth: null });
        });

        test('throws error for invalid zone key format', () => {
            expect(() => parseZoneKey('invalid')).toThrow('Invalid zone key format');
        });

        test('throws error for missing coordinates', () => {
            expect(() => parseZoneKey('0:0')).toThrow('Invalid coordinates');
        });

        test('throws error for non-string input', () => {
            expect(() => parseZoneKey(123)).toThrow('Zone key must be a string');
        });

        test('throws error for invalid numeric values', () => {
            expect(() => parseZoneKey('a,b:0')).toThrow('Invalid numeric values');
        });

        test('throws error for invalid depth value', () => {
            expect(() => parseZoneKey('0,0:2:z-abc')).toThrow('Invalid depth value');
        });
    });

    describe('isValidZoneKey', () => {
        test('returns true for valid surface zone key', () => {
            expect(isValidZoneKey('0,0:0')).toBe(true);
        });

        test('returns true for valid underground zone key', () => {
            expect(isValidZoneKey('0,0:2:z-5')).toBe(true);
        });

        test('returns false for invalid zone key', () => {
            expect(isValidZoneKey('invalid')).toBe(false);
        });

        test('returns false for non-string input', () => {
            expect(isValidZoneKey(123)).toBe(false);
        });
    });

    describe('createZoneKey and parseZoneKey roundtrip', () => {
        test('surface zone roundtrip', () => {
            const original = { x: 5, y: 10, dimension: 0 };
            const key = createZoneKey(original.x, original.y, original.dimension);
            const parsed = parseZoneKey(key);
            expect(parsed.x).toBe(original.x);
            expect(parsed.y).toBe(original.y);
            expect(parsed.dimension).toBe(original.dimension);
            expect(parsed.depth).toBe(null);
        });

        test('underground zone roundtrip', () => {
            const original = { x: -3, y: 7, dimension: 2, depth: 42 };
            const key = createZoneKey(original.x, original.y, original.dimension, original.depth);
            const parsed = parseZoneKey(key);
            expect(parsed).toEqual(original);
        });
    });
});
