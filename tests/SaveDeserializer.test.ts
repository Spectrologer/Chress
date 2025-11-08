import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SaveDeserializer } from '../src/core/SaveDeserializer\.ts';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';
import type { GameContext } from '@core/context/GameContextCore';
import type { SavedPlayerData, SavedPlayerStats, SaveGameData } from '@core/SharedTypes';

// Mock dependencies
vi.mock('@ui/Sign', () => ({
    Sign: {
        spawnedMessages: new Set()
    }
}));

vi.mock('@generators/GeneratorUtils', () => ({
    validateLoadedGrid: vi.fn((grid) => grid || [])
}));

vi.mock('@core/logger', () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn()
    }
}));

describe('SaveDeserializer', () => {
    let mockGame: any;
    let mockPlayer: any;
    let mockGrid: any[][];

    beforeEach(() => {
        vi.clearAllMocks();

        // Create a minimal valid grid
        mockGrid = Array(GRID_SIZE).fill(null).map(() =>
            Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)
        );

        // Create mock player with all required methods
        mockPlayer = {
            x: 0,
            y: 0,
            currentZone: { x: 0, y: 0, dimension: 0 },
            inventory: [],
            abilities: new Set(),
            visitedZones: new Set(),
            sprite: null,
            setThirst: vi.fn(),
            setHunger: vi.fn(),
            setHealth: vi.fn(),
            setPoints: vi.fn(),
            setSpentDiscoveries: vi.fn(),
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

        // Create mock Enemy constructor
        const MockEnemy = vi.fn((data) => ({
            ...data,
            isEnemy: true
        }));

        // Create mock game context
        mockGame = {
            world: {
                player: mockPlayer,
                zones: new Map(),
                grid: mockGrid,
                enemies: [],
                defeatedEnemies: new Set(),
                specialZones: new Map(),
                currentRegion: null
            },
            Enemy: MockEnemy,
            messageLog: []
        };
    });

    describe('deserializePlayer', () => {
        it('should restore all player properties correctly', () => {
            const playerData: SavedPlayerData = {
                x: 5,
                y: 7,
                currentZone: { x: 1, y: 2, dimension: 0 },
                thirst: 35,
                hunger: 45,
                inventory: [{ type: 'bow' }, { type: 'food', foodType: 'apple' }],
                abilities: ['axe', 'hammer'],
                health: 80,
                dead: false,
                sprite: 'player_sprite',
                points: 1250,
                visitedZones: ['0,0:0', '1,0:0', '0,1:0'],
                spentDiscoveries: 3
            };

            SaveDeserializer.deserializePlayer(mockGame, playerData);

            expect(mockPlayer.x).toBe(5);
            expect(mockPlayer.y).toBe(7);
            expect(mockPlayer.currentZone).toEqual({ x: 1, y: 2, dimension: 0 });
            expect(mockPlayer.setThirst).toHaveBeenCalledWith(35);
            expect(mockPlayer.setHunger).toHaveBeenCalledWith(45);
            expect(mockPlayer.setHealth).toHaveBeenCalledWith(80);
            expect(mockPlayer.setPoints).toHaveBeenCalledWith(1250);
            expect(mockPlayer.setSpentDiscoveries).toHaveBeenCalledWith(3);
            expect(mockPlayer.stats.dead).toBe(false);
            expect(mockPlayer.sprite).toBe('player_sprite');
        });

        it('should restore inventory correctly', () => {
            const playerData: SavedPlayerData = {
                x: 0,
                y: 0,
                currentZone: { x: 0, y: 0, dimension: 0 },
                thirst: 50,
                hunger: 50,
                inventory: [
                    { type: 'bomb' },
                    { type: 'bishop_spear', uses: 3 },
                    { type: 'food', foodType: 'bread', healing: 10 }
                ],
                abilities: [],
                health: 100,
                dead: false,
                sprite: null,
                points: 0,
                visitedZones: [],
                spentDiscoveries: 0
            };

            SaveDeserializer.deserializePlayer(mockGame, playerData);

            expect(mockPlayer.inventory).toHaveLength(3);
            expect(mockPlayer.inventory[0].type).toBe('bomb');
            expect(mockPlayer.inventory[1].uses).toBe(3);
            expect(mockPlayer.inventory[2].healing).toBe(10);
        });

        it('should convert abilities array to Set', () => {
            const playerData: SavedPlayerData = {
                x: 0,
                y: 0,
                currentZone: { x: 0, y: 0, dimension: 0 },
                thirst: 50,
                hunger: 50,
                inventory: [],
                abilities: ['axe', 'hammer', 'bow'],
                health: 100,
                dead: false,
                sprite: null,
                points: 0,
                visitedZones: [],
                spentDiscoveries: 0
            };

            SaveDeserializer.deserializePlayer(mockGame, playerData);

            expect(mockPlayer.abilities).toBeInstanceOf(Set);
            expect(mockPlayer.abilities.size).toBe(3);
            expect(mockPlayer.abilities.has('axe')).toBe(true);
            expect(mockPlayer.abilities.has('hammer')).toBe(true);
            expect(mockPlayer.abilities.has('bow')).toBe(true);
        });

        it('should handle null/undefined abilities array', () => {
            const playerData: SavedPlayerData = {
                x: 0,
                y: 0,
                currentZone: { x: 0, y: 0, dimension: 0 },
                thirst: 50,
                hunger: 50,
                inventory: [],
                abilities: null as any,
                health: 100,
                dead: false,
                sprite: null,
                points: 0,
                visitedZones: [],
                spentDiscoveries: 0
            };

            SaveDeserializer.deserializePlayer(mockGame, playerData);

            expect(mockPlayer.abilities).toBeInstanceOf(Set);
            expect(mockPlayer.abilities.size).toBe(0);
        });

        it('should convert visitedZones array to Set', () => {
            const playerData: SavedPlayerData = {
                x: 0,
                y: 0,
                currentZone: { x: 0, y: 0, dimension: 0 },
                thirst: 50,
                hunger: 50,
                inventory: [],
                abilities: [],
                health: 100,
                dead: false,
                sprite: null,
                points: 0,
                visitedZones: ['0,0:0', '1,0:0', '0,1:0', '1,1:0'],
                spentDiscoveries: 0
            };

            SaveDeserializer.deserializePlayer(mockGame, playerData);

            expect(mockPlayer.visitedZones).toBeInstanceOf(Set);
            expect(mockPlayer.visitedZones.size).toBe(4);
            expect(mockPlayer.visitedZones.has('0,0:0')).toBe(true);
            expect(mockPlayer.visitedZones.has('1,1:0')).toBe(true);
        });

        it('should handle null playerData gracefully', () => {
            expect(() => {
                SaveDeserializer.deserializePlayer(mockGame, null as any);
            }).not.toThrow();

            // Player should remain unchanged
            expect(mockPlayer.x).toBe(0);
        });

        it('should handle missing player object', () => {
            mockGame.world.player = null;

            expect(() => {
                SaveDeserializer.deserializePlayer(mockGame, {} as any);
            }).not.toThrow();
        });
    });

    describe('deserializePlayerStats', () => {
        it('should restore music and sfx settings', () => {
            const statsData: SavedPlayerStats = {
                musicEnabled: false,
                sfxEnabled: true
            };

            SaveDeserializer.deserializePlayerStats(mockGame, statsData);

            expect(mockPlayer.stats.musicEnabled).toBe(false);
            expect(mockPlayer.stats.sfxEnabled).toBe(true);
        });

        it('should use default true for undefined settings', () => {
            const statsData: Partial<SavedPlayerStats> = {};

            SaveDeserializer.deserializePlayerStats(mockGame, statsData as any);

            expect(mockPlayer.stats.musicEnabled).toBe(true);
            expect(mockPlayer.stats.sfxEnabled).toBe(true);
        });

        it('should coerce non-boolean values to boolean', () => {
            const statsData = {
                musicEnabled: 1,
                sfxEnabled: 0
            } as any;

            SaveDeserializer.deserializePlayerStats(mockGame, statsData);

            expect(mockPlayer.stats.musicEnabled).toBe(true);
            expect(mockPlayer.stats.sfxEnabled).toBe(false);
        });

        it('should handle null statsData gracefully', () => {
            expect(() => {
                SaveDeserializer.deserializePlayerStats(mockGame, null as any);
            }).not.toThrow();

            // Stats should remain unchanged
            expect(mockPlayer.stats.musicEnabled).toBe(true);
        });

        it('should handle missing player stats object', async () => {
            mockPlayer.stats = null;

            expect(() => {
                SaveDeserializer.deserializePlayerStats(mockGame, { musicEnabled: false, sfxEnabled: false });
            }).not.toThrow();

            // Should log a warning
            const { logger } = await import('@core/logger');
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should handle missing player gracefully', () => {
            mockGame.world.player = null;

            expect(() => {
                SaveDeserializer.deserializePlayerStats(mockGame, { musicEnabled: false, sfxEnabled: false });
            }).not.toThrow();
        });
    });

    describe('deserializeGameState', () => {
        it('should restore zones from array format', () => {
            const gameStateData: Partial<SaveGameData> = {
                zones: [
                    ['0,0:0', { grid: mockGrid, enemies: [] }],
                    ['1,0:0', { grid: mockGrid, enemies: [] }]
                ],
                grid: mockGrid,
                enemies: [],
                defeatedEnemies: [],
                specialZones: [],
                messageLog: [],
                currentRegion: 'Test Region'
            };

            SaveDeserializer.deserializeGameState(mockGame, gameStateData);

            expect(mockGame.world.zones).toBeInstanceOf(Map);
            expect(mockGame.world.zones.size).toBe(2);
            expect(mockGame.world.zones.has('0,0:0')).toBe(true);
            expect(mockGame.world.zones.has('1,0:0')).toBe(true);
        });

        it('should use zoneRepository if available', () => {
            const mockZoneRepository = {
                restore: vi.fn(),
                getMap: vi.fn(() => new Map([['0,0:0', {}]]))
            };
            mockGame.zoneRepository = mockZoneRepository;

            const gameStateData: Partial<SaveGameData> = {
                zones: [['0,0:0', { grid: mockGrid }]],
                grid: mockGrid,
                enemies: [],
                defeatedEnemies: [],
                specialZones: [],
                messageLog: [],
                currentRegion: ''
            };

            SaveDeserializer.deserializeGameState(mockGame, gameStateData);

            expect(mockZoneRepository.restore).toHaveBeenCalledWith([['0,0:0', { grid: mockGrid }]]);
            expect(mockZoneRepository.getMap).toHaveBeenCalled();
        });

        it('should restore enemies correctly', () => {
            const gameStateData: Partial<SaveGameData> = {
                zones: [],
                grid: mockGrid,
                enemies: [
                    { x: 3, y: 4, enemyType: 'lizardo', health: 100, id: 'e1' },
                    { x: 5, y: 6, enemyType: 'zard', health: 75, id: 'e2' }
                ],
                defeatedEnemies: [],
                specialZones: [],
                messageLog: [],
                currentRegion: ''
            };

            SaveDeserializer.deserializeGameState(mockGame, gameStateData);

            expect(mockGame.world.enemies).toHaveLength(2);
            expect(mockGame.Enemy).toHaveBeenCalledTimes(2);
        });

        it('should preserve enemyCollection reference by modifying array in place', () => {
            const originalArray = mockGame.world.enemies;

            const gameStateData: Partial<SaveGameData> = {
                zones: [],
                grid: mockGrid,
                enemies: [
                    { x: 1, y: 2, enemyType: 'lizardo', health: 100, id: 'e1' }
                ],
                defeatedEnemies: [],
                specialZones: [],
                messageLog: [],
                currentRegion: ''
            };

            SaveDeserializer.deserializeGameState(mockGame, gameStateData);

            // Array reference should be the same
            expect(mockGame.world.enemies).toBe(originalArray);
            expect(mockGame.world.enemies).toHaveLength(1);
        });

        it('should restore defeatedEnemies as Set', () => {
            const gameStateData: Partial<SaveGameData> = {
                zones: [],
                grid: mockGrid,
                enemies: [],
                defeatedEnemies: ['0,0:0,5,5', '1,0:0,3,2', '2,3:0,8,9'],
                specialZones: [],
                messageLog: [],
                currentRegion: ''
            };

            SaveDeserializer.deserializeGameState(mockGame, gameStateData);

            expect(mockGame.world.defeatedEnemies).toBeInstanceOf(Set);
            expect(mockGame.world.defeatedEnemies.size).toBe(3);
            expect(mockGame.world.defeatedEnemies.has('0,0:0,5,5')).toBe(true);
        });

        it('should restore specialZones as Map', () => {
            const gameStateData: Partial<SaveGameData> = {
                zones: [],
                grid: mockGrid,
                enemies: [],
                defeatedEnemies: [],
                specialZones: [
                    ['2,3:0', [{ type: 'treasure', value: 100 }]],
                    ['5,5:0', [{ type: 'note', text: 'Hello' }]]
                ],
                messageLog: [],
                currentRegion: ''
            };

            SaveDeserializer.deserializeGameState(mockGame, gameStateData);

            expect(mockGame.world.specialZones).toBeInstanceOf(Map);
            expect(mockGame.world.specialZones.size).toBe(2);
            expect(mockGame.world.specialZones.has('2,3:0')).toBe(true);
        });

        it('should restore messageLog array', () => {
            const gameStateData: Partial<SaveGameData> = {
                zones: [],
                grid: mockGrid,
                enemies: [],
                defeatedEnemies: [],
                specialZones: [],
                messageLog: ['Message 1', 'Message 2', 'Message 3'],
                currentRegion: ''
            };

            SaveDeserializer.deserializeGameState(mockGame, gameStateData);

            expect(mockGame.messageLog).toEqual(['Message 1', 'Message 2', 'Message 3']);
        });

        it('should restore currentRegion', () => {
            const gameStateData: Partial<SaveGameData> = {
                zones: [],
                grid: mockGrid,
                enemies: [],
                defeatedEnemies: [],
                specialZones: [],
                messageLog: [],
                currentRegion: 'The Frozen Wastes'
            };

            SaveDeserializer.deserializeGameState(mockGame, gameStateData);

            expect(mockGame.world.currentRegion).toBe('The Frozen Wastes');
        });

        it('should handle empty/null data gracefully', () => {
            const gameStateData: Partial<SaveGameData> = {
                zones: null as any,
                grid: mockGrid,
                enemies: null as any,
                defeatedEnemies: null as any,
                specialZones: null as any,
                messageLog: null as any,
                currentRegion: null as any
            };

            expect(() => {
                SaveDeserializer.deserializeGameState(mockGame, gameStateData);
            }).not.toThrow();

            expect(mockGame.world.zones.size).toBe(0);
            expect(mockGame.world.enemies).toHaveLength(0);
            expect(mockGame.world.defeatedEnemies.size).toBe(0);
            expect(mockGame.world.specialZones.size).toBe(0);
            expect(mockGame.messageLog).toEqual([]);
            expect(mockGame.world.currentRegion).toBeNull();
        });

        it('should call validateLoadedGrid on grid data', async () => {
            const { validateLoadedGrid } = await import('@generators/GeneratorUtils');

            const gameStateData: Partial<SaveGameData> = {
                zones: [],
                grid: mockGrid,
                enemies: [],
                defeatedEnemies: [],
                specialZones: [],
                messageLog: [],
                currentRegion: ''
            };

            SaveDeserializer.deserializeGameState(mockGame, gameStateData);

            expect(validateLoadedGrid).toHaveBeenCalledWith(mockGrid);
        });
    });

    describe('deserializeSignMessages', () => {
        it('should restore spawned messages to Sign class', async () => {
            const { Sign } = await import('@ui/Sign');
            const messages = ['sign_001', 'sign_002', 'sign_003'];

            SaveDeserializer.deserializeSignMessages(messages);

            expect(Sign.spawnedMessages).toBeInstanceOf(Set);
            expect(Sign.spawnedMessages.size).toBe(3);
            expect(Sign.spawnedMessages.has('sign_001')).toBe(true);
            expect(Sign.spawnedMessages.has('sign_003')).toBe(true);
        });

        it('should handle null/undefined array', async () => {
            const { Sign } = await import('@ui/Sign');

            expect(() => {
                SaveDeserializer.deserializeSignMessages(null as any);
            }).not.toThrow();

            expect(Sign.spawnedMessages.size).toBe(0);
        });

        it('should handle empty array', async () => {
            const { Sign } = await import('@ui/Sign');

            SaveDeserializer.deserializeSignMessages([]);

            expect(Sign.spawnedMessages.size).toBe(0);
        });
    });

    describe('Data integrity and corruption prevention', () => {
        it('should handle corrupted player data', () => {
            const corruptedData = {
                x: 'invalid' as any,
                y: null as any,
                currentZone: null,
                inventory: 'not an array' as any
            };

            // Should not throw, but data might be invalid
            expect(() => {
                SaveDeserializer.deserializePlayer(mockGame, corruptedData as any);
            }).not.toThrow();
        });

        it('should handle large datasets', () => {
            const largeEnemyArray = Array(1000).fill(null).map((_, i) => ({
                x: i % 20,
                y: Math.floor(i / 20),
                enemyType: 'lizardo',
                health: 100,
                id: `enemy_${i}`
            }));

            const gameStateData: Partial<SaveGameData> = {
                zones: [],
                grid: mockGrid,
                enemies: largeEnemyArray,
                defeatedEnemies: [],
                specialZones: [],
                messageLog: [],
                currentRegion: ''
            };

            expect(() => {
                SaveDeserializer.deserializeGameState(mockGame, gameStateData);
            }).not.toThrow();

            expect(mockGame.world.enemies).toHaveLength(1000);
        });

        it('should handle special characters in strings', () => {
            const gameStateData: Partial<SaveGameData> = {
                zones: [],
                grid: mockGrid,
                enemies: [],
                defeatedEnemies: [],
                specialZones: [],
                messageLog: [
                    'Message with "quotes"',
                    "Message with 'single quotes'",
                    'Message with \\n newline',
                    'Message with special chars'
                ],
                currentRegion: 'Region with special chars'
            };

            expect(() => {
                SaveDeserializer.deserializeGameState(mockGame, gameStateData);
            }).not.toThrow();

            expect(mockGame.messageLog[3]).toContain('special');
            expect(mockGame.world.currentRegion).toContain('special');
        });
    });
});
