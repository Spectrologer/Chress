/**
 * Tests for enemy tap feedback and attack range visualization
 */

import { GestureDetector } from '../controllers/GestureDetector';
import { InputCoordinator } from '../controllers/InputCoordinator';
import { Position } from '@core/Position';

describe('Enemy tap feedback', () => {
    let mockGame, gestureDetector, inputCoordinator;

    beforeEach(() => {
        const mockEnemies = [
            { x: 1, y: 0, health: 5, getPositionObject: () => new Position(1, 0) }, // Adjacent enemy
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
                clearFeedback: vi.fn(),
                showTapFeedback: vi.fn(),
                startHoldFeedback: vi.fn()
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

    test('pointerUp on adjacent enemy should clear hold feedback (immediate attack)', () => {
        const enemyX = 1, enemyY = 0; // Adjacent to player at (0,0)

        // Mock the conversion to return enemy position
        gestureDetector._safeConvert = vi.fn(() => ({ x: enemyX, y: enemyY }));

        // Simulate pointer down (which starts hold feedback)
        const pointerDownEvent = {
            pointerId: 1,
            clientX: 100,
            clientY: 100,
            pointerType: 'touch',
            target: { setPointerCapture: vi.fn() }
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
            target: { releasePointerCapture: vi.fn() }
        };

        // Mock _safeConvert for pointer up as well
        gestureDetector._safeConvert = vi.fn(() => ({ x: enemyX, y: enemyY }));

        gestureDetector._onPointerUp(pointerUpEvent);

        // clearFeedback SHOULD have been called because enemy is adjacent (immediate attack)
        expect(mockGame.renderManager.clearFeedback).toHaveBeenCalled();
    });

    test('pointerUp on non-adjacent enemy should NOT clear hold feedback (show range)', () => {
        const enemyX = 2, enemyY = 2; // Not adjacent to player at (0,0)

        // Add a non-adjacent enemy
        const nonAdjacentEnemy = { x: 2, y: 2, health: 5, getPositionObject: () => new Position(2, 2) };
        mockGame.enemies.push(nonAdjacentEnemy);

        // Mock the conversion to return non-adjacent enemy position
        gestureDetector._safeConvert = vi.fn(() => ({ x: enemyX, y: enemyY }));

        // Simulate pointer down (which starts hold feedback)
        const pointerDownEvent = {
            pointerId: 1,
            clientX: 200,
            clientY: 200,
            pointerType: 'touch',
            target: { setPointerCapture: vi.fn() }
        };
        gestureDetector._onPointerDown(pointerDownEvent);

        // Verify hold feedback was started
        expect(mockGame.renderManager.startHoldFeedback).toHaveBeenCalledWith(enemyX, enemyY);

        // Clear the mock to check pointer up behavior
        mockGame.renderManager.clearFeedback.mockClear();

        // Simulate pointer up on the same enemy tile
        const pointerUpEvent = {
            pointerId: 1,
            clientX: 200,
            clientY: 200,
            pointerType: 'touch',
            target: { releasePointerCapture: vi.fn() }
        };

        gestureDetector._onPointerUp(pointerUpEvent);

        // clearFeedback should NOT have been called because enemy is not adjacent (show range preview)
        expect(mockGame.renderManager.clearFeedback).not.toHaveBeenCalled();
    });

    test('pointerUp on non-enemy tile should clear hold feedback', () => {
        const emptyX = 2, emptyY = 2;

        // Mock the conversion to return empty tile position
        gestureDetector._safeConvert = vi.fn(() => ({ x: emptyX, y: emptyY }));

        // Simulate pointer down
        const pointerDownEvent = {
            pointerId: 1,
            clientX: 200,
            clientY: 200,
            pointerType: 'touch',
            target: { setPointerCapture: vi.fn() }
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
            target: { releasePointerCapture: vi.fn() }
        };
        gestureDetector._onPointerUp(pointerUpEvent);

        // clearFeedback SHOULD have been called because we released on empty tile
        expect(mockGame.renderManager.clearFeedback).toHaveBeenCalled();
    });

    test('tapping on non-enemy tile should clear hold feedback', () => {
        const emptyX = 2, emptyY = 2;

        // Mock grid coordinates conversion
        gestureDetector.convertScreenToGrid = vi.fn(() => ({ x: emptyX, y: emptyY }));
        gestureDetector.clearTapTimeout = vi.fn();
        gestureDetector.handleDoubleTapLogic = vi.fn(() => false);

        // Simulate tap on empty tile
        inputCoordinator.handleTap(200, 200);

        // clearFeedback should be called when tapping on non-enemy tile
        expect(mockGame.renderManager.clearFeedback).toHaveBeenCalled();
        expect(mockGame.renderManager.showTapFeedback).toHaveBeenCalledWith(emptyX, emptyY);
    });

    test('tapping on adjacent enemy tile should clear hold feedback', () => {
        const enemyX = 1, enemyY = 0; // Adjacent to player at (0,0)

        // Mock grid coordinates conversion
        gestureDetector.convertScreenToGrid = vi.fn(() => ({ x: enemyX, y: enemyY }));
        gestureDetector.clearTapTimeout = vi.fn();
        gestureDetector.handleDoubleTapLogic = vi.fn(() => false);

        // Simulate tap on adjacent enemy tile
        inputCoordinator.handleTap(100, 100);

        // clearFeedback SHOULD be called for adjacent enemy (immediate attack)
        expect(mockGame.renderManager.clearFeedback).toHaveBeenCalled();
        // showTapFeedback should NOT be called for enemy tiles
        expect(mockGame.renderManager.showTapFeedback).not.toHaveBeenCalled();
    });

    test('tapping on non-adjacent enemy tile should NOT clear hold feedback', () => {
        const enemyX = 2, enemyY = 2; // Not adjacent to player at (0,0)

        // Add a non-adjacent enemy
        const nonAdjacentEnemy = { x: 2, y: 2, health: 5, getPositionObject: () => new Position(2, 2) };
        mockGame.enemies.push(nonAdjacentEnemy);

        // Mock grid coordinates conversion
        gestureDetector.convertScreenToGrid = vi.fn(() => ({ x: enemyX, y: enemyY }));
        gestureDetector.clearTapTimeout = vi.fn();
        gestureDetector.handleDoubleTapLogic = vi.fn(() => false);

        // Simulate tap on non-adjacent enemy tile
        inputCoordinator.handleTap(200, 200);

        // clearFeedback should NOT be called for non-adjacent enemy (show range preview)
        expect(mockGame.renderManager.clearFeedback).not.toHaveBeenCalled();
        // showTapFeedback should NOT be called for enemy tiles
        expect(mockGame.renderManager.showTapFeedback).not.toHaveBeenCalled();
    });
});
