import { GRID_SIZE } from '../core/constants/index.js';

/**
 * GridIterator - Utility for iterating over game grids
 *
 * Eliminates duplicated nested loop patterns across the codebase.
 * Provides a consistent, declarative API for grid operations.
 *
 * @example
 * // Find all bombs on the grid
 * const bombs = GridIterator.findTiles(game.grid, isBomb);
 * bombs.forEach(({tile, x, y}) => explodeBomb(x, y));
 *
 * @example
 * // Process each tile
 * GridIterator.forEach(game.grid, (tile, x, y) => {
 *   if (isBomb(tile)) explode(x, y);
 * });
 *
 * @example
 * // Find first matching tile
 * const exitTile = GridIterator.findFirst(grid, tile => tile === TILE_TYPES.EXIT);
 */

export interface IterationOptions {
  startY?: number;
  endY?: number;
  startX?: number;
  endX?: number;
  skipBorders?: boolean;
}

export interface TileWithCoordinates<T = any> {
  tile: T;
  x: number;
  y: number;
}

export type Grid<T = any> = T[][];
export type TileCallback<T = any> = (tile: T, x: number, y: number, grid: Grid<T>) => void;
export type TilePredicate<T = any> = (tile: T, x: number, y: number) => boolean;
export type TileMapper<T = any, R = any> = (tile: T, x: number, y: number) => R;
export type TileReducer<T = any, R = any> = (accumulator: R, tile: T, x: number, y: number) => R;
export type ValueOrGenerator<T = any> = T | ((x: number, y: number) => T);

export class GridIterator {
  /**
   * Iterate over all tiles in a grid and execute a callback
   * @param grid - The 2D grid to iterate
   * @param callback - Function(tile, x, y, grid) => void
   * @param options - Iteration options
   */
  static forEach<T = any>(
    grid: Grid<T>,
    callback: TileCallback<T>,
    options: IterationOptions = {}
  ): void {
    const {
      startY = 0,
      endY = GRID_SIZE,
      startX = 0,
      endX = GRID_SIZE,
      skipBorders = false
    } = options;

    const actualStartY = skipBorders ? 1 : startY;
    const actualEndY = skipBorders ? GRID_SIZE - 1 : endY;
    const actualStartX = skipBorders ? 1 : startX;
    const actualEndX = skipBorders ? GRID_SIZE - 1 : endX;

    for (let y = actualStartY; y < actualEndY; y++) {
      for (let x = actualStartX; x < actualEndX; x++) {
        const tile = grid[y]?.[x];
        callback(tile, x, y, grid);
      }
    }
  }

  /**
   * Find all tiles matching a predicate
   * @param grid - The 2D grid to search
   * @param predicate - Function(tile, x, y) => boolean
   * @param options - Iteration options (same as forEach)
   * @returns Array of matching tiles with coordinates
   */
  static findTiles<T = any>(
    grid: Grid<T>,
    predicate: TilePredicate<T>,
    options: IterationOptions = {}
  ): TileWithCoordinates<T>[] {
    const results: TileWithCoordinates<T>[] = [];

    this.forEach(grid, (tile, x, y) => {
      if (predicate(tile, x, y)) {
        results.push({ tile, x, y });
      }
    }, options);

    return results;
  }

  /**
   * Find the first tile matching a predicate
   * @param grid - The 2D grid to search
   * @param predicate - Function(tile, x, y) => boolean
   * @param options - Iteration options (same as forEach)
   * @returns First matching tile or null
   */
  static findFirst<T = any>(
    grid: Grid<T>,
    predicate: TilePredicate<T>,
    options: IterationOptions = {}
  ): TileWithCoordinates<T> | null {
    const {
      startY = 0,
      endY = GRID_SIZE,
      startX = 0,
      endX = GRID_SIZE,
      skipBorders = false
    } = options;

    const actualStartY = skipBorders ? 1 : startY;
    const actualEndY = skipBorders ? GRID_SIZE - 1 : endY;
    const actualStartX = skipBorders ? 1 : startX;
    const actualEndX = skipBorders ? GRID_SIZE - 1 : endX;

    for (let y = actualStartY; y < actualEndY; y++) {
      for (let x = actualStartX; x < actualEndX; x++) {
        const tile = grid[y]?.[x];
        if (predicate(tile, x, y)) {
          return { tile, x, y };
        }
      }
    }

    return null;
  }

  /**
   * Count tiles matching a predicate
   * @param grid - The 2D grid to search
   * @param predicate - Function(tile, x, y) => boolean
   * @param options - Iteration options (same as forEach)
   * @returns Count of matching tiles
   */
  static count<T = any>(
    grid: Grid<T>,
    predicate: TilePredicate<T>,
    options: IterationOptions = {}
  ): number {
    let count = 0;

    this.forEach(grid, (tile, x, y) => {
      if (predicate(tile, x, y)) {
        count++;
      }
    }, options);

    return count;
  }

  /**
   * Check if any tile matches a predicate
   * @param grid - The 2D grid to search
   * @param predicate - Function(tile, x, y) => boolean
   * @param options - Iteration options (same as forEach)
   * @returns True if any tile matches
   */
  static some<T = any>(
    grid: Grid<T>,
    predicate: TilePredicate<T>,
    options: IterationOptions = {}
  ): boolean {
    return this.findFirst(grid, predicate, options) !== null;
  }

  /**
   * Check if all tiles match a predicate
   * @param grid - The 2D grid to search
   * @param predicate - Function(tile, x, y) => boolean
   * @param options - Iteration options (same as forEach)
   * @returns True if all tiles match
   */
  static every<T = any>(
    grid: Grid<T>,
    predicate: TilePredicate<T>,
    options: IterationOptions = {}
  ): boolean {
    const {
      startY = 0,
      endY = GRID_SIZE,
      startX = 0,
      endX = GRID_SIZE,
      skipBorders = false
    } = options;

    const actualStartY = skipBorders ? 1 : startY;
    const actualEndY = skipBorders ? GRID_SIZE - 1 : endY;
    const actualStartX = skipBorders ? 1 : startX;
    const actualEndX = skipBorders ? GRID_SIZE - 1 : endX;

    for (let y = actualStartY; y < actualEndY; y++) {
      for (let x = actualStartX; x < actualEndX; x++) {
        const tile = grid[y]?.[x];
        if (!predicate(tile, x, y)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Map over all tiles and return a new grid
   * @param grid - The 2D grid to map
   * @param mapper - Function(tile, x, y) => newTile
   * @param options - Iteration options (same as forEach)
   * @returns New grid with mapped values
   */
  static map<T = any, R = any>(
    grid: Grid<T>,
    mapper: TileMapper<T, R>,
    options: IterationOptions = {}
  ): Grid<R> {
    const newGrid: Grid<R> = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

    this.forEach(grid, (tile, x, y) => {
      if (newGrid[y]) {
        newGrid[y][x] = mapper(tile, x, y);
      }
    }, options);

    return newGrid;
  }

  /**
   * Reduce tiles to a single value
   * @param grid - The 2D grid to reduce
   * @param reducer - Function(accumulator, tile, x, y) => newAccumulator
   * @param initialValue - Initial accumulator value
   * @param options - Iteration options (same as forEach)
   * @returns Reduced value
   */
  static reduce<T = any, R = any>(
    grid: Grid<T>,
    reducer: TileReducer<T, R>,
    initialValue: R,
    options: IterationOptions = {}
  ): R {
    let accumulator = initialValue;

    this.forEach(grid, (tile, x, y) => {
      accumulator = reducer(accumulator, tile, x, y);
    }, options);

    return accumulator;
  }

  /**
   * Iterate over a rectangular sub-region of the grid
   * @param grid - The 2D grid
   * @param centerX - Center X coordinate
   * @param centerY - Center Y coordinate
   * @param width - Width of region
   * @param height - Height of region
   * @param callback - Function(tile, x, y) => void
   * @returns True if all tiles in region were within bounds
   */
  static forEachInRegion<T = any>(
    grid: Grid<T>,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    callback: TileCallback<T>
  ): boolean {
    const startX = Math.max(0, centerX - Math.floor(width / 2));
    const startY = Math.max(0, centerY - Math.floor(height / 2));
    const endX = Math.min(GRID_SIZE, startX + width);
    const endY = Math.min(GRID_SIZE, startY + height);

    const allInBounds = (endX - startX === width) && (endY - startY === height);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        callback(grid[y]?.[x], x, y, grid);
      }
    }

    return allInBounds;
  }

  /**
   * Check if a rectangular region can be placed at coordinates
   * @param grid - The 2D grid
   * @param x - Top-left X coordinate
   * @param y - Top-left Y coordinate
   * @param width - Width of region
   * @param height - Height of region
   * @param predicate - Function(tile, x, y) => boolean - Must return true for all tiles
   * @returns True if region fits and all tiles match predicate
   */
  static canPlaceRegion<T = any>(
    grid: Grid<T>,
    x: number,
    y: number,
    width: number,
    height: number,
    predicate: TilePredicate<T>
  ): boolean {
    // Check bounds
    if (x < 0 || y < 0 || x + width > GRID_SIZE || y + height > GRID_SIZE) {
      return false;
    }

    // Check all tiles in region
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const tile = grid[y + dy]?.[x + dx];
        if (!predicate(tile, x + dx, y + dy)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Fill a rectangular region with a value or callback result
   * @param grid - The 2D grid to modify
   * @param x - Top-left X coordinate
   * @param y - Top-left Y coordinate
   * @param width - Width of region
   * @param height - Height of region
   * @param value - Value or Function(x, y) => value
   */
  static fillRegion<T = any>(
    grid: Grid<T>,
    x: number,
    y: number,
    width: number,
    height: number,
    value: ValueOrGenerator<T>
  ): void {
    const isFn = typeof value === 'function';

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const tileX = x + dx;
        const tileY = y + dy;
        if (tileX >= 0 && tileX < GRID_SIZE && tileY >= 0 && tileY < GRID_SIZE && grid[tileY]) {
          grid[tileY][tileX] = isFn ? (value as Function)(tileX, tileY) : value as T;
        }
      }
    }
  }

  /**
   * Get all tiles in grid as a flat array
   * @param grid - The 2D grid
   * @param options - Iteration options (same as forEach)
   * @returns Flat array of all tiles with coordinates
   */
  static toArray<T = any>(
    grid: Grid<T>,
    options: IterationOptions = {}
  ): TileWithCoordinates<T>[] {
    return this.findTiles(grid, () => true, options);
  }

  /**
   * Initialize a new grid with a value or generator function
   * @param value - Initial value or Function(x, y) => value
   * @returns New grid
   */
  static initialize<T = any>(value: ValueOrGenerator<T>): Grid<T> {
    const grid: Grid<T> = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const isFn = typeof value === 'function';

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y]) {
          grid[y][x] = isFn ? (value as Function)(x, y) : value as T;
        }
      }
    }

    return grid;
  }
}

export default GridIterator;
