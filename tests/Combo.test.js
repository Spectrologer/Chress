import { CombatManager } from '../managers/CombatManager.js';
import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';

describe('Combat combo bonuses', () => {
  let combatManager;
  let mockGame;
  let mockPlayer;
  let mockEnemy;

  beforeEach(() => {
    mockPlayer = {
      x: 2,
      y: 2,
      getPosition: jest.fn().mockReturnValue({ x: 2, y: 2 }),
      takeDamage: jest.fn(),
      startBump: jest.fn(),
      getCurrentZone: jest.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
      addPoints: jest.fn()
    };

    mockEnemy = {
      x: 4,
      y: 4,
      id: 'e_combo',
      health: 1,
      takeDamage: jest.fn(),
      getPoints: jest.fn().mockReturnValue(1)
    };

    const mockAnimationManager = {
      addPointAnimation: jest.fn(),
      addMultiplierAnimation: jest.fn()
    };

    const mockSoundManager = { playSound: jest.fn() };
    const mockUIManager = { updatePlayerStats: jest.fn() };

    mockGame = {
      player: mockPlayer,
      enemies: [mockEnemy],
      grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
      soundManager: mockSoundManager,
      uiManager: mockUIManager,
      animationManager: mockAnimationManager,
      zones: new Map(),
      defeatedEnemies: new Set()
    };

    combatManager = new CombatManager(mockGame, new Set());
  });

  test('defeatEnemy awards combo bonus when previous action was an attack:kill', () => {
    // Simulate player had just performed an attack that resulted in a kill
    mockPlayer.lastActionType = 'attack';
    mockPlayer.lastActionResult = 'kill';
    mockPlayer.consecutiveKills = 1; // next kill should make it 2

    const res = combatManager.defeatEnemy(mockEnemy, 'player');

    expect(res.defeated).toBe(true);
    expect(res.consecutiveKills).toBe(2);

    // Multiplier animation should be created for x2
    expect(mockGame.animationManager.addMultiplierAnimation).toHaveBeenCalledWith(mockEnemy.x, mockEnemy.y, 2);

    // Point animations should have been added for base points and bonus
    expect(mockGame.animationManager.addPointAnimation).toHaveBeenCalledWith(mockEnemy.x, mockEnemy.y, 1);
    expect(mockGame.animationManager.addPointAnimation).toHaveBeenCalledWith(mockEnemy.x, mockEnemy.y, 2);

    // Player should receive both base points and bonus
    expect(mockPlayer.addPoints).toHaveBeenCalledWith(1);
    expect(mockPlayer.addPoints).toHaveBeenCalledWith(2);
  });

  test('defeatEnemy resets streak for non-player initiators', () => {
    mockPlayer.consecutiveKills = 3;
    mockPlayer.lastActionResult = 'kill';

    const res = combatManager.defeatEnemy(mockEnemy, 'bomb');

    expect(res.defeated).toBe(true);
    expect(res.consecutiveKills).toBe(0);
    expect(mockPlayer.consecutiveKills).toBe(0);
  });
});
