import { ZoneGenerator } from '@core/ZoneGenerator.js';
import { boardLoader } from '@core/BoardLoader.js';
import { TILE_TYPES } from '@core/constants/index.js';

describe('ZoneGenerator - Custom Board Integration', () => {
    let mockGame;
    let zoneGenerator;

    beforeEach(() => {
        // Clear board registry before each test
        boardLoader.boardRegistry.clear();
        boardLoader.boardCache.clear();

        mockGame = {
            player: {
                currentZone: { depth: 1 },
                undergroundDepth: 1
            },
            grid: Array(10).fill().map(() => Array(10).fill(TILE_TYPES.FLOOR))
        };

        zoneGenerator = new ZoneGenerator(mockGame);
    });

    describe('Board Detection', () => {
        test('should use custom board when registered for zone', () => {
            // Register a test board
            boardLoader.registerBoard(0, 0, 1, 'test_board', 'custom');

            // Pre-cache a mock board
            boardLoader.boardCache.set('custom/test_board', {
                size: [3, 3],
                terrain: new Array(9).fill('floor'),
                features: {
                    '1,1': 'table'
                }
            });

            const existingZones = new Map();
            const result = zoneGenerator.generateZone(0, 0, 1, existingZones, new Map(), [], null);

            expect(result).toBeDefined();
            expect(result.grid).toBeDefined();
            expect(result.grid.length).toBe(3);
        });

        test('should fallback to procedural generation when board not found', () => {
            const existingZones = new Map();
            const result = zoneGenerator.generateZone(5, 5, 1, existingZones, new Map(), [], null);

            expect(result).toBeDefined();
            expect(result.grid).toBeDefined();
        });

        test('should not use board for unregistered zones', () => {
            boardLoader.registerBoard(0, 0, 1, 'test_board', 'custom');

            const existingZones = new Map();
            const result = zoneGenerator.generateZone(1, 1, 1, existingZones, new Map(), [], null);

            expect(result).toBeDefined();
        });
    });

    describe('Board Loading with Features', () => {
        test('should load board with NPCs', () => {
            boardLoader.registerBoard(0, 0, 1, 'npc_test', 'custom');
            boardLoader.boardCache.set('custom/npc_test', {
                size: [5, 5],
                terrain: new Array(25).fill('floor'),
                features: {
                    '2,2': 'crayn',
                    '3,3': 'felt'
                }
            });

            const existingZones = new Map();
            const result = zoneGenerator.generateZone(0, 0, 1, existingZones, new Map(), [], null);

            expect(result.grid[2][2]).toBe(TILE_TYPES.CRAYN);
            expect(result.grid[3][3]).toBe(TILE_TYPES.FELT);
        });

        test('should load board with structures', () => {
            boardLoader.registerBoard(0, 0, 1, 'structure_test', 'custom');
            boardLoader.boardCache.set('custom/structure_test', {
                size: [5, 5],
                terrain: new Array(25).fill('floor'),
                features: {
                    '1,1': 'table',
                    '2,2': 'well',
                    '3,3': 'port'
                }
            });

            const existingZones = new Map();
            const result = zoneGenerator.generateZone(0, 0, 1, existingZones, new Map(), [], null);

            expect(result.grid[1][1]).toBe(TILE_TYPES.TABLE);
            expect(result.grid[2][2]).toBe(TILE_TYPES.WELL);
            expect(result.grid[3][3]).toBe(TILE_TYPES.PORT);
        });

        test('should handle random items in custom boards', () => {
            boardLoader.registerBoard(0, 0, 1, 'random_test', 'custom');
            boardLoader.boardCache.set('custom/random_test', {
                size: [5, 5],
                terrain: new Array(25).fill('floor'),
                features: {
                    '1,1': 'random_item',
                    '2,2': 'random_radial_item',
                    '3,3': 'random_food_water'
                }
            });

            const existingZones = new Map();
            const foodAssets = ['food/apple.png', 'food/bread.png'];
            const result = zoneGenerator.generateZone(0, 0, 1, existingZones, new Map(), foodAssets, null);

            // Should have spawned items (not null)
            expect(result.grid[1][1]).not.toBeNull();
            expect(result.grid[2][2]).not.toBeNull();
            expect(result.grid[3][3]).not.toBeNull();
        });
    });

    describe('Player Spawn Handling', () => {
        test('should use player spawn from board metadata', () => {
            boardLoader.registerBoard(0, 0, 1, 'spawn_test', 'custom');
            boardLoader.boardCache.set('custom/spawn_test', {
                size: [5, 5],
                terrain: new Array(25).fill('floor'),
                features: {},
                metadata: {
                    playerSpawn: { x: 2, y: 3 }
                }
            });

            const existingZones = new Map();
            const result = zoneGenerator.generateZone(0, 0, 1, existingZones, new Map(), [], null);

            expect(result.playerSpawn).toEqual({ x: 2, y: 3 });
        });

        test('should default player spawn to center when not specified', () => {
            boardLoader.registerBoard(0, 0, 1, 'default_spawn', 'custom');
            boardLoader.boardCache.set('custom/default_spawn', {
                size: [10, 10],
                terrain: new Array(100).fill('floor'),
                features: {}
            });

            const existingZones = new Map();
            const result = zoneGenerator.generateZone(0, 0, 1, existingZones, new Map(), [], null);

            expect(result.playerSpawn).toEqual({ x: 5, y: 5 });
        });
    });

    describe('Dimension Specific Boards', () => {
        test('should load different boards for different dimensions', () => {
            // Register boards for each dimension
            boardLoader.registerBoard(0, 0, 0, 'surface_board', 'custom');
            boardLoader.registerBoard(0, 0, 1, 'interior_board', 'custom');
            boardLoader.registerBoard(0, 0, 2, 'underground_board', 'custom');

            boardLoader.boardCache.set('custom/surface_board', {
                size: [3, 3],
                terrain: new Array(9).fill('floor'),
                features: { '1,1': 'rock' }
            });

            boardLoader.boardCache.set('custom/interior_board', {
                size: [3, 3],
                terrain: new Array(9).fill('floor'),
                features: { '1,1': 'table' }
            });

            boardLoader.boardCache.set('custom/underground_board', {
                size: [3, 3],
                terrain: new Array(9).fill('floor'),
                features: { '1,1': 'cistern' }
            });

            const existingZones = new Map();

            // Test surface
            const surface = zoneGenerator.generateZone(0, 0, 0, existingZones, new Map(), [], null);
            expect(surface.grid[1][1]).toBe(TILE_TYPES.ROCK);

            // Test interior
            const interior = zoneGenerator.generateZone(0, 0, 1, existingZones, new Map(), [], null);
            expect(interior.grid[1][1]).toBe(TILE_TYPES.TABLE);

            // Test underground
            const underground = zoneGenerator.generateZone(0, 0, 2, existingZones, new Map(), [], null);
            expect(underground.grid[1][1]).toBe(TILE_TYPES.CISTERN);
        });
    });

    describe('Existing Zone Caching', () => {
        test('should return existing zone instead of regenerating', () => {
            const existingZone = {
                grid: Array(5).fill().map(() => Array(5).fill(TILE_TYPES.WALL)),
                playerSpawn: { x: 2, y: 2 },
                enemies: []
            };

            const existingZones = new Map();
            const zoneKey = '0,0:1:z-1';
            existingZones.set(zoneKey, existingZone);

            const result = zoneGenerator.generateZone(0, 0, 1, existingZones, new Map(), [], null);

            expect(result).toBe(existingZone);
        });
    });

    describe('Canon vs Custom Boards', () => {
        test('should load canon boards from canon folder', () => {
            boardLoader.registerBoard(0, 0, 1, 'museum', 'canon');
            boardLoader.boardCache.set('canon/museum', {
                size: [5, 5],
                terrain: new Array(25).fill('floor'),
                features: {}
            });

            expect(boardLoader.hasBoard(0, 0, 1)).toBe(true);
        });

        test('should load custom boards from custom folder', () => {
            boardLoader.registerBoard(5, 5, 0, 'my_level', 'custom');
            boardLoader.boardCache.set('custom/my_level', {
                size: [5, 5],
                terrain: new Array(25).fill('floor'),
                features: {}
            });

            expect(boardLoader.hasBoard(5, 5, 0)).toBe(true);
        });
    });
});
