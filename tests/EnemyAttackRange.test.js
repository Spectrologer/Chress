import { RenderManager } from '../renderers/RenderManager.js';
import { GRID_SIZE, TILE_TYPES, TILE_SIZE } from '../core/constants/index.js';

function makeMockCanvas() {
  const listeners = {};
  return {
    width: 640,
    height: 640,
    getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0, width: 640, height: 640 }),
    addEventListener: jest.fn((name, fn) => { listeners[name] = fn; }),
    __listeners: listeners
  };
}

function makeMockCtx() {
  return {
    save: jest.fn(),
    restore: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    setLineDash: jest.fn(),
    lineWidth: 1,
    strokeStyle: '',
    fillStyle: '',
  };
}

function makeMinimalGame() {
  const canvas = makeMockCanvas();
  const ctx = makeMockCtx();
  const textureManager = { renderTile: jest.fn() };
  const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
  return { canvas, ctx, textureManager, grid, enemies: [], player: { getCurrentZone: () => ({ dimension: 0 }) } };
}

describe('RenderManager enemy attack range overlay', () => {
  test('lizardy shows diagonal forward tiles', () => {
    const game = makeMinimalGame();
    const rm = new RenderManager(game);
    // Inject our mock ctx onto the game/render manager
    game.ctx = game.ctx || game.ctx;
    rm.ctx = game.ctx;

    // Place a lizardy at (3,3) facing south
    const enemy = {
      x: 3, y: 3, health: 1, enemyType: 'lizardy', movementDirection: 1,
      isWalkable: (x, y, g) => true
    };
    game.enemies.push(enemy);

    // Start a hold feedback targeting the enemy tile
    rm.startHoldFeedback(3, 3);

    // Call internal draw to render the hold feedback and overlay
    rm['_drawTapFeedback']();

    // For lizardy we expect two diagonal target fills: (2,4) and (4,4)
    expect(game.ctx.fillRect).toHaveBeenCalled();
    const calls = game.ctx.fillRect.mock.calls.map(c => [c[0], c[1]]);
    // Convert pixel positions to tile coords
    const tiles = calls.map(([px, py]) => [Math.round(px / TILE_SIZE), Math.round(py / TILE_SIZE)]);
    expect(tiles).toEqual(expect.arrayContaining([[2,4],[4,4]]));
  });

  test('lizord shows knight move endpoints', () => {
    const game = makeMinimalGame();
    const rm = new RenderManager(game);
    rm.ctx = game.ctx;

    const enemy = { x: 4, y: 4, health: 1, enemyType: 'lizord', isWalkable: () => true };
    game.enemies.push(enemy);
    rm.startHoldFeedback(4, 4);
    rm['_drawTapFeedback']();

    // Expect at least one knight endpoint to be drawn, e.g., (6,5)
    const tiles = game.ctx.fillRect.mock.calls.map(([px,py]) => [Math.round(px / TILE_SIZE), Math.round(py / TILE_SIZE)]);
    expect(tiles).toEqual(expect.arrayContaining([[6,5]]));
  });

  test('lizardeaux shows orthogonal rays until blocked', () => {
    const game = makeMinimalGame();
    const rm = new RenderManager(game);
    rm.ctx = game.ctx;

    // Put a blocking non-walkable tile at (4,2)
    game.grid[2][4] = TILE_TYPES.EXIT; // still walkable in default rules, but we'll mock isWalkable

    const enemy = {
      x: 4, y: 4, health: 1, enemyType: 'lizardeaux',
      isWalkable: (x, y, g) => {
        // block north one tile away
        if (x === 4 && y === 3) return false;
        return true;
      }
    };
    game.enemies.push(enemy);

    rm.startHoldFeedback(4, 4);
    rm['_drawTapFeedback']();

    const tiles = game.ctx.fillRect.mock.calls.map(([px,py]) => [Math.round(px / TILE_SIZE), Math.round(py / TILE_SIZE)]);
    // Since north is blocked at (4,3), we should not see (4,2) as target; but east should be present (5,4)
    expect(tiles).toEqual(expect.arrayContaining([[5,4]]));
    expect(tiles).not.toEqual(expect.arrayContaining([[4,2]]));
  });
});
