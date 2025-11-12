/**
 * Position.ts
 *
 * A robust position abstraction that handles all position-related operations
 * in the Chesse codebase. Provides a consistent API while maintaining backward
 * compatibility with existing {x, y} object patterns.
 *
 * Key Features:
 * - Direct .x and .y property access for backward compatibility
 * - Distance calculations (Chebyshev, Manhattan, Euclidean)
 * - Direction and adjacency utilities
 * - Immutable operations (returns new Position instances)
 * - Grid coordinate validation
 * - Serialization support for events and storage
 *
 * This class now delegates to PositionCalculator and PositionValidator
 * for mathematical operations and validation logic.
 */

import { getOffset, getDeltaToDirection } from './utils/DirectionUtils';
import type { ArrowDirection } from './utils/DirectionUtils';
import { GRID_SIZE } from './constants/index';
import { PositionCalculator } from './PositionCalculator';
import { PositionValidator } from './PositionValidator';
import type {
  Coordinates,
  Delta,
  Offset,
  Grid,
  GridManager
} from './PositionTypes';

// Re-export the utility classes for convenience
export { PositionCalculator, PositionValidator };

// Re-export types from PositionTypes for backward compatibility
export type {
  Coordinates,
  Delta,
  Offset,
  Grid,
  GridManager
} from './PositionTypes';

export type PositionPredicate = (pos: Position) => boolean;

export class Position {
  x: number;
  y: number;

  /**
   * Creates a new Position instance.
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // ==========================================
  // Static Factory Methods
  // ==========================================

  /**
   * Creates a Position from an object with x and y properties
   * @param obj - Object with x and y properties
   * @returns Position instance
   */
  static from(obj: Coordinates | Position): Position {
    if (obj instanceof Position) return obj;
    return new Position(obj.x, obj.y);
  }

  /**
   * Creates a Position from separate x, y parameters or an object
   * @param xOrObj - X coordinate or object
   * @param y - Y coordinate (if first param is number)
   * @returns Position instance
   */
  static of(xOrObj: number | Coordinates, y?: number): Position {
    if (typeof xOrObj === 'object') {
      return Position.from(xOrObj);
    }
    return new Position(xOrObj, y as number);
  }

  /**
   * Creates a Position at the grid center
   * @param gridSize - Grid size to use
   * @returns Position at center
   */
  static center(gridSize: number = GRID_SIZE): Position {
    const center = Math.floor(gridSize / 2);
    return new Position(center, center);
  }

  /**
   * Creates a Position at the origin (0, 0)
   * @returns Position at origin
   */
  static zero(): Position {
    return new Position(0, 0);
  }

  /**
   * Creates a Position at (1, 1) - common starting position
   * @returns Position at (1, 1)
   */
  static one(): Position {
    return new Position(1, 1);
  }

  // ==========================================
  // Equality and Comparison
  // ==========================================

  /**
   * Checks if this position equals another position
   * @param xOrPos - Position, object, or x coordinate
   * @param y - Y coordinate (if first param is number)
   * @returns True if positions are equal
   */
  equals(xOrPos: Position | Coordinates | number, y?: number): boolean {
    if (typeof xOrPos === 'number') {
      return PositionValidator.equals(this, { x: xOrPos, y: y as number });
    }
    return PositionValidator.equals(this, xOrPos);
  }

  /**
   * Checks if this position is at the origin
   * @returns True if position is (0, 0)
   */
  isZero(): boolean {
    return PositionValidator.isZero(this);
  }

  // ==========================================
  // Distance Calculations
  // ==========================================

  /**
   * Calculates Chebyshev distance (8-way grid distance) to another position
   * This is the standard movement distance in the game.
   * @param other - Target position
   * @returns Chebyshev distance
   */
  chebyshevDistance(other: Position | Coordinates): number {
    return PositionCalculator.chebyshevDistance(this, other);
  }

  /**
   * Calculates Manhattan distance (4-way grid distance) to another position
   * @param other - Target position
   * @returns Manhattan distance
   */
  manhattanDistance(other: Position | Coordinates): number {
    return PositionCalculator.manhattanDistance(this, other);
  }

  /**
   * Calculates Euclidean distance (straight-line distance) to another position
   * @param other - Target position
   * @returns Euclidean distance
   */
  euclideanDistance(other: Position | Coordinates): number {
    return PositionCalculator.euclideanDistance(this, other);
  }

  /**
   * Alias for chebyshevDistance - the default movement distance in the game
   * @param other - Target position
   * @returns Distance
   */
  distanceTo(other: Position | Coordinates): number {
    return this.chebyshevDistance(other);
  }

  // ==========================================
  // Direction and Delta
  // ==========================================

  /**
   * Gets the delta (difference) between this position and another
   * @param other - Target position
   * @returns Delta object with dx and dy
   */
  delta(other: Position | Coordinates): Delta {
    return PositionCalculator.delta(this, other);
  }

  /**
   * Gets the absolute delta between this position and another
   * @param other - Target position
   * @returns Delta object with absolute dx and dy
   */
  absDelta(other: Position | Coordinates): Delta {
    return PositionCalculator.absDelta(this, other);
  }

  /**
   * Gets the direction string from this position to another
   * @param other - Target position
   * @returns Direction string (e.g., 'arrowright') or null if same position
   */
  directionTo(other: Position | Coordinates): ArrowDirection | null {
    const { dx, dy } = this.delta(other);
    return getDeltaToDirection(dx, dy);
  }

  /**
   * Creates a new position by moving in a direction
   * @param direction - Direction string (e.g., 'arrowright', 'w', 'north')
   * @param distance - How far to move
   * @returns New position after moving
   */
  move(direction: string, distance = 1): Position {
    const offset = getOffset(direction);
    return new Position(
      this.x + offset.x * distance,
      this.y + offset.y * distance
    );
  }

  /**
   * Creates a new position by adding an offset
   * @param dxOrOffset - Delta x or offset object
   * @param dy - Delta y (if first param is number)
   * @returns New position
   */
  add(dxOrOffset: number | Offset, dy?: number): Position {
    if (typeof dxOrOffset === 'object') {
      return new Position(this.x + dxOrOffset.x, this.y + dxOrOffset.y);
    }
    return new Position(this.x + dxOrOffset, this.y + (dy as number));
  }

  /**
   * Creates a new position by subtracting an offset
   * @param dxOrOffset - Delta x or offset object
   * @param dy - Delta y (if first param is number)
   * @returns New position
   */
  subtract(dxOrOffset: number | Offset, dy?: number): Position {
    if (typeof dxOrOffset === 'object') {
      return new Position(this.x - dxOrOffset.x, this.y - dxOrOffset.y);
    }
    return new Position(this.x - dxOrOffset, this.y - (dy as number));
  }

  // ==========================================
  // Adjacency and Neighbors
  // ==========================================

  /**
   * Checks if another position is adjacent to this one (including diagonals)
   * @param other - Position to check
   * @param allowDiagonal - Whether to consider diagonal adjacency
   * @returns True if adjacent
   */
  isAdjacentTo(other: Position | Coordinates, allowDiagonal = true): boolean {
    return PositionCalculator.isAdjacent(this, other, allowDiagonal);
  }

  /**
   * Gets all adjacent positions (8-way or 4-way)
   * @param allowDiagonal - Whether to include diagonal neighbors
   * @returns Array of adjacent positions
   */
  getNeighbors(allowDiagonal = true): Position[] {
    const neighbors = PositionCalculator.getNeighbors(this, allowDiagonal);
    return neighbors.map(pos => new Position(pos.x, pos.y));
  }

  /**
   * Gets neighbors filtered by a validation function
   * @param validator - Function that takes (pos) and returns boolean
   * @param allowDiagonal - Whether to include diagonal neighbors
   * @returns Array of valid adjacent positions
   */
  getValidNeighbors(validator: PositionPredicate, allowDiagonal = true): Position[] {
    return this.getNeighbors(allowDiagonal).filter(pos => validator(pos));
  }

  // ==========================================
  // Grid Bounds Validation
  // ==========================================

  /**
   * Checks if this position is within the grid bounds
   * @param gridSize - Grid size to check against
   * @returns True if in bounds
   */
  isInBounds(gridSize: number = GRID_SIZE): boolean {
    return PositionValidator.isInBounds(this, gridSize);
  }

  /**
   * Checks if this position is within the inner bounds (not on the edge)
   * Useful for placement validation where edges are walls
   * @param gridSize - Grid size to check against
   * @returns True if in inner bounds
   */
  isInInnerBounds(gridSize: number = GRID_SIZE): boolean {
    return PositionValidator.isInInnerBounds(this, gridSize);
  }

  /**
   * Clamps this position to be within grid bounds
   * @param gridSize - Grid size to clamp to
   * @returns New position clamped to bounds
   */
  clampToBounds(gridSize: number = GRID_SIZE): Position {
    const clamped = PositionValidator.clampToBounds(this, gridSize);
    return new Position(clamped.x, clamped.y);
  }

  // ==========================================
  // Grid Access Helpers
  // ==========================================

  /**
   * Gets the tile at this position from a grid or gridManager
   * Note: Grid access is always grid[y][x] (row-major order)
   * @param gridOrManager - 2D grid array or GridManager instance
   * @returns The tile at this position, or undefined if out of bounds
   */
  getTile<T = any>(gridOrManager: Grid<T> | GridManager): T | undefined {
    // Support both GridManager and raw grid arrays
    if (gridOrManager && typeof (gridOrManager as any).getTile === 'function') {
      return (gridOrManager as GridManager).getTile(this.x, this.y);
    }
    return PositionValidator.getTile(this, gridOrManager as Grid<T>);
  }

  /**
   * Sets the tile at this position in a grid or gridManager
   * @param gridOrManager - 2D grid array or GridManager instance
   * @param value - Value to set
   */
  setTile<T = any>(gridOrManager: Grid<T> | GridManager, value: T): void {
    // Support both GridManager and raw grid arrays
    const anyGrid = gridOrManager as any;
    if (gridOrManager && typeof anyGrid.setTile === 'function') {
      anyGrid.setTile(this.x, this.y, value);
      return;
    }
    const grid = gridOrManager as Grid<T>;
    if (!grid[this.y]) {
      grid[this.y] = [];
    }
    grid[this.y][this.x] = value;
  }

  /**
   * Checks if this position is a valid tile type in the grid
   * @param grid - 2D grid array
   * @param validator - Function that takes (tile) and returns boolean
   * @returns True if valid
   */
  isValidTile<T = any>(grid: Grid<T>, validator: (tile: T) => boolean): boolean {
    return PositionValidator.isValidTile(this, grid, validator);
  }

  // ==========================================
  // Serialization
  // ==========================================

  /**
   * Converts this position to a plain object
   * Useful for events, serialization, and compatibility with existing code
   * @returns Coordinates object
   */
  toObject(): Coordinates {
    return { x: this.x, y: this.y };
  }

  /**
   * Converts this position to a coordinate key for hashing
   * Format: "x,y"
   * @returns Coordinate key
   */
  toKey(): string {
    return `${this.x},${this.y}`;
  }

  /**
   * Creates a Position from a coordinate key
   * @param key - Key in format "x,y"
   * @returns Position instance
   */
  static fromKey(key: string): Position {
    const [x, y] = key.split(',').map(Number);
    return new Position(x, y);
  }

  /**
   * String representation (same as toKey for convenient interpolation)
   * @returns String representation
   */
  toString(): string {
    return this.toKey();
  }

  /**
   * JSON serialization
   * @returns Coordinates object
   */
  toJSON(): Coordinates {
    return this.toObject();
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  /**
   * Creates a copy of this position
   * @returns New position with same coordinates
   */
  clone(): Position {
    return new Position(this.x, this.y);
  }

  /**
   * Checks if this position is on the same row as another
   * @param other - Position to compare
   * @returns True if same row
   */
  isSameRow(other: Position | Coordinates): boolean {
    return PositionCalculator.isSameRow(this, other);
  }

  /**
   * Checks if this position is on the same column as another
   * @param other - Position to compare
   * @returns True if same column
   */
  isSameColumn(other: Position | Coordinates): boolean {
    return PositionCalculator.isSameColumn(this, other);
  }

  /**
   * Checks if this position is orthogonally aligned with another
   * (same row or same column)
   * @param other - Position to compare
   * @returns True if orthogonal
   */
  isOrthogonalTo(other: Position | Coordinates): boolean {
    return PositionCalculator.isOrthogonal(this, other);
  }

  /**
   * Checks if this position is diagonally aligned with another
   * @param other - Position to compare
   * @returns True if diagonal
   */
  isDiagonalTo(other: Position | Coordinates): boolean {
    return PositionCalculator.isDiagonal(this, other);
  }

  /**
   * Gets all positions in a line from this position to another
   * Uses Bresenham's line algorithm
   * @param target - Target position
   * @param includeStart - Whether to include starting position
   * @param includeEnd - Whether to include ending position
   * @returns Array of positions along the line
   */
  lineTo(target: Position | Coordinates, includeStart = false, includeEnd = true): Position[] {
    const positions = PositionCalculator.lineTo(this, target, includeStart, includeEnd);
    return positions.map(pos => new Position(pos.x, pos.y));
  }

  /**
   * Gets all positions in a rectangular area
   * @param corner - Opposite corner of rectangle
   * @param includeEdges - Whether to include edge positions
   * @returns Array of positions in the rectangle
   */
  rectangleTo(corner: Position | Coordinates, includeEdges = true): Position[] {
    const positions = PositionCalculator.rectangleBetween(this, corner, includeEdges);
    return positions.map(pos => new Position(pos.x, pos.y));
  }

  /**
   * Gets all positions within a radius (Chebyshev distance)
   * @param radius - Radius to search within
   * @param includeCenter - Whether to include this position
   * @returns Array of positions within radius
   */
  positionsWithinRadius(radius: number, includeCenter = false): Position[] {
    const positions = PositionCalculator.positionsWithinRadius(this, radius, includeCenter);
    return positions.map(pos => new Position(pos.x, pos.y));
  }
}
