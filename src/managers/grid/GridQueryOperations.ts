/**
 * GridQueryOperations - Advanced grid query and search operations
 *
 * Provides methods for finding, filtering, and counting tiles.
 * Extracted from GridManager to reduce file size.
 */

import { GridIterator } from '../../utils/GridIterator.js';
import { isTileType } from '../../utils/TileUtils.js';

type Tile = number | Record<string, any>;
type Grid = Array<Array<Tile>>;
type TilePredicate = (tile: Tile, x: number, y: number) => boolean;

interface TileWithPosition {
    tile: Tile;
    x: number;
    y: number;
}

interface NeighborTile {
    tile: Tile;
    x: number;
    y: number;
    direction: string;
}

interface DirectionInfo {
    dx: number;
    dy: number;
    name: string;
}

export class GridQueryOperations {
    private grid: Grid;
    private getTile: (x: number, y: number) => Tile | undefined;

    constructor(grid: Grid, getTile: (x: number, y: number) => Tile | undefined) {
        this.grid = grid;
        this.getTile = getTile;
    }

    /**
     * Find all tiles matching a predicate
     */
    findTiles(predicate: TilePredicate, options: Record<string, any> = {}): TileWithPosition[] {
        return GridIterator.findTiles(this.grid, predicate, options);
    }

    /**
     * Find first tile matching a predicate
     */
    findFirst(predicate: TilePredicate, options: Record<string, any> = {}): TileWithPosition | null {
        return GridIterator.findFirst(this.grid, predicate, options);
    }

    /**
     * Find all tiles of a specific type
     */
    findTilesOfType(tileType: number, options: Record<string, any> = {}): TileWithPosition[] {
        return this.findTiles(tile => isTileType(tile, tileType), options);
    }

    /**
     * Count tiles matching a predicate
     */
    count(predicate: TilePredicate, options: Record<string, any> = {}): number {
        return GridIterator.count(this.grid, predicate, options);
    }

    /**
     * Check if any tile matches a predicate
     */
    some(predicate: TilePredicate, options: Record<string, any> = {}): boolean {
        return GridIterator.some(this.grid, predicate, options);
    }

    /**
     * Check if all tiles match a predicate
     */
    every(predicate: TilePredicate, options: Record<string, any> = {}): boolean {
        return GridIterator.every(this.grid, predicate, options);
    }

    /**
     * Get all tiles in the grid as a flat array
     */
    toArray(options: Record<string, any> = {}): TileWithPosition[] {
        return GridIterator.toArray(this.grid, options);
    }

    /**
     * Get neighbors of a tile (4-directional: up, down, left, right)
     */
    getNeighbors(x: number, y: number, includeDiagonals: boolean = false): NeighborTile[] {
        const neighbors: NeighborTile[] = [];

        // Cardinal directions
        const directions: DirectionInfo[] = [
            { dx: 0, dy: -1, name: 'up' },
            { dx: 0, dy: 1, name: 'down' },
            { dx: -1, dy: 0, name: 'left' },
            { dx: 1, dy: 0, name: 'right' }
        ];

        // Add diagonals if requested
        if (includeDiagonals) {
            directions.push(
                { dx: -1, dy: -1, name: 'up-left' },
                { dx: 1, dy: -1, name: 'up-right' },
                { dx: -1, dy: 1, name: 'down-left' },
                { dx: 1, dy: 1, name: 'down-right' }
            );
        }

        for (const { dx, dy, name } of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const tile = this.getTile(nx, ny);

            if (tile !== undefined) {
                neighbors.push({ tile, x: nx, y: ny, direction: name });
            }
        }

        return neighbors;
    }
}
