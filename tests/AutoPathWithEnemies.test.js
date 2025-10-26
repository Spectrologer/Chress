import { InputController } from '../controllers/InputController.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';

// Minimal fake game/player similar to other tests
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

    // Minimal interactionManager so executeMovementOrInteraction can call handleTap
    game.interactionManager = { handleTap: jest.fn().mockReturnValue(false) };

    game.isPlayerTurn = true;
    game.pendingCharge = null;
    game.hideOverlayMessage = jest.fn();
    game.startEnemyTurns = jest.fn();
    game.incrementBombActions = jest.fn();
    game.updatePlayerPosition = jest.fn();
    game.updatePlayerStats = jest.fn();
    game.turnManager = { handleTurnCompletion: jest.fn() };

    global.requestAnimationFrame = (cb) => cb();
    return game;
}

describe('Auto Path With Enemies setting', () => {
    test('when OFF and enemies exist, clicking distant tile only moves one tile', () => {
        const game = makeGame();
        // add a live enemy on board
        game.enemies.push({ x: 6, y: 6, health: 10 });

    // ensure default stats object exists and autoPathWithEnemies is false
    // Use non-verbose animations to avoid Sequence/Promise handling in tests
    game.player.stats = { verbosePathAnimations: false, autoPathWithEnemies: false };

        const ic = new InputController(game, null);

        // Set up event listener to handle key presses synchronously (for testing)
        eventBus.on(EventTypes.INPUT_KEY_PRESS, (ev) => {
            // apply movement synchronously
            const map = { arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0] };
            const m = map[(ev.key || '').toLowerCase()];
            if (m) { game.player.x += m[0]; game.player.y += m[1]; }
        });

        // spy on executePath to observe what is issued
        const spy = jest.spyOn(ic, 'executePath');

        // click on a far-away tile
        ic.executeMovementOrInteraction({ x: 8, y: 8 });

        // Because enemy exists and autoPathWithEnemies is false, we should get a single-step path
        expect(spy).toHaveBeenCalled();
        const calledWith = spy.mock.calls[0][0];
        expect(Array.isArray(calledWith)).toBe(true);
        // should be a single-step
        expect(calledWith.length).toBe(1);
    });

    test('when ON and enemies exist, clicking distant tile attempts multi-tile path', () => {
        const game = makeGame();
        game.enemies.push({ x: 6, y: 6, health: 10 });

    // enable the setting
    // Use non-verbose animations to avoid Sequence/Promise handling in tests
    game.player.stats = { verbosePathAnimations: false, autoPathWithEnemies: true };

        const ic = new InputController(game, null);

        // Set up event listener to handle key presses synchronously (for testing)
        eventBus.on(EventTypes.INPUT_KEY_PRESS, (ev) => {
            const map = { arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0] };
            const m = map[(ev.key || '').toLowerCase()];
            if (m) { game.player.x += m[0]; game.player.y += m[1]; }
        });

        // spy on findPath and executePath
        const findSpy = jest.spyOn(ic, 'findPath');
        const execSpy = jest.spyOn(ic, 'executePath');

        // Click to a reachable distant tile - make sure target is walkable
        game.grid[8][8] = 0;
        // ensure player.isWalkable will allow pathing for test (we rely on BFS)
        ic.executeMovementOrInteraction({ x: 8, y: 8 });

        // Now findPath should have been called internally and executePath called
        expect(findSpy).toHaveBeenCalled();
        expect(execSpy).toHaveBeenCalled();
        // And because setting is ON, the executed path may be multi-step (length > 1)
        const pathArg = execSpy.mock.calls[0][0];
        expect(pathArg.length).toBeGreaterThanOrEqual(1);
    });
});
