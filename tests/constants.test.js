import { GRID_SIZE, TILE_TYPES } from '../constants.js';

describe('Constants', () => {
  test('GRID_SIZE should be 10', () => {
    expect(GRID_SIZE).toBe(10);
  });

  test('TILE_TYPES.FLOOR should be 0', () => {
    expect(TILE_TYPES.FLOOR).toBe(0);
  });

  test('TILE_TYPES.WALL should be 1', () => {
    expect(TILE_TYPES.WALL).toBe(1);
  });
});
