import GridIterator from '../utils/GridIterator.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants/index.js';
import { isTileType } from '../utils/TileUtils.js';

describe('GridIterator', () => {
    describe('initialize', () => {
        test('creates grid with constant value', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            expect(grid.length).toBe(GRID_SIZE);
            expect(grid[0].length).toBe(GRID_SIZE);
            expect(grid[0][0]).toBe(TILE_TYPES.FLOOR);
            expect(grid[GRID_SIZE - 1][GRID_SIZE - 1]).toBe(TILE_TYPES.FLOOR);
        });

        test('creates grid with generator function', () => {
            const grid = GridIterator.initialize((x, y) => x + y);
            expect(grid[0][0]).toBe(0);
            expect(grid[1][1]).toBe(2);
            expect(grid[5][3]).toBe(8);
        });
    });

    describe('forEach', () => {
        test('iterates over all tiles', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            let count = 0;
            GridIterator.forEach(grid, () => count++);
            expect(count).toBe(GRID_SIZE * GRID_SIZE);
        });

        test('iterates with correct coordinates', () => {
            const grid = GridIterator.initialize(0);
            GridIterator.forEach(grid, (tile, x, y) => {
                grid[y][x] = x + y * 100;
            });
            expect(grid[0][0]).toBe(0);
            expect(grid[0][5]).toBe(5);
            expect(grid[3][2]).toBe(302);
        });

        test('skips borders when requested', () => {
            const grid = GridIterator.initialize(0);
            GridIterator.forEach(grid, (tile, x, y) => {
                grid[y][x] = 1;
            }, { skipBorders: true });

            // Check borders are untouched
            expect(grid[0][0]).toBe(0);
            expect(grid[0][GRID_SIZE - 1]).toBe(0);
            expect(grid[GRID_SIZE - 1][0]).toBe(0);
            expect(grid[GRID_SIZE - 1][GRID_SIZE - 1]).toBe(0);

            // Check interior is modified
            expect(grid[1][1]).toBe(1);
            expect(grid[GRID_SIZE - 2][GRID_SIZE - 2]).toBe(1);
        });

        test('respects custom bounds', () => {
            const grid = GridIterator.initialize(0);
            GridIterator.forEach(grid, (tile, x, y) => {
                grid[y][x] = 1;
            }, { startY: 2, endY: 5, startX: 3, endX: 7 });

            expect(grid[2][3]).toBe(1);
            expect(grid[4][6]).toBe(1);
            expect(grid[1][3]).toBe(0); // Outside bounds
            expect(grid[2][2]).toBe(0); // Outside bounds
        });
    });

    describe('findTiles', () => {
        test('finds all matching tiles', () => {
            const grid = GridIterator.initialize((x, y) => (x + y) % 2 === 0 ? TILE_TYPES.FLOOR : TILE_TYPES.WALL);
            const floors = GridIterator.findTiles(grid, tile => isTileType(tile, TILE_TYPES.FLOOR));

            expect(floors.length).toBeGreaterThan(0);
            floors.forEach(({ tile, x, y }) => {
                expect(tile).toBe(TILE_TYPES.FLOOR);
                expect((x + y) % 2).toBe(0);
            });
        });

        test('returns empty array when no matches', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            const walls = GridIterator.findTiles(grid, tile => isTileType(tile, TILE_TYPES.WALL));
            expect(walls).toEqual([]);
        });

        test('includes coordinates in results', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            grid[5][3] = TILE_TYPES.WALL;
            grid[7][2] = TILE_TYPES.WALL;

            const walls = GridIterator.findTiles(grid, tile => isTileType(tile, TILE_TYPES.WALL));
            expect(walls.length).toBe(2);
            expect(walls).toContainEqual({ tile: TILE_TYPES.WALL, x: 3, y: 5 });
            expect(walls).toContainEqual({ tile: TILE_TYPES.WALL, x: 2, y: 7 });
        });
    });

    describe('findFirst', () => {
        test('finds first matching tile', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            grid[3][5] = TILE_TYPES.WALL;
            grid[7][2] = TILE_TYPES.WALL;

            const result = GridIterator.findFirst(grid, tile => isTileType(tile, TILE_TYPES.WALL));
            expect(result).toEqual({ tile: TILE_TYPES.WALL, x: 5, y: 3 });
        });

        test('returns null when no match', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            const result = GridIterator.findFirst(grid, tile => isTileType(tile, TILE_TYPES.WALL));
            expect(result).toBeNull();
        });

        test('respects custom bounds', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            grid[1][1] = TILE_TYPES.WALL;
            grid[5][5] = TILE_TYPES.WALL;

            const result = GridIterator.findFirst(grid, tile => isTileType(tile, TILE_TYPES.WALL), {
                startY: 3, startX: 3
            });
            expect(result).toEqual({ tile: TILE_TYPES.WALL, x: 5, y: 5 });
        });
    });

    describe('count', () => {
        test('counts matching tiles', () => {
            const grid = GridIterator.initialize((x, y) => (x + y) % 3 === 0 ? TILE_TYPES.WALL : TILE_TYPES.FLOOR);
            const wallCount = GridIterator.count(grid, tile => isTileType(tile, TILE_TYPES.WALL));
            expect(wallCount).toBeGreaterThan(0);
            expect(wallCount).toBeLessThan(GRID_SIZE * GRID_SIZE);
        });

        test('returns 0 when no matches', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            const count = GridIterator.count(grid, tile => isTileType(tile, TILE_TYPES.WALL));
            expect(count).toBe(0);
        });
    });

    describe('some', () => {
        test('returns true if any tile matches', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            grid[5][5] = TILE_TYPES.WALL;

            const result = GridIterator.some(grid, tile => isTileType(tile, TILE_TYPES.WALL));
            expect(result).toBe(true);
        });

        test('returns false if no tiles match', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            const result = GridIterator.some(grid, tile => isTileType(tile, TILE_TYPES.WALL));
            expect(result).toBe(false);
        });
    });

    describe('every', () => {
        test('returns true if all tiles match', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            const result = GridIterator.every(grid, tile => isTileType(tile, TILE_TYPES.FLOOR));
            expect(result).toBe(true);
        });

        test('returns false if any tile does not match', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            grid[5][5] = TILE_TYPES.WALL;

            const result = GridIterator.every(grid, tile => isTileType(tile, TILE_TYPES.FLOOR));
            expect(result).toBe(false);
        });
    });

    describe('map', () => {
        test('creates new grid with mapped values', () => {
            const grid = GridIterator.initialize((x, y) => x + y);
            const doubled = GridIterator.map(grid, tile => tile * 2);

            expect(doubled[0][0]).toBe(0);
            expect(doubled[1][1]).toBe(4);
            expect(doubled[3][2]).toBe(10);

            // Original grid should be unchanged
            expect(grid[1][1]).toBe(2);
        });
    });

    describe('reduce', () => {
        test('reduces grid to single value', () => {
            const grid = GridIterator.initialize(1);
            const sum = GridIterator.reduce(grid, (acc, tile) => acc + tile, 0);
            expect(sum).toBe(GRID_SIZE * GRID_SIZE);
        });

        test('can build complex accumulator', () => {
            const grid = GridIterator.initialize((x, y) => ({ x, y }));
            const coords = GridIterator.reduce(grid, (acc, tile) => {
                if (tile.x === tile.y) acc.push(tile);
                return acc;
            }, []);

            expect(coords.length).toBe(GRID_SIZE);
            coords.forEach(coord => expect(coord.x).toBe(coord.y));
        });
    });

    describe('canPlaceRegion', () => {
        test('returns true for valid placement', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            const result = GridIterator.canPlaceRegion(grid, 5, 5, 3, 3, tile => isTileType(tile, TILE_TYPES.FLOOR));
            expect(result).toBe(true);
        });

        test('returns false when out of bounds', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            const result = GridIterator.canPlaceRegion(grid, GRID_SIZE - 2, GRID_SIZE - 2, 3, 3, tile => isTileType(tile, TILE_TYPES.FLOOR));
            expect(result).toBe(false);
        });

        test('returns false when predicate fails', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            grid[6][6] = TILE_TYPES.WALL;

            const result = GridIterator.canPlaceRegion(grid, 5, 5, 3, 3, tile => isTileType(tile, TILE_TYPES.FLOOR));
            expect(result).toBe(false);
        });

        test('checks all tiles in region', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            grid[5][7] = TILE_TYPES.WALL; // Edge of 3x3 region starting at (5,5)

            const result = GridIterator.canPlaceRegion(grid, 5, 5, 3, 3, tile => isTileType(tile, TILE_TYPES.FLOOR));
            expect(result).toBe(false);
        });
    });

    describe('fillRegion', () => {
        test('fills region with constant value', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            GridIterator.fillRegion(grid, 5, 5, 3, 2, TILE_TYPES.WALL);

            expect(grid[5][5]).toBe(TILE_TYPES.WALL);
            expect(grid[5][7]).toBe(TILE_TYPES.WALL);
            expect(grid[6][5]).toBe(TILE_TYPES.WALL);
            expect(grid[6][7]).toBe(TILE_TYPES.WALL);

            // Outside region should be unchanged
            expect(grid[4][5]).toBe(TILE_TYPES.FLOOR);
            expect(grid[5][8]).toBe(TILE_TYPES.FLOOR);
        });

        test('fills region with function', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            GridIterator.fillRegion(grid, 2, 3, 3, 2, (x, y) => x + y);

            expect(grid[3][2]).toBe(5);
            expect(grid[3][4]).toBe(7);
            expect(grid[4][2]).toBe(6);
            expect(grid[4][4]).toBe(8);
        });

        test('handles out of bounds gracefully', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            // This should not throw
            expect(() => {
                GridIterator.fillRegion(grid, GRID_SIZE - 1, GRID_SIZE - 1, 3, 3, TILE_TYPES.WALL);
            }).not.toThrow();

            // Check that in-bounds tiles were filled
            expect(grid[GRID_SIZE - 1][GRID_SIZE - 1]).toBe(TILE_TYPES.WALL);
        });
    });

    describe('forEachInRegion', () => {
        test('iterates over region', () => {
            const grid = GridIterator.initialize(0);
            const visited = [];

            GridIterator.forEachInRegion(grid, 5, 5, 3, 3, (tile, x, y) => {
                visited.push({ x, y });
            });

            expect(visited.length).toBe(9);
            expect(visited).toContainEqual({ x: 4, y: 4 });
            expect(visited).toContainEqual({ x: 6, y: 6 });
        });

        test('returns true when all tiles in bounds', () => {
            const grid = GridIterator.initialize(0);
            const result = GridIterator.forEachInRegion(grid, 5, 5, 3, 3, () => {});
            expect(result).toBe(true);
        });

        test('returns false when region extends out of bounds', () => {
            const grid = GridIterator.initialize(0);
            const result = GridIterator.forEachInRegion(grid, GRID_SIZE - 1, GRID_SIZE - 1, 3, 3, () => {});
            expect(result).toBe(false);
        });
    });

    describe('toArray', () => {
        test('converts grid to flat array', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            grid[3][5] = TILE_TYPES.WALL;

            const array = GridIterator.toArray(grid);
            expect(array.length).toBe(GRID_SIZE * GRID_SIZE);
            expect(array[0]).toEqual({ tile: TILE_TYPES.FLOOR, x: 0, y: 0 });

            const wallTile = array.find(item => item.tile === TILE_TYPES.WALL);
            expect(wallTile).toEqual({ tile: TILE_TYPES.WALL, x: 5, y: 3 });
        });
    });

    describe('Integration tests', () => {
        test('finding and modifying bomb tiles', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            grid[3][5] = { type: TILE_TYPES.BOMB, timer: 0 };
            grid[7][2] = { type: TILE_TYPES.BOMB, timer: 1 };

            const isBomb = tile => tile && typeof tile === 'object' && tile.type === TILE_TYPES.BOMB;
            const bombs = GridIterator.findTiles(grid, isBomb);

            expect(bombs.length).toBe(2);
            bombs.forEach(({ tile, x, y }) => {
                tile.timer++;
                if (tile.timer >= 2) {
                    grid[y][x] = TILE_TYPES.FLOOR; // Explode
                }
            });

            expect(grid[3][5].timer).toBe(1);
            expect(grid[7][2]).toBe(TILE_TYPES.FLOOR);
        });

        test('finding valid spawn positions', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            // Add some obstacles
            grid[5][5] = TILE_TYPES.WALL;
            grid[6][6] = TILE_TYPES.WALL;

            const enemies = [{ x: 7, y: 7 }];
            const playerX = 1, playerY = 1;

            const validSpawns = GridIterator.findTiles(grid, (tile, x, y) => {
                const hasEnemy = enemies.some(e => e.x === x && e.y === y);
                const isPlayer = x === playerX && y === playerY;
                return tile === TILE_TYPES.FLOOR && !hasEnemy && !isPlayer;
            });

            expect(validSpawns.length).toBeGreaterThan(0);
            validSpawns.forEach(({ x, y }) => {
                expect(grid[y][x]).toBe(TILE_TYPES.FLOOR);
                expect(x !== playerX || y !== playerY).toBe(true);
                expect(!enemies.some(e => e.x === x && e.y === y)).toBe(true);
            });
        });

        test('structure placement validation', () => {
            const grid = GridIterator.initialize(TILE_TYPES.FLOOR);
            grid[5][5] = TILE_TYPES.WALL;

            // Try to place 3x3 structure at (4, 4) - should fail because (5,5) has wall
            const canPlace = GridIterator.canPlaceRegion(grid, 4, 4, 3, 3, tile => isTileType(tile, TILE_TYPES.FLOOR));
            expect(canPlace).toBe(false);

            // Try at (6, 6) - should succeed
            const canPlace2 = GridIterator.canPlaceRegion(grid, 6, 6, 3, 3, tile => isTileType(tile, TILE_TYPES.FLOOR));
            expect(canPlace2).toBe(true);

            if (canPlace2) {
                GridIterator.fillRegion(grid, 6, 6, 3, 3, TILE_TYPES.HOUSE);
            }

            expect(grid[6][6]).toBe(TILE_TYPES.HOUSE);
            expect(grid[8][8]).toBe(TILE_TYPES.HOUSE);
        });
    });
});
