import { InteractionManager } from '@managers/InteractionManager.js';

describe('InteractionManager melee tap adjacency', () => {
  let mockGame;
  let mockPlayer;
  let im;

  beforeEach(() => {
    mockPlayer = {
      getPosition: jest.fn().mockReturnValue({ x: 1, y: 1 }),
      getPositionObject: jest.fn().mockReturnValue({
        x: 1,
        y: 1,
        equals: jest.fn(),
        toObject: jest.fn().mockReturnValue({ x: 1, y: 1 }),
        getTile: jest.fn()
      }),
      startAttackAnimation: jest.fn(),
      startBump: jest.fn(),
      startBackflip: jest.fn(),
      setAction: jest.fn(),
      abilities: { has: jest.fn().mockReturnValue(false) },
      x: 1,
      y: 1
    };

    const mockEnemyCardinal = { x: 2, y: 1, health: 10, startBump: jest.fn(), takeDamage: jest.fn(), id: 'e1', getPoints: jest.fn().mockReturnValue(5) };
    const mockEnemyDiagonal = { x: 2, y: 2, health: 10, startBump: jest.fn(), takeDamage: jest.fn(), id: 'e2', getPoints: jest.fn().mockReturnValue(5) };

    // Create mock facades
    const mockInteractionFacade = {
      npcManager: {},
      environmentManager: {},
      inputManager: {}
    };

    const mockCombatFacade = {
      combatActionManager: {},
      bombManager: {}
    };

    const mockWorldFacade = {
      terrainManager: {},
      zoneManager: {},
      itemPickupManager: {}
    };

    mockGame = {
      player: mockPlayer,
      enemies: [mockEnemyCardinal, mockEnemyDiagonal],
      enemyCollection: {
        findAt: jest.fn((x, y) => {
          if (x === 2 && y === 1) return mockEnemyCardinal;
          if (x === 2 && y === 2) return mockEnemyDiagonal;
          return null;
        })
      },
      playerFacade: {
        hasAbility: jest.fn().mockReturnValue(false),
        findInInventory: jest.fn().mockReturnValue(null)
      },
      transientGameState: {
        hasPendingCharge: jest.fn().mockReturnValue(false)
      },
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

    im = new InteractionManager(mockGame, mockInteractionFacade, mockCombatFacade, mockWorldFacade);
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
