/**
 * Test: Gossip NPC Spawning Logic
 *
 * Verifies that gossip NPCs spawn based on their JSON configuration:
 * - Filter by dimension (surface = 0, underground = 2)
 * - Filter by level (1-4)
 * - Respect individual spawnWeight values
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentRegistry } from '@core/ContentRegistry';
import { BaseZoneHandler } from '@core/handlers/BaseZoneHandler';
import { TILE_TYPES } from '@core/constants/index';

// Mock dependencies
vi.mock('../src/core/logger', () => ({
    logger: {
        log: vi.fn(),
        error: vi.fn(),
        debug: vi.fn()
    }
}));

describe('Gossip NPC Spawning', () => {
    let mockZoneGen;
    let mockGame;
    let handler;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Create mock grid manager
        const mockGridManager = {
            getTile: vi.fn((x, y) => TILE_TYPES.FLOOR),
            setTile: vi.fn()
        };

        // Create mock game with zone gen state
        mockGame = {
            zoneGenState: {
                getZoneCounter: vi.fn(() => 0),
                incrementZoneCounter: vi.fn(),
                hasSpawned: vi.fn(() => false),
                setSpawnFlag: vi.fn(),
                setSpawnLocation: vi.fn(),
                firstWildsZonePlaced: false
            }
        };

        // Create mock zone generator
        mockZoneGen = {
            game: mockGame,
            gridManager: mockGridManager,
            grid: Array(32).fill(null).map(() => Array(32).fill(TILE_TYPES.FLOOR)),
            enemies: [],
            playerSpawn: { x: 16, y: 16 }
        };
    });

    it('filters gossip NPCs by dimension and level', () => {
        // Create a test handler for surface, level 1
        handler = new BaseZoneHandler(mockZoneGen, 5, 5, [], 0, 0);

        // Mock ContentRegistry to return test NPCs
        const mockNPCs = [
            {
                tileType: 100,
                placement: {
                    dimension: 0,
                    level: 1,
                    spawnWeight: 0.005
                },
                metadata: {
                    characterData: {
                        metadata: { category: 'gossip' },
                        name: 'TestNPC1'
                    }
                }
            },
            {
                tileType: 101,
                placement: {
                    dimension: 0,
                    level: 2, // Wrong level
                    spawnWeight: 0.005
                },
                metadata: {
                    characterData: {
                        metadata: { category: 'gossip' },
                        name: 'TestNPC2'
                    }
                }
            },
            {
                tileType: 102,
                placement: {
                    dimension: 2, // Wrong dimension
                    level: 1,
                    spawnWeight: 0.005
                },
                metadata: {
                    characterData: {
                        metadata: { category: 'gossip' },
                        name: 'TestNPC3'
                    }
                }
            }
        ];

        vi.spyOn(ContentRegistry, 'getAllNPCs').mockReturnValue(mockNPCs);
        vi.spyOn(Math, 'random').mockReturnValue(0.001); // Always spawn

        handler.handleGossipNPCSpawning();

        // Should only spawn the NPC with matching dimension and level
        expect(mockZoneGen.gridManager.setTile).toHaveBeenCalledWith(
            expect.any(Number),
            expect.any(Number),
            100 // Only TestNPC1 should spawn
        );
        expect(mockZoneGen.gridManager.setTile).toHaveBeenCalledTimes(1);
    });

    it('respects spawn weight probability', () => {
        handler = new BaseZoneHandler(mockZoneGen, 5, 5, [], 0, 0);

        const mockNPCs = [
            {
                tileType: 100,
                placement: {
                    dimension: 0,
                    level: 1,
                    spawnWeight: 0.005
                },
                metadata: {
                    characterData: {
                        metadata: { category: 'gossip' },
                        name: 'TestNPC1'
                    }
                }
            }
        ];

        vi.spyOn(ContentRegistry, 'getAllNPCs').mockReturnValue(mockNPCs);
        vi.spyOn(Math, 'random').mockReturnValue(0.99); // Should NOT spawn (0.99 > 0.005)

        handler.handleGossipNPCSpawning();

        // Should not spawn because random value is higher than spawn weight
        expect(mockZoneGen.gridManager.setTile).not.toHaveBeenCalled();
    });

    it('spawns underground gossip NPCs with dimension 2', () => {
        // Create handler for underground, level 1
        handler = new BaseZoneHandler(mockZoneGen, 5, 5, [], 2, 1);

        const mockNPCs = [
            {
                tileType: 200,
                placement: {
                    dimension: 2, // Underground
                    level: 1,
                    spawnWeight: 0.005
                },
                metadata: {
                    characterData: {
                        metadata: { category: 'gossip' },
                        name: 'UndergroundNPC'
                    }
                }
            },
            {
                tileType: 201,
                placement: {
                    dimension: 0, // Surface - should not spawn
                    level: 1,
                    spawnWeight: 0.005
                },
                metadata: {
                    characterData: {
                        metadata: { category: 'gossip' },
                        name: 'SurfaceNPC'
                    }
                }
            }
        ];

        vi.spyOn(ContentRegistry, 'getAllNPCs').mockReturnValue(mockNPCs);
        vi.spyOn(Math, 'random').mockReturnValue(0.001); // Always spawn

        handler.handleGossipNPCSpawning();

        // Should only spawn the underground NPC
        expect(mockZoneGen.gridManager.setTile).toHaveBeenCalledWith(
            expect.any(Number),
            expect.any(Number),
            200 // Only UndergroundNPC should spawn
        );
        expect(mockZoneGen.gridManager.setTile).toHaveBeenCalledTimes(1);
    });

    it('only spawns one gossip NPC per zone even if multiple pass checks', () => {
        handler = new BaseZoneHandler(mockZoneGen, 5, 5, [], 0, 0);

        const mockNPCs = [
            {
                tileType: 100,
                placement: { dimension: 0, level: 1, spawnWeight: 0.005 },
                metadata: {
                    characterData: {
                        metadata: { category: 'gossip' },
                        name: 'NPC1'
                    }
                }
            },
            {
                tileType: 101,
                placement: { dimension: 0, level: 1, spawnWeight: 0.005 },
                metadata: {
                    characterData: {
                        metadata: { category: 'gossip' },
                        name: 'NPC2'
                    }
                }
            }
        ];

        vi.spyOn(ContentRegistry, 'getAllNPCs').mockReturnValue(mockNPCs);
        vi.spyOn(Math, 'random').mockReturnValue(0.001); // Both would pass spawn check

        handler.handleGossipNPCSpawning();

        // Should only spawn one NPC (first one that passes)
        expect(mockZoneGen.gridManager.setTile).toHaveBeenCalledTimes(1);
    });
});
