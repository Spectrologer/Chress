import { InputController } from '../controllers/InputController.js';
import { eventBus } from '@core/EventBus.js';
import { EventTypes } from '@core/EventTypes.js';

// Minimal fake game/player to test executePath behavior
function makeGame() {
    const player = {
        x: 2,
        y: 2,
        getPosition() { return { x: this.x, y: this.y }; },
        move(newX, newY) { this.x = newX; this.y = newY; return true; },
        isDead() { return false; },
        isWalkable() { return true; },
        getCurrentZone() { return { x: 0, y: 0, dimension: 0 }; }
    };

    const renderManager = {
        startHoldFeedback: jest.fn(),
        clearFeedback: jest.fn(),
        showTapFeedback: jest.fn()
    };

    const game = {
        player,
        renderManager,
        grid: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
        enemies: [],
        animationScheduler: {
            createSequence: () => ({ then: () => ({ wait: () => ({ then: () => ({ start: () => Promise.resolve(), id: 1 }) }) }) }),
            cancelSequence: jest.fn()
        }
    };
    // Minimal runtime flags and helpers used by InteractionController.handleKeyPress
    game.isPlayerTurn = true;
    game.pendingCharge = null;
    game.hideOverlayMessage = jest.fn();
    game.startEnemyTurns = jest.fn();
    game.incrementBombActions = jest.fn();
    game.updatePlayerPosition = jest.fn();
    game.updatePlayerStats = jest.fn();
    game.turnManager = { handleTurnCompletion: jest.fn() };

    // Ensure requestAnimationFrame is available and deterministic in tests
    global.requestAnimationFrame = (cb) => cb();
    return game;
}

describe('InputController path feedback', () => {
    jest.useFakeTimers();

    test('startHoldFeedback is called with correct destination for simple path', () => {
        const game = makeGame();
        const ic = new InputController(game, null);

        // Path: right, down -> destination should be (3,3)
        ic.executePath(['arrowright', 'arrowdown']);

        expect(game.renderManager.startHoldFeedback).toHaveBeenCalledTimes(1);
        expect(game.renderManager.startHoldFeedback).toHaveBeenCalledWith(3, 3);
    });

    test('clearFeedback is called when non-sequence path completes', (done) => {
        const game = makeGame();
        // Use non-verbose path execution branch by disabling verbosePathAnimations
        game.player.stats = {};
        const ic = new InputController(game, null);

        // Set up event listener to apply movement synchronously (for testing)
        eventBus.on(EventTypes.INPUT_KEY_PRESS, (ev) => {
            // Synthetic handler to apply movement synchronously so the runNextStep loop advances
            const moveMap = { arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0] };
            const m = moveMap[(ev.key || '').toLowerCase()];
            if (m) {
                game.player.x += m[0];
                game.player.y += m[1];
            }
        });

        ic.executePath(['arrowright']);

        // fast-forward time to let the path runner conclude
        jest.runOnlyPendingTimers();

        // After completion we expect clearFeedback to have been called
        expect(game.renderManager.clearFeedback).toHaveBeenCalled();
        done();
    });

    test('clearFeedback is called on cancelPathExecution', () => {
        const game = makeGame();
        const ic = new InputController(game, null);

        ic.executePath(['arrowright','arrowright']);
        // Immediately cancel
        ic.cancelPathExecution();

        expect(game.renderManager.clearFeedback).toHaveBeenCalled();
    });
});
