/**
 * Tests for enemy tap feedback and attack range visualization
 */

import { GestureDetector } from '../controllers/GestureDetector.js';
import { InputCoordinator } from '../controllers/InputCoordinator.js';
import { Position } from '../core/Position.js';

describe('Enemy tap feedback', () => {
    let mockGame, gestureDetector, inputCoordinator;

    beforeEach(() => {
        const mockEnemies = [
            { x: 1, y: 1, health: 5, getPositionObject: () => new Position(1, 1) }
        ];

        mockGame = {
            canvas: document.createElement('canvas'),
            grid: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
            enemies: mockEnemies,
            enemyCollection: {
                findAt: (x, y, aliveOnly) => mockEnemies.find(e =>
                    e.x === x && e.y === y && (!aliveOnly || e.health > 0)
                ) || null,
                getAll: () => [...mockEnemies]
            },
            player: {
                x: 0,
                y: 0,
                getPosition: () => ({ x: 0, y: 0 }),
                getPositionObject: () => new Position(0, 0)
            },
            renderManager: {
                clearFeedback: jest.fn(),
                showTapFeedback: jest.fn(),
                startHoldFeedback: jest.fn()
            },
            animationScheduler: {
                isAnimating: false
            },
            transientGameState: {
                hasPendingCharge: () => false
            },
            settings: {
                getSetting: () => false
            }
        };

        gestureDetector = new GestureDetector(mockGame);
        inputCoordinator = new InputCoordinator(mockGame, {});
        inputCoordinator.gestureDetector = gestureDetector;
    });

    test('pointerUp on enemy should NOT clear hold feedback', () => {
        const enemyX = 1, enemyY = 1;

        // Mock the conversion to return enemy position
        gestureDetector._safeConvert = jest.fn(() => ({ x: enemyX, y: enemyY }));

        // Simulate pointer down (which starts hold feedback)
        const pointerDownEvent = {
            pointerId: 1,
            clientX: 100,
            clientY: 100,
            pointerType: 'touch',
            target: { setPointerCapture: jest.fn() }
        };
        gestureDetector._onPointerDown(pointerDownEvent);

        // Verify hold feedback was started
        expect(mockGame.renderManager.startHoldFeedback).toHaveBeenCalledWith(enemyX, enemyY);

        // Clear the mock to check pointer up behavior
        mockGame.renderManager.clearFeedback.mockClear();

        // Simulate pointer up on the same enemy tile
        const pointerUpEvent = {
            pointerId: 1,
            clientX: 100,
            clientY: 100,
            pointerType: 'touch',
            target: { releasePointerCapture: jest.fn() }
        };

        // Mock _safeConvert for pointer up as well
        gestureDetector._safeConvert = jest.fn(() => ({ x: enemyX, y: enemyY }));

        gestureDetector._onPointerUp(pointerUpEvent);

        // clearFeedback should NOT have been called because we released on an enemy
        expect(mockGame.renderManager.clearFeedback).not.toHaveBeenCalled();
    });

    test('pointerUp on non-enemy tile should clear hold feedback', () => {
        const emptyX = 2, emptyY = 2;

        // Mock the conversion to return empty tile position
        gestureDetector._safeConvert = jest.fn(() => ({ x: emptyX, y: emptyY }));

        // Simulate pointer down
        const pointerDownEvent = {
            pointerId: 1,
            clientX: 200,
            clientY: 200,
            pointerType: 'touch',
            target: { setPointerCapture: jest.fn() }
        };
        gestureDetector._onPointerDown(pointerDownEvent);

        // Clear the mock
        mockGame.renderManager.clearFeedback.mockClear();

        // Simulate pointer up on empty tile
        const pointerUpEvent = {
            pointerId: 1,
            clientX: 200,
            clientY: 200,
            pointerType: 'touch',
            target: { releasePointerCapture: jest.fn() }
        };
        gestureDetector._onPointerUp(pointerUpEvent);

        // clearFeedback SHOULD have been called because we released on empty tile
        expect(mockGame.renderManager.clearFeedback).toHaveBeenCalled();
    });

    test('tapping on non-enemy tile should clear hold feedback', () => {
        const emptyX = 2, emptyY = 2;

        // Mock grid coordinates conversion
        gestureDetector.convertScreenToGrid = jest.fn(() => ({ x: emptyX, y: emptyY }));
        gestureDetector.clearTapTimeout = jest.fn();
        gestureDetector.handleDoubleTapLogic = jest.fn(() => false);

        // Simulate tap on empty tile
        inputCoordinator.handleTap(200, 200);

        // clearFeedback should be called when tapping on non-enemy tile
        expect(mockGame.renderManager.clearFeedback).toHaveBeenCalled();
        expect(mockGame.renderManager.showTapFeedback).toHaveBeenCalledWith(emptyX, emptyY);
    });

    test('tapping on enemy tile should NOT clear hold feedback', () => {
        const enemyX = 1, enemyY = 1;

        // Mock grid coordinates conversion
        gestureDetector.convertScreenToGrid = jest.fn(() => ({ x: enemyX, y: enemyY }));
        gestureDetector.clearTapTimeout = jest.fn();
        gestureDetector.handleDoubleTapLogic = jest.fn(() => false);

        // Simulate tap on enemy tile
        inputCoordinator.handleTap(100, 100);

        // clearFeedback should NOT be called when tapping on enemy
        expect(mockGame.renderManager.clearFeedback).not.toHaveBeenCalled();
        // showTapFeedback should also NOT be called for enemy tiles
        expect(mockGame.renderManager.showTapFeedback).not.toHaveBeenCalled();
    });
});
