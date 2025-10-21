import { sanitizeGrid } from '../core/zoneSanitizer.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';

test('sanitizeGrid replaces null/undefined tiles with FLOOR', () => {
  const grid = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => TILE_TYPES.FLOOR));
  grid[2][3] = null;
  grid[1][1] = undefined;
  const zoneGen = { grid };

  sanitizeGrid(zoneGen);

  expect(zoneGen.grid[2][3]).toBe(TILE_TYPES.FLOOR);
  expect(zoneGen.grid[1][1]).toBe(TILE_TYPES.FLOOR);
});
