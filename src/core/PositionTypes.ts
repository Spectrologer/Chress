/**
 * PositionTypes.ts
 *
 * Shared type definitions for position-related operations.
 * These types are used across Position, PositionCalculator, and PositionValidator classes.
 */

/**
 * Basic coordinate interface used throughout the position system
 */
export interface Coordinates {
  x: number;
  y: number;
}

/**
 * Represents a change in position
 */
export interface Delta {
  dx: number;
  dy: number;
}

/**
 * Offset for position movements (similar to Coordinates but semantically different)
 */
export interface Offset {
  x: number;
  y: number;
}

/**
 * Predicate function for filtering positions
 */
export type PositionPredicate = (pos: Coordinates) => boolean;

/**
 * Generic grid type for 2D arrays
 */
export type Grid<T = any> = T[][];

/**
 * Validator function for tile types
 */
export type TileValidator<T = any> = (tile: T) => boolean;

/**
 * Interface for objects that manage grids
 */
export interface GridManager {
  getTile(x: number, y: number): any;
  setTile(x: number, y: number, value: any): void;
}