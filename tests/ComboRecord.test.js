/**
 * @jest-environment jsdom
 */

import { CombatManager } from '../managers/CombatManager.js';
import { BombManager } from '../managers/BombManager.js';
import { EnemyDefeatFlow } from '../managers/EnemyDefeatFlow.js';

// Create minimal mocks for game, player, enemy used by CombatManager.defeatEnemy
function makeMockGame() {
    return {
        animationManager: { addMultiplierAnimation: jest.fn(), addPointAnimation: jest.fn() },
        soundManager: { playSound: jest.fn() },
        player: {
            lastActionType: 'attack',
            lastActionResult: 'kill',
            consecutiveKills: 1,
            addPoints: jest.fn(),
            getPoints: () => 0,
            getVisitedZones: () => new Set(),
            getSpentDiscoveries: () => 0
        },
        defeatedEnemies: new Set(),
        enemies: [],
        zones: new Map(),
        turnManager: { initialEnemyTilesThisTurn: new Set() }
    };
}

beforeEach(() => {
    document.body.innerHTML = '<div></div>'; // minimal DOM
    localStorage.clear();
});

afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
});

test('CombatManager.defeatEnemy updates chress:record:combo when player achieves new highest combo', () => {
    const game = makeMockGame();
    // Use real instances for proper combo tracking
    const mockBombManager = new BombManager(game);
    const mockDefeatFlow = new EnemyDefeatFlow(game);
    const cm = new CombatManager(game, new Set(), mockBombManager, mockDefeatFlow);

    // Simulate an enemy object
    const enemy = {
        id: 'e1',
        x: 2,
        y: 3,
        health: 0,
        getPoints: () => 5,
        takeDamage: jest.fn()
    };

    // Pre-seed a lower combo record
    localStorage.setItem('chress:record:combo', '1');

    // player already had consecutiveKills 1 and lastActionType/Result set so defeatEnemy will increment to 2
    const result = cm.defeatEnemy(enemy, 'player');

    expect(result.defeated).toBe(true);
    expect(result.consecutiveKills).toBeGreaterThanOrEqual(1);

    const stored = parseInt(localStorage.getItem('chress:record:combo') || '0', 10) || 0;
    expect(stored).toBeGreaterThanOrEqual(2);
});
