import { CombatActionManager } from '@managers/CombatActionManager';
import { TILE_TYPES } from '@core/constants/index';

describe('CombatActionManager', () => {
  let game;
  let cam;

  beforeEach(() => {
    const grid = Array(9).fill().map(() => Array(9).fill(TILE_TYPES.FLOOR));

    const mockPlayer = {
      x: 4,
      y: 4,
      inventory: [
        { type: 'bishop_spear', uses: 1, disabled: false },
        { type: 'horse_icon', uses: 1, disabled: false },
        { type: 'bow', uses: 1, disabled: false }
      ],
      isWalkable: vi.fn().mockReturnValue(true)
    };

    game = {
      player: mockPlayer,
      enemies: [ { x: 7, y: 7, id: 'e1' } ],
      grid: grid,
      pendingCharge: null,
      hideOverlayMessage: vi.fn(),
      performBishopSpearCharge: vi.fn(),
      performHorseIconCharge: vi.fn(),
      actionManager: { performBowShot: vi.fn() },
      // Add gridManager mock
      gridManager: {
        getTile: vi.fn((x, y) => {
          if (x < 0 || y < 0 || x >= 9 || y >= 9) return undefined;
          return grid[y][x];
        }),
        setTile: vi.fn(),
        isWalkable: vi.fn().mockReturnValue(true)
      },
      // Add playerFacade mock for Vitest compatibility
      playerFacade: {
        getInventory: vi.fn(() => mockPlayer.inventory),
        getRadialInventory: vi.fn().mockReturnValue([]),
        isWalkable: vi.fn().mockReturnValue(true)
      },
      // Add transientGameState mock
      transientGameState: {
        clearPendingCharge: vi.fn(() => { game.pendingCharge = null; })
      },
      // Add enemyCollection mock
      enemyCollection: {
        findAt: vi.fn((x, y) => game.enemies.find((e: any) => e.x === x && e.y === y))
      }
    };

    cam = new CombatActionManager(game);
  });

  test('isValidBishopSpearCharge returns details for diagonal up to 5 tiles', () => {
    const playerPos = { x: 4, y: 4 };
    const target = { x: 7, y: 7 }; // diagonal distance 3
    const res = cam.isValidBishopSpearCharge(target, playerPos);
    expect(res).not.toBeNull();
    expect(res.type).toBe('bishop_spear');
    expect(res.dx).toBe(3);
  });

  test('isValidBishopSpearCharge returns null when no item available', () => {
    game.player.inventory = [];
    const res = cam.isValidBishopSpearCharge({ x: 6, y: 6 }, { x: 4, y: 4 });
    expect(res).toBeNull();
  });

  test('isValidHorseIconCharge recognizes L-shaped moves', () => {
    const playerPos = { x: 4, y: 4 };
    // L-shape: dx=2, dy=1
    const res = cam.isValidHorseIconCharge({ x: 6, y: 5 }, playerPos);
    expect(res).not.toBeNull();
    expect(res.type).toBe('horse_icon');
  });

  test('isValidHorseIconCharge returns null for invalid shapes', () => {
    const res = cam.isValidHorseIconCharge({ x: 8, y: 8 }, { x: 4, y: 4 });
    expect(res).toBeNull();
  });

  test('isValidBowShot returns null when no enemy at target', () => {
    const res = cam.isValidBowShot({ x: 0, y: 0 }, { x: 4, y: 4 });
    expect(res).toBeNull();
  });

  test('isValidBowShot returns object when enemy is orthogonally aligned and path clear', () => {
    // place enemy orthogonally
    game.enemies = [{ x: 4, y: 8, id: 'e2' }];
    const res = cam.isValidBowShot({ x: 4, y: 8 }, { x: 4, y: 4 });
    expect(res).not.toBeNull();
    expect(res.type).toBe('bow');
  });

  test('confirmPendingCharge routes to performBowShot and clears pendingCharge', () => {
    const enemy = { x: 4, y: 8, id: 'e2' };
    const chargeDetails = { type: 'bow', item: game.player.inventory[2], target: { x: 4, y: 8 }, enemy };
    game.pendingCharge = chargeDetails;
    cam.confirmPendingCharge(chargeDetails);
    expect(game.pendingCharge).toBeNull();
    expect(game.actionManager.performBowShot).toHaveBeenCalledWith(chargeDetails.item, 4, 8, enemy);
  });
});
