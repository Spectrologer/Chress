/**
 * Tests for SafeServiceCall utility
 */

import { safeCall, safeCallAsync, safeGet, hasMethod } from '../utils/SafeServiceCall.js';

describe('SafeServiceCall', () => {
    describe('safeCall', () => {
        test('calls method when service and method exist', () => {
            const service = {
                testMethod: jest.fn(() => 'result')
            };

            const result = safeCall(service, 'testMethod');

            expect(service.testMethod).toHaveBeenCalledTimes(1);
            expect(result).toBe('result');
        });

        test('calls method with arguments', () => {
            const service = {
                testMethod: jest.fn((a, b) => a + b)
            };

            const result = safeCall(service, 'testMethod', 5, 3);

            expect(service.testMethod).toHaveBeenCalledWith(5, 3);
            expect(result).toBe(8);
        });

        test('returns undefined when service is null', () => {
            const result = safeCall(null, 'testMethod');
            expect(result).toBeUndefined();
        });

        test('returns undefined when service is undefined', () => {
            const result = safeCall(undefined, 'testMethod');
            expect(result).toBeUndefined();
        });

        test('returns undefined when method does not exist', () => {
            const service = {};
            const result = safeCall(service, 'nonExistentMethod');
            expect(result).toBeUndefined();
        });

        test('returns undefined when method is not a function', () => {
            const service = {
                notAFunction: 'string value'
            };
            const result = safeCall(service, 'notAFunction');
            expect(result).toBeUndefined();
        });

        test('handles method returning falsy values', () => {
            const service = {
                returnFalse: () => false,
                returnZero: () => 0,
                returnEmptyString: () => '',
                returnNull: () => null
            };

            expect(safeCall(service, 'returnFalse')).toBe(false);
            expect(safeCall(service, 'returnZero')).toBe(0);
            expect(safeCall(service, 'returnEmptyString')).toBe('');
            expect(safeCall(service, 'returnNull')).toBe(null);
        });
    });

    describe('safeCallAsync', () => {
        test('calls async method when service and method exist', async () => {
            const service = {
                asyncMethod: jest.fn(async () => 'async result')
            };

            const result = await safeCallAsync(service, 'asyncMethod');

            expect(service.asyncMethod).toHaveBeenCalledTimes(1);
            expect(result).toBe('async result');
        });

        test('calls async method with arguments', async () => {
            const service = {
                asyncMethod: jest.fn(async (a, b) => a * b)
            };

            const result = await safeCallAsync(service, 'asyncMethod', 4, 5);

            expect(service.asyncMethod).toHaveBeenCalledWith(4, 5);
            expect(result).toBe(20);
        });

        test('returns undefined when service is null', async () => {
            const result = await safeCallAsync(null, 'asyncMethod');
            expect(result).toBeUndefined();
        });

        test('returns undefined when service is undefined', async () => {
            const result = await safeCallAsync(undefined, 'asyncMethod');
            expect(result).toBeUndefined();
        });

        test('returns undefined when method does not exist', async () => {
            const service = {};
            const result = await safeCallAsync(service, 'nonExistentMethod');
            expect(result).toBeUndefined();
        });

        test('propagates errors from async methods', async () => {
            const service = {
                failingMethod: jest.fn(async () => {
                    throw new Error('Test error');
                })
            };

            await expect(safeCallAsync(service, 'failingMethod')).rejects.toThrow('Test error');
        });
    });

    describe('safeGet', () => {
        test('gets simple property', () => {
            const obj = { name: 'test' };
            expect(safeGet(obj, 'name')).toBe('test');
        });

        test('gets nested property', () => {
            const obj = {
                player: {
                    stats: {
                        health: 100
                    }
                }
            };
            expect(safeGet(obj, 'player.stats.health')).toBe(100);
        });

        test('returns default value when object is null', () => {
            expect(safeGet(null, 'path', 'default')).toBe('default');
        });

        test('returns default value when object is undefined', () => {
            expect(safeGet(undefined, 'path', 'default')).toBe('default');
        });

        test('returns default value when path does not exist', () => {
            const obj = { a: 1 };
            expect(safeGet(obj, 'b.c.d', 'default')).toBe('default');
        });

        test('returns undefined when no default value provided', () => {
            const obj = { a: 1 };
            expect(safeGet(obj, 'b.c')).toBeUndefined();
        });

        test('handles path through null/undefined', () => {
            const obj = {
                a: {
                    b: null
                }
            };
            expect(safeGet(obj, 'a.b.c', 'default')).toBe('default');
        });

        test('gets property with falsy values', () => {
            const obj = {
                zero: 0,
                empty: '',
                false: false,
                null: null
            };
            expect(safeGet(obj, 'zero')).toBe(0);
            expect(safeGet(obj, 'empty')).toBe('');
            expect(safeGet(obj, 'false')).toBe(false);
            expect(safeGet(obj, 'null')).toBe(null);
        });
    });

    describe('hasMethod', () => {
        test('returns true when method exists', () => {
            const service = {
                testMethod: () => {}
            };
            expect(hasMethod(service, 'testMethod')).toBe(true);
        });

        test('returns false when service is null', () => {
            expect(hasMethod(null, 'testMethod')).toBe(false);
        });

        test('returns false when service is undefined', () => {
            expect(hasMethod(undefined, 'testMethod')).toBe(false);
        });

        test('returns false when method does not exist', () => {
            const service = {};
            expect(hasMethod(service, 'nonExistentMethod')).toBe(false);
        });

        test('returns false when property is not a function', () => {
            const service = {
                notAFunction: 'string'
            };
            expect(hasMethod(service, 'notAFunction')).toBe(false);
        });
    });

    describe('Real-world usage examples', () => {
        test('replaces defensive gameStateManager check', () => {
            // Before: if (this.game.gameStateManager && typeof this.game.gameStateManager.startAutoSave === 'function')
            const game = {
                gameStateManager: {
                    startAutoSave: jest.fn()
                }
            };

            safeCall(game.gameStateManager, 'startAutoSave');

            expect(game.gameStateManager.startAutoSave).toHaveBeenCalled();
        });

        test('handles missing gameStateManager gracefully', () => {
            const game = {};

            // This should not throw
            expect(() => {
                safeCall(game.gameStateManager, 'startAutoSave');
            }).not.toThrow();
        });

        test('replaces nested property access', () => {
            // Before: this.game.player && this.game.player.stats && this.game.player.stats.musicEnabled
            const game = {
                player: {
                    stats: {
                        musicEnabled: true
                    }
                }
            };

            const musicEnabled = safeGet(game, 'player.stats.musicEnabled', false);
            expect(musicEnabled).toBe(true);
        });

        test('handles missing nested properties', () => {
            const game = {};
            const musicEnabled = safeGet(game, 'player.stats.musicEnabled', false);
            expect(musicEnabled).toBe(false);
        });

        test('replaces fallback method pattern', () => {
            // Before: try method1, fallback to method2
            const gameStateManager = {
                resetGame: jest.fn(() => true)
            };

            const reset = safeCall(gameStateManager, 'resetGame');
            if (!reset) {
                safeCall(gameStateManager, 'clearSavedState');
            }

            expect(gameStateManager.resetGame).toHaveBeenCalled();
        });
    });
});
