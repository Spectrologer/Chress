/**
 * Core type definitions for fixing TypeScript compatibility issues
 */

// Import necessary types
import { Position } from '../core/Position';
import type { GameContext } from '../core/GameContext';

// Fix for IGame interface - make it compatible with GameContext
export interface IGameCompat extends GameContext {
    // Add any missing properties that are expected
    justEnteredZone?: boolean;
    isInPitfallZone?: boolean;
    pitfallTurnsSurvived?: number;
    displayingMessageForSign?: any;
}

// Position compatibility shim
export function toPosition(coords: { x: number; y: number } | Position): Position {
    if (coords instanceof Position) {
        return coords;
    }
    return new Position(coords.x, coords.y);
}

// Item type with index signature for compatibility
export interface ItemWithIndex {
    type: string;
    name?: string;
    uses?: number;
    foodType?: string;
    [key: string]: any;
}

// Tile type that's compatible across the codebase
export type TileCompat = number | object | any;

// Grid type
export type GridCompat = any[][];

// Enemy type shim for compatibility
export interface EnemyCompat {
    id?: string;
    health?: number;
    attack?: number;
    enemyType?: string;
    position?: { x: number; y: number };
    serialize?: () => any;
    takeDamage?: (amount: number) => boolean | void;
    planMoveTowards?: (...args: any[]) => any;
    [key: string]: any;
}

// Type guards
export function isPosition(obj: any): obj is Position {
    return obj && typeof obj.x === 'number' && typeof obj.y === 'number';
}

export function isEnemy(obj: any): obj is EnemyCompat {
    return obj && (typeof obj.health === 'number' || typeof obj.id === 'string');
}