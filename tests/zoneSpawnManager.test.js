import { findValidPlayerSpawn, isTileFree, findOpenNpcSpawn } from '@core/zoneSpawnManager.js';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index.js';

function makeEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => TILE_TYPES.FLOOR));
}

test('isTileFree returns false for walls and true for floor', () => {
  const grid = makeEmptyGrid();
  grid[3][3] = TILE_TYPES.WALL;
  const zoneGen = { grid, enemies: [] };
  expect(isTileFree(zoneGen, 3, 3)).toBe(false);
  expect(isTileFree(zoneGen, 2, 2)).toBe(true);
});

test('findValidPlayerSpawn avoids occupied tiles', () => {
  const grid = makeEmptyGrid();
  grid[4][4] = TILE_TYPES.WALL;
  const zoneGen = { grid, enemies: [] , currentZoneX: 1, currentZoneY: 1, currentDimension:0, game:{portTransitionData:null} };
  const pos = findValidPlayerSpawn(zoneGen);
  expect(pos).not.toBeNull();
  expect(grid[pos.y][pos.x]).toBe(TILE_TYPES.FLOOR);
});

test('findOpenNpcSpawn finds a tile with neighbors', () => {
  const grid = makeEmptyGrid();
  const zoneGen = { grid, enemies: [] };
  const pos = findOpenNpcSpawn(zoneGen, 1);
  expect(pos).not.toBeNull();
});
