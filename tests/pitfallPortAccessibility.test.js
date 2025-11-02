/**
 * @jest-environment jsdom
 */

import { PathGenerator } from '../generators/PathGenerator.js';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index.js';
import { isTileType } from '@utils/TileUtils.js';

/**
 * Tests to ensure that pitfall zones always have accessible escape routes.
 * The player should always be able to reach the PORT (stairup) to escape.
 */

describe('Pitfall Port Accessibility', () => {
    test('ensureExitAccess finds and clears paths to PORT tiles', () => {
        // Create a grid with walls everywhere except a few tiles
        const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.WALL));

        // Create a PORT in the middle
        const portX = Math.floor(GRID_SIZE / 2);
        const portY = Math.floor(GRID_SIZE / 2);
        grid[portY][portX] = { type: TILE_TYPES.PORT, portKind: 'stairup' };

        // Run ensureExitAccess
        const pathGen = new PathGenerator(grid);
        pathGen.ensureExitAccess();

        // Verify that tiles around the port have been cleared
        let hasAdjacentFloor = false;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const tile = grid[portY + dy][portX + dx];
                if (isTileType(tile, TILE_TYPES.FLOOR)) {
                    hasAdjacentFloor = true;
                    break;
                }
            }
            if (hasAdjacentFloor) break;
        }

        expect(hasAdjacentFloor).toBe(true);

        // Verify that the PORT itself was not overwritten
        expect(grid[portY][portX]).toEqual({ type: TILE_TYPES.PORT, portKind: 'stairup' });
    });

    test('ensureExitAccess handles multiple PORTs', () => {
        // Create a grid with walls
        const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.WALL));

        // Place multiple ports
        grid[2][2] = TILE_TYPES.PORT;
        grid[5][5] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };

        const pathGen = new PathGenerator(grid);
        pathGen.ensureExitAccess();

        // Both ports should still exist
        expect(grid[2][2]).toBe(TILE_TYPES.PORT);
        expect(grid[5][5]).toEqual({ type: TILE_TYPES.PORT, portKind: 'stairdown' });

        // Both should have adjacent floor tiles
        const hasFloorNearFirst = [
            grid[1][2], grid[3][2], grid[2][1], grid[2][3],
            grid[1][1], grid[1][3], grid[3][1], grid[3][3]
        ].some(tile => isTileType(tile, TILE_TYPES.FLOOR));

        const hasFloorNearSecond = [
            grid[4][5], grid[6][5], grid[5][4], grid[5][6],
            grid[4][4], grid[4][6], grid[6][4], grid[6][6]
        ].some(tile => isTileType(tile, TILE_TYPES.FLOOR));

        expect(hasFloorNearFirst).toBe(true);
        expect(hasFloorNearSecond).toBe(true);
    });

    test('clearPathToCenter does not overwrite PORT tiles', () => {
        const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.WALL));

        // Place a port in the path to center
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);
        grid[centerY][centerX] = { type: TILE_TYPES.PORT, portKind: 'stairup' };

        // Create a spawn point in a corner
        const startX = 2;
        const startY = 2;
        grid[startY][startX] = TILE_TYPES.FLOOR;

        const pathGen = new PathGenerator(grid);
        pathGen.clearPathToCenter(startX, startY);

        // The PORT should still exist
        expect(grid[centerY][centerX]).toEqual({ type: TILE_TYPES.PORT, portKind: 'stairup' });
    });

    test('ensureExitAccess handles both EXIT and PORT tiles', () => {
        const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.WALL));

        // Place an EXIT on the edge
        grid[0][5] = TILE_TYPES.EXIT;

        // Place a PORT in the middle
        grid[4][4] = { type: TILE_TYPES.PORT, portKind: 'stairup' };

        const pathGen = new PathGenerator(grid);
        pathGen.ensureExitAccess();

        // Both should still exist
        expect(grid[0][5]).toBe(TILE_TYPES.EXIT);
        expect(grid[4][4]).toEqual({ type: TILE_TYPES.PORT, portKind: 'stairup' });

        // Both should have accessible paths
        expect(grid[1][5]).toBe(TILE_TYPES.FLOOR); // Adjacent to EXIT

        // Check for floor near PORT
        const hasFloorNearPort = [
            grid[3][4], grid[5][4], grid[4][3], grid[4][5],
            grid[3][3], grid[3][5], grid[5][3], grid[5][5]
        ].some(tile => isTileType(tile, TILE_TYPES.FLOOR));
        expect(hasFloorNearPort).toBe(true);
    });

    test('pitfall zone with isolated PORT gets cleared path', () => {
        // Simulate a worst-case scenario: PORT surrounded by obstacles
        const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));

        const portX = 4;
        const portY = 4;

        // Surround the port with rocks
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) {
                    grid[portY][portX] = { type: TILE_TYPES.PORT, portKind: 'stairup' };
                } else {
                    grid[portY + dy][portX + dx] = TILE_TYPES.ROCK;
                }
            }
        }

        const pathGen = new PathGenerator(grid);
        pathGen.ensureExitAccess();

        // Verify the PORT is still there
        expect(grid[portY][portX]).toEqual({ type: TILE_TYPES.PORT, portKind: 'stairup' });

        // Verify at least one adjacent tile was cleared
        let clearedCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                if (grid[portY + dy][portX + dx] === TILE_TYPES.FLOOR) {
                    clearedCount++;
                }
            }
        }

        expect(clearedCount).toBeGreaterThan(0);
    });

    test('clearPathToCenter clears obstacles but preserves important tiles', () => {
        const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));

        // Create a wall barrier
        for (let x = 3; x < 6; x++) {
            grid[4][x] = TILE_TYPES.WALL;
        }

        // Place a PORT beyond the wall
        grid[5][4] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };

        // Start position on the other side
        const startX = 2;
        const startY = 4;

        const pathGen = new PathGenerator(grid);
        pathGen.clearPathToCenter(startX, startY);

        // The path should have cleared some wall tiles
        const wallsRemaining = [grid[4][3], grid[4][4], grid[4][5]].filter(t => t === TILE_TYPES.WALL).length;
        expect(wallsRemaining).toBeLessThan(3);

        // But the PORT should remain
        expect(grid[5][4]).toEqual({ type: TILE_TYPES.PORT, portKind: 'stairdown' });
    });
});
