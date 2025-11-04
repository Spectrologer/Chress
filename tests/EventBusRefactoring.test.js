/**
 * Test suite for event bus refactoring of input system
 */
import { PathfindingController } from '../controllers/PathfindingController';
import { InputController } from '../controllers/InputController';
import { KeyboardHandler } from '../controllers/KeyboardHandler';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { TILE_TYPES } from '@core/constants/index';

describe('Event Bus Refactoring', () => {
    let mockGame;
    let mockPlayer;
    let mockInventoryService;

    beforeEach(() => {
        // Clear all event listeners before each test
        eventBus.clear();

        mockPlayer = {
            x: 5,
            y: 5,
            getPosition: vi.fn(() => ({ x: 5, y: 5 })),
            isWalkable: vi.fn(() => true),
            move: vi.fn(() => true),
            isDead: vi.fn(() => false),
            stats: { verbosePathAnimations: false },
            abilities: { has: vi.fn(() => false) },
            startAttackAnimation: vi.fn(),
            startBump: vi.fn(),
            setAction: vi.fn(),
        };

        mockGame = {
            player: mockPlayer,
            grid: Array(16).fill(null).map(() => Array(16).fill(TILE_TYPES.GRASS)),
            enemies: [],
            isPlayerTurn: true,
            displayingMessageForSign: false,
            pendingCharge: null,
            bombPlacementMode: false,
            hideOverlayMessage: vi.fn(),
            renderManager: {
                showTapFeedback: vi.fn(),
                clearFeedback: vi.fn(),
            },
            animationScheduler: {
                createSequence: vi.fn(() => ({
                    then: vi.fn(function() { return this; }),
                    wait: vi.fn(function() { return this; }),
                    start: vi.fn(() => Promise.resolve()),
                    id: 'test-sequence',
                })),
            },
            startEnemyTurns: vi.fn(),
            updatePlayerPosition: vi.fn(),
            incrementBombActions: vi.fn(),
        };

        mockInventoryService = {};
    });

    afterEach(() => {
        eventBus.clear();
    });

    describe('PathfindingController event emission', () => {
        test('emits INPUT_KEY_PRESS when triggering key press', (done) => {
            const pathfindingController = new PathfindingController(mockGame);

            eventBus.on(EventTypes.INPUT_KEY_PRESS, (event) => {
                expect(event.key).toBe('arrowup');
                expect(event._synthetic).toBe(true);
                done();
            });

            pathfindingController._triggerKeyPress({
                key: 'arrowup',
                preventDefault: () => {},
                _synthetic: true
            });
        });

        test('emits INPUT_PATH_STARTED when executing path', () => {
            const pathfindingController = new PathfindingController(mockGame);
            const listener = vi.fn();

            eventBus.on(EventTypes.INPUT_PATH_STARTED, listener);

            pathfindingController.executePath(['arrowup', 'arrowdown']);

            expect(listener).toHaveBeenCalledWith({ pathLength: 2 });
        });

        test('emits INPUT_PATH_CANCELLED when cancelling path', () => {
            const pathfindingController = new PathfindingController(mockGame);
            const listener = vi.fn();

            eventBus.on(EventTypes.INPUT_PATH_CANCELLED, listener);

            pathfindingController.executePath(['arrowup']);
            pathfindingController.cancelPathExecution();

            expect(listener).toHaveBeenCalled();
        });

        test('emits INPUT_EXIT_REACHED when reaching exit', () => {
            const pathfindingController = new PathfindingController(mockGame);
            const listener = vi.fn();

            // Set up exit tile
            mockGame.grid[5][5] = TILE_TYPES.EXIT;
            pathfindingController.autoUseNextTransition = 'exit';

            eventBus.on(EventTypes.INPUT_EXIT_REACHED, listener);

            pathfindingController._handlePathCompletion();

            expect(listener).toHaveBeenCalledWith({ x: 5, y: 5 });
        });
    });

    describe('InputController event subscription', () => {
        test('subscribes to INPUT_KEY_PRESS and handles it', () => {
            const inputController = new InputController(mockGame, mockInventoryService);
            const handleKeyPressSpy = vi.spyOn(inputController.coordinator, 'handleKeyPress');

            const event = { key: 'arrowup', preventDefault: () => {} };
            eventBus.emit(EventTypes.INPUT_KEY_PRESS, event);

            expect(handleKeyPressSpy).toHaveBeenCalledWith(event);
        });

        test('subscribes to INPUT_EXIT_REACHED and handles it', () => {
            const inputController = new InputController(mockGame, mockInventoryService);
            const performExitTapSpy = vi.spyOn(inputController.coordinator, 'performExitTap');

            eventBus.emit(EventTypes.INPUT_EXIT_REACHED, { x: 5, y: 5 });

            expect(performExitTapSpy).toHaveBeenCalledWith(5, 5);
        });

        test('unsubscribes from events on destroy', () => {
            const inputController = new InputController(mockGame, mockInventoryService);
            const handleKeyPressSpy = vi.spyOn(inputController.coordinator, 'handleKeyPress');

            inputController.destroy();

            eventBus.emit(EventTypes.INPUT_KEY_PRESS, { key: 'arrowup', preventDefault: () => {} });

            // Should not be called after destroy
            expect(handleKeyPressSpy).not.toHaveBeenCalled();
        });
    });

    describe('KeyboardHandler event-based state tracking', () => {
        test('tracks path execution state via events', () => {
            const keyboardHandler = new KeyboardHandler(mockGame);

            expect(keyboardHandler._pathExecuting).toBe(false);

            eventBus.emit(EventTypes.INPUT_PATH_STARTED, { pathLength: 3 });
            expect(keyboardHandler._pathExecuting).toBe(true);

            eventBus.emit(EventTypes.INPUT_PATH_COMPLETED, {});
            expect(keyboardHandler._pathExecuting).toBe(false);
        });

        test('resets path execution on cancellation', () => {
            const keyboardHandler = new KeyboardHandler(mockGame);

            eventBus.emit(EventTypes.INPUT_PATH_STARTED, { pathLength: 3 });
            expect(keyboardHandler._pathExecuting).toBe(true);

            eventBus.emit(EventTypes.INPUT_PATH_CANCELLED, {});
            expect(keyboardHandler._pathExecuting).toBe(false);
        });

        test('unsubscribes from events on destroy', () => {
            const keyboardHandler = new KeyboardHandler(mockGame);

            keyboardHandler.destroy();

            eventBus.emit(EventTypes.INPUT_PATH_STARTED, { pathLength: 3 });

            // State should not change after destroy
            expect(keyboardHandler._pathExecuting).toBe(false);
        });
    });

    describe('Integration: Full event flow', () => {
        test('PathfindingController -> InputController via events', () => {
            const inputController = new InputController(mockGame, mockInventoryService);
            const pathfindingController = inputController.pathfindingController;
            const handleKeyPressSpy = vi.spyOn(inputController.coordinator, 'handleKeyPress');

            // Trigger key press via event
            pathfindingController._triggerKeyPress({
                key: 'arrowup',
                preventDefault: () => {},
                _synthetic: true
            });

            // Should be called at least once (via event bus and/or legacy callback)
            expect(handleKeyPressSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: 'arrowup',
                    _synthetic: true
                })
            );
        });

        test('Path execution state flows to KeyboardHandler', () => {
            const inputController = new InputController(mockGame, mockInventoryService);
            const pathfindingController = inputController.pathfindingController;
            const keyboardHandler = inputController.keyboardHandler;

            // Start path execution
            pathfindingController.executePath(['arrowup']);

            // KeyboardHandler should see the state change
            expect(keyboardHandler._pathExecuting).toBe(true);

            // Cancel path
            pathfindingController.cancelPathExecution();

            // KeyboardHandler should see the cancellation
            expect(keyboardHandler._pathExecuting).toBe(false);
        });
    });

});
