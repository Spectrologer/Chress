import { GRID_SIZE, TILE_TYPES, ANIMATION_CONSTANTS, UI_CONSTANTS, SIMULATION_CONSTANTS, INPUT_CONSTANTS, ZONE_CONSTANTS } from '../core/constants.js';

describe('Constants', () => {
  test('GRID_SIZE should be 9', () => {
    expect(GRID_SIZE).toBe(9);
  });

  test('TILE_TYPES.FLOOR should be 0', () => {
    expect(TILE_TYPES.FLOOR).toBe(0);
  });

  test('TILE_TYPES.WALL should be 1', () => {
    expect(TILE_TYPES.WALL).toBe(1);
  });

  test('ANIMATION_CONSTANTS.LIFT_FRAMES should be 15', () => {
    expect(ANIMATION_CONSTANTS.LIFT_FRAMES).toBe(15);
  });

  test('UI_CONSTANTS.AXE_ICON_SIZE_RELATIVE should be 0.7', () => {
    expect(UI_CONSTANTS.AXE_ICON_SIZE_RELATIVE).toBe(0.7);
  });

  test('SIMULATION_CONSTANTS.DEFEAT_DAMAGE should be 999', () => {
    expect(SIMULATION_CONSTANTS.DEFEAT_DAMAGE).toBe(999);
  });

  test('INPUT_CONSTANTS.LEGACY_PATH_DELAY should be 150', () => {
    expect(INPUT_CONSTANTS.LEGACY_PATH_DELAY).toBe(150);
  });

  test('ZONE_CONSTANTS.PLAYER_SPAWN_POSITION should be {x: 4, y: 7}', () => {
    expect(ZONE_CONSTANTS.PLAYER_SPAWN_POSITION).toEqual({x: 4, y: 7});
  });
});
