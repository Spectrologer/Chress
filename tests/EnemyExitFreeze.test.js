import { TurnManager } from '../core/TurnManager.js';
import { GameContext } from '../core/GameContext.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';
import { BaseEnemy } from '../enemy/BaseEnemy.js';

describe('Enemy Exit Freeze Feature', () => {
    let turnManager;
    let mockGame;
    let mockPlayer;
    let mockCombatManager;
    let mockAnimationScheduler;
    let mockEnemy1;
    let mockEnemy2;

    beforeEach(() => {
        // Create mock player
        mockPlayer = {
            getPosition: jest.fn().mockReturnValue({ x: 4, y: 4 }),
            x: 4,
            y: 4
        };

        // Create mock enemies
        mockEnemy1 = {
            x: 2,
            y: 2,
            id: 'enemy1',
            enemyType: 'lizardy',
            isFrozen: false,
            isDead: jest.fn().mockReturnValue(false)
        };

        mockEnemy2 = {
            x: 6,
            y: 6,
            id: 'enemy2',
            enemyType: 'lizardo',
            isFrozen: false,
            isDead: jest.fn().mockReturnValue(false)
        };

        // Create mock combat manager
        mockCombatManager = {
            handleSingleEnemyMovement: jest.fn(),
            checkCollisions: jest.fn()
        };

        // Create mock animation scheduler
        let sequence;
        mockAnimationScheduler = {
            createSequence: jest.fn(() => {
                sequence = {
                    then: jest.fn((callback) => {
                        if (callback) callback();
                        return sequence;
                    }),
                    wait: jest.fn(() => sequence),
                    start: jest.fn()
                };
                return sequence;
            })
        };

        // Create mock interaction manager
        const mockInteractionManager = {
            checkItemPickup: jest.fn()
        };

        // Create grid with floor tiles
        const grid = Array(GRID_SIZE).fill().map(() =>
            Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)
        );

        // Create mock game context
        mockGame = {
            player: mockPlayer,
            enemies: [mockEnemy1, mockEnemy2],
            grid: grid,
            isPlayerTurn: true,
            playerJustAttacked: false,
            justLeftExitTile: false,
            isInPitfallZone: false,
            pitfallTurnsSurvived: 0,
            combatManager: mockCombatManager,
            animationScheduler: mockAnimationScheduler,
            interactionManager: mockInteractionManager,
            isPlayerOnExitTile: jest.fn().mockReturnValue(false)
        };

        turnManager = new TurnManager(mockGame);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Player on exit tile', () => {
        test('freezes all enemies when player is on exit tile', () => {
            // Place player on exit tile
            mockGame.grid[4][4] = TILE_TYPES.EXIT;
            mockGame.isPlayerOnExitTile.mockReturnValue(true);

            turnManager.startEnemyTurns();

            expect(mockEnemy1.isFrozen).toBe(true);
            expect(mockEnemy2.isFrozen).toBe(true);
        });

        test('does not move frozen enemies', () => {
            // Place player on exit tile
            mockGame.grid[4][4] = TILE_TYPES.EXIT;
            mockGame.isPlayerOnExitTile.mockReturnValue(true);

            turnManager.startEnemyTurns();

            // Enemies should be frozen, movement should not be called
            expect(mockCombatManager.handleSingleEnemyMovement).not.toHaveBeenCalled();
        });

        test('keeps enemies unfrozen when player is not on exit tile', () => {
            // Player not on exit tile
            mockGame.isPlayerOnExitTile.mockReturnValue(false);

            turnManager.startEnemyTurns();

            expect(mockEnemy1.isFrozen).toBe(false);
            expect(mockEnemy2.isFrozen).toBe(false);
        });
    });

    describe('1-turn grace period after leaving exit', () => {
        test('keeps enemies frozen for 1 turn after player steps off exit', () => {
            // Turn 1: Player on exit
            mockGame.grid[4][4] = TILE_TYPES.EXIT;
            mockGame.isPlayerOnExitTile.mockReturnValue(true);
            turnManager.startEnemyTurns();

            expect(mockEnemy1.isFrozen).toBe(true);
            expect(mockEnemy2.isFrozen).toBe(true);

            // Turn 2: Player moves off exit (first turn off)
            mockPlayer.x = 4;
            mockPlayer.y = 5;
            mockPlayer.getPosition.mockReturnValue({ x: 4, y: 5 });
            mockGame.grid[4][5] = TILE_TYPES.FLOOR;
            mockGame.isPlayerOnExitTile.mockReturnValue(false);
            turnManager.startEnemyTurns();

            // Enemies should still be frozen (grace period)
            expect(mockEnemy1.isFrozen).toBe(true);
            expect(mockEnemy2.isFrozen).toBe(true);
            expect(mockGame.justLeftExitTile).toBe(false); // Flag cleared after use
        });

        test('unfreezes enemies on second turn after leaving exit', () => {
            // Turn 1: Player on exit
            mockGame.grid[4][4] = TILE_TYPES.EXIT;
            mockGame.isPlayerOnExitTile.mockReturnValue(true);
            turnManager.startEnemyTurns();

            expect(mockEnemy1.isFrozen).toBe(true);

            // Turn 2: Player moves off exit (first turn off - grace period)
            mockPlayer.x = 4;
            mockPlayer.y = 5;
            mockPlayer.getPosition.mockReturnValue({ x: 4, y: 5 });
            mockGame.isPlayerOnExitTile.mockReturnValue(false);
            turnManager.startEnemyTurns();

            expect(mockEnemy1.isFrozen).toBe(true); // Still frozen

            // Turn 3: Second turn off exit (grace period over)
            mockPlayer.x = 4;
            mockPlayer.y = 6;
            mockPlayer.getPosition.mockReturnValue({ x: 4, y: 6 });
            turnManager.startEnemyTurns();

            expect(mockEnemy1.isFrozen).toBe(false); // Now unfrozen
            expect(mockEnemy2.isFrozen).toBe(false);
        });

        test('allows enemy movement after grace period expires', () => {
            // Turn 1: Player on exit
            mockGame.isPlayerOnExitTile.mockReturnValue(true);
            turnManager.startEnemyTurns();

            // Turn 2: First turn off exit
            mockGame.isPlayerOnExitTile.mockReturnValue(false);
            turnManager.startEnemyTurns();
            mockCombatManager.handleSingleEnemyMovement.mockClear();

            // Turn 3: Second turn off exit - enemies should move
            turnManager.startEnemyTurns();

            expect(mockCombatManager.handleSingleEnemyMovement).toHaveBeenCalled();
        });
    });

    describe('Re-entering exit tile', () => {
        test('refreezes enemies if player returns to exit tile', () => {
            // Turn 1: Player on exit
            mockGame.isPlayerOnExitTile.mockReturnValue(true);
            turnManager.startEnemyTurns();

            expect(mockEnemy1.isFrozen).toBe(true);

            // Turn 2: Player moves off exit
            mockGame.isPlayerOnExitTile.mockReturnValue(false);
            turnManager.startEnemyTurns();

            // Turn 3: Player moves back onto exit
            mockGame.isPlayerOnExitTile.mockReturnValue(true);
            turnManager.startEnemyTurns();

            expect(mockEnemy1.isFrozen).toBe(true);
            expect(mockEnemy2.isFrozen).toBe(true);
        });
    });

    describe('GameContext.isPlayerOnExitTile', () => {
        test('returns true when player is on exit tile', () => {
            const gameContext = new GameContext();
            gameContext.player = mockPlayer;
            gameContext.grid = Array(GRID_SIZE).fill().map(() =>
                Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)
            );
            gameContext.grid[4][4] = TILE_TYPES.EXIT;

            expect(gameContext.isPlayerOnExitTile()).toBe(true);
        });

        test('returns false when player is not on exit tile', () => {
            const gameContext = new GameContext();
            gameContext.player = mockPlayer;
            gameContext.grid = Array(GRID_SIZE).fill().map(() =>
                Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)
            );

            expect(gameContext.isPlayerOnExitTile()).toBe(false);
        });

        test('returns false when player or grid is missing', () => {
            const gameContext = new GameContext();

            expect(gameContext.isPlayerOnExitTile()).toBe(false);

            gameContext.player = mockPlayer;
            expect(gameContext.isPlayerOnExitTile()).toBe(false);
        });

        test('handles exit tile as object with type property', () => {
            const gameContext = new GameContext();
            gameContext.player = mockPlayer;
            gameContext.grid = Array(GRID_SIZE).fill().map(() =>
                Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)
            );
            gameContext.grid[4][4] = { type: TILE_TYPES.EXIT };

            expect(gameContext.isPlayerOnExitTile()).toBe(true);
        });
    });

    describe('BaseEnemy initialization', () => {
        test('initializes isFrozen property to false', () => {
            const enemy = new BaseEnemy({
                x: 3,
                y: 3,
                enemyType: 'lizardy',
                id: 'test-enemy'
            });

            expect(enemy.isFrozen).toBe(false);
        });
    });

    describe('Edge cases', () => {
        test('handles empty enemy array', () => {
            mockGame.enemies = [];
            mockGame.isPlayerOnExitTile.mockReturnValue(true);

            expect(() => turnManager.startEnemyTurns()).not.toThrow();
        });

        test('does not affect dead enemies', () => {
            mockEnemy1.isDead.mockReturnValue(true);
            mockGame.isPlayerOnExitTile.mockReturnValue(true);

            turnManager.startEnemyTurns();

            // Dead enemy should not move regardless of frozen state
            expect(mockCombatManager.handleSingleEnemyMovement).not.toHaveBeenCalledWith(mockEnemy1);
        });

        test('handles player attacking scenario', () => {
            mockGame.playerJustAttacked = true;
            mockGame.isPlayerOnExitTile.mockReturnValue(true);

            turnManager.startEnemyTurns();

            // Should return early, not process enemy turns
            expect(mockGame.isPlayerTurn).toBe(true);
        });
    });
});
