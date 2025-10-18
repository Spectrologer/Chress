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
      addEventListener: jest.fn((name, fn) => { listeners[name] = fn; }),
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

  test('mousedown -> mousemove -> mouseup calls startHoldFeedback, updates, and clears + triggers tap', () => {
    const handlers = mockGame.canvas.__listeners;
    const mousedown = handlers['mousedown'];
    expect(typeof mousedown).toBe('function');

    // Capture window.addEventListener registrations so we can call the window handlers
    const added = {};
    const origAdd = window.addEventListener;
    window.addEventListener = jest.fn((name, fn) => {
      added[name] = added[name] || [];
      added[name].push(fn);
    });

    const spyHandleTap = jest.spyOn(inputManager, 'handleTap');

    // Simulate mousedown at tile (1,1) -> pixel 96,96 (tile 1 index center approx 96)
    mousedown({ clientX: 96, clientY: 96 });

    // Expect startHoldFeedback called for initial tile
    expect(mockGame.renderManager.startHoldFeedback).toHaveBeenCalled();
  expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('bloop');

    // There should be window mousemove and mouseup handlers registered
    expect(added['mousemove'] && added['mousemove'].length).toBeGreaterThan(0);
    expect(added['mouseup'] && added['mouseup'].length).toBeGreaterThan(0);

    const onMouseMove = added['mousemove'][0];
    const onMouseUp = added['mouseup'][0];

    // Simulate dragging to tile (3,1) - pixel ~224
    onMouseMove({ clientX: 224, clientY: 96 });
    expect(mockGame.renderManager.startHoldFeedback).toHaveBeenCalledWith(3, 1);
  expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('bloop');

    // Simulate mouseup: should clear feedback and trigger handleTap
    onMouseUp({ clientX: 224, clientY: 96 });
    expect(mockGame.renderManager.clearFeedback).toHaveBeenCalled();
    expect(spyHandleTap).toHaveBeenCalled();

    // Restore original
    window.addEventListener = origAdd;
  });

  test('long press + drag release treated as tap at release tile (touch)', () => {
    const handlers = mockGame.canvas.__listeners;
    const touchstart = handlers['touchstart'];
    const touchend = handlers['touchend'];
    expect(typeof touchstart).toBe('function');
    expect(typeof touchend).toBe('function');

    const spyHandleTap = jest.spyOn(inputManager, 'handleTap');

    // Mock Date.now to simulate a long press
    let now = 1000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    // Start touch at (96,96)
    touchstart({ preventDefault: () => {}, touches: [{ clientX: 96, clientY: 96 }] });

    // Advance time beyond MAX_TAP_TIME
    now += INPUT_CONSTANTS.MAX_TAP_TIME + 200;

    // End touch at (416,96) ~ tile (6,1)
    touchend({ preventDefault: () => {}, changedTouches: [{ clientX: 416, clientY: 96 }] });

    // Long-press-drag-release should call handleTap at release coordinates
    expect(spyHandleTap).toHaveBeenCalledWith(416, 96);
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('bloop');
  });
});
