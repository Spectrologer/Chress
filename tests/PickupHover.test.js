import { ItemManager } from '@managers/ItemManager';
import { ItemPickupManager } from '@managers/inventory/ItemPickupManager';
import { Player } from '../entities/Player.js';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';

describe('Pickup hover visuals', () => {
  beforeEach(() => {
    global.window = global.window || {};
    global.window.soundManager = { playSound: jest.fn() };
  });

  test('ItemManager.handleItemPickup sets pickupHover for bow and clears tile', () => {
    const player = new Player();
    const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
    // place a bow object tile at (5,4) -> grid[y][x]
    grid[4][5] = { type: TILE_TYPES.BOW, uses: 1 };

    const manager = new ItemManager({});
    manager.handleItemPickup(player, 5, 4, grid);

    expect(player.animations.pickupHover).toBeTruthy();
    expect(player.animations.pickupHover.imageKey).toBe('bow');
    expect(player.animations.pickupHover.frames).toBeGreaterThan(0);
    expect(grid[4][5]).toBe(TILE_TYPES.FLOOR);
  });

  test('ItemPickupManager.checkItemPickup sets pickupHover when stepping on bow tile', () => {
    const player = new Player();
    player.x = 3; player.y = 3;
    const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
    grid[3][3] = { type: TILE_TYPES.BOW, uses: 1 };

    const uiManager = { updatePlayerStats: jest.fn(), addMessageToLog: jest.fn() };
    const game = { player, grid, uiManager };

    const pickupManager = new ItemPickupManager(game);
    pickupManager.checkItemPickup();

    expect(player.animations.pickupHover).toBeTruthy();
    expect(player.animations.pickupHover.imageKey).toBe('bow');
    expect(player.animations.pickupHover.frames).toBeGreaterThan(0);
  });

  test('PlayerAnimations.update decrements pickupHover.frames and clears when done; clears bowShot', () => {
    const player = new Player();
    const anim = player.animations;

    anim.pickupHover = { imageKey: 'axe', frames: 2, totalFrames: 2, type: 'axe' };
    anim.update();
    expect(anim.pickupHover.frames).toBe(1);
    anim.update();
    expect(anim.pickupHover).toBeNull();

    anim.bowShot = { frames: 1, totalFrames: 1, power: 1.2 };
    anim.update();
    expect(anim.bowShot).toBeNull();
  });
});
