import { InputManager } from '../managers/InputManager.js';
import { TILE_TYPES, GRID_SIZE, INPUT_CONSTANTS } from '../core/constants.js';

describe('Input feedback integration', () => {
  let inputManager;
  let mockGame;
  let mockPlayer;

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
      y: 1,
      stats: { verbosePathAnimations: true }
    };

    // canvas mock that captures event listeners
    const listeners = {};
    const mockCanvas = {
      width: 576,
      height: 576,
      getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0, width: 576, height: 576 }),
      addEventListener: jest.fn((name, fn, options) => { listeners[name] = fn; }),
      removeEventListener: jest.fn((name, fn, options) => { delete listeners[name]; }),
      setPointerCapture: jest.fn(),
      releasePointerCapture: jest.fn(),
      __listeners: listeners
    };

    mockGame = {
      player: mockPlayer,
      interactionManager: { handleTap: jest.fn().mockReturnValue(false) },
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
      hideOverlayMessage: jest.fn(),
      transitionToZone: jest.fn(),
  startEnemyTurns: jest.fn(),
  updatePlayerPosition: jest.fn(),
  updatePlayerStats: jest.fn(),
      incrementBombActions: jest.fn(),
      combatManager: { addPointAnimation: jest.fn(), defeatEnemy: jest.fn() },
      uiManager: { isStatsPanelOpen: jest.fn().mockReturnValue(false), hideStatsPanel: jest.fn(), updatePlayerStats: jest.fn() },
      consentManager: { forceShowConsentBanner: jest.fn() },
      animationScheduler: { createSequence: jest.fn() }
    };

    // Provide a renderManager mock with feedback methods
    mockGame.renderManager = {
      showTapFeedback: jest.fn(),
      startHoldFeedback: jest.fn(),
      clearFeedback: jest.fn()
    };

    // Provide a mock soundManager
    mockGame.soundManager = {
      playSound: jest.fn()
    };

    inputManager = new InputManager(mockGame, null);
    // Attach controls so event listeners on canvas are registered
    inputManager.setupControls();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('handleTap triggers renderManager.showTapFeedback', () => {
    // center of tile (2,2) is at pixel 160,160
    inputManager.handleTap(160, 160);
    expect(mockGame.renderManager.showTapFeedback).toHaveBeenCalledWith(2, 2);
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('bloop');
  });

  test('handleKeyPress triggers renderManager.showTapFeedback on destination', () => {
    inputManager.handleKeyPress({ key: 'arrowright', preventDefault: jest.fn() });
    // movement from player (1,1) -> (2,1)
    expect(mockGame.renderManager.showTapFeedback).toHaveBeenCalledWith(2, 1);
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('bloop');
  });

  test('pointerdown -> pointermove -> pointerup calls startHoldFeedback, updates, and clears + triggers tap', () => {
    const handlers = mockGame.canvas.__listeners;
    const pointerdown = handlers['pointerdown'];
    expect(typeof pointerdown).toBe('function');

    const spyHandleTap = jest.spyOn(inputManager.controller, 'handleTap');

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

  const spyHandleTap = jest.spyOn(inputManager.controller, 'handleTap');

  // Mock Date.now to simulate a long press
  let now = 1000;
  jest.spyOn(Date, 'now').mockImplementation(() => now);

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
