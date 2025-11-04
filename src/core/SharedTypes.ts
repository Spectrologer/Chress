/**
 * SharedTypes - Common type definitions used across the codebase
 * This file provides centralized type definitions to avoid circular dependencies
 * and ensure type consistency across the application.
 */

import type { Enemy, EnemyData } from '@entities/Enemy';
import type { InventoryItem } from '@managers/inventory/ItemMetadata';

// Re-export commonly used types for convenience
export type { Enemy, EnemyData, InventoryItem };

/**
 * Tile type definitions
 */
export type TileValue = number;
export type TileObject = {
    type: number;
    [key: string]: any;
};
export type Tile = TileValue | TileObject | null | undefined;
export type Grid = Tile[][];

/**
 * Save game data structure
 */
export interface SavedPlayerData {
    x: number;
    y: number;
    currentZone: { x: number; y: number; dimension: number };
    thirst: number;
    hunger: number;
    inventory: InventoryItem[];
    abilities: string[];
    health: number;
    dead: boolean;
    sprite: any;
    points: number;
    visitedZones: string[];
    spentDiscoveries: number;
}

export interface SavedPlayerStats {
    musicEnabled: boolean;
    sfxEnabled: boolean;
}

export interface SavedEnemyData {
    x: number;
    y: number;
    enemyType: string;
    health: number;
    id: string;
}

export interface SaveGameData {
    player: SavedPlayerData;
    playerStats: SavedPlayerStats;
    zones: Array<[string, any]>;
    grid: Grid;
    enemies: SavedEnemyData[];
    defeatedEnemies: string[];
    specialZones: Array<[string, any]>;
    messageLog: string[];
    currentRegion: string;
    zoneGeneration?: any; // Zone generation state for session tracking
}

/**
 * Animation data types
 */
export interface HorseChargeAnimationData {
    startPos: { x: number; y: number };
    midPos: { x: number; y: number };
    endPos: { x: number; y: number };
}

export interface ArrowAnimationData {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface PointAnimationData {
    points: number;
    color?: string;
}

export interface MultiplierAnimationData {
    multiplier: number;
}

export interface BumpAnimationData {
    dx: number;
    dy: number;
    playerX: number;
    playerY: number;
}

export type AnimationData =
    | HorseChargeAnimationData
    | ArrowAnimationData
    | PointAnimationData
    | MultiplierAnimationData
    | BumpAnimationData
    | { x?: number; y?: number }  // Generic animation data
    | null;

/**
 * Trade data structures
 */
export interface TradeData {
    cost: number;
    reward: InventoryItem | number;
    description?: string;
}

/**
 * Statistics data
 */
export interface GameStatistics {
    enemiesDefeated: number;
    damageDealt: number;
    damageTaken: number;
    zonesExplored: number;
    itemsCollected: number;
    timePlayed: number;
}

/**
 * Charge state data
 */
export interface ChargeStateData {
    targetPosition: { x: number; y: number };
    damage: number;
    source: string;
}