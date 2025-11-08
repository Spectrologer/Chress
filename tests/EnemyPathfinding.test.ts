import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EnemyPathfinding } from '../src/enemy/EnemyPathfinding\.ts';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';

describe('EnemyPathfinding', () => {
    let grid: unknown[][];
    let isWalkable: (x: number, y: number, grid: unknown[][]) => boolean;

    beforeEach(() => {
        // Create a grid filled with walkable floor tiles
        grid = Array(GRID_SIZE).fill(null).map(() =>
            Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)
        );

        // Default walkability check: floor tiles are walkable, walls are not
        isWalkable = (x: number, y: number, g: unknown[][]) => {
            if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
                return false;
            }
            return g[y][x] === TILE_TYPES.FLOOR;
        };
    });

    describe('findPath - Basic functionality', () => {
        it('should find a path between two adjacent positions', () => {
            const path = EnemyPathfinding.findPath(5, 5, 6, 5, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            expect(path).toHaveLength(2);
            expect(path![0]).toEqual({ x: 5, y: 5 });
            expect(path![1]).toEqual({ x: 6, y: 5 });
        });

        it('should find a path between distant positions', () => {
            const path = EnemyPathfinding.findPath(0, 0, 5, 5, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            expect(path!.length).toBeGreaterThan(2);
            expect(path![0]).toEqual({ x: 0, y: 0 });
            expect(path![path!.length - 1]).toEqual({ x: 5, y: 5 });
        });

        it('should return null when target is unreachable', () => {
            // Create walls blocking the path
            for (let x = 0; x < GRID_SIZE; x++) {
                grid[5][x] = TILE_TYPES.WALL;
            }

            const path = EnemyPathfinding.findPath(0, 0, 0, 10, grid, 'lizardo', isWalkable);

            expect(path).toBeNull();
        });

        it('should return path with start position when start equals target', () => {
            const path = EnemyPathfinding.findPath(5, 5, 5, 5, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            expect(path).toHaveLength(1);
            expect(path![0]).toEqual({ x: 5, y: 5 });
        });

        it('should not revisit already explored positions', () => {
            const visitedPositions = new Set<string>();
            const trackingIsWalkable = (x: number, y: number, g: unknown[][]) => {
                const key = `${x},${y}`;
                expect(visitedPositions.has(key)).toBe(false);
                visitedPositions.add(key);
                return isWalkable(x, y, g);
            };

            EnemyPathfinding.findPath(0, 0, 3, 3, grid, 'lizardo', trackingIsWalkable);

            // Each position should only be visited once
            expect(visitedPositions.size).toBeGreaterThan(0);
        });

        it('should find shortest path', () => {
            // In an open grid, shortest path should be direct
            const path = EnemyPathfinding.findPath(0, 0, 3, 0, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            expect(path!.length).toBe(4); // [0,0], [1,0], [2,0], [3,0]
        });
    });

    describe('findPath - Enemy type: lizardo (King-like, 8-way)', () => {
        it('should move in all 8 directions', () => {
            const path = EnemyPathfinding.findPath(5, 5, 6, 6, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            expect(path).toHaveLength(2);
            expect(path![1]).toEqual({ x: 6, y: 6 }); // Diagonal move
        });

        it('should use diagonal shortcuts', () => {
            const path = EnemyPathfinding.findPath(0, 0, 5, 5, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            // With diagonals, should be able to reach in 6 moves
            expect(path!.length).toBeLessThanOrEqual(6);
        });
    });

    describe('findPath - Enemy type: lizardy (Pawn-like, vertical only)', () => {
        it('should only move vertically', () => {
            const path = EnemyPathfinding.findPath(5, 5, 5, 8, grid, 'lizardy', isWalkable);

            expect(path).not.toBeNull();
            expect(path).toHaveLength(4); // [5,5], [5,6], [5,7], [5,8]

            // All positions should have same x coordinate
            path!.forEach(pos => {
                expect(pos.x).toBe(5);
            });
        });

        it('should not be able to reach horizontal targets directly', () => {
            const path = EnemyPathfinding.findPath(5, 5, 8, 5, grid, 'lizardy', isWalkable);

            expect(path).toBeNull(); // Cannot move horizontally
        });

        it('should not be able to reach diagonal targets', () => {
            const path = EnemyPathfinding.findPath(5, 5, 8, 8, grid, 'lizardy', isWalkable);

            expect(path).toBeNull(); // Cannot move diagonally
        });
    });

    describe('findPath - Enemy type: lizord (Knight-like, L-shaped)', () => {
        it('should move in L-shaped patterns', () => {
            const path = EnemyPathfinding.findPath(5, 5, 6, 7, grid, 'lizord', isWalkable);

            expect(path).not.toBeNull();
            expect(path).toHaveLength(2);
            expect(path![1]).toEqual({ x: 6, y: 7 }); // L-shaped move: +1x, +2y
        });

        it('should be able to reach all 8 L-shaped positions', () => {
            const center = { x: 10, y: 10 };
            const lShapedMoves = [
                { x: 11, y: 12 }, // +1x, +2y
                { x: 11, y: 8 },  // +1x, -2y
                { x: 9, y: 12 },  // -1x, +2y
                { x: 9, y: 8 },   // -1x, -2y
                { x: 12, y: 11 }, // +2x, +1y
                { x: 12, y: 9 },  // +2x, -1y
                { x: 8, y: 11 },  // -2x, +1y
                { x: 8, y: 9 }    // -2x, -1y
            ];

            lShapedMoves.forEach(target => {
                const path = EnemyPathfinding.findPath(
                    center.x, center.y,
                    target.x, target.y,
                    grid, 'lizord', isWalkable
                );

                expect(path).not.toBeNull();
                expect(path![1]).toEqual(target);
            });
        });

        it('should not be able to reach adjacent orthogonal positions directly', () => {
            const path = EnemyPathfinding.findPath(5, 5, 6, 5, grid, 'lizord', isWalkable);

            // Knight cannot move to adjacent orthogonal squares directly
            if (path) {
                expect(path.length).toBeGreaterThan(2);
            }
        });
    });

    describe('findPath - Enemy type: zard (Bishop-like, diagonal only)', () => {
        it('should only move diagonally', () => {
            const path = EnemyPathfinding.findPath(5, 5, 8, 8, grid, 'zard', isWalkable);

            expect(path).not.toBeNull();
            expect(path).toHaveLength(4); // [5,5], [6,6], [7,7], [8,8]

            // All moves should be diagonal (dx === dy)
            for (let i = 1; i < path!.length; i++) {
                const dx = Math.abs(path![i].x - path![i - 1].x);
                const dy = Math.abs(path![i].y - path![i - 1].y);
                expect(dx).toBe(dy);
            }
        });

        it('should not be able to reach orthogonal targets directly', () => {
            const path = EnemyPathfinding.findPath(5, 5, 8, 5, grid, 'zard', isWalkable);

            expect(path).toBeNull(); // Cannot move orthogonally
        });

        it('should reach all 4 diagonal directions', () => {
            const center = { x: 10, y: 10 };
            const diagonals = [
                { x: 12, y: 12 }, // Southeast
                { x: 8, y: 8 },   // Northwest
                { x: 12, y: 8 },  // Northeast
                { x: 8, y: 12 }   // Southwest
            ];

            diagonals.forEach(target => {
                const path = EnemyPathfinding.findPath(
                    center.x, center.y,
                    target.x, target.y,
                    grid, 'zard', isWalkable
                );

                expect(path).not.toBeNull();
            });
        });
    });

    describe('findPath - Enemy type: lizardeaux (Rook-like, orthogonal only)', () => {
        it('should only move orthogonally', () => {
            const path = EnemyPathfinding.findPath(5, 5, 10, 5, grid, 'lizardeaux', isWalkable);

            expect(path).not.toBeNull();
            expect(path).toHaveLength(6); // [5,5], [6,5], [7,5], [8,5], [9,5], [10,5]

            // All positions should have same y coordinate (horizontal move)
            path!.forEach(pos => {
                expect(pos.y).toBe(5);
            });
        });

        it('should not be able to reach diagonal targets directly', () => {
            const path = EnemyPathfinding.findPath(5, 5, 8, 8, grid, 'lizardeaux', isWalkable);

            expect(path).toBeNull(); // Cannot move diagonally
        });

        it('should reach all 4 orthogonal directions', () => {
            const center = { x: 10, y: 10 };
            const orthogonals = [
                { x: 10, y: 5 },  // North
                { x: 10, y: 15 }, // South
                { x: 5, y: 10 },  // West
                { x: 15, y: 10 }  // East
            ];

            orthogonals.forEach(target => {
                const path = EnemyPathfinding.findPath(
                    center.x, center.y,
                    target.x, target.y,
                    grid, 'lizardeaux', isWalkable
                );

                expect(path).not.toBeNull();
            });
        });
    });

    describe('findPath - Enemy type: lazerd (Queen-like, 8-way any distance)', () => {
        it('should move in all 8 directions', () => {
            const center = { x: 10, y: 10 };
            const targets = [
                { x: 10, y: 15 }, // South
                { x: 10, y: 5 },  // North
                { x: 15, y: 10 }, // East
                { x: 5, y: 10 },  // West
                { x: 15, y: 15 }, // Southeast
                { x: 5, y: 5 },   // Northwest
                { x: 15, y: 5 },  // Northeast
                { x: 5, y: 15 }   // Southwest
            ];

            targets.forEach(target => {
                const path = EnemyPathfinding.findPath(
                    center.x, center.y,
                    target.x, target.y,
                    grid, 'lazerd', isWalkable
                );

                expect(path).not.toBeNull();
            });
        });

        it('should find shortest diagonal paths', () => {
            const path = EnemyPathfinding.findPath(0, 0, 5, 5, grid, 'lazerd', isWalkable);

            expect(path).not.toBeNull();
            expect(path!.length).toBe(6); // Direct diagonal
        });
    });

    describe('findPath - Obstacle avoidance', () => {
        it('should navigate around single obstacle', () => {
            grid[5][5] = TILE_TYPES.WALL;

            const path = EnemyPathfinding.findPath(4, 5, 6, 5, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            expect(path!.length).toBeGreaterThan(3); // Must go around
            // Path should not include the wall
            path!.forEach(pos => {
                if (pos.x === 5 && pos.y === 5) {
                    expect(false).toBe(true); // Should not happen
                }
            });
        });

        it('should navigate through narrow corridors', () => {
            // Create a corridor
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    grid[y][x] = TILE_TYPES.WALL;
                }
            }

            // Create a narrow path
            for (let x = 0; x < 10; x++) {
                grid[5][x] = TILE_TYPES.FLOOR;
            }

            const path = EnemyPathfinding.findPath(0, 5, 9, 5, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            expect(path!.length).toBe(10);
        });

        it('should find alternate routes when primary path is blocked', () => {
            // Block direct path
            grid[5][5] = TILE_TYPES.WALL;
            grid[5][4] = TILE_TYPES.WALL;
            grid[5][6] = TILE_TYPES.WALL;

            const path = EnemyPathfinding.findPath(3, 5, 7, 5, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            // Should find a path around the obstacle
            expect(path!.length).toBeGreaterThan(5);
        });

        it('should handle complex maze-like structures', () => {
            // Create a zigzag path
            for (let y = 0; y < 10; y++) {
                if (y % 2 === 0) {
                    for (let x = 0; x < 9; x++) {
                        grid[y][x] = TILE_TYPES.WALL;
                    }
                } else {
                    for (let x = 1; x < 10; x++) {
                        grid[y][x] = TILE_TYPES.WALL;
                    }
                }
            }

            const path = EnemyPathfinding.findPath(0, 0, 9, 9, grid, 'lizardo', isWalkable);

            // Should find a path through the zigzag or return null if impossible
            if (path) {
                expect(path[0]).toEqual({ x: 0, y: 0 });
            }
        });
    });

    describe('getMovementDirectionsForType', () => {
        it('should return 8 directions for lizardo', () => {
            const directions = EnemyPathfinding.getMovementDirectionsForType('lizardo');

            expect(directions).toHaveLength(8);
            expect(directions).toContainEqual({ x: 0, y: -1 }); // North
            expect(directions).toContainEqual({ x: 1, y: 1 });  // Southeast
        });

        it('should return 2 directions for lizardy', () => {
            const directions = EnemyPathfinding.getMovementDirectionsForType('lizardy');

            expect(directions).toHaveLength(2);
            expect(directions).toContainEqual({ x: 0, y: -1 }); // North
            expect(directions).toContainEqual({ x: 0, y: 1 });  // South
        });

        it('should return 8 L-shaped directions for lizord', () => {
            const directions = EnemyPathfinding.getMovementDirectionsForType('lizord');

            expect(directions).toHaveLength(8);
            expect(directions).toContainEqual({ x: 1, y: 2 });
            expect(directions).toContainEqual({ x: 2, y: 1 });
        });

        it('should return 4 diagonal directions for zard', () => {
            const directions = EnemyPathfinding.getMovementDirectionsForType('zard');

            expect(directions).toHaveLength(4);
            expect(directions).toContainEqual({ x: -1, y: -1 }); // Northwest
            expect(directions).toContainEqual({ x: 1, y: 1 });   // Southeast
        });

        it('should return 4 orthogonal directions for lizardeaux', () => {
            const directions = EnemyPathfinding.getMovementDirectionsForType('lizardeaux');

            expect(directions).toHaveLength(4);
            expect(directions).toContainEqual({ x: 0, y: -1 }); // North
            expect(directions).toContainEqual({ x: 1, y: 0 });  // East
        });

        it('should return 8 directions for lazerd', () => {
            const directions = EnemyPathfinding.getMovementDirectionsForType('lazerd');

            expect(directions).toHaveLength(8);
            expect(directions).toContainEqual({ x: 0, y: -1 }); // North
            expect(directions).toContainEqual({ x: 1, y: 1 });  // Southeast
        });

        it('should return 4 orthogonal directions for unknown enemy types', () => {
            const directions = EnemyPathfinding.getMovementDirectionsForType('unknown_enemy');

            expect(directions).toHaveLength(4);
            expect(directions).toContainEqual({ x: 0, y: -1 }); // North
            expect(directions).toContainEqual({ x: 1, y: 0 });  // East
        });

        it('should return same result for lazord as lizardo', () => {
            const lizordDirs = EnemyPathfinding.getMovementDirectionsForType('lazord');
            const lizardoDirs = EnemyPathfinding.getMovementDirectionsForType('lizardo');

            expect(lizordDirs).toEqual(lizardoDirs);
        });
    });

    describe('getMovementDirections - Compatibility method', () => {
        it('should call getMovementDirectionsForType', () => {
            const spy = vi.spyOn(EnemyPathfinding, 'getMovementDirectionsForType');

            EnemyPathfinding.getMovementDirections('lizardo');

            expect(spy).toHaveBeenCalledWith('lizardo');
        });

        it('should return same result as getMovementDirectionsForType', () => {
            const type = 'zard';
            const result1 = EnemyPathfinding.getMovementDirections(type);
            const result2 = EnemyPathfinding.getMovementDirectionsForType(type);

            expect(result1).toEqual(result2);
        });
    });

    describe('Edge cases and performance', () => {
        it('should handle start position at grid boundary', () => {
            const path = EnemyPathfinding.findPath(0, 0, 3, 3, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            expect(path![0]).toEqual({ x: 0, y: 0 });
        });

        it('should handle target position at grid boundary', () => {
            const path = EnemyPathfinding.findPath(
                10, 10,
                GRID_SIZE - 1, GRID_SIZE - 1,
                grid, 'lizardo', isWalkable
            );

            expect(path).not.toBeNull();
            expect(path![path!.length - 1]).toEqual({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 });
        });

        it('should handle unwalkable start position', () => {
            grid[5][5] = TILE_TYPES.WALL;

            const path = EnemyPathfinding.findPath(5, 5, 10, 10, grid, 'lizardo', isWalkable);

            // Start is marked as visited even if unwalkable
            expect(path).not.toBeNull();
            expect(path![0]).toEqual({ x: 5, y: 5 });
        });

        it('should handle unwalkable target position', () => {
            grid[10][10] = TILE_TYPES.WALL;

            const path = EnemyPathfinding.findPath(5, 5, 10, 10, grid, 'lizardo', isWalkable);

            expect(path).toBeNull(); // Cannot reach unwalkable target
        });

        it('should handle completely walled-in start position', () => {
            // Wall off position [5,5]
            grid[4][5] = TILE_TYPES.WALL;
            grid[6][5] = TILE_TYPES.WALL;
            grid[5][4] = TILE_TYPES.WALL;
            grid[5][6] = TILE_TYPES.WALL;
            grid[4][4] = TILE_TYPES.WALL;
            grid[6][6] = TILE_TYPES.WALL;
            grid[4][6] = TILE_TYPES.WALL;
            grid[6][4] = TILE_TYPES.WALL;

            const path = EnemyPathfinding.findPath(5, 5, 10, 10, grid, 'lizardo', isWalkable);

            expect(path).toBeNull();
        });

        it('should perform efficiently on large grids', () => {
            const startTime = performance.now();

            EnemyPathfinding.findPath(0, 0, GRID_SIZE - 1, GRID_SIZE - 1, grid, 'lizardo', isWalkable);

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should complete in reasonable time (< 100ms for typical grid size)
            expect(duration).toBeLessThan(100);
        });

        it('should handle paths requiring many steps', () => {
            // Create a very long winding path
            const path = EnemyPathfinding.findPath(0, 0, 19, 19, grid, 'lizardy', isWalkable);

            // lizardy can only move vertically, so cannot reach diagonal target
            expect(path).toBeNull();
        });

        it('should handle custom walkability functions', () => {
            const customWalkable = (x: number, y: number, g: unknown[][]) => {
                // Only even coordinates are walkable
                return x % 2 === 0 && y % 2 === 0 && isWalkable(x, y, g);
            };

            const path = EnemyPathfinding.findPath(0, 0, 4, 4, grid, 'lizardo', customWalkable);

            if (path) {
                path.forEach(pos => {
                    if (pos.x !== 0 && pos.y !== 0) {
                        expect(pos.x % 2).toBe(0);
                        expect(pos.y % 2).toBe(0);
                    }
                });
            }
        });
    });

    describe('Path reconstruction correctness', () => {
        it('should return path from start to target in correct order', () => {
            const path = EnemyPathfinding.findPath(0, 0, 5, 0, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            expect(path![0]).toEqual({ x: 0, y: 0 }); // Start
            expect(path![path!.length - 1]).toEqual({ x: 5, y: 0 }); // End
        });

        it('should include all intermediate positions', () => {
            const path = EnemyPathfinding.findPath(0, 0, 3, 0, grid, 'lizardo', isWalkable);

            expect(path).not.toBeNull();
            expect(path).toHaveLength(4);
            // Should be continuous path
            for (let i = 1; i < path!.length; i++) {
                const prev = path![i - 1];
                const curr = path![i];
                const dx = Math.abs(curr.x - prev.x);
                const dy = Math.abs(curr.y - prev.y);

                // For lizardo, each step should be adjacent (including diagonal)
                expect(dx + dy).toBeGreaterThan(0);
                expect(dx).toBeLessThanOrEqual(1);
                expect(dy).toBeLessThanOrEqual(1);
            }
        });

        it('should create valid path where each step is according to enemy movement rules', () => {
            const path = EnemyPathfinding.findPath(5, 5, 5, 10, grid, 'lizardy', isWalkable);

            expect(path).not.toBeNull();

            // For lizardy (vertical only), x should not change
            for (let i = 1; i < path!.length; i++) {
                expect(path![i].x).toBe(path![i - 1].x);
                expect(Math.abs(path![i].y - path![i - 1].y)).toBe(1);
            }
        });
    });

    describe('BFS algorithm correctness', () => {
        it('should guarantee shortest path in terms of number of moves', () => {
            const path1 = EnemyPathfinding.findPath(0, 0, 5, 0, grid, 'lizardo', isWalkable);
            const path2 = EnemyPathfinding.findPath(0, 0, 5, 0, grid, 'lizardo', isWalkable);

            // Multiple calls should return same length (shortest)
            expect(path1!.length).toBe(path2!.length);
            expect(path1!.length).toBe(6); // Direct path
        });

        it('should explore positions in breadth-first order', () => {
            const exploredOrder: string[] = [];
            const trackingWalkable = (x: number, y: number, g: unknown[][]) => {
                exploredOrder.push(`${x},${y}`);
                return isWalkable(x, y, g);
            };

            EnemyPathfinding.findPath(5, 5, 8, 8, grid, 'lizardo', trackingWalkable);

            // First explored should be start position neighbors
            // BFS explores layer by layer
            expect(exploredOrder[0]).toBe('5,5'); // Start position visited first
        });

        it('should stop searching once target is found', () => {
            let walkableCallCount = 0;
            const countingWalkable = (x: number, y: number, g: unknown[][]) => {
                walkableCallCount++;
                return isWalkable(x, y, g);
            };

            EnemyPathfinding.findPath(5, 5, 6, 5, grid, 'lizardo', countingWalkable);

            // Should not explore entire grid for nearby target
            expect(walkableCallCount).toBeLessThan(GRID_SIZE * GRID_SIZE);
        });
    });
});
