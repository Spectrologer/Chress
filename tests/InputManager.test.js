import { InputManager } from '../InputManager.js';
import { TILE_TYPES, GRID_SIZE } from '../constants.js';

describe('InputManager', () => {
  let inputManager;
  let mockGame;
  let mockPlayer;
  let mockInteractionManager;

  beforeEach(() => {
    mockPlayer = {
      getPosition: jest.fn().mockReturnValue({ x: 1, y: 1 }),
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
      y: 1
    };

    mockInteractionManager = {
      handleTap: jest.fn().mockReturnValue(false)
    };

    mockGame = {
      player: mockPlayer,
      interactionManager: mockInteractionManager,
      canvas: { getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0, width: 360, height: 360 }) },
      grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
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
      combatManager: {
        addPointAnimation: jest.fn()
      },
      uiManager: {
        isStatsPanelOpen: jest.fn().mockReturnValue(false),
        hideStatsPanel: jest.fn(),
        showStatsPanel: jest.fn(),
        updatePlayerStats: jest.fn()
      },
      consentManager: {
        forceShowConsentBanner: jest.fn()
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

  describe('screenToGridCoordinates', () => {
    test('converts screen coordinates to grid coordinates', () => {
      mockGame.canvas.width = 576;  // 9 tiles * 64px per tile = 576px
      mockGame.canvas.height = 576;
      mockGame.canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 576,  // Canvas displayed at full size
        height: 576
      });

      const result = inputManager.screenToGridCoordinates(64, 64); // Center of first tile (0,0) to tile center

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
    test('finds and executes path to valid target', () => {
      mockGame.canvas.width = 576;
      mockGame.canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 576,
        height: 576
      });
      const executePathSpy = jest.spyOn(inputManager, 'executePath');

      // Grid position (2,2) - center of tile would be around pixel 2*64 + 32 = 160
      inputManager.handleTap(160, 160);

      // Should calculate to grid (2,2) after conversion
    });

    test('handles exit double tap', () => {
      mockGame.grid[2][2] = TILE_TYPES.EXIT;
      mockPlayer.getPosition = jest.fn().mockReturnValue({ x: 2, y: 2 });
      mockGame.canvas.width = 576;
      mockGame.canvas.height = 576;
      mockGame.canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0, top: 0, width: 576, height: 576
      });
      const handleExitTapSpy = jest.spyOn(inputManager, 'handleExitTap');

      // First tap (when player is at the exit) - center of tile 2: 160
      inputManager.handleTap(160, 160);
      // Second tap (double tap on same exit)
      inputManager.handleTap(160, 160);

      expect(handleExitTapSpy).toHaveBeenCalledWith(2, 2);
    });
  });

  describe('handleExitTap', () => {
    test('triggers zone transition based on exit position', () => {
      mockGame.grid[1][0] = TILE_TYPES.EXIT; // Left edge
      const handleKeyPressSpy = jest.spyOn(inputManager, 'handleKeyPress');

      inputManager.handleExitTap(0, 1);

      expect(handleKeyPressSpy).toHaveBeenCalledWith({ key: 'arrowleft', preventDefault: expect.any(Function) });
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
      const handleKeyPressSpy = jest.spyOn(inputManager, 'handleKeyPress');

      inputManager.executePath(['arrowright', 'arrowdown']);

      expect(inputManager.isExecutingPath).toBe(true);
      expect(handleKeyPressSpy).toHaveBeenCalledWith({ key: 'arrowright', preventDefault: expect.any(Function) });

      jest.advanceTimersByTime(150);
      expect(handleKeyPressSpy).toHaveBeenCalledWith({ key: 'arrowdown', preventDefault: expect.any(Function) });

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
  });
});
