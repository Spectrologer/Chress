import { TILE_TYPES, GRID_SIZE } from '../core/constants/index.js';

describe('ZoneManager - PORT Handling for Custom Boards', () => {
    let mockGame;
    let zoneManager;

    beforeEach(() => {
        // Create mock game object
        mockGame = {
            player: {
                x: 5,
                y: 5,
                currentZone: { x: 0, y: 0, dimension: 1 }
            },
            playerFacade: {
                getPosition: jest.fn(() => ({ x: 5, y: 5 })),
                setPosition: jest.fn(),
                getCurrentZone: jest.fn(() => ({ x: 0, y: 0, dimension: 1 }))
            },
            gridManager: {
                isTileType: jest.fn((x, y, tileType) => {
                    return mockGame.grid[y][x] === tileType;
                })
            },
            grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR))
        };

        // Import ZoneManager (mocking would be complex, so we test the logic)
        const { ZoneManager } = require('../managers/ZoneManager.js');
        zoneManager = new ZoneManager(mockGame);
    });

    describe('_positionAfterInteriorEntry', () => {
        test('should create PORT at default position when none exists', () => {
            // No PORT exists in the grid
            const portX = Math.floor(GRID_SIZE / 2);
            const portY = GRID_SIZE - 1;

            zoneManager._positionAfterInteriorEntry();

            // Should position player at default port location
            expect(mockGame.playerFacade.setPosition).toHaveBeenCalledWith(portX, portY);
        });

        test('should use existing PORT when custom board has one', () => {
            // Custom board has PORT at a different location
            const customPortX = 3;
            const customPortY = 7;
            mockGame.grid[customPortY][customPortX] = TILE_TYPES.PORT;

            zoneManager._positionAfterInteriorEntry();

            // Should position player at existing PORT location
            expect(mockGame.playerFacade.setPosition).toHaveBeenCalledWith(customPortX, customPortY);
        });

        test('should not create duplicate PORTs', () => {
            // Custom board already has PORT
            const customPortX = 4;
            const customPortY = 9;
            mockGame.grid[customPortY][customPortX] = TILE_TYPES.PORT;

            // Count PORTs before
            let portCountBefore = 0;
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (mockGame.grid[y][x] === TILE_TYPES.PORT) {
                        portCountBefore++;
                    }
                }
            }

            zoneManager._positionAfterInteriorEntry();

            // Count PORTs after
            let portCountAfter = 0;
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (mockGame.grid[y][x] === TILE_TYPES.PORT) {
                        portCountAfter++;
                    }
                }
            }

            // Should still have only one PORT
            expect(portCountBefore).toBe(1);
            expect(portCountAfter).toBe(1);
        });

        test('should find PORT anywhere on the grid', () => {
            // Place PORT at various locations
            const testLocations = [
                { x: 0, y: 0 },
                { x: 9, y: 9 },
                { x: 5, y: 3 },
                { x: 2, y: 7 }
            ];

            testLocations.forEach(location => {
                // Reset grid
                mockGame.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
                mockGame.grid[location.y][location.x] = TILE_TYPES.PORT;
                mockGame.playerFacade.setPosition.mockClear();

                zoneManager._positionAfterInteriorEntry();

                expect(mockGame.playerFacade.setPosition).toHaveBeenCalledWith(location.x, location.y);
            });
        });

        test('should handle multiple PORTs by using first found', () => {
            // Place multiple PORTs (shouldn't happen, but handle gracefully)
            mockGame.grid[2][2] = TILE_TYPES.PORT;
            mockGame.grid[7][7] = TILE_TYPES.PORT;

            zoneManager._positionAfterInteriorEntry();

            // Should use one of them (first found in scan order)
            const setPositionCall = mockGame.playerFacade.setPosition.mock.calls[0];
            const [x, y] = setPositionCall;

            expect(mockGame.grid[y][x]).toBe(TILE_TYPES.PORT);
        });
    });

    describe('Museum Board Specific Tests', () => {
        test('should correctly position player at museum PORT location', () => {
            // Museum has PORT at (4, 9)
            const museumPortX = 4;
            const museumPortY = 9;
            mockGame.grid[museumPortY][museumPortX] = TILE_TYPES.PORT;

            zoneManager._positionAfterInteriorEntry();

            expect(mockGame.playerFacade.setPosition).toHaveBeenCalledWith(museumPortX, museumPortY);
        });

        test('should not overwrite museum board features with default PORT', () => {
            // Museum board layout with various features
            mockGame.grid[4][4] = TILE_TYPES.CRAYN;
            mockGame.grid[6][3] = TILE_TYPES.FELT;
            mockGame.grid[9][4] = TILE_TYPES.PORT; // Custom PORT position

            const defaultPortX = Math.floor(GRID_SIZE / 2);
            const defaultPortY = GRID_SIZE - 1;

            // Place something at default PORT location to verify it's not overwritten
            mockGame.grid[defaultPortY][defaultPortX] = TILE_TYPES.TABLE;

            zoneManager._positionAfterInteriorEntry();

            // Should not overwrite the table at default position
            expect(mockGame.grid[defaultPortY][defaultPortX]).toBe(TILE_TYPES.TABLE);

            // Should use the custom PORT
            expect(mockGame.playerFacade.setPosition).toHaveBeenCalledWith(9, 4);
        });
    });

    describe('Procedural Interior Compatibility', () => {
        test('should still work with procedurally generated interiors', () => {
            // Empty grid (no PORT) - procedural generation case
            const portX = Math.floor(GRID_SIZE / 2);
            const portY = GRID_SIZE - 1;

            zoneManager._positionAfterInteriorEntry();

            // Should create PORT at default location
            expect(mockGame.playerFacade.setPosition).toHaveBeenCalledWith(portX, portY);
        });

        test('should handle grids with only walls and floor', () => {
            // Typical procedural interior before PORT placement
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
                        mockGame.grid[y][x] = TILE_TYPES.WALL;
                    }
                }
            }

            const portX = Math.floor(GRID_SIZE / 2);
            const portY = GRID_SIZE - 1;

            zoneManager._positionAfterInteriorEntry();

            // Should still position at default location
            expect(mockGame.playerFacade.setPosition).toHaveBeenCalledWith(portX, portY);
        });
    });

    describe('Edge Cases', () => {
        test('should handle completely empty grid', () => {
            mockGame.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));

            const portX = Math.floor(GRID_SIZE / 2);
            const portY = GRID_SIZE - 1;

            zoneManager._positionAfterInteriorEntry();

            expect(mockGame.playerFacade.setPosition).toHaveBeenCalledWith(portX, portY);
        });

        test('should handle grid with all walls', () => {
            mockGame.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.WALL));

            const portX = Math.floor(GRID_SIZE / 2);
            const portY = GRID_SIZE - 1;

            zoneManager._positionAfterInteriorEntry();

            // Should still try to place player at default location
            expect(mockGame.playerFacade.setPosition).toHaveBeenCalledWith(portX, portY);
        });

        test('should handle PORT at grid boundaries', () => {
            // PORT at corner
            mockGame.grid[0][0] = TILE_TYPES.PORT;

            zoneManager._positionAfterInteriorEntry();

            expect(mockGame.playerFacade.setPosition).toHaveBeenCalledWith(0, 0);
        });
    });
});
