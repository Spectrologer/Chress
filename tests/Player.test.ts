import { Player } from '../entities/Player';
import { TILE_TYPES, GRID_SIZE, ZONE_CONSTANTS } from '@core/constants/index';

describe('Player', () => {
  let player;
  let grid;

  beforeEach(() => {
    player = new Player();
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
    // Provide minimal global window stubs used by Player.move
    global.window = global.window || {};
    global.window.gameInstance = global.window.gameInstance || {};
    global.window.gameInstance.isPlayerTurn = true;
    global.window.gameInstance.startEnemyTurns = vi.fn();
    global.window.gameInstance.explodeBomb = vi.fn();
    global.window.soundManager = global.window.soundManager || { playSound: vi.fn() };
  });

  test('initial state and reset', () => {
    // Default spawn is set in constructor
    expect(player.getPosition()).toHaveProperty('x');
    expect(player.getPosition()).toHaveProperty('y');
    player.x = 7; player.y = 8;
    player.inventory.push({ type: 'bow' });
    player.reset();
    expect(player.x).toBe(ZONE_CONSTANTS.PLAYER_SPAWN_POSITION.x);
    expect(player.y).toBe(ZONE_CONSTANTS.PLAYER_SPAWN_POSITION.y);
    expect(player.inventory.length).toBe(0);
  });

  test('isWalkable allows floor and denies sign/out-of-bounds', () => {
    expect(player.isWalkable(1, 1, grid)).toBe(true);
    grid[2][2] = TILE_TYPES.SIGN;
    expect(player.isWalkable(2, 2, grid)).toBe(false);
    expect(player.isWalkable(-1, 0, grid)).toBe(false);
  });

  test('move to walkable tile succeeds and triggers animations (no exceptions)', () => {
    player.x = 2; player.y = 2;
    // move into an adjacent floor tile
    const moved = player.move(3, 2, grid);
    expect(moved).toBe(true);
    expect(player.x).toBe(3);
    expect(player.y).toBe(2);
  });

  test('move off-grid only allowed from EXIT tile via callback', () => {
    player.x = 0; player.y = 0;
    grid[player.y][player.x] = TILE_TYPES.FLOOR;
    expect(player.move(-1, 0, grid)).toBe(false);

    grid[player.y][player.x] = TILE_TYPES.EXIT;
    let sawCallback = false;
    const moved = player.move(-1, 0, grid, (nx, ny, side) => { sawCallback = true; expect(typeof side).toBe('string'); });
    expect(moved).toBe(true);
    expect(sawCallback).toBe(true);
  });

  test('getValidSpawnPosition avoids player position and enemies', () => {
    player.x = 4; player.y = 4;
    const game = { grid, enemies: [{ x: 0, y: 0 }] };
    const pos = player.getValidSpawnPosition(game);
    expect(pos).toBeTruthy();
  // Ensure the returned spawn position is not the player's current coordinates
  expect(!(pos.x === player.x && pos.y === player.y)).toBe(true);
  });

  test('visit tracking works', () => {
    expect(player.hasVisitedZone(0, 0, 0)).toBe(true);
    player.setCurrentZone(2, 3, 0);
    expect(player.hasVisitedZone(2, 3, 0)).toBe(true);
  });

  test('itemManager.handleItemPickup is called when moving onto a tile', () => {
    player.x = 2; player.y = 2;
    const mockItemManager = { handleItemPickup: vi.fn() };
    player.itemManager = mockItemManager;
    // move into an adjacent floor tile
    const moved = player.move(3, 2, grid);
    expect(moved).toBe(true);
    expect(mockItemManager.handleItemPickup).toHaveBeenCalledWith(player, 3, 2, grid);
  });

  test('axe chops grass/shrubbery (does not move player and modifies grid)', () => {
    player.x = 4; player.y = 4;
    player.abilities.add('axe');
    // Place grass at target
    grid[4][5] = TILE_TYPES.GRASS;
    const moved = player.move(5, 4, grid);
    // Axe action should not move the player
    expect(moved).toBe(false);
    // Tile should be converted to floor (or exit if border) - here interior so FLOOR
    expect(grid[4][5]).toBe(TILE_TYPES.FLOOR);
    // Hunger should have decreased by default 1
    expect(player.getHunger()).toBeLessThan(50);
  });

  test('hammer smashes rock (does not move player and modifies grid, costs 2 hunger)', () => {
    player.x = 4; player.y = 4;
    player.abilities.add('hammer');
    grid[4][5] = TILE_TYPES.ROCK;
    const beforeHunger = player.getHunger();
    const moved = player.move(5, 4, grid);
    expect(moved).toBe(false);
    expect(grid[4][5] === TILE_TYPES.FLOOR || grid[4][5] === TILE_TYPES.EXIT).toBeTruthy();
    expect(player.getHunger()).toBe(beforeHunger - 2);
  });

  test('stepping onto a bomb (object tile) does not move player but triggers explosion', () => {
    player.x = 3; player.y = 3;
    // Represent bomb as an object tile as used by game logic
    grid[3][4] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 2 };
    const moved = player.move(4, 3, grid);
    // Player should not move, but explosion should be triggered
    expect(moved).toBe(false);
    expect(global.window.gameInstance.explodeBomb).toHaveBeenCalledWith(4, 3);
  });
});

