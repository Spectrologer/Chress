import { InteractionManager } from '@managers/InteractionManager';

describe('InteractionManager melee tap adjacency', () => {
  let mockGame;
  let mockPlayer;
  let im;

  beforeEach(() => {
    mockPlayer = {
      getPosition: vi.fn().mockReturnValue({ x: 1, y: 1 }),
      getPositionObject: vi.fn().mockReturnValue({
        x: 1,
        y: 1,
        equals: vi.fn(),
        toObject: vi.fn().mockReturnValue({ x: 1, y: 1 }),
        getTile: vi.fn()
      }),
      startAttackAnimation: vi.fn(),
      startBump: vi.fn(),
      startBackflip: vi.fn(),
      setAction: vi.fn(),
      abilities: { has: vi.fn().mockReturnValue(false) },
      x: 1,
      y: 1
    };

    const mockEnemyCardinal = { x: 2, y: 1, health: 10, startBump: vi.fn(), takeDamage: vi.fn(), id: 'e1', getPoints: vi.fn().mockReturnValue(5) };
    const mockEnemyDiagonal = { x: 2, y: 2, health: 10, startBump: vi.fn(), takeDamage: vi.fn(), id: 'e2', getPoints: vi.fn().mockReturnValue(5) };

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
        findAt: vi.fn((x, y) => {
          if (x === 2 && y === 1) return mockEnemyCardinal;
          if (x === 2 && y === 2) return mockEnemyDiagonal;
          return null;
        })
      },
      playerFacade: {
        hasAbility: vi.fn().mockReturnValue(false),
        findInInventory: vi.fn().mockReturnValue(null),
        getPositionObject: mockPlayer.getPositionObject,
        startAttackAnimation: mockPlayer.startAttackAnimation,
        setAction: mockPlayer.setAction,
        startBump: mockPlayer.startBump
      },
      transientGameState: {
        hasPendingCharge: vi.fn().mockReturnValue(false)
      },
      grid: [],
      pendingCharge: null,
      justEnteredZone: false,
      startEnemyTurns: vi.fn(),
      updatePlayerPosition: vi.fn(),
      updatePlayerStats: vi.fn(),
      uiManager: { showOverlayMessage: vi.fn(), hideOverlayMessage: vi.fn(), isStatsPanelOpen: vi.fn().mockReturnValue(false) },
      soundManager: { playSound: vi.fn() },
      combatManager: { defeatEnemy: vi.fn().mockReturnValue({ defeated: true, consecutiveKills: 0 }) },
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
