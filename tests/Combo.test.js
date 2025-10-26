import { CombatManager } from '../managers/CombatManager.js';
import { BombManager } from '../managers/BombManager.js';
import { EnemyDefeatFlow } from '../managers/EnemyDefeatFlow.js';
import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';

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

    // Use real instances for proper combo behavior
    const mockBombManager = new BombManager(mockGame);
    const mockDefeatFlow = new EnemyDefeatFlow(mockGame);
    combatManager = new CombatManager(mockGame, new Set(), mockBombManager, mockDefeatFlow);
  });

  test('defeatEnemy awards combo bonus when previous action was an attack:kill', () => {
    const comboEvents = [];
    const animationEvents = [];

    // Listen for events
    eventBus.on(EventTypes.COMBO_ACHIEVED, (data) => comboEvents.push(data));
    eventBus.on(EventTypes.ANIMATION_REQUESTED, (data) => animationEvents.push(data));

    // Simulate player had just performed an attack that resulted in a kill
    mockPlayer.lastActionType = 'attack';
    mockPlayer.lastActionResult = 'kill';
    mockPlayer.consecutiveKills = 1; // next kill should make it 2

    const res = combatManager.defeatEnemy(mockEnemy, 'player');

    expect(res.defeated).toBe(true);
    expect(res.consecutiveKills).toBe(2);

    // Verify COMBO_ACHIEVED event was emitted
    expect(comboEvents.length).toBeGreaterThan(0);
    expect(comboEvents[0].comboCount).toBe(2);
    expect(comboEvents[0].x).toBe(mockEnemy.x);
    expect(comboEvents[0].y).toBe(mockEnemy.y);

    // Verify animation events were emitted for point animations
    const pointAnimations = animationEvents.filter(e => e.type === 'point');
    expect(pointAnimations.length).toBeGreaterThan(0);

    // Player should receive both base points and bonus
    expect(mockPlayer.addPoints).toHaveBeenCalledWith(1);
    expect(mockPlayer.addPoints).toHaveBeenCalledWith(2);

    // Clean up
    eventBus.clear(EventTypes.COMBO_ACHIEVED);
    eventBus.clear(EventTypes.ANIMATION_REQUESTED);
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
