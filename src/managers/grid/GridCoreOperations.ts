/**
 * GridCoreOperations - Core grid access and validation
 *
 * Provides basic get/set/check operations for grid tiles.
 * Extracted from GridManager to reduce file size.
 */

import { getTileType, isTileType, isWalkable as isWalkableTile } from '@utils/TileUtils';
import { TileTypeChecker } from '@utils/TypeChecks';
import { logger } from '@core/logger';
import type { Tile, Grid } from '@core/SharedTypes';

export class GridCoreOperations {
    private grid: Grid;
    private gridWidth: number;
    private gridHeight: number;

    constructor(grid: Grid) {
        if (!grid || !Array.isArray(grid)) {
            throw new Error('GridCoreOperations requires a valid grid array');
        }

        this.grid = grid;
        this.gridHeight = grid.length;
        this.gridWidth = grid[0]?.length || 0;
    }

    /**
     * Check if coordinates are within the actual grid boundaries
     */
    isWithinBounds(x: number, y: number): boolean {
        return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
    }

    /**
     * Get tile at coordinates (safe access with bounds checking)
     */
    getTile(x: number, y: number): Tile | undefined {
        if (!this.isWithinBounds(x, y)) {
            logger.warn(`GridCoreOperations.getTile: coordinates out of bounds (${x}, ${y})`);
            return undefined;
        }
        return this.grid[y][x];
    }

    /**
     * Set tile at coordinates (safe write with bounds checking)
     */
    setTile(x: number, y: number, tile: Tile): boolean {
        if (!this.isWithinBounds(x, y)) {
            logger.warn(`GridCoreOperations.setTile: coordinates out of bounds (${x}, ${y})`);
            return false;
        }
        this.grid[y][x] = tile;
        return true;
    }

    /**
     * Check if tile at coordinates is walkable
     */
    isWalkable(x: number, y: number): boolean {
        const tile = this.getTile(x, y);
        return tile !== undefined && isWalkableTile(tile);
    }

    /**
     * Check if tile at coordinates matches a specific type
     */
    isTileType(x: number, y: number, tileType: number): boolean {
        const tile = this.getTile(x, y);
        return tile !== undefined && isTileType(tile, tileType);
    }

    /**
     * Get the type of tile at coordinates (normalized)
     */
    getTileType(x: number, y: number): number | undefined {
        const tile = this.getTile(x, y);
        return getTileType(tile);
    }

    /**
     * Clone a tile at coordinates (creates a shallow copy if object)
     */
    cloneTile(x: number, y: number): Tile | undefined {
        const tile = this.getTile(x, y);
        if (tile === undefined) return undefined;

        // If tile is an object, create shallow copy using TypeChecks
        if (TileTypeChecker.isTileObject(tile)) {
            return { ...tile };
        }

        return tile;
    }

    /**
     * Clear a tile (set to floor)
     */
    clearTile(x: number, y: number, floorType = 0): boolean {
        return this.setTile(x, y, floorType);
    }

    /**
     * Replace the entire grid reference (useful for zone transitions)
     */
    setGrid(newGrid: Grid): void {
        if (!newGrid || !Array.isArray(newGrid)) {
            throw new Error('GridCoreOperations.setGrid: Invalid grid provided');
        }
        this.grid = newGrid;
        this.gridHeight = newGrid.length;
        this.gridWidth = newGrid[0]?.length || 0;
    }

    /**
     * Get the raw grid reference
     * @internal This method is primarily for GridManager internal use.
     * External callers should prefer GridManager's abstraction methods.
     */
    getRawGrid(): Grid {
        return this.grid;
    }
}
