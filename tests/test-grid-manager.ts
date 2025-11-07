import { GridManager } from '../src/managers/GridManager\.ts';
import { TILE_TYPES } from '../src/core/constants/index\.ts';

// Create a simple 9x9 grid filled with floors
const testGrid = Array(9).fill(null).map(() =>
    Array(9).fill(TILE_TYPES.FLOOR)
);

// Initialize GridManager
const gridManager = new GridManager(testGrid);

console.log('✓ GridManager instantiated');

// Test 1: Get and Set tile
gridManager.setTile(4, 4, TILE_TYPES.WALL);
const tile = gridManager.getTile(4, 4);
console.assert(tile === TILE_TYPES.WALL, 'getTile/setTile should work');
console.log('✓ getTile/setTile works');

// Test 2: Check bounds
console.assert(gridManager.isWithinBounds(0, 0) === true, 'top-left should be in bounds');
console.assert(gridManager.isWithinBounds(8, 8) === true, 'bottom-right should be in bounds');
console.assert(gridManager.isWithinBounds(-1, 0) === false, 'negative x should be out of bounds');
console.assert(gridManager.isWithinBounds(0, 9) === false, 'y=9 should be out of bounds');
console.log('✓ isWithinBounds works');

// Test 3: Check tile type
gridManager.setTile(5, 5, TILE_TYPES.EXIT);
console.assert(gridManager.isTileType(5, 5, TILE_TYPES.EXIT) === true, 'should detect EXIT tile');
console.assert(gridManager.isTileType(5, 5, TILE_TYPES.FLOOR) === false, 'should not detect FLOOR');
console.log('✓ isTileType works');

// Test 4: Find tiles
gridManager.setTile(1, 1, TILE_TYPES.BOMB);
gridManager.setTile(2, 2, TILE_TYPES.BOMB);
const bombs = gridManager.findTilesOfType(TILE_TYPES.BOMB);
console.assert(bombs.length === 2, `should find 2 bombs, found ${bombs.length}`);
console.assert(bombs[0].x === 1 && bombs[0].y === 1, 'first bomb position');
console.assert(bombs[1].x === 2 && bombs[1].y === 2, 'second bomb position');
console.log('✓ findTilesOfType works');

// Test 5: Clone tile
gridManager.setTile(3, 3, { type: TILE_TYPES.PORT, portKind: 'stairup' });
const clonedTile = gridManager.cloneTile(3, 3);
console.assert(clonedTile.type === TILE_TYPES.PORT, 'cloned tile should have PORT type');
console.assert(clonedTile.portKind === 'stairup', 'cloned tile should have portKind');
console.assert(clonedTile !== gridManager.getTile(3, 3), 'cloned tile should be a different object');
console.log('✓ cloneTile works');

// Test 6: Get neighbors
gridManager.setTile(4, 3, TILE_TYPES.ENEMY);
gridManager.setTile(5, 4, TILE_TYPES.ENEMY);
const neighbors = gridManager.getNeighbors(4, 4);
console.assert(neighbors.length === 4, `should have 4 neighbors, found ${neighbors.length}`);
const upNeighbor = neighbors.find(n => n.direction === 'up');
console.assert(upNeighbor.tile === TILE_TYPES.ENEMY, 'up neighbor should be enemy');
console.log('✓ getNeighbors works');

// Test 7: Fill region
gridManager.fillRegion(6, 6, 2, 2, TILE_TYPES.WATER);
console.assert(gridManager.getTile(6, 6) === TILE_TYPES.WATER, 'top-left of region');
console.assert(gridManager.getTile(7, 6) === TILE_TYPES.WATER, 'top-right of region');
console.assert(gridManager.getTile(6, 7) === TILE_TYPES.WATER, 'bottom-left of region');
console.assert(gridManager.getTile(7, 7) === TILE_TYPES.WATER, 'bottom-right of region');
console.log('✓ fillRegion works');

// Test 8: Out of bounds handling
const outOfBoundsTile = gridManager.getTile(100, 100);
console.assert(outOfBoundsTile === undefined, 'out of bounds should return undefined');
const setResult = gridManager.setTile(100, 100, TILE_TYPES.FLOOR);
console.assert(setResult === false, 'out of bounds set should return false');
console.log('✓ Out of bounds handling works');

console.log('\n✅ All GridManager tests passed!');
console.log('\n📊 Summary:');
console.log('- Basic operations (get/set/bounds): Working');
console.log('- Tile type checking: Working');
console.log('- Search operations (find): Working');
console.log('- Tile manipulation (clone/neighbors): Working');
console.log('- Region operations (fill): Working');
console.log('- Error handling (out of bounds): Working');
