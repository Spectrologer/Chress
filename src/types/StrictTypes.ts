/**
 * StrictTypes - Proper discriminated unions and strict type definitions
 * This file eliminates [key: string]: unknown and provides type safety
 */

import { Position } from '@core/Position';
import type { Coordinates, ZoneCoordinates } from '@core/PositionTypes';

// ============================================================================
// ENEMY TYPES - Discriminated Unions
// ============================================================================

/**
 * Base enemy properties shared by all enemy types
 */
interface BaseEnemyData {
    id: string;
    x: number;
    y: number;
    health: number;
    attack: number;
    justAttacked?: boolean;
    attackAnimation?: number;
    deathAnimation?: number;
    isFrozen?: boolean;
    showFrozenVisual?: boolean;
}

/**
 * Lizardy - Basic enemy with charge attack capability
 */
export interface LizardyEnemy extends BaseEnemyData {
    enemyType: 'lizardy';
    scale?: number; // Lizardy has special scale
}

/**
 * Lizardo - Intermediate enemy
 */
export interface LizardoEnemy extends BaseEnemyData {
    enemyType: 'lizardo';
}

/**
 * Lizardeaux - Advanced enemy with heal ability
 */
export interface LizardeauxEnemy extends BaseEnemyData {
    enemyType: 'lizardeaux';
    healCooldown?: number;
}

/**
 * Lizord - Advanced enemy with teleport
 */
export interface LizordEnemy extends BaseEnemyData {
    enemyType: 'lizord';
}

/**
 * Lazerd - Elite enemy with laser attack
 */
export interface LazerdEnemy extends BaseEnemyData {
    enemyType: 'lazerd';
}

/**
 * Zard - Elite enemy
 */
export interface ZardEnemy extends BaseEnemyData {
    enemyType: 'zard';
}

/**
 * Generic/Fallback enemy type for legacy compatibility
 */
export interface GenericEnemy extends BaseEnemyData {
    enemyType: string; // For any other enemy types not explicitly defined
}

/**
 * Discriminated union of all enemy types
 * TypeScript can narrow this based on enemyType property
 */
export type StrictEnemy =
    | LizardyEnemy
    | LizardoEnemy
    | LizardeauxEnemy
    | LizordEnemy
    | LazerdEnemy
    | ZardEnemy
    | GenericEnemy;

/**
 * Type guard to check if an object is a valid enemy
 */
export function isStrictEnemy(obj: unknown): obj is StrictEnemy {
    return (
        obj !== null &&
        obj !== undefined &&
        typeof obj === 'object' &&
        'enemyType' in obj &&
        'x' in obj &&
        'y' in obj &&
        'health' in obj &&
        typeof (obj as any).enemyType === 'string' &&
        typeof (obj as any).x === 'number' &&
        typeof (obj as any).y === 'number' &&
        typeof (obj as any).health === 'number'
    );
}

// ============================================================================
// TILE TYPES - Discriminated Unions
// ============================================================================

/**
 * Base tile properties
 */
interface BaseTileObject {
    type: number;
}

/**
 * Bomb tile with placement tracking
 */
export interface BombTile extends BaseTileObject {
    type: number; // TILE_TYPES.BOMB
    actionsSincePlaced: number;
    justPlaced: boolean;
}

/**
 * Food tile with food type
 */
export interface FoodTile extends BaseTileObject {
    type: number; // TILE_TYPES.FOOD
    foodType: string;
    name?: string;
    icon?: string;
}

/**
 * Tool/Item tile with uses
 */
export interface ToolTile extends BaseTileObject {
    type: number; // TILE_TYPES for tools (BISHOP_SPEAR, HORSE_ICON, BOW, etc.)
    uses: number;
    name?: string;
    icon?: string;
}

/**
 * Sign tile with message
 */
export interface SignTile extends BaseTileObject {
    type: number; // TILE_TYPES.SIGN
    message: string;
    name?: string;
    icon?: string;
}

/**
 * Enemy tile representation
 */
export interface EnemyTile extends BaseTileObject {
    type: number; // TILE_TYPES.ENEMY
    enemyType: string;
    name?: string;
    icon?: string;
}

/**
 * NPC tile representation
 */
export interface NPCTile extends BaseTileObject {
    type: number; // TILE_TYPES.NPC
    npcType: string;
    name?: string;
    icon?: string;
}

/**
 * Exit/Portal tile
 */
export interface ExitTile extends BaseTileObject {
    type: number; // TILE_TYPES.EXIT or PORTAL
    direction?: string;
    discovered?: boolean;
}

/**
 * Generic tile object for simple tiles with no extra properties
 * This is for tiles that just need a type number and maybe basic metadata
 */
export interface GenericTileObject extends BaseTileObject {
    type: number;
    name?: string;
    icon?: string;
    discovered?: boolean;
}

/**
 * Discriminated union of all tile object types
 */
export type StrictTileObject =
    | BombTile
    | FoodTile
    | ToolTile
    | SignTile
    | EnemyTile
    | NPCTile
    | ExitTile
    | GenericTileObject;

/**
 * Complete tile type - can be a number (empty/floor), tile object, or null/undefined
 */
export type StrictTile = number | StrictTileObject | null | undefined;

/**
 * Grid type using strict tiles
 */
export type StrictGrid = StrictTile[][];

/**
 * Type guard to check if a tile is an object
 */
export function isTileObject(tile: StrictTile): tile is StrictTileObject {
    return tile !== null && tile !== undefined && typeof tile === 'object' && 'type' in tile;
}

/**
 * Type guard to check if a tile is a bomb
 */
export function isBombTile(tile: StrictTile): tile is BombTile {
    return (
        isTileObject(tile) &&
        'actionsSincePlaced' in tile &&
        'justPlaced' in tile
    );
}

/**
 * Type guard to check if a tile is a food tile
 */
export function isFoodTile(tile: StrictTile): tile is FoodTile {
    return isTileObject(tile) && 'foodType' in tile && typeof (tile as any).foodType === 'string';
}

/**
 * Type guard to check if a tile is a tool tile
 */
export function isToolTile(tile: StrictTile): tile is ToolTile {
    return isTileObject(tile) && 'uses' in tile && typeof (tile as any).uses === 'number';
}

/**
 * Type guard to check if a tile is a sign
 */
export function isSignTile(tile: StrictTile): tile is SignTile {
    return isTileObject(tile) && 'message' in tile && typeof (tile as any).message === 'string';
}

// ============================================================================
// ZONE DATA
// ============================================================================

/**
 * Saved enemy data for zone persistence
 */
export interface SavedEnemyData {
    x: number;
    y: number;
    enemyType: string;
    health: number;
    id: string;
}

/**
 * Zone data with strict types (no index signature)
 */
export interface StrictZoneData {
    grid: StrictGrid;
    enemies: SavedEnemyData[];
    discovered: boolean;
}

// ============================================================================
// NPC DATA
// ============================================================================

/**
 * NPC data with strict types (no index signature)
 */
export interface StrictNPC {
    x: number;
    y: number;
    type: string;
    name?: string;
}

// ============================================================================
// ITEM DATA
// ============================================================================

/**
 * Base item interface
 */
interface BaseItem {
    type: string;
    name?: string;
    icon?: string;
}

/**
 * Food item
 */
export interface FoodItem extends BaseItem {
    type: 'food';
    foodType: string;
}

/**
 * Tool item with uses
 */
export interface ToolItem extends BaseItem {
    type: 'tool';
    uses: number;
}

/**
 * Discriminated union of item types
 */
export type StrictInventoryItem = FoodItem | ToolItem | BaseItem;

// ============================================================================
// SIGN DATA
// ============================================================================

/**
 * Sign data with strict types
 */
export interface StrictSignData {
    message?: string;
    x?: number;
    y?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get enemy points based on type
 */
export function getEnemyPoints(enemyType: string): number {
    switch (enemyType) {
        case 'lizardy':
            return 1;
        case 'lizardo':
        case 'lizord':
        case 'zard':
            return 3;
        case 'lizardeaux':
            return 5;
        case 'lazerd':
            return 9;
        default:
            return 0;
    }
}

/**
 * Type assertion helper for migrating from legacy types
 */
export function assertStrictEnemy(enemy: any): StrictEnemy {
    if (!isStrictEnemy(enemy)) {
        throw new Error(`Invalid enemy data: ${JSON.stringify(enemy)}`);
    }
    return enemy;
}
