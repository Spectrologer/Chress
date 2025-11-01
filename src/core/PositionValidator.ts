/**
 * PositionValidator.ts
 *
 * Handles all validation and bounds checking for positions including:
 * - Grid bounds validation
 * - Inner bounds checking (non-edge positions)
 * - Position clamping to valid ranges
 * - Tile validation with custom predicates
 *
 * This is a utility class extracted from Position.js to separate concerns.
 * All methods are static and work with position-like objects {x, y}.
 */

import { GRID_SIZE } from './constants/index.ts';

export interface Coordinates {
  x: number;
  y: number;
}

export type Grid<T = any> = T[][];
export type TileValidator<T = any> = (tile: T) => boolean;
export type PositionPredicate = (pos: Coordinates) => boolean;

export class PositionValidator {
  // ==========================================
  // Basic Bounds Checking
  // ==========================================

  /**
   * Checks if a position is within the grid bounds
   * @param pos - Position to check
   * @param gridSize - Grid size to check against
   * @returns True if position is in bounds
   */
  static isInBounds(pos: Coordinates, gridSize: number = GRID_SIZE): boolean {
    return pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize;
  }

  /**
   * Checks if a position is within the inner bounds (not on the edge)
   * Useful for placement validation where edges are walls
   * @param pos - Position to check
   * @param gridSize - Grid size to check against
   * @returns True if position is in inner bounds
   */
  static isInInnerBounds(pos: Coordinates, gridSize: number = GRID_SIZE): boolean {
    return pos.x >= 1 && pos.x < gridSize - 1 && pos.y >= 1 && pos.y < gridSize - 1;
  }

  /**
   * Checks if a position is at the origin (0, 0)
   * @param pos - Position to check
   * @returns True if position is (0, 0)
   */
  static isZero(pos: Coordinates): boolean {
    return pos.x === 0 && pos.y === 0;
  }

  // ==========================================
  // Position Equality
  // ==========================================

  /**
   * Checks if two positions are equal
   * @param pos1 - First position
   * @param pos2 - Second position
   * @returns True if positions are equal
   */
  static equals(pos1: Coordinates, pos2: Coordinates): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }

  // ==========================================
  // Clamping and Constraints
  // ==========================================

  /**
   * Clamps a position to be within grid bounds
   * @param pos - Position to clamp
   * @param gridSize - Grid size to clamp to
   * @returns New position clamped to bounds
   */
  static clampToBounds(pos: Coordinates, gridSize: number = GRID_SIZE): Coordinates {
    return {
      x: Math.max(0, Math.min(gridSize - 1, pos.x)),
      y: Math.max(0, Math.min(gridSize - 1, pos.y))
    };
  }

  // ==========================================
  // Tile Validation
  // ==========================================

  /**
   * Gets the tile at a position from a grid
   * Note: Grid access is always grid[y][x] (row-major order)
   * @param pos - Position to get tile from
   * @param grid - 2D grid array
   * @returns The tile at this position, or undefined if out of bounds
   */
  static getTile<T = any>(pos: Coordinates, grid: Grid<T>): T | undefined {
    return grid[pos.y]?.[pos.x];
  }

  /**
   * Checks if a position is a valid tile type in the grid
   * @param pos - Position to check
   * @param grid - 2D grid array
   * @param validator - Function that takes (tile) and returns boolean
   * @returns True if tile is valid
   */
  static isValidTile<T = any>(pos: Coordinates, grid: Grid<T>, validator: TileValidator<T>): boolean {
    const tile = this.getTile(pos, grid);
    return tile !== undefined && validator(tile);
  }

  /**
   * Filters an array of positions to only valid ones
   * @param positions - Array of positions to filter
   * @param validator - Function that takes (pos) and returns boolean
   * @returns Array of valid positions
   */
  static filterValid(positions: Coordinates[], validator: PositionPredicate): Coordinates[] {
    return positions.filter(validator);
  }

  /**
   * Filters positions to only those within bounds
   * @param positions - Array of positions to filter
   * @param gridSize - Grid size to check against
   * @returns Array of in-bounds positions
   */
  static filterInBounds(positions: Coordinates[], gridSize: number = GRID_SIZE): Coordinates[] {
    return positions.filter(pos => this.isInBounds(pos, gridSize));
  }

  /**
   * Filters positions to only those within inner bounds
   * @param positions - Array of positions to filter
   * @param gridSize - Grid size to check against
   * @returns Array of in-inner-bounds positions
   */
  static filterInInnerBounds(positions: Coordinates[], gridSize: number = GRID_SIZE): Coordinates[] {
    return positions.filter(pos => this.isInInnerBounds(pos, gridSize));
  }
}
