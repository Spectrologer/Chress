import { InputManager } from '@managers/InputManager';
import { TILE_TYPES, GRID_SIZE, INPUT_CONSTANTS } from '@core/constants/index';

describe('InputManager', () => {
  let inputManager;
  let mockGame;
  let mockPlayer;
  let mockInteractionManager;

  beforeEach(() => {
    mockPlayer = {
      getPosition: jest.fn().mockReturnValue({ x: 1, y: 1 }),
      getPositionObject: jest.fn().mockReturnValue({ x: 2, y: 1 }),
      isDead: jest.fn().mockReturnValue(false),
      isWalkable: jest.fn().mockReturnValue(true),
      move: jest.fn(),
      startAttackAnimation: jest.fn(),
      startBump: jest.fn(),
      takeDamage: jest.fn(),
      setPosition: jest.fn(),
      setInteractOnReach: jest.fn(),
      clearInteractOnReach: jest.fn(),
      interactOnReach: null,
      getCurrentZone: jest.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
      addPoints: jest.fn(),
      x: 2,
      y: 1,
      stats: {
        verbosePathAnimations: true
      }
    };

    mockInteractionManager = {
      handleTap: jest.fn().mockReturnValue(false)
    };

    mockGame = {
      player: mockPlayer,
      interactionManager: mockInteractionManager,
      canvas: { getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0, width: 360, height: 360 }) },
      grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
      gridManager: {
        getTile: jest.fn((x, y) => {
          if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return null;
          }
          return mockGame.grid[y][x];
        }),
        setTile: jest.fn()
      },
      enemies: [],
      pendingCharge: null,
      bombPlacementMode: false,
      bombPlacementPositions: [],
      defeatedEnemies: new Set(),
      zones: new Map(),
      displayingMessageForSign: null,
      justEnteredZone: false,
      isPlayerTurn: true,
      hideOverlayMessage: jest.fn(),
      transitionToZone: jest.fn(),
      handleEnemyMovements: jest.fn(),
      checkCollisions: jest.fn(),
      checkItemPickup: jest.fn(),
      updatePlayerPosition: jest.fn(),
      updatePlayerStats: jest.fn(),
      startEnemyTurns: jest.fn(),
      incrementBombActions: jest.fn(),
      combatManager: {
        addPointAnimation: jest.fn(),
        handlePlayerAttack: jest.fn().mockImplementation((enemy, playerPos) => {
          // Mock the behavior of handlePlayerAttack
          mockPlayer.startAttackAnimation();
          enemy.takeDamage(999);
          mockGame.combatManager.addPointAnimation(enemy.x, enemy.y, enemy.getPoints());
          mockPlayer.addPoints(enemy.getPoints());
          mockGame.defeatedEnemies.add(enemy.id);
          mockGame.enemies = mockGame.enemies.filter(e => e !== enemy);
        }),
        defeatEnemy: jest.fn().mockImplementation((enemy) => {
          enemy.takeDamage(999);
          mockGame.combatManager.addPointAnimation(enemy.x, enemy.y, enemy.getPoints());
          mockPlayer.addPoints(enemy.getPoints());
          mockGame.defeatedEnemies.add(enemy.id);
          mockGame.enemies = [];
        })
      },
      uiManager: {
        isStatsPanelOpen: jest.fn().mockReturnValue(false),
        hideStatsPanel: jest.fn(),
        showStatsPanel: jest.fn(),
        updatePlayerStats: jest.fn()
      },
      consentManager: {
        forceShowConsentBanner: jest.fn()
      },
      turnManager: {
        handleTurnCompletion: jest.fn().mockImplementation(() => {
          // Start enemy turns if not just entered zone
          const shouldStartEnemyTurns = !mockGame.justEnteredZone;
          // Reset justEnteredZone flag
          mockGame.justEnteredZone = false;

          if (shouldStartEnemyTurns) {
            mockGame.startEnemyTurns();
          }
        })
      },
      animationScheduler: {
        createSequence: jest.fn(() => {
          let sequence = {
            actions: [],
            loop: function() { return this; },
            then: function(callback) {
              this.actions.push({ type: 'then', callback });
              return this;
            },
            wait: function(delay) {
              this.actions.push({ type: 'wait', delay });
              return this;
            },
            start: function() {
              this.executeNext(0);
            },
            executeNext: function(index) {
              if (index >= this.actions.length) return;

              const action = this.actions[index];
              if (action.type === 'wait') {
                setTimeout(() => {
                  this.executeNext(index + 1);
                }, action.delay);
              } else if (action.type === 'then') {
                action.callback();
                this.executeNext(index + 1);
              }
            }
          };
          return sequence;
        })
      }
    };

    inputManager = new InputManager(mockGame);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear any timers
    if (inputManager.pathExecutionTimer) {
      clearTimeout(inputManager.pathExecutionTimer);
    }
  });

  describe('convertScreenToGrid', () => {
    test('converts screen coordinates to grid coordinates', () => {
      mockGame.canvas.width = 640;  // 10 tiles * 64px per tile = 640px
      mockGame.canvas.height = 640;
      mockGame.canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 640,  // Canvas displayed at full size
        height: 640
      });

      const result = inputManager.convertScreenToGrid(64, 64); // Center of first tile (0,0) to tile center

      expect(result).toEqual({ x: 1, y: 1 });
    });
  });

  describe('findPath', () => {
    test('returns empty path when at target', () => {
      const path = inputManager.findPath(2, 2, 2, 2);

      expect(path).toEqual([]);
    });

    test('finds path to adjacent tile', () => {
      const path = inputManager.findPath(1, 1, 2, 1);

      expect(path).toEqual(['arrowright']);
    });

    test('returns null for unwalkable target', () => {
      mockPlayer.isWalkable.mockReturnValue(false);

      const path = inputManager.findPath(1, 1, 3, 3);

      expect(path).toBeNull();
    });

    test('returns null for out of bounds target', () => {
      const path = inputManager.findPath(1, 1, 10, 10);

      expect(path).toBeNull();
    });

    test('avoids signs during pathfinding', () => {
      mockGame.grid[2][2] = TILE_TYPES.SIGN;

      const path = inputManager.findPath(1, 1, 2, 2);

      expect(path).toBeNull();
    });
  });

  describe('handleTap', () => {
    test('ignores taps when path is executing', () => {
      inputManager.isExecutingPath = true;
      const executePathSpy = jest.spyOn(inputManager, 'executePath');

      inputManager.handleTap(160, 160);

      expect(executePathSpy).not.toHaveBeenCalled();
    });

    test('finds and executes path to valid target', () => {
      mockGame.canvas.width = 640;
      mockGame.canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 640,
        height: 640
      });
      const executePathSpy = jest.spyOn(inputManager, 'executePath');

      // Grid position (2,2) - center of tile would be around pixel 2*64 + 32 = 160
      inputManager.handleTap(160, 160);

      // Should calculate to grid (2,2) after conversion
    });

    test('handles exit double tap', () => {
      mockGame.grid[2][2] = TILE_TYPES.EXIT;
      mockPlayer.getPosition = jest.fn().mockReturnValue({ x: 2, y: 2 });
      mockGame.canvas.width = 640;
      mockGame.canvas.height = 640;
      mockGame.canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0, top: 0, width: 640, height: 640
      });
      const performExitTapSpy = jest.spyOn(inputManager.controller.coordinator, 'performExitTap');

      // First tap (when player is at the exit) - center of tile 2: 160
      inputManager.handleTap(160, 160);
      // Second tap (double tap on same exit)
      inputManager.handleTap(160, 160);

      expect(performExitTapSpy).toHaveBeenCalledWith(2, 2);
    });

    test('handles port double tap', () => {
      mockGame.grid[2][2] = TILE_TYPES.PORT;
      mockPlayer.getPosition = jest.fn().mockReturnValue({ x: 2, y: 2 });
      mockGame.canvas.width = 640;
      mockGame.canvas.height = 640;
      mockGame.canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0, top: 0, width: 640, height: 640
      });

      if (!mockGame.interactionManager.zoneManager) {
        mockGame.interactionManager.zoneManager = { handlePortTransition: jest.fn() };
      }
      const handlePortSpy = jest.spyOn(mockGame.interactionManager.zoneManager, 'handlePortTransition');

      // First tap (when player is at the port)
      inputManager.handleTap(160, 160);
      // Second tap (double tap on same port)
      inputManager.handleTap(160, 160);

      expect(handlePortSpy).toHaveBeenCalled();
    });
  });

  describe('handleExitTap', () => {
    test('triggers zone transition based on exit position', () => {
      mockGame.grid[1][0] = TILE_TYPES.EXIT; // Left edge
      const handleKeyPressSpy = jest.spyOn(inputManager.controller.coordinator, 'handleKeyPress');

      inputManager.handleExitTap(0, 1);

  expect(handleKeyPressSpy).toHaveBeenCalledWith(expect.objectContaining({ key: 'arrowleft', preventDefault: expect.any(Function) }));
    });
  });

  describe('handleKeyPress', () => {
    test('moves player in arrow directions', () => {
      inputManager.handleKeyPress({ key: 'arrowright', preventDefault: jest.fn() });

      expect(mockPlayer.move).toHaveBeenCalledWith(2, 1, mockGame.grid, expect.any(Function));
      expect(mockGame.startEnemyTurns).toHaveBeenCalled();
    });

    test('handles WASD movement', () => {
      inputManager.handleKeyPress({ key: 'd', preventDefault: jest.fn() });

      expect(mockPlayer.move).toHaveBeenCalledWith(2, 1, mockGame.grid, expect.any(Function));
    });

    test('handles enemy attack on movement', () => {
      const mockEnemy = { x: 2, y: 1, takeDamage: jest.fn(), startBump: jest.fn(), id: 'enemy1', getPoints: jest.fn().mockReturnValue(10) };
      mockGame.enemies.push(mockEnemy);

      inputManager.handleKeyPress({ key: 'arrowright', preventDefault: jest.fn() });

      expect(mockPlayer.startAttackAnimation).toHaveBeenCalled();
      expect(mockEnemy.takeDamage).toHaveBeenCalledWith(999);
      expect(mockGame.enemies).toHaveLength(0);
    });

    test('skips enemy movement when just entered zone', () => {
      mockGame.justEnteredZone = true;

      inputManager.handleKeyPress({ key: 'arrowright', preventDefault: jest.fn() });

      expect(mockGame.startEnemyTurns).not.toHaveBeenCalled();
      expect(mockGame.justEnteredZone).toBe(false);
    });

    test('hides overlay messages on movement', () => {
      mockGame.pendingCharge = { type: 'spear' };

      inputManager.handleKeyPress({ key: 'arrowright', preventDefault: jest.fn() });

      expect(mockGame.hideOverlayMessage).toHaveBeenCalled();
      expect(mockGame.pendingCharge).toBeNull();
    });

    test('ignores input when player is dead', () => {
      mockPlayer.isDead.mockReturnValue(true);

      inputManager.handleKeyPress({ key: 'arrowright', preventDefault: jest.fn() });

      expect(mockPlayer.move).not.toHaveBeenCalled();
    });
  });

  describe('executePath', () => {
    test('executes path with timing delays', () => {
      jest.useFakeTimers();
      const handleKeyPressSpy = jest.spyOn(inputManager.controller.coordinator, 'handleKeyPress');

      inputManager.executePath(['arrowright', 'arrowdown']);

      expect(inputManager.isExecutingPath).toBe(true);
  expect(handleKeyPressSpy).toHaveBeenCalledWith(expect.objectContaining({ key: 'arrowright', preventDefault: expect.any(Function) }));

      jest.advanceTimersByTime(150);
  expect(handleKeyPressSpy).toHaveBeenCalledWith(expect.objectContaining({ key: 'arrowright', preventDefault: expect.any(Function) }));

      jest.advanceTimersByTime(150);
      // Note: The path may still be executing due to animation timing, so we check after enough time
      jest.advanceTimersByTime(150);
      expect(inputManager.isExecutingPath).toBe(false);
    });

    test('cancels previous path when new path starts', () => {
      jest.useFakeTimers();

      inputManager.executePath(['arrowright']);
      expect(inputManager.isExecutingPath).toBe(true);

      inputManager.executePath(['arrowup']);
      expect(inputManager.isExecutingPath).toBe(true);
    });

    test('works with Promise-based AnimationSequence and cleans up sequence reference', async () => {
      jest.useFakeTimers();

      // Provide a Promise-returning sequence implementation to mimic real AnimationScheduler
      const actions = [];
      const seq = {
        id: 'promise-seq',
        actions: [],
        then(cb) { this.actions.push({ type: 'then', cb }); return this; },
        wait(ms) { this.actions.push({ type: 'wait', ms }); return this; },
        start() {
          return new Promise((resolve) => {
            const run = (i) => {
              if (i >= this.actions.length) { resolve(); return; }
              const a = this.actions[i];
              if (a.type === 'then') {
                a.cb();
                run(i + 1);
              } else if (a.type === 'wait') {
                setTimeout(() => run(i + 1), a.ms);
              }
            };
            run(0);
          });
        }
      };

      mockGame.animationScheduler.createSequence = jest.fn(() => seq);
      mockGame.animationScheduler.cancelSequence = jest.fn((id) => {
        // no-op for this test
      });

      const handleKeyPressSpy = jest.spyOn(inputManager.controller.coordinator, 'handleKeyPress');

      inputManager.executePath(['arrowright', 'arrowdown']);

      expect(inputManager.isExecutingPath).toBe(true);
      // First step's then() should have been invoked synchronously
  expect(handleKeyPressSpy).toHaveBeenCalledWith(expect.objectContaining({ key: 'arrowright', preventDefault: expect.any(Function) }));

      // Advance timers by one LEGACY_PATH_DELAY to allow the next step to run
      jest.advanceTimersByTime(INPUT_CONSTANTS.LEGACY_PATH_DELAY + 10);

      // Second step should run
  expect(handleKeyPressSpy).toHaveBeenCalledWith(expect.objectContaining({ key: 'arrowdown', preventDefault: expect.any(Function) }));

      // Advance timers to complete sequence
      jest.advanceTimersByTime(INPUT_CONSTANTS.LEGACY_PATH_DELAY + 50);

      // Wait for any pending promise microtasks
      await Promise.resolve();

      expect(inputManager.isExecutingPath).toBe(false);
      expect(inputManager.currentPathSequence).toBeNull();
    });

    test('cancelPathExecution cancels active AnimationSequence', () => {
      jest.useFakeTimers();

      const seq = {
        id: 'to-cancel',
        actions: [],
        then(cb) { this.actions.push({ type: 'then', cb }); return this; },
        wait(ms) { this.actions.push({ type: 'wait', ms }); return this; },
        start() {
          // Non-promise start (legacy)
          this.executeNext = () => {
            for (const a of this.actions) {
              if (a.type === 'then') a.cb();
            }
          };
          this.executeNext();
        }
      };

      mockGame.animationScheduler.createSequence = jest.fn(() => seq);
      mockGame.animationScheduler.cancelSequence = jest.fn();

      inputManager.executePath(['arrowright']);

      // Sequence reference should be set
      expect(inputManager.currentPathSequence).toBe(seq);

      inputManager.cancelPathExecution();

      expect(mockGame.animationScheduler.cancelSequence).toHaveBeenCalledWith(seq.id);
      expect(inputManager.currentPathSequence).toBeNull();
      expect(inputManager.currentPathSequenceFallback).toBeNull();
    });
  });
});
