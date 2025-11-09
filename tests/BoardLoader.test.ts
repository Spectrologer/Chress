import { BoardLoader } from '@core/BoardLoader';
import { TILE_TYPES } from '@core/constants/index';

describe('BoardLoader', () => {
    let boardLoader;

    beforeEach(() => {
        boardLoader = new BoardLoader();
    });

    describe('Board Registration', () => {
        test('should register a board for a specific zone', () => {
            boardLoader.registerBoard(0, 0, 1, 'museum', 'canon');
            expect(boardLoader.hasBoard(0, 0, 1)).toBe(true);
        });

        test('should not have unregistered boards', () => {
            expect(boardLoader.hasBoard(5, 5, 0)).toBe(false);
        });

        test('should support both canon and custom board types', () => {
            boardLoader.registerBoard(0, 0, 1, 'museum', 'canon');
            boardLoader.registerBoard(5, 5, 0, 'my_zone', 'custom');
            expect(boardLoader.hasBoard(0, 0, 1)).toBe(true);
            expect(boardLoader.hasBoard(5, 5, 0)).toBe(true);
        });

        test('should create unique keys for different dimensions', () => {
            boardLoader.registerBoard(0, 0, 0, 'surface', 'canon');
            boardLoader.registerBoard(0, 0, 1, 'interior', 'canon');
            boardLoader.registerBoard(0, 0, 2, 'underground', 'canon');
            expect(boardLoader.hasBoard(0, 0, 0)).toBe(true);
            expect(boardLoader.hasBoard(0, 0, 1)).toBe(true);
            expect(boardLoader.hasBoard(0, 0, 2)).toBe(true);
        });
    });

    describe('Board Validation', () => {
        test('should validate board with correct structure', () => {
            const validBoard = {
                size: [10, 10],
                terrain: new Array(100).fill('floor'),
                features: {}
            };
            expect(boardLoader.validateBoard(validBoard)).toBe(true);
        });

        test('should reject board without size', () => {
            const invalidBoard = {
                terrain: new Array(100).fill('floor'),
                features: {}
            };
            expect(boardLoader.validateBoard(invalidBoard)).toBe(false);
        });

        test('should reject board with invalid size format', () => {
            const invalidBoard = {
                size: [10], // Should be [width, height]
                terrain: new Array(100).fill('floor'),
                features: {}
            };
            expect(boardLoader.validateBoard(invalidBoard)).toBe(false);
        });

        test('should reject board with mismatched terrain length', () => {
            const invalidBoard = {
                size: [10, 10],
                terrain: new Array(50).fill('floor'), // Should be 100
                features: {}
            };
            expect(boardLoader.validateBoard(invalidBoard)).toBe(false);
        });

        test('should reject board without features', () => {
            const invalidBoard = {
                size: [10, 10],
                terrain: new Array(100).fill('floor')
            };
            expect(boardLoader.validateBoard(invalidBoard)).toBe(false);
        });
    });

    describe('Grid Conversion', () => {
        test('should convert board terrain to grid correctly', () => {
            const boardData = {
                size: [3, 3],
                terrain: [
                    'floor', 'wall', 'floor',
                    'floor', 'floor', 'floor',
                    'wall', 'floor', 'wall'
                ],
                features: {}
            };

            const result = boardLoader.convertBoardToGrid(boardData, []);
            expect(result.grid.length).toBe(3);
            expect(result.grid[0].length).toBe(3);
            expect(result.grid[0][0]).toBe(TILE_TYPES.FLOOR);
            expect(result.grid[0][1]).toBe(TILE_TYPES.WALL);
            expect(result.grid[2][0]).toBe(TILE_TYPES.WALL);
        });

        test('should default null terrain to floor', () => {
            const boardData = {
                size: [2, 2],
                terrain: [null, 'floor', null, 'wall'],
                features: {}
            };

            const result = boardLoader.convertBoardToGrid(boardData, []);
            expect(result.grid[0][0]).toBe(TILE_TYPES.FLOOR); // null -> floor
            expect(result.grid[1][0]).toBe(TILE_TYPES.FLOOR); // null -> floor
            expect(result.grid[1][1]).toBe(TILE_TYPES.WALL);
        });

        test('should place features on top of terrain', () => {
            const boardData = {
                size: [2, 2],
                terrain: ['floor', 'floor', 'floor', 'floor'],
                features: {
                    '0,0': 'wall',
                    '1,1': 'table'
                }
            };

            const result = boardLoader.convertBoardToGrid(boardData, []);
            expect(result.grid[0][0]).toBe(TILE_TYPES.WALL);
            expect(result.grid[1][1]).toBe(TILE_TYPES.TABLE);
        });

        test('should set player spawn from metadata', () => {
            const boardData = {
                size: [5, 5],
                terrain: new Array(25).fill('floor'),
                features: {},
                metadata: {
                    playerSpawn: { x: 2, y: 3 }
                }
            };

            const result = boardLoader.convertBoardToGrid(boardData, []);
            expect(result.playerSpawn).toEqual({ x: 2, y: 3 });
        });

        test('should default player spawn to center when not specified', () => {
            const boardData = {
                size: [10, 10],
                terrain: new Array(100).fill('floor'),
                features: {}
            };

            const result = boardLoader.convertBoardToGrid(boardData, []);
            expect(result.playerSpawn).toEqual({ x: 5, y: 5 });
        });
    });

    describe('Random Item Generation', () => {
        const mockFoodAssets = ['food/apple.png', 'food/bread.png'];

        test('random_item should generate from full pool', () => {
            const results = new Set();
            for (let i = 0; i < 100; i++) {
                const item = boardLoader.generateRandomItem(mockFoodAssets);
                if (item.type) {
                    results.add(item.type);
                } else {
                    results.add(item);
                }
            }

            // Should generate various types
            expect(results.size).toBeGreaterThan(3);
        });

        test('random_item should include food, water, weapons, and notes', () => {
            const results = [];
            for (let i = 0; i < 200; i++) {
                results.push(boardLoader.generateRandomItem(mockFoodAssets));
            }

            const types = results.map(item => item.type || item);
            expect(types).toContain(TILE_TYPES.WATER);
            expect(types).toContain(TILE_TYPES.BOMB);
            expect(types).toContain(TILE_TYPES.NOTE);
            expect(types.some(t => t === TILE_TYPES.FOOD)).toBe(true);
        });

        test('random_radial_item should only generate weapons', () => {
            const weaponTypes = new Set([
                TILE_TYPES.BOMB,
                TILE_TYPES.BISHOP_SPEAR,
                TILE_TYPES.HORSE_ICON,
                TILE_TYPES.BOW,
                TILE_TYPES.SHOVEL,
                TILE_TYPES.BOOK_OF_TIME_TRAVEL,
                TILE_TYPES.FISCHERS_CUBE
            ]);

            for (let i = 0; i < 50; i++) {
                const item = boardLoader.generateRandomRadialItem();
                const type = item.type || item;
                expect(weaponTypes.has(type)).toBe(true);
            }
        });

        test('random_food_water should only generate food or water', () => {
            const results = [];
            for (let i = 0; i < 100; i++) {
                results.push(boardLoader.generateRandomFoodWater(mockFoodAssets));
            }

            const types = results.map(item => item.type || item);
            const validTypes = [TILE_TYPES.FOOD, TILE_TYPES.WATER];
            types.forEach(type => {
                expect(validTypes.includes(type)).toBe(true);
            });
        });

        test('should handle missing food assets gracefully', () => {
            const item = boardLoader.generateRandomItem([]);
            expect(item).not.toBeNull();

            const foodWater = boardLoader.generateRandomFoodWater([]);
            expect(foodWater).toBe(TILE_TYPES.WATER);
        });
    });

    describe('Feature Conversion', () => {
        test('should convert random_item placeholder', () => {
            const tile = boardLoader.convertFeatureToTile('random_item', ['food/apple.png']);
            expect(tile).not.toBeNull();
            expect(tile).toBeDefined();
        });

        test('should convert random_radial_item placeholder', () => {
            const tile = boardLoader.convertFeatureToTile('random_radial_item', []);
            expect(tile).not.toBeNull();
            const type = tile.type || tile;
            expect([
                TILE_TYPES.BOMB,
                TILE_TYPES.BISHOP_SPEAR,
                TILE_TYPES.HORSE_ICON,
                TILE_TYPES.BOW,
                TILE_TYPES.SHOVEL,
                TILE_TYPES.BOOK_OF_TIME_TRAVEL,
                TILE_TYPES.FISCHERS_CUBE
            ]).toContain(type);
        });

        test('should convert random_food_water placeholder', () => {
            const tile = boardLoader.convertFeatureToTile('random_food_water', ['food/apple.png']);
            expect(tile).not.toBeNull();
            const type = tile.type || tile;
            expect([TILE_TYPES.FOOD, TILE_TYPES.WATER]).toContain(type);
        });

        test('should convert standard tile types', () => {
            expect(boardLoader.convertFeatureToTile('wall', [])).toBe(TILE_TYPES.WALL);
            expect(boardLoader.convertFeatureToTile('floor', [])).toBe(TILE_TYPES.FLOOR);
            expect(boardLoader.convertFeatureToTile('table', [])).toBe(TILE_TYPES.TABLE);
            expect(boardLoader.convertFeatureToTile('port', [])).toBe(TILE_TYPES.PORT);
        });

        test('should handle hyphenated feature names', () => {
            const tile = boardLoader.convertFeatureToTile('bishop-spear', []);
            expect(tile).toEqual({ type: TILE_TYPES.BISHOP_SPEAR, uses: 3 });
        });

        test('should return null for unknown features', () => {
            const tile = boardLoader.convertFeatureToTile('unknown_feature', []);
            expect(tile).toBeNull();
        });
    });

    describe('Cache Management', () => {
        test('should clear cache', () => {
            boardLoader.boardCache.set('test', { data: 'test' });
            expect(boardLoader.boardCache.size).toBe(1);

            boardLoader.clearCache();
            expect(boardLoader.boardCache.size).toBe(0);
        });
    });
});
