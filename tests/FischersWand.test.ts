import { FischersCubeEffect } from '@managers/inventory/effects/SpecialEffects';
import { TILE_TYPES } from '@core/constants/index';
import { ItemMetadata } from '@managers/inventory/ItemMetadata';
import type { Game } from '@managers/inventory/effects/BaseItemEffect';
import type { FischersCubeItem } from '@managers/inventory/ItemMetadata';

describe('FischersCubeEffect', () => {
    let effect: FischersCubeEffect;
    let mockGame: Partial<Game>;
    let mockPlayer: any;
    let mockGrid: number[][];
    let mockEnemies: any[];
    let mockNPCs: any[];

    beforeEach(() => {
        effect = new FischersCubeEffect();

        // Create a simple 10x10 grid for testing
        mockGrid = Array(10).fill(null).map(() => Array(10).fill(TILE_TYPES.FLOOR));

        // Add some walls
        mockGrid[0][0] = TILE_TYPES.WALL;
        mockGrid[0][1] = TILE_TYPES.WALL;

        // Add some rocks (avoid overlap with enemies)
        mockGrid[2][2] = TILE_TYPES.ROCK;
        mockGrid[3][3] = TILE_TYPES.ROCK;

        // Add some items
        mockGrid[4][4] = TILE_TYPES.FOOD;
        mockGrid[5][5] = TILE_TYPES.BOMB;

        // Create mock player
        mockPlayer = {
            x: 5,
            y: 5,
            getPosition: vi.fn(() => ({ x: 5, y: 5 }))
        };

        // Create mock enemies (different positions from rocks)
        mockEnemies = [
            { x: 1, y: 1, type: 'enemy' },
            { x: 6, y: 7, type: 'enemy' },
            { x: 7, y: 8, type: 'enemy' }
        ];

        // Create mock NPCs
        mockNPCs = [
            { x: 6, y: 6, type: 'npc', name: 'Penne' }
        ];

        // Create mock game
        mockGame = {
            player: mockPlayer,
            grid: mockGrid,
            enemies: mockEnemies,
            npcs: mockNPCs,
            startEnemyTurns: vi.fn()
        };
    });

    describe('Constructor', () => {
        test('should create FischersCubeEffect instance', () => {
            expect(effect).toBeDefined();
            expect(effect).toBeInstanceOf(FischersCubeEffect);
        });
    });

    describe('apply()', () => {
        test('should shuffle entity positions', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            // Store original positions
            const originalPlayerPos = { x: mockPlayer.x, y: mockPlayer.y };
            const originalEnemyPositions = mockEnemies.map(e => ({ x: e.x, y: e.y }));
            const originalNPCPositions = mockNPCs.map(n => ({ x: n.x, y: n.y }));

            const result = effect.apply(mockGame as Game, item, {});

            expect(result.success).toBe(true);
            expect(result.consumed).toBe(true);
            expect(result.uses).toBe(1);

            // Verify at least one entity moved (with very high probability)
            const playerMoved = mockPlayer.x !== originalPlayerPos.x || mockPlayer.y !== originalPlayerPos.y;
            const enemiesMoved = mockEnemies.some((e, i) =>
                e.x !== originalEnemyPositions[i].x || e.y !== originalEnemyPositions[i].y
            );
            const npcsMoved = mockNPCs.some((n, i) =>
                n.x !== originalNPCPositions[i].x || n.y !== originalNPCPositions[i].y
            );

            // At least one entity should have moved (statistically almost certain with shuffle)
            expect(playerMoved || enemiesMoved || npcsMoved).toBe(true);
        });

        test('should not move walls or exits', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            // Add exit to grid
            mockGrid[9][9] = TILE_TYPES.EXIT;

            effect.apply(mockGame as Game, item, {});

            // Walls and exits should remain in place
            expect(mockGrid[0][0]).toBe(TILE_TYPES.WALL);
            expect(mockGrid[0][1]).toBe(TILE_TYPES.WALL);
            expect(mockGrid[9][9]).toBe(TILE_TYPES.EXIT);
        });

        test('should preserve entity count', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            const originalEnemyCount = mockEnemies.length;
            const originalNPCCount = mockNPCs.length;

            effect.apply(mockGame as Game, item, {});

            // All entities should still exist
            expect(mockEnemies.length).toBe(originalEnemyCount);
            expect(mockNPCs.length).toBe(originalNPCCount);
        });

        test('should call startEnemyTurns after shuffle', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            effect.apply(mockGame as Game, item, {});

            expect(mockGame.startEnemyTurns).toHaveBeenCalledTimes(1);
        });

        test('should handle empty zone gracefully', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            // Create empty game state (only player)
            mockGame.enemies = [];
            mockGame.npcs = [];
            mockGrid = Array(10).fill(null).map(() => Array(10).fill(TILE_TYPES.FLOOR));
            mockGame.grid = mockGrid;

            const result = effect.apply(mockGame as Game, item, {});

            // Should still succeed with just the player
            expect(result.success).toBe(true);
            expect(result.consumed).toBe(true);
        });

        test('should shuffle rocks and shrubbery', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            // Count original rocks and shrubbery (from beforeEach: rocks at 2,2 and 3,3)
            const originalRockPositions: Array<{x: number, y: number}> = [];
            const originalShrubPositions: Array<{x: number, y: number}> = [];

            // Find original positions
            for (let y = 0; y < mockGrid.length; y++) {
                for (let x = 0; x < mockGrid[y].length; x++) {
                    if (mockGrid[y][x] === TILE_TYPES.ROCK) {
                        originalRockPositions.push({ x, y });
                    }
                    if (mockGrid[y][x] === TILE_TYPES.SHRUBBERY) {
                        originalShrubPositions.push({ x, y });
                    }
                }
            }

            // Add shrubbery for testing
            mockGrid[8][8] = TILE_TYPES.SHRUBBERY;
            originalShrubPositions.push({ x: 8, y: 8 });

            effect.apply(mockGame as Game, item, {});

            // Count rocks and shrubbery after shuffle
            let rockCount = 0;
            let shrubCount = 0;
            for (let y = 0; y < mockGrid.length; y++) {
                for (let x = 0; x < mockGrid[y].length; x++) {
                    if (mockGrid[y][x] === TILE_TYPES.ROCK) rockCount++;
                    if (mockGrid[y][x] === TILE_TYPES.SHRUBBERY) shrubCount++;
                }
            }

            // Same count should exist
            expect(rockCount).toBe(originalRockPositions.length);
            expect(shrubCount).toBe(originalShrubPositions.length);
        });

        test('should handle game without startEnemyTurns method', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            // Remove startEnemyTurns method
            delete mockGame.startEnemyTurns;

            // Should not throw error
            expect(() => {
                effect.apply(mockGame as Game, item, {});
            }).not.toThrow();
        });

        test('should handle game with multiple NPC arrays', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            // Add merchants and tutorial NPCs
            (mockGame as any).merchants = [{ x: 7, y: 7, type: 'merchant' }];
            (mockGame as any).tutorialNPCs = [{ x: 8, y: 8, type: 'tutorial' }];

            const result = effect.apply(mockGame as Game, item, {});

            expect(result.success).toBe(true);
            expect(result.consumed).toBe(true);

            // Verify merchants and tutorial NPCs have valid positions
            const merchants = (mockGame as any).merchants;
            const tutorialNPCs = (mockGame as any).tutorialNPCs;

            expect(merchants[0]).toHaveProperty('x');
            expect(merchants[0]).toHaveProperty('y');
            expect(tutorialNPCs[0]).toHaveProperty('x');
            expect(tutorialNPCs[0]).toHaveProperty('y');
        });

        test('should shuffle items on the ground', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            // Clear pre-existing items from beforeEach
            mockGrid[4][4] = TILE_TYPES.FLOOR;
            mockGrid[5][5] = TILE_TYPES.FLOOR;

            // Add test items to clean positions
            mockGrid[1][5] = TILE_TYPES.FOOD;
            mockGrid[2][5] = TILE_TYPES.BOMB;
            mockGrid[3][5] = TILE_TYPES.HEART;

            const result = effect.apply(mockGame as Game, item, {});

            expect(result.success).toBe(true);
            expect(result.consumed).toBe(true);

            // Count each item type after shuffle
            let foodCount = 0;
            let bombCount = 0;
            let heartCount = 0;

            for (let y = 0; y < mockGrid.length; y++) {
                for (let x = 0; x < mockGrid[y].length; x++) {
                    const tile = mockGrid[y][x];
                    if (tile === TILE_TYPES.FOOD) foodCount++;
                    if (tile === TILE_TYPES.BOMB) bombCount++;
                    if (tile === TILE_TYPES.HEART) heartCount++;
                }
            }

            // Verify all items still exist after shuffle
            expect(foodCount).toBe(1);
            expect(bombCount).toBe(1);
            expect(heartCount).toBe(1);
        });
    });

    describe('Integration with ItemMetadata', () => {
        test('should have correct default uses', () => {
            const item = ItemMetadata.normalizeItem({ type: 'fischers_cube' });

            expect(item.uses).toBe(1);
        });

        test('should have correct tooltip', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            const tooltip = ItemMetadata.getTooltipText(item);

            expect(tooltip).toContain('Fischer\'s Cube');
            expect(tooltip).toContain('Shuffles all enemies and obstacles');
            expect(tooltip).toContain('1 charges');
        });

        test('should have correct image key', () => {
            const item: FischersCubeItem = { type: 'fischers_cube', uses: 1 };

            const imageKey = ItemMetadata.getImageKey(item);

            expect(imageKey).toBe('doodads/cube');
        });

        test('should be stackable', () => {
            expect(ItemMetadata.isStackable('fischers_cube')).toBe(true);
        });

        test('should be radial type', () => {
            expect(ItemMetadata.isRadialType('fischers_cube')).toBe(true);
        });
    });
});
