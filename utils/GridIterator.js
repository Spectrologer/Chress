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
export class GridIterator {
  /**
   * Iterate over all tiles in a grid and execute a callback
   * @param {Array<Array>} grid - The 2D grid to iterate
   * @param {Function} callback - Function(tile, x, y, grid) => void
   * @param {Object} options - Iteration options
   * @param {number} options.startY - Starting Y coordinate (default: 0)
   * @param {number} options.endY - Ending Y coordinate (default: GRID_SIZE)
   * @param {number} options.startX - Starting X coordinate (default: 0)
   * @param {number} options.endX - Ending X coordinate (default: GRID_SIZE)
   * @param {boolean} options.skipBorders - Skip border tiles (default: false)
   */
  static forEach(grid, callback, options = {}) {
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
        const tile = grid[y][x];
        callback(tile, x, y, grid);
      }
    }
  }

  /**
   * Find all tiles matching a predicate
   * @param {Array<Array>} grid - The 2D grid to search
   * @param {Function} predicate - Function(tile, x, y) => boolean
   * @param {Object} options - Iteration options (same as forEach)
   * @returns {Array<{tile, x, y}>} Array of matching tiles with coordinates
   */
  static findTiles(grid, predicate, options = {}) {
    const results = [];

    this.forEach(grid, (tile, x, y) => {
      if (predicate(tile, x, y)) {
        results.push({ tile, x, y });
      }
    }, options);

    return results;
  }

  /**
   * Find the first tile matching a predicate
   * @param {Array<Array>} grid - The 2D grid to search
   * @param {Function} predicate - Function(tile, x, y) => boolean
   * @param {Object} options - Iteration options (same as forEach)
   * @returns {{tile, x, y}|null} First matching tile or null
   */
  static findFirst(grid, predicate, options = {}) {
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
        const tile = grid[y][x];
        if (predicate(tile, x, y)) {
          return { tile, x, y };
        }
      }
    }

    return null;
  }

  /**
   * Count tiles matching a predicate
   * @param {Array<Array>} grid - The 2D grid to search
   * @param {Function} predicate - Function(tile, x, y) => boolean
   * @param {Object} options - Iteration options (same as forEach)
   * @returns {number} Count of matching tiles
   */
  static count(grid, predicate, options = {}) {
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
   * @param {Array<Array>} grid - The 2D grid to search
   * @param {Function} predicate - Function(tile, x, y) => boolean
   * @param {Object} options - Iteration options (same as forEach)
   * @returns {boolean} True if any tile matches
   */
  static some(grid, predicate, options = {}) {
    return this.findFirst(grid, predicate, options) !== null;
  }

  /**
   * Check if all tiles match a predicate
   * @param {Array<Array>} grid - The 2D grid to search
   * @param {Function} predicate - Function(tile, x, y) => boolean
   * @param {Object} options - Iteration options (same as forEach)
   * @returns {boolean} True if all tiles match
   */
  static every(grid, predicate, options = {}) {
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
        const tile = grid[y][x];
        if (!predicate(tile, x, y)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Map over all tiles and return a new grid
   * @param {Array<Array>} grid - The 2D grid to map
   * @param {Function} mapper - Function(tile, x, y) => newTile
   * @param {Object} options - Iteration options (same as forEach)
   * @returns {Array<Array>} New grid with mapped values
   */
  static map(grid, mapper, options = {}) {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE));

    this.forEach(grid, (tile, x, y) => {
      newGrid[y][x] = mapper(tile, x, y);
    }, options);

    return newGrid;
  }

  /**
   * Reduce tiles to a single value
   * @param {Array<Array>} grid - The 2D grid to reduce
   * @param {Function} reducer - Function(accumulator, tile, x, y) => newAccumulator
   * @param {*} initialValue - Initial accumulator value
   * @param {Object} options - Iteration options (same as forEach)
   * @returns {*} Reduced value
   */
  static reduce(grid, reducer, initialValue, options = {}) {
    let accumulator = initialValue;

    this.forEach(grid, (tile, x, y) => {
      accumulator = reducer(accumulator, tile, x, y);
    }, options);

    return accumulator;
  }

  /**
   * Iterate over a rectangular sub-region of the grid
   * @param {Array<Array>} grid - The 2D grid
   * @param {number} centerX - Center X coordinate
   * @param {number} centerY - Center Y coordinate
   * @param {number} width - Width of region
   * @param {number} height - Height of region
   * @param {Function} callback - Function(tile, x, y) => void
   * @returns {boolean} True if all tiles in region were within bounds
   */
  static forEachInRegion(grid, centerX, centerY, width, height, callback) {
    const startX = Math.max(0, centerX - Math.floor(width / 2));
    const startY = Math.max(0, centerY - Math.floor(height / 2));
    const endX = Math.min(GRID_SIZE, startX + width);
    const endY = Math.min(GRID_SIZE, startY + height);

    const allInBounds = (endX - startX === width) && (endY - startY === height);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        callback(grid[y][x], x, y);
      }
    }

    return allInBounds;
  }

  /**
   * Check if a rectangular region can be placed at coordinates
   * @param {Array<Array>} grid - The 2D grid
   * @param {number} x - Top-left X coordinate
   * @param {number} y - Top-left Y coordinate
   * @param {number} width - Width of region
   * @param {number} height - Height of region
   * @param {Function} predicate - Function(tile, x, y) => boolean - Must return true for all tiles
   * @returns {boolean} True if region fits and all tiles match predicate
   */
  static canPlaceRegion(grid, x, y, width, height, predicate) {
    // Check bounds
    if (x < 0 || y < 0 || x + width > GRID_SIZE || y + height > GRID_SIZE) {
      return false;
    }

    // Check all tiles in region
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const tile = grid[y + dy][x + dx];
        if (!predicate(tile, x + dx, y + dy)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Fill a rectangular region with a value or callback result
   * @param {Array<Array>} grid - The 2D grid to modify
   * @param {number} x - Top-left X coordinate
   * @param {number} y - Top-left Y coordinate
   * @param {number} width - Width of region
   * @param {number} height - Height of region
   * @param {*|Function} value - Value or Function(x, y) => value
   */
  static fillRegion(grid, x, y, width, height, value) {
    const isFn = typeof value === 'function';

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const tileX = x + dx;
        const tileY = y + dy;
        if (tileX >= 0 && tileX < GRID_SIZE && tileY >= 0 && tileY < GRID_SIZE) {
          grid[tileY][tileX] = isFn ? value(tileX, tileY) : value;
        }
      }
    }
  }

  /**
   * Get all tiles in grid as a flat array
   * @param {Array<Array>} grid - The 2D grid
   * @param {Object} options - Iteration options (same as forEach)
   * @returns {Array<{tile, x, y}>} Flat array of all tiles with coordinates
   */
  static toArray(grid, options = {}) {
    return this.findTiles(grid, () => true, options);
  }

  /**
   * Initialize a new grid with a value or generator function
   * @param {*|Function} value - Initial value or Function(x, y) => value
   * @returns {Array<Array>} New grid
   */
  static initialize(value) {
    const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE));
    const isFn = typeof value === 'function';

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        grid[y][x] = isFn ? value(x, y) : value;
      }
    }

    return grid;
  }
}

export default GridIterator;
