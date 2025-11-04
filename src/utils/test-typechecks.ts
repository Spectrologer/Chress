/**
 * Quick test to verify generated TypeChecks.ts works correctly
 */

import { TileTypeChecker, EntityTypeChecker, isStatue } from './TypeChecks';
import { TILE_TYPES } from '@core/constants/index';

console.log('🧪 Testing Generated TypeChecks.ts\n');

let passed: number = 0;
let failed: number = 0;

function test(name: string, condition: boolean): void {
    if (condition) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        console.log(`❌ ${name}`);
        failed++;
    }
}

// Test basic type checking
test('isFloor() with primitive', TileTypeChecker.isFloor(TILE_TYPES.FLOOR));
test('isFloor() with object', TileTypeChecker.isFloor({ type: TILE_TYPES.FLOOR }));
test('isFloor() rejects non-floor', !TileTypeChecker.isFloor(TILE_TYPES.WALL));

// Test category checkers
test('isItem() detects axe', TileTypeChecker.isItem(TILE_TYPES.AXE));
test('isItem() detects bomb', TileTypeChecker.isItem(TILE_TYPES.BOMB));
test('isItem() rejects floor', !TileTypeChecker.isItem(TILE_TYPES.FLOOR));

// Test walkability
test('isWalkable() allows floor', TileTypeChecker.isWalkable(TILE_TYPES.FLOOR));
test('isWalkable() blocks wall', !TileTypeChecker.isWalkable(TILE_TYPES.WALL));
test('isWalkable() blocks rock', !TileTypeChecker.isWalkable(TILE_TYPES.ROCK));

// Test entity checkers
test('isPenne() works', EntityTypeChecker.isPenne(TILE_TYPES.PENNE));
test('isNPC() detects Penne', EntityTypeChecker.isNPC(TILE_TYPES.PENNE));
test('isNPC() detects Squig', EntityTypeChecker.isNPC(TILE_TYPES.SQUIG));
test('isNPC() rejects floor', !EntityTypeChecker.isNPC(TILE_TYPES.FLOOR));

// Test combined checkers
test('isStatue() detects bomb statue', isStatue(TILE_TYPES.BOMB_STATUE));
test('isStatue() detects lizardy statue', isStatue(TILE_TYPES.LIZARDY_STATUE));
test('isStatue() rejects floor', !isStatue(TILE_TYPES.FLOOR));

// Test object property helpers
test('isTileObject() detects object', TileTypeChecker.isTileObject({ type: TILE_TYPES.BOMB }));
test('isTileObject() rejects primitive', !TileTypeChecker.isTileObject(TILE_TYPES.BOMB));
test('isTileObject() rejects null', !TileTypeChecker.isTileObject(null));

const bombObj = { type: TILE_TYPES.BOMB, actionsSincePlaced: 5 };
test('getTileProperty() retrieves value', TileTypeChecker.getTileProperty(bombObj, 'actionsSincePlaced') === 5);
test('getTileProperty() returns undefined for primitive', TileTypeChecker.getTileProperty(TILE_TYPES.BOMB, 'actionsSincePlaced') === undefined);

test('hasTileProperty() detects property', TileTypeChecker.hasTileProperty(bombObj, 'actionsSincePlaced'));
test('hasTileProperty() rejects missing property', !TileTypeChecker.hasTileProperty(bombObj, 'nonexistent'));

test('isTileObjectOfType() validates type', TileTypeChecker.isTileObjectOfType(bombObj, TILE_TYPES.BOMB));
test('isTileObjectOfType() rejects wrong type', !TileTypeChecker.isTileObjectOfType(bombObj, TILE_TYPES.FLOOR));
test('isTileObjectOfType() rejects primitive', !TileTypeChecker.isTileObjectOfType(TILE_TYPES.BOMB, TILE_TYPES.BOMB));

// Test backward compatibility exports
(async () => {
    const { isFloor, isBomb, isNPC, getTileType } = await import('./TypeChecks');
    test('Backward compat: isFloor()', isFloor(TILE_TYPES.FLOOR));
    test('Backward compat: isBomb()', isBomb(TILE_TYPES.BOMB));
    test('Backward compat: isNPC()', isNPC(TILE_TYPES.PENNE));
    test('Backward compat: getTileType()', getTileType({ type: TILE_TYPES.BOMB }) === TILE_TYPES.BOMB);

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('✅ All tests passed!');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed');
        process.exit(1);
    }
})();
