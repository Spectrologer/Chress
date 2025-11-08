import { describe, test, expect } from 'vitest';
import { Position } from '@core/Position';
import { TILE_TYPES } from '@core/constants/index';
import { TileRegistry } from '@core/TileRegistry';
import { isAdjacent } from '@core/utils/DirectionUtils';

describe('InputCoordinator - Double-Click Interactions', () => {

    describe('Adjacency helper (isAdjacent)', () => {
        test('returns true for adjacent positions (cardinal)', () => {
            const pos1 = new Position(5, 5);
            const pos2Adjacent = new Position(5, 6); // Below
            const pos3Adjacent = new Position(6, 5); // Right

            const dx1 = Math.abs(pos1.x - pos2Adjacent.x);
            const dy1 = Math.abs(pos1.y - pos2Adjacent.y);
            const dx2 = Math.abs(pos1.x - pos3Adjacent.x);
            const dy2 = Math.abs(pos1.y - pos3Adjacent.y);

            expect(isAdjacent(dx1, dy1)).toBe(true);
            expect(isAdjacent(dx2, dy2)).toBe(true);
        });

        test('returns true for diagonally adjacent positions', () => {
            const pos1 = new Position(5, 5);
            const pos2Diagonal = new Position(6, 6); // Diagonal

            const dx = Math.abs(pos1.x - pos2Diagonal.x);
            const dy = Math.abs(pos1.y - pos2Diagonal.y);

            expect(isAdjacent(dx, dy)).toBe(true);
        });

        test('returns false for non-adjacent positions', () => {
            const pos1 = new Position(5, 5);
            const pos2Far = new Position(7, 7); // Too far
            const pos3Far = new Position(5, 8); // Too far vertically

            const dx1 = Math.abs(pos1.x - pos2Far.x);
            const dy1 = Math.abs(pos1.y - pos2Far.y);
            const dx2 = Math.abs(pos1.x - pos3Far.x);
            const dy2 = Math.abs(pos1.y - pos3Far.y);

            expect(isAdjacent(dx1, dy1)).toBe(false);
            expect(isAdjacent(dx2, dy2)).toBe(false);
        });

        test('returns false for same position', () => {
            const dx = 0;
            const dy = 0;

            expect(isAdjacent(dx, dy)).toBe(false);
        });
    });

    describe('Integration: TileRegistry checks', () => {
        test('TileRegistry.isChoppable identifies grass and shrubbery', () => {
            expect(TileRegistry.isChoppable(TILE_TYPES.GRASS)).toBe(true);
            expect(TileRegistry.isChoppable(TILE_TYPES.SHRUBBERY)).toBe(true);
            expect(TileRegistry.isChoppable(TILE_TYPES.ROCK)).toBe(false);
        });

        test('TileRegistry.isBreakable identifies rocks', () => {
            expect(TileRegistry.isBreakable(TILE_TYPES.ROCK)).toBe(true);
            expect(TileRegistry.isBreakable(TILE_TYPES.GRASS)).toBe(false);
            expect(TileRegistry.isBreakable(TILE_TYPES.FLOOR)).toBe(false);
        });

        test('TileRegistry.ALL_STATUE_TYPES includes all statues', () => {
            // Test enemy statues
            expect(TileRegistry.ALL_STATUE_TYPES.includes(TILE_TYPES.LIZARDY_STATUE)).toBe(true);
            expect(TileRegistry.ALL_STATUE_TYPES.includes(TILE_TYPES.LIZARDO_STATUE)).toBe(true);

            // Test item statues
            expect(TileRegistry.ALL_STATUE_TYPES.includes(TILE_TYPES.BOMB_STATUE)).toBe(true);
            expect(TileRegistry.ALL_STATUE_TYPES.includes(TILE_TYPES.SPEAR_STATUE)).toBe(true);

            // Test non-statue
            expect(TileRegistry.ALL_STATUE_TYPES.includes(TILE_TYPES.FLOOR)).toBe(false);
        });
    });
});
