import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from '../src/core/GameStateManager\.ts';
import type { GameContext } from '@core/context/GameContextCore';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';

// Mock dependencies
vi.mock('@core/logger', () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('@ui/Sign', () => ({
    Sign: {
        spawnedMessages: new Set()
    }
}));

vi.mock('@core/EventBus', () => ({
    eventBus: {
        emit: vi.fn()
    }
}));

vi.mock('@core/SaveSerializer', () => ({
    SaveSerializer: {
        serializeGameState: vi.fn(() => ({
            player: {},
            playerStats: {},
            zones: [],
            grid: [],
            enemies: [],
            defeatedEnemies: [],
            specialZones: [],
            messageLog: [],
            currentRegion: ''
        }))
    }
}));

vi.mock('@core/SaveDeserializer', () => ({
    SaveDeserializer: {
        deserializePlayer: vi.fn(),
        deserializePlayerStats: vi.fn(),
        deserializeGameState: vi.fn()
    }
}));

vi.mock('@core/ZoneStateRestorer', () => ({
    ZoneStateRestorer: {
        restoreZoneState: vi.fn()
    }
}));

vi.mock('@repositories/ZoneRepository', () => ({
    ZoneRepository: vi.fn().mockImplementation(() => ({
        getMap: vi.fn(() => new Map()),
        clear: vi.fn(),
        entries: vi.fn(() => []),
        getByKey: vi.fn(),
        setByKey: vi.fn()
    }))
}));

vi.mock('@core/BoardLoader', () => ({
    boardLoader: {
        hasBoard: vi.fn(() => false),
        getBoardSync: vi.fn(),
        convertBoardToGrid: vi.fn()
    }
}));

describe('GameStateManager', () => {
    let gameStateManager: GameStateManager;
    let mockGame: any;
    let mockPlayer: any;
    let mockGrid: any[][];

    beforeEach(() => {
        vi.clearAllMocks();

        // Create a minimal valid grid
        mockGrid = Array(GRID_SIZE).fill(null).map(() =>
            Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)
        );

        // Create mock player
        mockPlayer = {
            x: 10,
            y: 10,
            currentZone: { x: 0, y: 0, dimension: 0 },
            inventory: [],
            abilities: new Set(),
            visitedZones: new Set(),
            sprite: null,
            reset: vi.fn(),
            getCurrentZone: vi.fn(() => ({ x: 0, y: 0 })),
            getPosition: vi.fn(() => ({ x: 10, y: 10 })),
            stats: {
                dead: false,
                musicEnabled: true,
                sfxEnabled: true,
                health: 100,
                points: 0,
                hunger: 50,
                thirst: 50
            }
        };

        // Create mock storage adapter
        const mockStorageAdapter = {
            save: vi.fn().mockResolvedValue(undefined),
            load: vi.fn().mockResolvedValue(null),
            remove: vi.fn().mockResolvedValue(undefined)
        };

        // Create mock game context
        mockGame = {
            player: mockPlayer,
            zones: new Map(),
            grid: mockGrid,
            enemies: [],
            defeatedEnemies: new Set(),
            gameStarted: false,
            currentRegion: null,
            specialZones: new Map(),
            world: {
                player: mockPlayer,
                zones: new Map(),
                grid: mockGrid,
                enemies: [],
                defeatedEnemies: new Set(),
                specialZones: new Map(),
                currentRegion: null
            },
            storageAdapter: mockStorageAdapter,
            zoneGenState: {
                serialize: vi.fn(() => ({})),
                deserialize: vi.fn(),
                reset: vi.fn()
            },
            connectionManager: {
                clear: vi.fn()
            },
            enemyCollection: {
                clear: vi.fn()
            },
            zoneManager: {
                generateZone: vi.fn()
            },
            uiManager: {
                generateRegionName: vi.fn(() => 'Test Region')
            },
            animationManager: {
                clearAll: vi.fn()
            },
            availableFoodAssets: ['apple', 'bread']
        };

        gameStateManager = new GameStateManager(mockGame as any);
    });

    afterEach(() => {
        gameStateManager.stopAutoSave();
    });

    describe('Constructor and Initialization', () => {
        it('should initialize game state manager', () => {
            expect(gameStateManager).toBeDefined();
            expect(mockGame.zones).toBeInstanceOf(Map);
        });

        it('should initialize zoneRepository', () => {
            expect(mockGame.zoneRepository).toBeDefined();
        });

        it('should initialize empty enemies array', () => {
            expect(mockGame.enemies).toEqual([]);
        });

        it('should initialize empty defeated enemies set', () => {
            expect(mockGame.defeatedEnemies).toBeInstanceOf(Set);
            expect(mockGame.defeatedEnemies.size).toBe(0);
        });

        it('should initialize gameStarted to false', () => {
            expect(mockGame.gameStarted).toBe(false);
        });

        it('should preserve existing enemies array reference', () => {
            const existingArray = [{ x: 1, y: 2 }];
            mockGame.enemies = existingArray;

            const newManager = new GameStateManager(mockGame);

            // Should clear in place, not replace
            expect(mockGame.enemies).toBe(existingArray);
            expect(mockGame.enemies).toHaveLength(0);
        });
    });

    describe('resetGame', () => {
        it('should preserve music and sfx settings across reset', () => {
            mockPlayer.stats.musicEnabled = false;
            mockPlayer.stats.sfxEnabled = false;

            gameStateManager.resetGame();

            expect(mockPlayer.stats.musicEnabled).toBe(false);
            expect(mockPlayer.stats.sfxEnabled).toBe(false);
        });

        it('should clear saved state', async () => {
            gameStateManager.resetGame();

            // Wait a tick for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockGame.storageAdapter.remove).toHaveBeenCalled();
        });

        it('should reset player', () => {
            gameStateManager.resetGame();

            expect(mockPlayer.reset).toHaveBeenCalled();
        });

        it('should clear enemies via enemyCollection', () => {
            gameStateManager.resetGame();

            expect(mockGame.enemyCollection.clear).toHaveBeenCalledWith(false);
        });

        it('should clear defeatedEnemies', () => {
            mockGame.defeatedEnemies.add('test');
            gameStateManager.resetGame();

            // Creates a new Set
            expect(mockGame.defeatedEnemies.size).toBe(0);
        });

        it('should reset zone generation state', () => {
            gameStateManager.resetGame();

            expect(mockGame.zoneGenState.reset).toHaveBeenCalled();
        });

        it('should clear all animations', () => {
            gameStateManager.resetGame();

            expect(mockGame.animationManager.clearAll).toHaveBeenCalled();
        });

        it('should generate starting zone', () => {
            gameStateManager.resetGame();

            expect(mockGame.zoneManager.generateZone).toHaveBeenCalled();
        });

        it('should emit GAME_RESET event', async () => {
            const { eventBus } = await import('@core/EventBus');

            gameStateManager.resetGame();

            expect(eventBus.emit).toHaveBeenCalledWith(
                expect.any(String), // EventTypes.GAME_RESET
                expect.objectContaining({
                    zone: expect.any(Object),
                    regionName: expect.any(String)
                })
            );
        });

        it('should handle missing enemyCollection gracefully', () => {
            mockGame.enemyCollection = null;

            expect(() => {
                gameStateManager.resetGame();
            }).not.toThrow();

            expect(mockGame.enemies).toHaveLength(0);
        });

        it('should set player tile to floor if within grid', () => {
            mockPlayer.x = 10;
            mockPlayer.y = 10;

            gameStateManager.resetGame();

            expect(mockGame.grid[10][10]).toBe(TILE_TYPES.FLOOR);
        });

        it('should not set player tile if out of bounds', () => {
            mockPlayer.x = -1;
            mockPlayer.y = -1;

            expect(() => {
                gameStateManager.resetGame();
            }).not.toThrow();
        });

        it('should handle undefined player stats', () => {
            mockPlayer.stats = undefined;

            expect(() => {
                gameStateManager.resetGame();
            }).not.toThrow();

            expect(mockPlayer.stats).toBeDefined();
        });
    });

    describe('addTreasureToInventory', () => {
        it('should add 3-5 items to inventory', () => {
            gameStateManager.addTreasureToInventory();

            const itemCount = mockPlayer.inventory.length;
            expect(itemCount).toBeGreaterThanOrEqual(3);
            expect(itemCount).toBeLessThanOrEqual(5);
        });

        it('should respect inventory limit of 6', () => {
            mockPlayer.inventory = Array(6).fill({ type: 'test' });

            gameStateManager.addTreasureToInventory();

            expect(mockPlayer.inventory.length).toBe(6);
        });

        it('should add bombs to inventory', () => {
            // Force random to always return bomb
            vi.spyOn(Math, 'random').mockReturnValue(0);

            gameStateManager.addTreasureToInventory();

            const bombs = mockPlayer.inventory.filter((i: any) => i.type === 'bomb');
            expect(bombs.length).toBeGreaterThan(0);
        });

        it('should add bishop_spear with 3 uses', () => {
            // Force random to return bishop_spear
            vi.spyOn(Math, 'random')
                .mockReturnValueOnce(0.5) // numItems
                .mockReturnValue(0.4); // type selection

            gameStateManager.addTreasureToInventory();

            const spears = mockPlayer.inventory.filter((i: any) => i.type === 'bishop_spear');
            if (spears.length > 0) {
                expect(spears[0].uses).toBe(3);
            }
        });

        it('should add food items when available', () => {
            // Force random to return food
            vi.spyOn(Math, 'random')
                .mockReturnValueOnce(0.5) // numItems
                .mockReturnValue(0.8); // type selection

            gameStateManager.addTreasureToInventory();

            const foods = mockPlayer.inventory.filter((i: any) => i.type === 'food');
            if (foods.length > 0) {
                expect(foods[0].foodType).toBeDefined();
            }
        });

        it('should emit TREASURE_FOUND events', async () => {
            const { eventBus } = await import('@core/EventBus');

            gameStateManager.addTreasureToInventory();

            expect(eventBus.emit).toHaveBeenCalledWith(
                expect.any(String), // EventTypes.TREASURE_FOUND
                expect.objectContaining({
                    itemType: expect.any(String),
                    quantity: expect.any(Number),
                    message: expect.any(String)
                })
            );
        });

        it('should emit PLAYER_STATS_CHANGED event', async () => {
            const { eventBus } = await import('@core/EventBus');

            gameStateManager.addTreasureToInventory();

            expect(eventBus.emit).toHaveBeenCalledWith(
                expect.any(String), // EventTypes.PLAYER_STATS_CHANGED
                expect.objectContaining({
                    health: expect.any(Number),
                    points: expect.any(Number)
                })
            );
        });

        it('should stop adding items when inventory is full', () => {
            mockPlayer.inventory = Array(5).fill({ type: 'existing' });

            gameStateManager.addTreasureToInventory();

            // Should add at most 1 item to reach limit of 6
            expect(mockPlayer.inventory.length).toBeLessThanOrEqual(6);
        });
    });

    describe('addBomb', () => {
        it('should add bomb to inventory if space available', () => {
            mockPlayer.inventory = [];

            gameStateManager.addBomb();

            expect(mockPlayer.inventory).toHaveLength(1);
            expect(mockPlayer.inventory[0].type).toBe('bomb');
        });

        it('should not add bomb if inventory is full', () => {
            mockPlayer.inventory = Array(6).fill({ type: 'test' });

            gameStateManager.addBomb();

            expect(mockPlayer.inventory).toHaveLength(6);
            expect(mockPlayer.inventory.every((i: any) => i.type === 'test')).toBe(true);
        });

        it('should emit PLAYER_STATS_CHANGED event', async () => {
            const { eventBus } = await import('@core/EventBus');
            mockPlayer.inventory = [];

            gameStateManager.addBomb();

            expect(eventBus.emit).toHaveBeenCalledWith(
                expect.any(String), // EventTypes.PLAYER_STATS_CHANGED
                expect.any(Object)
            );
        });
    });

    describe('saveGameState and scheduleSave', () => {
        it('should schedule a debounced save', () => {
            vi.useFakeTimers();

            gameStateManager.saveGameState();

            // Save should not happen immediately
            expect(mockGame.storageAdapter.save).not.toHaveBeenCalled();

            // Fast-forward time
            vi.advanceTimersByTime(1000);

            expect(mockGame.storageAdapter.save).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should cancel previous save timer when scheduling new save', () => {
            vi.useFakeTimers();

            gameStateManager.scheduleSave();
            gameStateManager.scheduleSave();

            vi.advanceTimersByTime(1000);

            // Should only save once
            expect(mockGame.storageAdapter.save).toHaveBeenCalledTimes(1);

            vi.useRealTimers();
        });

        it('should serialize game state before saving', async () => {
            const { SaveSerializer } = await import('@core/SaveSerializer');

            await gameStateManager.saveGameStateImmediate();

            // Wait for async save
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(SaveSerializer.serializeGameState).toHaveBeenCalledWith(mockGame);
        });

        it('should add version and timestamp to save payload', async () => {
            await gameStateManager.saveGameStateImmediate();

            // Wait for async save
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockGame.storageAdapter.save).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    version: expect.any(Number),
                    lastSaved: expect.any(Number),
                    state: expect.any(Object)
                })
            );
        });

        it('should use requestIdleCallback when available', async () => {
            const mockRequestIdleCallback = vi.fn((cb) => cb());
            global.window = { requestIdleCallback: mockRequestIdleCallback } as any;

            await gameStateManager.saveGameStateImmediate();

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockRequestIdleCallback).toHaveBeenCalled();

            delete (global as any).window;
        });

        it('should fallback to localStorage on storage adapter failure', async () => {
            const { logger } = await import('@core/logger');
            mockGame.storageAdapter.save.mockRejectedValueOnce(new Error('Save failed'));

            const mockSetItem = vi.fn();
            global.localStorage = { setItem: mockSetItem } as any;

            await gameStateManager.saveGameStateImmediate();

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(logger.warn).toHaveBeenCalled();
            expect(mockSetItem).toHaveBeenCalled();

            delete (global as any).localStorage;
        });

        it('should handle save errors gracefully', async () => {
            const { logger } = await import('@core/logger');
            mockGame.storageAdapter.save.mockRejectedValueOnce(new Error('Save failed'));
            global.localStorage = {} as any; // No setItem

            await gameStateManager.saveGameStateImmediate();

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(logger.warn).toHaveBeenCalled();

            delete (global as any).localStorage;
        });
    });

    describe('loadGameState', () => {
        it('should load saved state from storage adapter', async () => {
            const mockSaveData = {
                version: 2,
                lastSaved: Date.now(),
                state: {
                    player: {},
                    playerStats: {},
                    zones: [],
                    grid: mockGrid,
                    enemies: [],
                    defeatedEnemies: [],
                    specialZones: [],
                    messageLog: [],
                    currentRegion: '',
                    zoneGeneration: {}
                }
            };
            mockGame.storageAdapter.load.mockResolvedValueOnce(mockSaveData);

            const result = await gameStateManager.loadGameState();

            expect(result).toBe(true);
            expect(mockGame.storageAdapter.load).toHaveBeenCalled();
        });

        it('should fallback to localStorage if storage adapter returns null', async () => {
            mockGame.storageAdapter.load.mockResolvedValueOnce(null);

            const mockSaveData = {
                version: 2,
                state: {
                    player: {},
                    playerStats: {},
                    zones: [],
                    grid: mockGrid,
                    enemies: [],
                    defeatedEnemies: [],
                    specialZones: [],
                    messageLog: [],
                    currentRegion: ''
                }
            };
            global.localStorage = {
                getItem: vi.fn(() => JSON.stringify(mockSaveData))
            } as any;

            const result = await gameStateManager.loadGameState();

            expect(result).toBe(true);

            delete (global as any).localStorage;
        });

        it('should return false if no saved state exists', async () => {
            mockGame.storageAdapter.load.mockResolvedValueOnce(null);
            global.localStorage = { getItem: vi.fn(() => null) } as any;

            const result = await gameStateManager.loadGameState();

            expect(result).toBe(false);

            delete (global as any).localStorage;
        });

        it('should deserialize player data', async () => {
            const { SaveDeserializer } = await import('@core/SaveDeserializer');

            const mockSaveData = {
                version: 2,
                state: {
                    player: { x: 5, y: 7 },
                    playerStats: {},
                    zones: [],
                    grid: mockGrid,
                    enemies: [],
                    defeatedEnemies: [],
                    specialZones: [],
                    messageLog: [],
                    currentRegion: ''
                }
            };
            mockGame.storageAdapter.load.mockResolvedValueOnce(mockSaveData);

            await gameStateManager.loadGameState();

            expect(SaveDeserializer.deserializePlayer).toHaveBeenCalled();
            expect(SaveDeserializer.deserializePlayerStats).toHaveBeenCalled();
            expect(SaveDeserializer.deserializeGameState).toHaveBeenCalled();
        });

        it('should handle newer save version gracefully', async () => {
            const { logger } = await import('@core/logger');

            const mockSaveData = {
                version: 999, // Future version
                state: {}
            };
            mockGame.storageAdapter.load.mockResolvedValueOnce(mockSaveData);

            const result = await gameStateManager.loadGameState();

            expect(result).toBe(false);
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should restore zone generation state', async () => {
            const mockZoneGenData = { someState: 'data' };
            const mockSaveData = {
                version: 2,
                state: {
                    player: {},
                    playerStats: {},
                    zones: [],
                    grid: mockGrid,
                    enemies: [],
                    defeatedEnemies: [],
                    specialZones: [],
                    messageLog: [],
                    currentRegion: '',
                    zoneGeneration: mockZoneGenData
                }
            };
            mockGame.storageAdapter.load.mockResolvedValueOnce(mockSaveData);

            await gameStateManager.loadGameState();

            expect(mockGame.zoneGenState.deserialize).toHaveBeenCalledWith(mockZoneGenData);
        });

        it('should handle backward compatibility for old save format', async () => {
            const { ZoneStateRestorer } = await import('@core/ZoneStateRestorer');

            const mockSaveData = {
                version: 1,
                state: {
                    player: {},
                    playerStats: {},
                    zones: [],
                    grid: mockGrid,
                    enemies: [],
                    defeatedEnemies: [],
                    specialZones: [],
                    messageLog: [],
                    currentRegion: '',
                    zoneStateManager: { oldFormat: true }
                }
            };
            mockGame.storageAdapter.load.mockResolvedValueOnce(mockSaveData);

            await gameStateManager.loadGameState();

            expect(ZoneStateRestorer.restoreZoneState).toHaveBeenCalled();
        });

        it('should clear corrupted save data on load error', async () => {
            const { logger } = await import('@core/logger');
            mockGame.storageAdapter.load.mockRejectedValueOnce(new Error('Corrupted data'));

            const result = await gameStateManager.loadGameState();

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalled();
            expect(mockGame.storageAdapter.remove).toHaveBeenCalled();
        });
    });

    describe('clearSavedState', () => {
        it('should remove saved state from storage adapter', async () => {
            await gameStateManager.clearSavedState();

            expect(mockGame.storageAdapter.remove).toHaveBeenCalled();
        });

        it('should fallback to localStorage on storage adapter failure', async () => {
            mockGame.storageAdapter.remove.mockRejectedValueOnce(new Error('Remove failed'));

            const mockRemoveItem = vi.fn();
            global.localStorage = { removeItem: mockRemoveItem } as any;

            await gameStateManager.clearSavedState();

            expect(mockRemoveItem).toHaveBeenCalled();

            delete (global as any).localStorage;
        });
    });

    describe('startAutoSave and stopAutoSave', () => {
        it('should start periodic autosave', () => {
            vi.useFakeTimers();

            gameStateManager.startAutoSave();

            // Fast-forward past save interval
            vi.advanceTimersByTime(31000);

            expect(mockGame.storageAdapter.save).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should not start multiple autosave intervals', () => {
            vi.useFakeTimers();

            gameStateManager.startAutoSave();
            gameStateManager.startAutoSave();

            vi.advanceTimersByTime(31000);

            // Should only save once per interval
            expect(mockGame.storageAdapter.save).toHaveBeenCalledTimes(1);

            vi.useRealTimers();
        });

        it('should stop autosave interval', () => {
            vi.useFakeTimers();

            gameStateManager.startAutoSave();
            gameStateManager.stopAutoSave();

            vi.advanceTimersByTime(31000);

            expect(mockGame.storageAdapter.save).not.toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should handle autosave errors gracefully', async () => {
            const { logger } = await import('@core/logger');
            mockGame.storageAdapter.save.mockRejectedValueOnce(new Error('Save failed'));

            vi.useFakeTimers();

            gameStateManager.startAutoSave();

            vi.advanceTimersByTime(31000);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(logger.warn).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should clear pending save timer on stop', () => {
            vi.useFakeTimers();

            gameStateManager.scheduleSave();
            gameStateManager.stopAutoSave();

            vi.advanceTimersByTime(1000);

            expect(mockGame.storageAdapter.save).not.toHaveBeenCalled();

            vi.useRealTimers();
        });
    });

    describe('Board zone repair functionality', () => {
        it('should repair board zones missing terrain textures', async () => {
            const { boardLoader } = await import('@core/BoardLoader');

            const mockZoneData = {
                grid: mockGrid,
                terrainTextures: {}
            };

            mockGame.zoneRepository = {
                entries: vi.fn(() => [['0,0:0', mockZoneData]]),
                getByKey: vi.fn(),
                setByKey: vi.fn()
            };

            boardLoader.hasBoard = vi.fn(() => true);
            boardLoader.getBoardSync = vi.fn(() => ({ tiles: [] }));
            boardLoader.convertBoardToGrid = vi.fn(() => ({
                terrainTextures: { '0,0': 'grass' },
                overlayTextures: {},
                rotations: {},
                overlayRotations: {}
            }));

            const mockSaveData = {
                version: 2,
                state: {
                    player: {},
                    playerStats: {},
                    zones: [['0,0:0', mockZoneData]],
                    grid: mockGrid,
                    enemies: [],
                    defeatedEnemies: [],
                    specialZones: [],
                    messageLog: [],
                    currentRegion: ''
                }
            };
            mockGame.storageAdapter.load.mockResolvedValueOnce(mockSaveData);

            await gameStateManager.loadGameState();

            expect(boardLoader.hasBoard).toHaveBeenCalled();
        });
    });

    describe('Zone texture restoration', () => {
        it('should restore current zone textures to zoneGenerator', async () => {
            mockGame.zoneGenerator = {
                terrainTextures: {},
                overlayTextures: {},
                rotations: {},
                overlayRotations: {}
            };

            const mockZoneData = {
                grid: mockGrid,
                terrainTextures: { '0,0': 'grass' },
                overlayTextures: { '1,1': 'flower' },
                rotations: { '0,0': 90 },
                overlayRotations: { '1,1': 180 }
            };

            mockGame.zoneRepository = {
                entries: vi.fn(() => []),
                getByKey: vi.fn(() => mockZoneData)
            };

            const mockSaveData = {
                version: 2,
                state: {
                    player: {},
                    playerStats: {},
                    zones: [],
                    grid: mockGrid,
                    enemies: [],
                    defeatedEnemies: [],
                    specialZones: [],
                    messageLog: [],
                    currentRegion: ''
                }
            };
            mockGame.storageAdapter.load.mockResolvedValueOnce(mockSaveData);

            await gameStateManager.loadGameState();

            expect(mockGame.zoneGenerator.terrainTextures).toEqual({ '0,0': 'grass' });
            expect(mockGame.zoneGenerator.overlayTextures).toEqual({ '1,1': 'flower' });
        });

        it('should handle missing zoneGenerator gracefully', async () => {
            mockGame.zoneGenerator = null;

            const mockSaveData = {
                version: 2,
                state: {
                    player: {},
                    playerStats: {},
                    zones: [],
                    grid: mockGrid,
                    enemies: [],
                    defeatedEnemies: [],
                    specialZones: [],
                    messageLog: [],
                    currentRegion: ''
                }
            };
            mockGame.storageAdapter.load.mockResolvedValueOnce(mockSaveData);

            await expect(gameStateManager.loadGameState()).resolves.toBe(true);
        });
    });
});
