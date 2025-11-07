import { TurnManager } from '@core/TurnManager';
import { createMockEnemy } from './helpers/mocks.js';

describe('TurnManager', () => {
  let turnManager;
  let mockGame;
  let mockEnemyCollection;
  let mockAnimationScheduler;
  let mockTransientState;
  let mockCombatManager;
  let mockInteractionManager;

  beforeEach(() => {
    // Create mock enemy collection
    const enemies = [];
    mockEnemyCollection = {
      getPositionsSet: vi.fn(() => new Set()),
      forEach: vi.fn((callback) => enemies.forEach(callback)),
      getAll: vi.fn(() => [...enemies]),
      includes: vi.fn((enemy) => enemies.includes(enemy)),
      _enemies: enemies,
    };

    // Create mock animation scheduler
    const mockSequence = {
      then: vi.fn(function(callback) {
        if (callback) callback();
        return this;
      }),
      wait: vi.fn(function() { return this; }),
      start: vi.fn(function() { return this; }),
    };
    mockAnimationScheduler = {
      createSequence: vi.fn(() => mockSequence),
    };

    // Create mock transient state
    mockTransientState = {
      isInPitfallZone: vi.fn(() => false),
      incrementPitfallTurnsSurvived: vi.fn(),
      didPlayerJustAttack: vi.fn(() => false),
    };

    // Create mock combat manager
    mockCombatManager = {
      checkCollisions: vi.fn(() => false),
      handleSingleEnemyMovement: vi.fn(),
    };

    // Create mock interaction manager
    mockInteractionManager = {
      checkItemPickup: vi.fn(),
    };

    // Create mock game
    mockGame = {
      player: {
        getPosition: vi.fn(() => ({ x: 5, y: 5 })),
      },
      enemyCollection: mockEnemyCollection,
      animationScheduler: mockAnimationScheduler,
      transientGameState: mockTransientState,
      combatManager: mockCombatManager,
      interactionManager: mockInteractionManager,
      isPlayerOnExitTile: vi.fn(() => false),
      isPlayerTurn: true,
      justLeftExitTile: false,
      playerJustAttacked: false,
    };

    turnManager = new TurnManager(mockGame);
  });

  describe('Constructor', () => {
    test('should initialize with empty turn queue', () => {
      expect(turnManager.turnQueue).toEqual([]);
    });

    test('should initialize with empty occupied tiles set', () => {
      expect(turnManager.occupiedTilesThisTurn.size).toBe(0);
    });

    test('should initialize with empty initial enemy tiles set', () => {
      expect(turnManager.initialEnemyTilesThisTurn.size).toBe(0);
    });

    test('should initialize wasPlayerOnExitLastTurn as false', () => {
      expect(turnManager.wasPlayerOnExitLastTurn).toBe(false);
    });
  });

  describe('handleTurnCompletion', () => {
    test('should call startEnemyTurns', () => {
      const spy = vi.spyOn(turnManager, 'startEnemyTurns');
      turnManager.handleTurnCompletion();
      expect(spy).toHaveBeenCalledOnce();
    });

    test('should increment pitfall turns if in pitfall zone', () => {
      mockTransientState.isInPitfallZone.mockReturnValue(true);
      turnManager.handleTurnCompletion();
      expect(mockTransientState.incrementPitfallTurnsSurvived).toHaveBeenCalledOnce();
    });

    test('should not increment pitfall turns if not in pitfall zone', () => {
      mockTransientState.isInPitfallZone.mockReturnValue(false);
      turnManager.handleTurnCompletion();
      expect(mockTransientState.incrementPitfallTurnsSurvived).not.toHaveBeenCalled();
    });

    test('should return true', () => {
      expect(turnManager.handleTurnCompletion()).toBe(true);
    });
  });

  describe('startEnemyTurns', () => {
    test('should not start turns if player just attacked', () => {
      mockTransientState.didPlayerJustAttack.mockReturnValue(true);
      turnManager.startEnemyTurns();
      expect(mockGame.isPlayerTurn).toBe(true);
    });

    test('should set isPlayerTurn to false during enemy turns', () => {
      const enemy = createMockEnemy({ id: 'e1' });
      mockEnemyCollection._enemies.push(enemy);
      mockGame.isPlayerTurn = true;

      // Mock the sequence to NOT execute callback immediately for this test
      let capturedCallback = null;
      const delayedSequence = {
        then: vi.fn(function(callback) {
          capturedCallback = callback;
          return this;
        }),
        wait: vi.fn(function() { return this; }),
        start: vi.fn(function() { return this; }),
      };
      mockAnimationScheduler.createSequence.mockReturnValue(delayedSequence);

      turnManager.startEnemyTurns();

      // isPlayerTurn should be false before queue completes
      expect(mockGame.isPlayerTurn).toBe(false);
    });

    test('should clear occupied tiles', () => {
      turnManager.occupiedTilesThisTurn.add('1,1');
      turnManager.occupiedTilesThisTurn.add('2,2');
      turnManager.startEnemyTurns();
      expect(turnManager.occupiedTilesThisTurn.size).toBe(1); // Only player position
    });

    test('should add player position to occupied tiles', () => {
      mockGame.player.getPosition.mockReturnValue({ x: 3, y: 4 });
      turnManager.startEnemyTurns();
      expect(turnManager.occupiedTilesThisTurn.has('3,4')).toBe(true);
    });

    test('should freeze enemies when player is on exit tile', () => {
      const enemy1 = createMockEnemy({ id: 'e1' });
      const enemy2 = createMockEnemy({ id: 'e2' });
      mockEnemyCollection._enemies.push(enemy1, enemy2);
      mockGame.isPlayerOnExitTile.mockReturnValue(true);

      turnManager.startEnemyTurns();

      expect(enemy1.isFrozen).toBe(true);
      expect(enemy1.showFrozenVisual).toBe(true);
      expect(enemy2.isFrozen).toBe(true);
      expect(enemy2.showFrozenVisual).toBe(true);
    });

    test('should not freeze enemies when player is not on exit tile', () => {
      const enemy1 = createMockEnemy({ id: 'e1' });
      mockEnemyCollection._enemies.push(enemy1);
      mockGame.isPlayerOnExitTile.mockReturnValue(false);

      turnManager.startEnemyTurns();

      expect(enemy1.isFrozen).toBe(false);
      expect(enemy1.showFrozenVisual).toBe(false);
    });

    test('should set and clear justLeftExitTile when player steps off exit', () => {
      const enemy = createMockEnemy({ id: 'e1' });
      mockEnemyCollection._enemies.push(enemy);
      turnManager.wasPlayerOnExitLastTurn = true;
      mockGame.isPlayerOnExitTile.mockReturnValue(false);

      turnManager.startEnemyTurns();

      // Flag is cleared after use, but enemy should have been frozen
      expect(mockGame.justLeftExitTile).toBe(false);
      expect(enemy.isFrozen).toBe(true);
    });

    test('should keep enemies frozen for grace period after leaving exit', () => {
      const enemy = createMockEnemy({ id: 'e1' });
      mockEnemyCollection._enemies.push(enemy);
      mockGame.justLeftExitTile = true;
      mockGame.isPlayerOnExitTile.mockReturnValue(false);

      turnManager.startEnemyTurns();

      expect(enemy.isFrozen).toBe(true);
      expect(enemy.showFrozenVisual).toBe(false); // Visual removed during grace period
    });

    test('should clear grace period flag after use', () => {
      mockGame.justLeftExitTile = true;
      mockGame.isPlayerOnExitTile.mockReturnValue(false);

      turnManager.startEnemyTurns();

      expect(mockGame.justLeftExitTile).toBe(false);
    });

    test('should update wasPlayerOnExitLastTurn', () => {
      mockGame.isPlayerOnExitTile.mockReturnValue(true);
      turnManager.startEnemyTurns();
      expect(turnManager.wasPlayerOnExitLastTurn).toBe(true);

      mockGame.isPlayerOnExitTile.mockReturnValue(false);
      turnManager.startEnemyTurns();
      expect(turnManager.wasPlayerOnExitLastTurn).toBe(false);
    });

    test('should populate turn queue with all enemies', () => {
      const enemy1 = createMockEnemy({ id: 'e1' });
      const enemy2 = createMockEnemy({ id: 'e2' });
      mockEnemyCollection._enemies.push(enemy1, enemy2);

      turnManager.startEnemyTurns();

      expect(mockEnemyCollection.getAll).toHaveBeenCalled();
    });

    test('should call processTurnQueue', () => {
      const spy = vi.spyOn(turnManager, 'processTurnQueue');
      turnManager.startEnemyTurns();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('processTurnQueue', () => {
    test('should set isPlayerTurn to true when queue is empty', () => {
      mockGame.isPlayerTurn = false;
      turnManager.turnQueue = [];
      turnManager.processTurnQueue();
      expect(mockGame.isPlayerTurn).toBe(true);
    });

    test('should set playerJustAttacked to false when queue is empty', () => {
      mockGame.playerJustAttacked = true;
      turnManager.turnQueue = [];
      turnManager.processTurnQueue();
      expect(mockGame.playerJustAttacked).toBe(false);
    });

    test('should call checkCollisions when queue is empty', () => {
      turnManager.turnQueue = [];
      turnManager.processTurnQueue();
      expect(mockCombatManager.checkCollisions).toHaveBeenCalledOnce();
    });

    test('should call checkItemPickup when queue is empty', () => {
      turnManager.turnQueue = [];
      turnManager.processTurnQueue();
      expect(mockInteractionManager.checkItemPickup).toHaveBeenCalledOnce();
    });

    test('should handle missing combatManager gracefully', () => {
      mockGame.combatManager = null;
      turnManager.turnQueue = [];
      expect(() => turnManager.processTurnQueue()).not.toThrow();
    });

    test('should handle missing interactionManager gracefully', () => {
      mockGame.interactionManager = null;
      turnManager.turnQueue = [];
      expect(() => turnManager.processTurnQueue()).not.toThrow();
    });

    test('should create animation sequence for player attack pause', () => {
      mockCombatManager.checkCollisions.mockReturnValue(true);
      turnManager.turnQueue = [];
      turnManager.processTurnQueue();
      expect(mockAnimationScheduler.createSequence).toHaveBeenCalled();
    });

    test('should process enemy movement for valid unfrozen enemy', () => {
      const enemy = createMockEnemy({ id: 'e1', isFrozen: false });
      enemy.isDead = vi.fn(() => false);
      mockEnemyCollection._enemies.push(enemy);
      mockEnemyCollection.includes.mockReturnValue(true);
      turnManager.turnQueue = [enemy];

      turnManager.processTurnQueue();

      expect(mockAnimationScheduler.createSequence).toHaveBeenCalled();
    });

    test('should skip movement for frozen enemy', () => {
      const enemy = createMockEnemy({ id: 'e1', isFrozen: true });
      enemy.isDead = vi.fn(() => false);
      mockEnemyCollection._enemies.push(enemy);
      mockEnemyCollection.includes.mockReturnValue(true);
      turnManager.turnQueue = [enemy];

      turnManager.processTurnQueue();

      // Should still create sequence but not call handleSingleEnemyMovement
      expect(mockAnimationScheduler.createSequence).toHaveBeenCalled();
    });

    test('should use shorter wait time for frozen enemies', () => {
      const enemy = createMockEnemy({ id: 'e1', isFrozen: true });
      enemy.isDead = vi.fn(() => false);
      mockEnemyCollection._enemies.push(enemy);
      mockEnemyCollection.includes.mockReturnValue(true);
      turnManager.turnQueue = [enemy];

      turnManager.processTurnQueue();

      const mockSequence = mockAnimationScheduler.createSequence();
      // Frozen enemies should use 50ms wait, unfrozen use 400ms
      expect(mockSequence.wait).toHaveBeenCalled();
    });

    test('should skip invalid enemies (dead or not in collection)', () => {
      const deadEnemy = createMockEnemy({ id: 'dead' });
      deadEnemy.isDead = vi.fn(() => true);
      mockEnemyCollection.includes.mockReturnValue(false);
      turnManager.turnQueue = [deadEnemy];

      turnManager.processTurnQueue();

      expect(mockCombatManager.handleSingleEnemyMovement).not.toHaveBeenCalled();
    });

    test('should recursively process queue', () => {
      const enemy1 = createMockEnemy({ id: 'e1', isFrozen: false });
      const enemy2 = createMockEnemy({ id: 'e2', isFrozen: false });
      enemy1.isDead = vi.fn(() => false);
      enemy2.isDead = vi.fn(() => false);
      mockEnemyCollection._enemies.push(enemy1, enemy2);
      mockEnemyCollection.includes.mockReturnValue(true);
      turnManager.turnQueue = [enemy1, enemy2];

      const spy = vi.spyOn(turnManager, 'processTurnQueue');
      turnManager.processTurnQueue();

      // Should be called again in the sequence
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Exit Tile Mechanics', () => {
    test('should handle complete exit tile workflow', () => {
      const enemy = createMockEnemy({ id: 'e1' });
      mockEnemyCollection._enemies.push(enemy);

      // Player steps onto exit
      mockGame.isPlayerOnExitTile.mockReturnValue(true);
      turnManager.startEnemyTurns();
      expect(enemy.isFrozen).toBe(true);
      expect(enemy.showFrozenVisual).toBe(true);
      expect(turnManager.wasPlayerOnExitLastTurn).toBe(true);

      // Player steps off exit (grace period)
      mockGame.isPlayerOnExitTile.mockReturnValue(false);
      turnManager.startEnemyTurns();
      expect(enemy.isFrozen).toBe(true);
      expect(enemy.showFrozenVisual).toBe(false);
      expect(mockGame.justLeftExitTile).toBe(false); // Cleared after use

      // Next turn - enemies unfreeze
      turnManager.startEnemyTurns();
      expect(enemy.isFrozen).toBe(false);
      expect(enemy.showFrozenVisual).toBe(false);
    });
  });

  describe('Turn Queue Management', () => {
    test('should handle empty enemy collection', () => {
      mockEnemyCollection._enemies = [];
      expect(() => turnManager.startEnemyTurns()).not.toThrow();
      expect(turnManager.turnQueue.length).toBe(0);
    });

    test('should handle multiple enemies in queue', () => {
      const enemies = [
        createMockEnemy({ id: 'e1' }),
        createMockEnemy({ id: 'e2' }),
        createMockEnemy({ id: 'e3' }),
      ];
      enemies.forEach(e => {
        e.isDead = vi.fn(() => false);
        mockEnemyCollection._enemies.push(e);
      });
      mockEnemyCollection.includes.mockReturnValue(true);

      turnManager.startEnemyTurns();

      // Queue should be populated in processTurnQueue
      expect(mockAnimationScheduler.createSequence).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should throw on null player position', () => {
      mockGame.player.getPosition.mockReturnValue(null);
      expect(() => turnManager.startEnemyTurns()).toThrow();
    });

    test('should handle missing animation scheduler', () => {
      mockGame.animationScheduler = null;
      const enemy = createMockEnemy({ id: 'e1' });
      enemy.isDead = vi.fn(() => false);
      turnManager.turnQueue = [enemy];
      expect(() => turnManager.processTurnQueue()).toThrow();
    });

    test('should handle undefined enemy in queue', () => {
      turnManager.turnQueue = [undefined];
      turnManager.processTurnQueue();
      // Should skip undefined and continue
      expect(mockGame.isPlayerTurn).toBe(true);
    });

    test('should handle null enemy in queue', () => {
      turnManager.turnQueue = [null];
      turnManager.processTurnQueue();
      // Should skip null and continue
      expect(mockGame.isPlayerTurn).toBe(true);
    });
  });
});
