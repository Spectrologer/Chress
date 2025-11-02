import { generateExits, clearPathToExit } from '@core/zoneMutators.js';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index.js';

function makeEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => TILE_TYPES.FLOOR));
}

test('generateExits sets exit tiles on edges', () => {
  const grid = makeEmptyGrid();
  const zoneGen = { grid, currentDimension:0 };
  const zoneConnections = new Map();
  zoneConnections.set('0,0', { north: 2, south: null, west: null, east: null });
  const featureGenerator = { blockExitsWithShrubbery: () => {} };

  generateExits(zoneGen, 0, 0, zoneConnections, featureGenerator, 1);
  expect(zoneGen.grid[0][2]).toBe(TILE_TYPES.EXIT);
});

test('clearPathToExit clears inward tile', () => {
  const grid = makeEmptyGrid();
  const zoneGen = { grid };
  grid[0][2] = TILE_TYPES.EXIT;
  grid[1][2] = TILE_TYPES.WALL;
  clearPathToExit(zoneGen, 2, 0);
  expect(zoneGen.grid[1][2]).toBe(TILE_TYPES.FLOOR);
});
