import { InteractionManager } from '../managers/InteractionManager.js';

describe('InteractionManager melee tap adjacency', () => {
  let mockGame;
  let mockPlayer;
  let im;

  beforeEach(() => {
    mockPlayer = {
      getPosition: jest.fn().mockReturnValue({ x: 1, y: 1 }),
      startAttackAnimation: jest.fn(),
      startBump: jest.fn(),
      setAction: jest.fn(),
      abilities: { has: jest.fn().mockReturnValue(false) },
      setAction: jest.fn(),
      x: 1,
      y: 1
    };

    const mockEnemyCardinal = { x: 2, y: 1, health: 10, startBump: jest.fn(), takeDamage: jest.fn(), id: 'e1', getPoints: jest.fn().mockReturnValue(5) };
    const mockEnemyDiagonal = { x: 2, y: 2, health: 10, startBump: jest.fn(), takeDamage: jest.fn(), id: 'e2', getPoints: jest.fn().mockReturnValue(5) };

    mockGame = {
      player: mockPlayer,
      enemies: [mockEnemyCardinal, mockEnemyDiagonal],
      grid: [],
      pendingCharge: null,
      justEnteredZone: false,
      startEnemyTurns: jest.fn(),
      updatePlayerPosition: jest.fn(),
      updatePlayerStats: jest.fn(),
      uiManager: { showOverlayMessage: jest.fn(), hideOverlayMessage: jest.fn(), isStatsPanelOpen: jest.fn().mockReturnValue(false) },
      soundManager: { playSound: jest.fn() },
      combatManager: { defeatEnemy: jest.fn().mockReturnValue({ defeated: true, consecutiveKills: 0 }) },
    };

    im = new InteractionManager(mockGame, null);
    // Prevent other handlers (NPCs/items/etc) from intercepting taps in the test
    im.interactionHandlers = [];
  });

  test('does not perform immediate melee attack when tapping diagonally adjacent enemy', () => {
    const handled = im.handleTap({ x: 2, y: 2 }); // diagonal from player (1,1)

    // The tap should be consumed (to prevent auto-pathing) but should NOT trigger attack animation or defeatEnemy
    expect(mockPlayer.startAttackAnimation).not.toHaveBeenCalled();
    expect(mockGame.combatManager.defeatEnemy).not.toHaveBeenCalled();
    // The function returns true because the tap was processed (enemy present but not adjacent)
    expect(handled).toBe(true);
  });

  test('performs immediate melee attack when tapping cardinally adjacent enemy', () => {
    const handled = im.handleTap({ x: 2, y: 1 }); // cardinal adjacent to player (1,1)

    expect(mockPlayer.startAttackAnimation).toHaveBeenCalled();
    expect(mockGame.combatManager.defeatEnemy).toHaveBeenCalled();
    expect(handled).toBe(true);
  });
});
