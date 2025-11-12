/**
 * SharedTypes - Common type definitions used across the codebase
 * This file provides centralized type definitions to avoid circular dependencies
 * and ensure type consistency across the application.
 */

import type { Enemy, EnemyData } from '@entities/Enemy';
import type { InventoryItem } from '@managers/inventory/ItemMetadata';
import type { Coordinates, ZoneCoordinates } from '@core/PositionTypes';

// Re-export commonly used types for convenience
export type { Enemy, EnemyData, InventoryItem, Coordinates, ZoneCoordinates };

/**
 * Tile type definitions
 */
export type TileValue = number;

/**
 * Valid portKind values for PORT tiles
 * - 'interior': Port to/from building interiors
 * - 'grate': Surface grate leading underground
 * - 'stairdown': Stairs descending (e.g., in buildings)
 * - 'stairup': Stairs ascending (e.g., from underground)
 */
export type PortKind = 'interior' | 'grate' | 'stairdown' | 'stairup';

export type TileObject = {
    type: number;
    uses?: number;
    message?: string;
    foodType?: string;
    name?: string;
    icon?: string;
    npcType?: string;
    enemyType?: string;
    direction?: string;
    discovered?: boolean;
    portKind?: PortKind;
    actionsSincePlaced?: number;
    justPlaced?: boolean;
};
export type Tile = TileValue | TileObject | null | undefined;
export type Grid = Tile[][];

/**
 * Save game data structure
 */
export interface SavedPlayerData {
    x: number;
    y: number;
    currentZone: ZoneCoordinates;
    thirst: number;
    hunger: number;
    inventory: InventoryItem[];
    abilities: string[];
    health: number;
    dead: boolean;
    sprite: string | null;
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
    zones: Array<[string, { grid: Grid; enemies: SavedEnemyData[]; discovered: boolean }]>;
    grid: Grid;
    enemies: SavedEnemyData[];
    defeatedEnemies: string[];
    specialZones: Array<[string, { grid: Grid; enemies: SavedEnemyData[]; discovered: boolean }]>;
    messageLog: string[];
    currentRegion: string;
    zoneGeneration?: {
        itemLocations?: Map<string, { x: number; y: number }>;
        visitedRegions?: Set<string>;
    };
}

/**
 * Animation data types
 */
export interface HorseChargeAnimationData {
    startPos: Coordinates;
    midPos: Coordinates;
    endPos: Coordinates;
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
    targetPosition: Coordinates;
    damage: number;
    source: string;
}