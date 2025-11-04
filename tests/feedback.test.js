import { InputManager } from '@managers/InputManager';
import { TILE_TYPES, GRID_SIZE, INPUT_CONSTANTS } from '@core/constants/index';

describe('Input feedback integration', () => {
  let inputManager;
  let mockGame;
  let mockPlayer;

  beforeEach(() => {
    mockPlayer = {
      getPosition: vi.fn().mockReturnValue({ x: 1, y: 1 }),
      isDead: vi.fn().mockReturnValue(false),
      isWalkable: vi.fn().mockReturnValue(true),
      move: vi.fn(),
      startAttackAnimation: vi.fn(),
      startBump: vi.fn(),
      takeDamage: vi.fn(),
      setPosition: vi.fn(),
      setInteractOnReach: vi.fn(),
      clearInteractOnReach: vi.fn(),
      interactOnReach: null,
      getCurrentZone: vi.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
      addPoints: vi.fn(),
      x: 2,
      y: 1,
      stats: { verbosePathAnimations: true }
    };

    // canvas mock that captures event listeners
    const listeners = {};
    const mockCanvas = {
      width: 640,
      height: 640,
      getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0, width: 640, height: 640 }),
      addEventListener: vi.fn((name, fn, options) => { listeners[name] = fn; }),
      removeEventListener: vi.fn((name, fn, options) => { delete listeners[name]; }),
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      __listeners: listeners
    };

    mockGame = {
      player: mockPlayer,
      interactionManager: { handleTap: vi.fn().mockReturnValue(false) },
      canvas: mockCanvas,
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
      hideOverlayMessage: vi.fn(),
      transitionToZone: vi.fn(),
  startEnemyTurns: vi.fn(),
  updatePlayerPosition: vi.fn(),
  updatePlayerStats: vi.fn(),
      incrementBombActions: vi.fn(),
      combatManager: { addPointAnimation: vi.fn(), defeatEnemy: vi.fn() },
      uiManager: { isStatsPanelOpen: vi.fn().mockReturnValue(false), hideStatsPanel: vi.fn(), updatePlayerStats: vi.fn() },
      consentManager: { forceShowConsentBanner: vi.fn() },
      animationScheduler: { createSequence: vi.fn() }
    };

    // Provide a renderManager mock with feedback methods
    mockGame.renderManager = {
      showTapFeedback: vi.fn(),
      startHoldFeedback: vi.fn(),
      clearFeedback: vi.fn()
    };

    // Provide a mock soundManager
    mockGame.soundManager = {
      playSound: vi.fn()
    };

    inputManager = new InputManager(mockGame, null);
    // Attach controls so event listeners on canvas are registered
    inputManager.setupControls();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  test('handleTap triggers renderManager.showTapFeedback', () => {
    // center of tile (2,2) is at pixel 160,160
    inputManager.handleTap(160, 160);
    expect(mockGame.renderManager.showTapFeedback).toHaveBeenCalledWith(2, 2);
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('bloop');
  });

  test('handleKeyPress triggers renderManager.showTapFeedback on destination', () => {
    inputManager.handleKeyPress({ key: 'arrowright', preventDefault: vi.fn() });
    // movement from player (1,1) -> (2,1)
    expect(mockGame.renderManager.showTapFeedback).toHaveBeenCalledWith(2, 1);
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('bloop');
  });

  test('pointerdown -> pointermove -> pointerup calls startHoldFeedback, updates, and clears + triggers tap', () => {
    const handlers = mockGame.canvas.__listeners;
    const pointerdown = handlers['pointerdown'];
    expect(typeof pointerdown).toBe('function');

    const spyHandleTap = vi.spyOn(inputManager.controller.coordinator, 'handleTap');

    // Simulate pointerdown at tile (1,1) -> pixel 96,96 (tile 1 index center approx 96)
    pointerdown({ clientX: 96, clientY: 96, pointerId: 1, pointerType: 'mouse', button: 0, target: mockGame.canvas });

    // Expect startHoldFeedback called for initial tile
    expect(mockGame.renderManager.startHoldFeedback).toHaveBeenCalled();
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('bloop');

    // There should be canvas pointermove and pointerup handlers registered
    expect(typeof handlers['pointermove']).toBe('function');
    expect(typeof handlers['pointerup']).toBe('function');

    const onPointerMove = handlers['pointermove'];
    const onPointerUp = handlers['pointerup'];

  // Simulate dragging to tile (3,1) - pixel ~224
  onPointerMove({ clientX: 224, clientY: 96, pointerId: 1, pointerType: 'mouse' });
    expect(mockGame.renderManager.startHoldFeedback).toHaveBeenCalledWith(3, 1);
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('bloop');

    // Simulate pointerup: should clear feedback and trigger handleTap
  onPointerUp({ clientX: 224, clientY: 96, pointerId: 1, pointerType: 'mouse', target: mockGame.canvas });
    expect(mockGame.renderManager.clearFeedback).toHaveBeenCalled();
    expect(spyHandleTap).toHaveBeenCalled();
  });

  test('long press + drag release treated as tap at release tile (touch)', () => {
    const handlers = mockGame.canvas.__listeners;
  const pointerdownTouch = handlers['pointerdown'];
  const pointerupTouch = handlers['pointerup'];
  expect(typeof pointerdownTouch).toBe('function');
  expect(typeof pointerupTouch).toBe('function');

  const spyHandleTap = vi.spyOn(inputManager.controller.coordinator, 'handleTap');

  // Mock Date.now to simulate a long press
  let now = 1000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);

  // Start touch-like pointer at (96,96)
  pointerdownTouch({ clientX: 96, clientY: 96, pointerId: 2, pointerType: 'touch', target: mockGame.canvas });

  // Advance time beyond MAX_TAP_TIME
  now += INPUT_CONSTANTS.MAX_TAP_TIME + 200;

  // End pointer at (416,96) ~ tile (6,1)
  pointerupTouch({ clientX: 416, clientY: 96, pointerId: 2, pointerType: 'touch', target: mockGame.canvas });

  // Long-press-drag-release should call handleTap at release coordinates
  expect(spyHandleTap).toHaveBeenCalledWith(416, 96);
  expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('bloop');
  });
});
