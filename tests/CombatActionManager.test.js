import { CombatActionManager } from '../managers/CombatActionManager.js';
import { TILE_TYPES } from '../core/constants.js';

describe('CombatActionManager', () => {
  let game;
  let cam;

  beforeEach(() => {
    const mockPlayer = {
      x: 4,
      y: 4,
      inventory: [
        { type: 'bishop_spear', uses: 1, disabled: false },
        { type: 'horse_icon', uses: 1, disabled: false },
        { type: 'bow', uses: 1, disabled: false }
      ],
      isWalkable: jest.fn().mockReturnValue(true)
    };

    game = {
      player: mockPlayer,
      enemies: [ { x: 7, y: 7, id: 'e1' } ],
      grid: Array(9).fill().map(() => Array(9).fill(TILE_TYPES.FLOOR)),
      pendingCharge: null,
      hideOverlayMessage: jest.fn(),
      performBishopSpearCharge: jest.fn(),
      performHorseIconCharge: jest.fn(),
      actionManager: { performBowShot: jest.fn() }
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
