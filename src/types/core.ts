/**
 * Core type definitions for fixing TypeScript compatibility issues
 */

// Import necessary types
import { Position } from '@core/Position';
import type { GameContext } from '@core/context';

export interface SignData {
    message?: string;
    x?: number;
    y?: number;
}

// Fix for IGame interface - make it compatible with GameContext
export interface IGameCompat extends GameContext {
    // Add any missing properties that are expected
    justEnteredZone?: boolean;
    isInPitfallZone?: boolean;
    pitfallTurnsSurvived?: number;
    displayingMessageForSign?: SignData;
}

// Position compatibility shim
export function toPosition(coords: { x: number; y: number } | Position): Position {
    if (coords instanceof Position) {
        return coords;
    }
    return new Position(coords.x, coords.y);
}

// Item type for compatibility
export interface ItemWithIndex {
    type: string;
    name?: string;
    uses?: number;
    foodType?: string;
    icon?: string;
}

// Tile type that's compatible across the codebase
export type TileCompat = number | {
    type: number;
    uses?: number;
    message?: string;
    foodType?: string;
    name?: string;
    icon?: string;
    actionsSincePlaced?: number;
    justPlaced?: boolean;
};

// Grid type - using unknown instead of any for better type safety
export type GridCompat = TileCompat[][];

// Enemy type shim for compatibility
export interface EnemyCompat {
    id?: string;
    x?: number;
    y?: number;
    health?: number;
    attack?: number;
    enemyType?: string;
    position?: { x: number; y: number };
    lastX?: number;
    lastY?: number;
    justAttacked?: boolean;
    attackAnimation?: number;
    deathAnimation?: number;
    isFrozen?: boolean;
    showFrozenVisual?: boolean;
    serialize?: () => Record<string, unknown>;
    takeDamage?: (amount: number) => boolean | void;
    planMoveTowards?: (...args: unknown[]) => unknown;
}

// Type guards
export function isPosition(obj: unknown): obj is Position {
    return obj !== null && obj !== undefined && typeof obj === 'object' && 'x' in obj && 'y' in obj && typeof (obj as { x: unknown }).x === 'number' && typeof (obj as { y: unknown }).y === 'number';
}

export function isEnemy(obj: unknown): obj is EnemyCompat {
    return obj !== null && obj !== undefined && typeof obj === 'object' && ('health' in obj || 'id' in obj) && (typeof (obj as Record<string, unknown>).health === 'number' || typeof (obj as Record<string, unknown>).id === 'string');
}