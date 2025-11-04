/**
 * GridIterationOperations - Grid iteration and transformation operations
 *
 * Provides methods for iterating, filling, and transforming grid regions.
 * Extracted from GridManager to reduce file size.
 */

import { GridIterator } from '@utils/GridIterator';
import { logger } from '@core/logger';
import type { Tile, Grid } from '@core/SharedTypes';

type TileCallback = (tile: Tile, x: number, y: number) => void;
type TilePredicate = (tile: Tile, x: number, y: number) => boolean;

export class GridIterationOperations {
    private grid: Grid;
    private isWithinBounds: (x: number, y: number) => boolean;
    private getTile: (x: number, y: number) => Tile | undefined;

    constructor(grid: Grid, isWithinBounds: (x: number, y: number) => boolean, getTile: (x: number, y: number) => Tile | undefined) {
        this.grid = grid;
        this.isWithinBounds = isWithinBounds;
        this.getTile = getTile;
    }

    /**
     * Iterate over each tile in the grid
     */
    forEach(callback: TileCallback, options: Record<string, any> = {}): void {
        GridIterator.forEach(this.grid, callback, options as any);
    }

    /**
     * Fill a rectangular region with a tile value
     */
    fillRegion(x: number, y: number, width: number, height: number, value: Tile | ((x: number, y: number) => Tile)): void {
        GridIterator.fillRegion(this.grid, x, y, width, height, value);
    }

    /**
     * Check if a rectangular region can be placed at coordinates
     */
    canPlaceRegion(x: number, y: number, width: number, height: number, predicate: TilePredicate): boolean {
        return GridIterator.canPlaceRegion(this.grid, x, y, width, height, predicate);
    }

    /**
     * Iterate over tiles in a rectangular region around a center point
     */
    forEachInRegion(centerX: number, centerY: number, width: number, height: number, callback: TileCallback): boolean {
        return GridIterator.forEachInRegion(this.grid, centerX, centerY, width, height, callback);
    }

    /**
     * Swap tiles at two positions
     */
    swapTiles(x1: number, y1: number, x2: number, y2: number): boolean {
        if (!this.isWithinBounds(x1, y1) || !this.isWithinBounds(x2, y2)) {
            logger.warn(`GridIterationOperations.swapTiles: coordinates out of bounds`);
            return false;
        }

        const temp = this.grid[y1][x1];
        this.grid[y1][x1] = this.grid[y2][x2];
        this.grid[y2][x2] = temp;
        return true;
    }

    /**
     * Create a deep copy of the current grid
     */
    cloneGrid(): Grid {
        return this.grid.map(row =>
            row.map(tile => {
                if (typeof tile === 'object' && tile !== null) {
                    return { ...tile };
                }
                return tile;
            })
        );
    }

    /**
     * Update the grid reference (for zone transitions)
     */
    setGrid(newGrid: Grid): void {
        this.grid = newGrid;
    }
}
