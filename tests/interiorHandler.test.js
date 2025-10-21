import { handleInterior } from '../core/handlers/interiorHandler.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';

function makeEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => TILE_TYPES.FLOOR));
}

test('handleInterior for home places port and returns expected shape', () => {
  const grid = makeEmptyGrid();
  const zoneGen = { grid };
  const res = handleInterior(zoneGen, 0, 0, ['apple']);
  expect(res).toHaveProperty('grid');
  expect(res).toHaveProperty('enemies');
  expect(res).toHaveProperty('playerSpawn');
  const portX = Math.floor(GRID_SIZE / 2);
  const portY = GRID_SIZE - 1;
  expect(zoneGen.grid[portY][portX]).toBe(TILE_TYPES.PORT);
});
