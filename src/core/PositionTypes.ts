/**
 * PositionTypes.ts
 *
 * Shared type definitions for position-related operations.
 * These types are used across Position, PositionCalculator, and PositionValidator classes.
 *
 * IMPORTANT: Use these types instead of inline { x: number; y: number } definitions
 * to maintain consistency across the codebase.
 */

/**
 * Basic coordinate interface used throughout the position system
 */
export interface Coordinates {
  x: number;
  y: number;
}

/**
 * Alias for Coordinates - use for semantic clarity when referring to a point in space
 */
export type Point = Coordinates;

/**
 * Alias for Coordinates - use for semantic clarity when referring to a tile location
 */
export type TilePosition = Coordinates;

/**
 * Zone coordinates with dimension information
 */
export interface ZoneCoordinates extends Coordinates {
  dimension: number;
}

/**
 * Full zone reference with coordinates
 */
export type ZoneReference = ZoneCoordinates;

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
 * Direction vector for movement
 */
export type DirectionVector = Coordinates;

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

/**
 * Interface for objects that have a position
 */
export interface Positionable {
  x: number;
  y: number;
}

/**
 * Interface for objects that can return their position
 */
export interface HasPosition {
  getPosition(): Coordinates;
}

/**
 * Type guard to check if an object has x and y coordinates
 */
export function isCoordinates(obj: any): obj is Coordinates {
  return obj && typeof obj.x === 'number' && typeof obj.y === 'number';
}

/**
 * Type guard to check if an object has zone coordinates
 */
export function isZoneCoordinates(obj: any): obj is ZoneCoordinates {
  return isCoordinates(obj) && typeof (obj as any).dimension === 'number';
}