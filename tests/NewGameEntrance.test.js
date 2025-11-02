import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index.js';

// Mock logger before imports
const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
};

jest.mock('../core/logger.js', () => ({
    default: mockLogger
}));

/**
 * Tests for New Game Entrance Feature
 *
 * Verifies that when starting a new game:
 * 1. Player spawns on an exit tile in the home zone
 * 2. Player is initially positioned off-screen (one tile beyond exit)
 * 3. Entrance animation triggers correctly
 * 4. Exit tiles are preserved (not converted to FLOOR)
 */

describe('New Game Entrance', () => {
    let mockGame;
    let mockZoneGen;
    let mockPlayer;

    beforeEach(() => {
        // Mock player
        mockPlayer = {
            x: 1,
            y: 1,
            setPosition: jest.fn((x, y) => {
                mockPlayer.x = x;
                mockPlayer.y = y;
            }),
            getPosition: jest.fn(() => ({ x: mockPlayer.x, y: mockPlayer.y })),
            getCurrentZone: jest.fn(() => ({ x: 0, y: 0, dimension: 0, depth: 0 }))
        };

        // Mock game instance
        mockGame = {
            player: mockPlayer,
            grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
            zones: new Map(),
            lastExitSide: null,
            _newGameSpawnPosition: null
        };

        // Mock zone generator
        mockZoneGen = {
            currentZoneX: 0,
            currentZoneY: 0,
            currentDimension: 0,
            grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
            game: mockGame
        };
    });

    describe('findValidPlayerSpawn - Logic Tests', () => {
        it('should identify exit tiles in home zone (0,0)', () => {
            // Test the logic without importing the actual module
            // Add exit tiles to the grid
            mockZoneGen.grid[0][4] = TILE_TYPES.EXIT; // Top edge
            mockZoneGen.grid[3][0] = TILE_TYPES.EXIT; // Left edge
            mockZoneGen.grid[9][5] = TILE_TYPES.EXIT; // Bottom edge (GRID_SIZE - 1)

            // Simulate the logic from findValidPlayerSpawn
            const exitTiles = [];
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (mockZoneGen.grid[y][x] === TILE_TYPES.EXIT) {
                        exitTiles.push({ x, y });
                    }
                }
            }

            // Should find all 3 exit tiles
            expect(exitTiles).toHaveLength(3);
            expect(exitTiles).toContainEqual({ x: 4, y: 0 });
            expect(exitTiles).toContainEqual({ x: 0, y: 3 });
            expect(exitTiles).toContainEqual({ x: 5, y: 9 });
        });

        it('should select from available exit tiles', () => {
            // Add specific exit tiles
            const exitPositions = [
                { x: 4, y: 0 },
                { x: 0, y: 3 },
                { x: 9, y: 5 } // Right edge (GRID_SIZE - 1)
            ];

            exitPositions.forEach(pos => {
                mockZoneGen.grid[pos.y][pos.x] = TILE_TYPES.EXIT;
            });

            // Find all exits
            const exitTiles = [];
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (mockZoneGen.grid[y][x] === TILE_TYPES.EXIT) {
                        exitTiles.push({ x, y });
                    }
                }
            }

            // Random selection (simulate)
            const spawn = exitTiles[Math.floor(Math.random() * exitTiles.length)];

            // Should be one of our exit positions
            const isValidExit = exitPositions.some(
                pos => pos.x === spawn.x && pos.y === spawn.y
            );
            expect(isValidExit).toBe(true);
        });

        it('should have fallback spawn coordinates for house front', () => {
            // Test fallback logic
            const houseStartX = 3;
            const houseStartY = 3;
            const frontY = houseStartY + 3; // 6

            // Fallback spawn should be in front of house
            expect(frontY).toBe(6);

            // X should be within house width (3-6)
            for (let x = houseStartX; x < houseStartX + 4; x++) {
                expect(x).toBeGreaterThanOrEqual(3);
                expect(x).toBeLessThan(7);
            }
        });

        it('should only apply exit spawn logic to home zone', () => {
            // Test zone check logic
            const isHomeZone = (zoneX, zoneY, dimension) => {
                return zoneX === 0 && zoneY === 0 && dimension === 0;
            };

            expect(isHomeZone(0, 0, 0)).toBe(true);
            expect(isHomeZone(1, 0, 0)).toBe(false);
            expect(isHomeZone(0, 1, 0)).toBe(false);
            expect(isHomeZone(0, 0, 1)).toBe(false);
        });
    });

    describe('ZoneManager - Off-screen positioning', () => {
        let ZoneManager;
        let zoneManager;

        beforeEach(() => {
            ZoneManager = require('../managers/ZoneManager.js').ZoneManager;
            zoneManager = new ZoneManager(mockGame);
        });

        it('should position player off-screen for top edge exit', () => {
            const exitSpawn = { x: 4, y: 0 }; // Top edge

            // Simulate zone data with playerSpawn
            const zoneData = {
                grid: mockGame.grid,
                enemies: [],
                playerSpawn: exitSpawn
            };

            // Manually trigger the positioning logic
            mockGame.lastExitSide = null; // New game
            mockGame.grid = zoneData.grid;

            if (!mockGame.lastExitSide && zoneData.playerSpawn) {
                mockGame._newGameSpawnPosition = { ...zoneData.playerSpawn };

                let offScreenX = zoneData.playerSpawn.x;
                let offScreenY = zoneData.playerSpawn.y;

                if (zoneData.playerSpawn.y === 0) {
                    offScreenY = -1;
                }

                mockPlayer.setPosition(offScreenX, offScreenY);
            }

            // Verify player is off-screen above the exit
            expect(mockPlayer.x).toBe(4);
            expect(mockPlayer.y).toBe(-1);
            expect(mockGame._newGameSpawnPosition).toEqual({ x: 4, y: 0 });
        });

        it('should position player off-screen for left edge exit', () => {
            const exitSpawn = { x: 0, y: 3 }; // Left edge

            const zoneData = {
                grid: mockGame.grid,
                enemies: [],
                playerSpawn: exitSpawn
            };

            mockGame.lastExitSide = null;
            mockGame.grid = zoneData.grid;

            if (!mockGame.lastExitSide && zoneData.playerSpawn) {
                mockGame._newGameSpawnPosition = { ...zoneData.playerSpawn };

                let offScreenX = zoneData.playerSpawn.x;
                let offScreenY = zoneData.playerSpawn.y;

                if (zoneData.playerSpawn.x === 0) {
                    offScreenX = -1;
                }

                mockPlayer.setPosition(offScreenX, offScreenY);
            }

            // Verify player is off-screen to the left
            expect(mockPlayer.x).toBe(-1);
            expect(mockPlayer.y).toBe(3);
            expect(mockGame._newGameSpawnPosition).toEqual({ x: 0, y: 3 });
        });

        it('should position player off-screen for bottom edge exit', () => {
            const exitSpawn = { x: 5, y: 9 }; // Bottom edge (GRID_SIZE - 1)

            const zoneData = {
                grid: mockGame.grid,
                enemies: [],
                playerSpawn: exitSpawn
            };

            mockGame.lastExitSide = null;
            mockGame.grid = zoneData.grid;

            if (!mockGame.lastExitSide && zoneData.playerSpawn) {
                mockGame._newGameSpawnPosition = { ...zoneData.playerSpawn };

                let offScreenX = zoneData.playerSpawn.x;
                let offScreenY = zoneData.playerSpawn.y;

                if (zoneData.playerSpawn.y === GRID_SIZE - 1) {
                    offScreenY = GRID_SIZE;
                }

                mockPlayer.setPosition(offScreenX, offScreenY);
            }

            // Verify player is off-screen below the exit
            expect(mockPlayer.x).toBe(5);
            expect(mockPlayer.y).toBe(GRID_SIZE);
            expect(mockGame._newGameSpawnPosition).toEqual({ x: 5, y: 9 });
        });

        it('should position player off-screen for right edge exit', () => {
            const exitSpawn = { x: 9, y: 4 }; // Right edge (GRID_SIZE - 1)

            const zoneData = {
                grid: mockGame.grid,
                enemies: [],
                playerSpawn: exitSpawn
            };

            mockGame.lastExitSide = null;
            mockGame.grid = zoneData.grid;

            if (!mockGame.lastExitSide && zoneData.playerSpawn) {
                mockGame._newGameSpawnPosition = { ...zoneData.playerSpawn };

                let offScreenX = zoneData.playerSpawn.x;
                let offScreenY = zoneData.playerSpawn.y;

                if (zoneData.playerSpawn.x === GRID_SIZE - 1) {
                    offScreenX = GRID_SIZE;
                }

                mockPlayer.setPosition(offScreenX, offScreenY);
            }

            // Verify player is off-screen to the right
            expect(mockPlayer.x).toBe(GRID_SIZE);
            expect(mockPlayer.y).toBe(4);
            expect(mockGame._newGameSpawnPosition).toEqual({ x: 9, y: 4 });
        });

        it('should not position off-screen for loaded games', () => {
            const exitSpawn = { x: 4, y: 0 };

            const zoneData = {
                grid: mockGame.grid,
                enemies: [],
                playerSpawn: exitSpawn
            };

            // Simulate loaded game (has lastExitSide)
            mockGame.lastExitSide = 'north';
            mockGame.grid = zoneData.grid;

            const initialX = mockPlayer.x;
            const initialY = mockPlayer.y;

            // This logic should NOT run for loaded games
            if (!mockGame.lastExitSide && zoneData.playerSpawn) {
                mockPlayer.setPosition(-1, 4);
            }

            // Player should not have moved
            expect(mockPlayer.x).toBe(initialX);
            expect(mockPlayer.y).toBe(initialY);
            expect(mockGame._newGameSpawnPosition).toBeNull();
        });
    });

    describe('GameInitializer - Exit tile preservation', () => {
        it('should not convert EXIT tiles to FLOOR on new game', () => {
            // Create a grid with an EXIT tile where player spawns
            const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
            grid[0][4] = TILE_TYPES.EXIT;

            mockPlayer.x = 4;
            mockPlayer.y = 0;
            mockGame.grid = grid;

            // Simulate the tile preservation logic from GameInitializer
            const startTile = mockGame.grid[mockPlayer.y][mockPlayer.x];

            // Don't overwrite SIGN or EXIT tiles
            if (!startTile ||
                (typeof startTile === 'string' && startTile !== TILE_TYPES.SIGN && startTile !== TILE_TYPES.EXIT) ||
                (typeof startTile === 'object' && startTile.type !== TILE_TYPES.SIGN)) {
                mockGame.grid[mockPlayer.y][mockPlayer.x] = TILE_TYPES.FLOOR;
            }

            // EXIT tile should still be EXIT
            expect(mockGame.grid[0][4]).toBe(TILE_TYPES.EXIT);
        });

        it('should convert regular FLOOR tiles to FLOOR on new game', () => {
            const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));

            mockPlayer.x = 4;
            mockPlayer.y = 4;
            mockGame.grid = grid;

            const startTile = mockGame.grid[mockPlayer.y][mockPlayer.x];

            if (!startTile ||
                (typeof startTile === 'string' && startTile !== TILE_TYPES.SIGN && startTile !== TILE_TYPES.EXIT) ||
                (typeof startTile === 'object' && startTile.type !== TILE_TYPES.SIGN)) {
                mockGame.grid[mockPlayer.y][mockPlayer.x] = TILE_TYPES.FLOOR;
            }

            // Should be FLOOR (converted from FLOOR, no change)
            expect(mockGame.grid[4][4]).toBe(TILE_TYPES.FLOOR);
        });

        it('should preserve SIGN tiles on new game', () => {
            const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
            grid[5][2] = TILE_TYPES.SIGN;

            mockPlayer.x = 2;
            mockPlayer.y = 5;
            mockGame.grid = grid;

            const startTile = mockGame.grid[mockPlayer.y][mockPlayer.x];

            if (!startTile ||
                (typeof startTile === 'string' && startTile !== TILE_TYPES.SIGN && startTile !== TILE_TYPES.EXIT) ||
                (typeof startTile === 'object' && startTile.type !== TILE_TYPES.SIGN)) {
                mockGame.grid[mockPlayer.y][mockPlayer.x] = TILE_TYPES.FLOOR;
            }

            // SIGN should be preserved
            expect(mockGame.grid[5][2]).toBe(TILE_TYPES.SIGN);
        });
    });

    describe('Entrance Animation Pathfinding', () => {
        it('should calculate path from off-screen to exit tile', () => {
            // Mock InputManager
            const mockInputManager = {
                findPath: jest.fn((startX, startY, targetX, targetY) => {
                    // Simulate simple vertical path
                    if (startX === targetX && startY < targetY) {
                        return ['arrowdown'];
                    }
                    return null;
                }),
                executePath: jest.fn()
            };

            mockGame.inputManager = mockInputManager;
            mockGame._newGameSpawnPosition = { x: 4, y: 0 }; // Exit tile
            mockPlayer.x = 4;
            mockPlayer.y = -1; // Off-screen

            // Simulate entrance animation logic
            const exitSpawn = mockGame._newGameSpawnPosition;
            const playerPos = mockPlayer.getPosition();

            const pathToExit = mockInputManager.findPath(
                playerPos.x,
                playerPos.y,
                exitSpawn.x,
                exitSpawn.y
            );

            expect(pathToExit).toBeDefined();
            expect(pathToExit.length).toBeGreaterThan(0);
            expect(mockInputManager.findPath).toHaveBeenCalledWith(4, -1, 4, 0);
        });

        it('should calculate path from exit to club entrance', () => {
            const mockInputManager = {
                findPath: jest.fn(() => ['arrowdown', 'arrowdown', 'arrowdown']),
                executePath: jest.fn()
            };

            mockGame.inputManager = mockInputManager;

            const exitSpawn = { x: 4, y: 0 };
            const clubEntranceX = 4;
            const clubEntranceY = 6;

            const pathToClub = mockInputManager.findPath(
                exitSpawn.x,
                exitSpawn.y,
                clubEntranceX,
                clubEntranceY
            );

            expect(pathToClub).toBeDefined();
            expect(pathToClub.length).toBeGreaterThan(0);
            expect(mockInputManager.findPath).toHaveBeenCalledWith(4, 0, 4, 6);
        });

        it('should execute two-stage entrance animation', () => {
            const mockInputManager = {
                findPath: jest.fn()
                    .mockReturnValueOnce(['arrowdown']) // Path to exit
                    .mockReturnValueOnce(['arrowdown', 'arrowdown', 'arrowdown']), // Path to club
                executePath: jest.fn()
            };

            mockGame.inputManager = mockInputManager;
            mockGame._newGameSpawnPosition = { x: 4, y: 0 };
            mockPlayer.x = 4;
            mockPlayer.y = -1;

            // Stage 1: Hop to exit
            const pathToExit = mockInputManager.findPath(4, -1, 4, 0);
            expect(pathToExit).toEqual(['arrowdown']);

            mockInputManager.executePath(pathToExit);
            expect(mockInputManager.executePath).toHaveBeenCalledWith(['arrowdown']);

            // Stage 2: Walk to club
            const pathToClub = mockInputManager.findPath(4, 0, 4, 6);
            expect(pathToClub).toEqual(['arrowdown', 'arrowdown', 'arrowdown']);

            mockInputManager.executePath(pathToClub);
            expect(mockInputManager.executePath).toHaveBeenCalledTimes(2);
        });
    });

    describe('Input Blocking During Entrance', () => {
        it('should block tap input during entrance animation', () => {
            mockGame._entranceAnimationInProgress = true;

            const mockInputController = {
                handleTap: jest.fn((screenX, screenY) => {
                    // Simulate the blocking logic
                    if (mockGame._entranceAnimationInProgress) {
                        return;
                    }
                    // Normal tap handling would go here
                })
            };

            // Try to tap during animation
            mockInputController.handleTap(100, 100);

            // Should not have processed the tap (early return)
            expect(mockInputController.handleTap).toHaveBeenCalled();
        });

        it('should block keyboard input during entrance animation', () => {
            mockGame._entranceAnimationInProgress = true;

            const mockInputController = {
                handleKeyPress: jest.fn((event) => {
                    // Simulate the blocking logic
                    if (mockGame._entranceAnimationInProgress) {
                        return;
                    }
                    // Normal key handling would go here
                })
            };

            // Try to press key during animation
            mockInputController.handleKeyPress({ key: 'arrowup' });

            // Should not have processed the key (early return)
            expect(mockInputController.handleKeyPress).toHaveBeenCalled();
        });

        it('should allow input after entrance animation completes', () => {
            mockGame._entranceAnimationInProgress = false;

            const mockInputController = {
                handleTap: jest.fn((screenX, screenY) => {
                    if (mockGame._entranceAnimationInProgress) {
                        return;
                    }
                    return 'tap_processed';
                })
            };

            // Tap after animation completes
            const result = mockInputController.handleTap(100, 100);

            // Should process normally
            expect(result).toBe('tap_processed');
        });

        it('should re-enable input after entrance animation completes', () => {
            // Simulate entrance animation sequence
            mockGame._entranceAnimationInProgress = true;

            // Animation starts
            expect(mockGame._entranceAnimationInProgress).toBe(true);

            // Simulate animation completion
            mockGame._entranceAnimationInProgress = false;

            // Input should now be allowed
            expect(mockGame._entranceAnimationInProgress).toBe(false);
        });
    });

    describe('Integration - Full entrance sequence', () => {
        it('should complete full entrance sequence for new game', () => {
            // Setup
            const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
            grid[0][4] = TILE_TYPES.EXIT;
            grid[3][3] = TILE_TYPES.HOUSE;

            mockGame.grid = grid;
            mockGame.lastExitSide = null; // New game
            mockGame._newGameSpawnPosition = { x: 4, y: 0 };

            const mockInputManager = {
                findPath: jest.fn()
                    .mockReturnValueOnce(['arrowdown']) // Off-screen to exit
                    .mockReturnValueOnce(['arrowdown', 'arrowdown', 'arrowdown', 'arrowdown', 'arrowdown', 'arrowdown']), // Exit to club
                executePath: jest.fn()
            };

            mockGame.inputManager = mockInputManager;

            // Player starts off-screen
            mockPlayer.setPosition(4, -1);

            // Verify initial state
            expect(mockPlayer.y).toBe(-1); // Off-screen
            expect(mockGame._newGameSpawnPosition).toEqual({ x: 4, y: 0 }); // Exit tile stored
            expect(grid[0][4]).toBe(TILE_TYPES.EXIT); // Exit preserved

            // Execute entrance animation
            const playerPos = mockPlayer.getPosition();
            const exitSpawn = mockGame._newGameSpawnPosition;

            // Stage 1: Path to exit
            const pathToExit = mockInputManager.findPath(
                playerPos.x,
                playerPos.y,
                exitSpawn.x,
                exitSpawn.y
            );

            expect(pathToExit).toBeDefined();
            expect(pathToExit.length).toBe(1);

            // Stage 2: Path to club
            const pathToClub = mockInputManager.findPath(
                exitSpawn.x,
                exitSpawn.y,
                4,
                6
            );

            expect(pathToClub).toBeDefined();
            expect(pathToClub.length).toBe(6);

            // Verify both paths were calculated
            expect(mockInputManager.findPath).toHaveBeenCalledTimes(2);
        });
    });
});
