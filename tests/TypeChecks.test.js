/**
 * TypeChecks.test.js - Unit tests for TypeChecks utility module
 *
 * Tests all core utilities and validates behavior with:
 * - Primitive tiles (numbers)
 * - Object tiles (with type property)
 * - Null/undefined values
 * - Edge cases
 */

import {
    getTileType,
    isTileObject,
    isTileType,
    isValidTile,
    isBomb,
    isFloor,
    isWall,
    isExit,
    isPort,
    isSign,
    isTileObjectOfType,
    getTileProperty,
    hasTileProperty,
    isWalkable,
    isItem,
    isStatue
} from '@utils/TypeChecks';

import { TILE_TYPES } from '@core/constants/index';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        testsPassed++;
    } else {
        testsFailed++;
        console.error(`❌ FAILED: ${message}`);
    }
}

function assertEquals(actual, expected, message) {
    if (actual === expected) {
        testsPassed++;
    } else {
        testsFailed++;
        console.error(`❌ FAILED: ${message}`);
        console.error(`   Expected: ${expected}, Got: ${actual}`);
    }
}

console.log('🧪 Running TypeChecks.js Tests...\n');

// ========================================
// Core Utilities Tests
// ========================================

console.log('Testing getTileType()...');
assertEquals(getTileType(TILE_TYPES.FLOOR), TILE_TYPES.FLOOR, 'Primitive tile returns type');
assertEquals(getTileType({ type: TILE_TYPES.BOMB }), TILE_TYPES.BOMB, 'Object tile returns type property');
assertEquals(getTileType(null), undefined, 'Null returns undefined');
assertEquals(getTileType(undefined), undefined, 'Undefined returns undefined');

console.log('Testing isTileObject()...');
assert(isTileObject({ type: TILE_TYPES.BOMB }), 'Object with type is valid');
assert(!isTileObject(TILE_TYPES.FLOOR), 'Primitive is not object');
assert(!isTileObject(null), 'Null is not object');
assert(!isTileObject(undefined), 'Undefined is not object');
assert(!isTileObject({}), 'Empty object without type is not valid');

console.log('Testing isValidTile()...');
assert(isValidTile(TILE_TYPES.FLOOR), 'Primitive tile is valid');
assert(isValidTile({ type: TILE_TYPES.BOMB }), 'Object tile is valid');
assert(!isValidTile(null), 'Null is not valid');
assert(!isValidTile(undefined), 'Undefined is not valid');

console.log('Testing isTileType()...');
assert(isTileType(TILE_TYPES.BOMB, TILE_TYPES.BOMB), 'Primitive matches type');
assert(isTileType({ type: TILE_TYPES.BOMB }, TILE_TYPES.BOMB), 'Object matches type');
assert(!isTileType(TILE_TYPES.FLOOR, TILE_TYPES.BOMB), 'Primitive does not match wrong type');
assert(!isTileType({ type: TILE_TYPES.FLOOR }, TILE_TYPES.BOMB), 'Object does not match wrong type');
assert(!isTileType(null, TILE_TYPES.BOMB), 'Null does not match any type');

// ========================================
// Specific Type Checkers Tests
// ========================================

console.log('\nTesting specific type checkers...');
assert(isBomb(TILE_TYPES.BOMB), 'isBomb() recognizes primitive bomb');
assert(isBomb({ type: TILE_TYPES.BOMB, actionsSincePlaced: 0 }), 'isBomb() recognizes object bomb');
assert(!isBomb(TILE_TYPES.FLOOR), 'isBomb() rejects non-bomb');
assert(!isBomb(null), 'isBomb() rejects null');

assert(isFloor(TILE_TYPES.FLOOR), 'isFloor() recognizes floor');
assert(isWall(TILE_TYPES.WALL), 'isWall() recognizes wall');
assert(isExit(TILE_TYPES.EXIT), 'isExit() recognizes exit');
assert(isPort(TILE_TYPES.PORT), 'isPort() recognizes port');
assert(isSign({ type: TILE_TYPES.SIGN, message: 'Hello' }), 'isSign() recognizes sign object');

// ========================================
// Combined Condition Tests
// ========================================

console.log('\nTesting isTileObjectOfType()...');
const bombObject = { type: TILE_TYPES.BOMB, actionsSincePlaced: 1, justPlaced: true };
assert(isTileObjectOfType(bombObject, TILE_TYPES.BOMB), 'Recognizes object with correct type');
assert(!isTileObjectOfType(TILE_TYPES.BOMB, TILE_TYPES.BOMB), 'Rejects primitive even with correct type');
assert(!isTileObjectOfType(bombObject, TILE_TYPES.FLOOR), 'Rejects object with wrong type');
assert(!isTileObjectOfType(null, TILE_TYPES.BOMB), 'Rejects null');

// ========================================
// Property Helper Tests
// ========================================

console.log('\nTesting property helpers...');
const tileWithProps = { type: TILE_TYPES.BOMB, actionsSincePlaced: 5, justPlaced: false };
assertEquals(getTileProperty(tileWithProps, 'actionsSincePlaced'), 5, 'getTileProperty returns value');
assertEquals(getTileProperty(tileWithProps, 'nonexistent'), undefined, 'getTileProperty returns undefined for missing property');
assertEquals(getTileProperty(TILE_TYPES.FLOOR, 'actionsSincePlaced'), undefined, 'getTileProperty returns undefined for primitive');

assert(hasTileProperty(tileWithProps, 'actionsSincePlaced'), 'hasTileProperty finds existing property');
assert(!hasTileProperty(tileWithProps, 'nonexistent'), 'hasTileProperty returns false for missing property');
assert(!hasTileProperty(TILE_TYPES.FLOOR, 'actionsSincePlaced'), 'hasTileProperty returns false for primitive');

// ========================================
// Category Checker Tests
// ========================================

console.log('\nTesting category checkers...');
assert(isWalkable(TILE_TYPES.FLOOR), 'Floor is walkable');
assert(!isWalkable(TILE_TYPES.WALL), 'Wall is not walkable');
assert(!isWalkable(TILE_TYPES.ROCK), 'Rock is not walkable');
assert(!isWalkable(TILE_TYPES.HOUSE), 'House is not walkable');
assert(!isWalkable(TILE_TYPES.SIGN), 'Sign is not walkable');

assert(isItem(TILE_TYPES.AXE), 'Axe is an item');
assert(isItem(TILE_TYPES.BOMB), 'Bomb is an item');
assert(isItem(TILE_TYPES.HEART), 'Heart is an item');
assert(!isItem(TILE_TYPES.WALL), 'Wall is not an item');

assert(isStatue(TILE_TYPES.LIZARDY_STATUE), 'Lizardy statue recognized');
assert(isStatue(TILE_TYPES.BOMB_STATUE), 'Bomb statue recognized');
assert(!isStatue(TILE_TYPES.BOMB), 'Bomb is not a statue');

// ========================================
// Edge Cases Tests
// ========================================

console.log('\nTesting edge cases...');
assert(!isTileType({}, TILE_TYPES.FLOOR), 'Empty object does not match any type');
assert(!isTileType({ type: undefined }, TILE_TYPES.FLOOR), 'Object with undefined type does not match');
assert(!isTileType({ notType: TILE_TYPES.FLOOR }, TILE_TYPES.FLOOR), 'Object without type property does not match');

// Test with actual bomb object structure from game
const realBombTile = {
    type: TILE_TYPES.BOMB,
    actionsSincePlaced: 0,
    justPlaced: true
};
assert(isBomb(realBombTile), 'Real bomb tile structure recognized');
assert(isTileObject(realBombTile), 'Real bomb tile is object');
assert(isTileObjectOfType(realBombTile, TILE_TYPES.BOMB), 'Real bomb tile validates correctly');
assertEquals(getTileProperty(realBombTile, 'actionsSincePlaced'), 0, 'Can access bomb properties');

// Test with sign object structure
const realSignTile = {
    type: TILE_TYPES.SIGN,
    message: 'Welcome to the dungeon!',
    hasBeenRead: false
};
assert(isSign(realSignTile), 'Real sign tile structure recognized');
assert(isTileObjectOfType(realSignTile, TILE_TYPES.SIGN), 'Real sign tile validates correctly');
assertEquals(getTileProperty(realSignTile, 'message'), 'Welcome to the dungeon!', 'Can access sign message');

// ========================================
// Results
// ========================================

console.log('\n' + '='.repeat(50));
console.log('📊 Test Results:');
console.log('='.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total:  ${testsPassed + testsFailed}`);
console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(50));

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! TypeChecks.js is working correctly.\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
}
