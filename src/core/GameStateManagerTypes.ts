/**
 * GameStateManagerTypes - Type definitions for GameStateManager
 * This file provides proper types to eliminate `as any` casts
 */

import type { GameContext } from './context/GameContextCore';
import type { ZoneRepository } from '@repositories/ZoneRepository';
import type { Player } from '@entities/Player';
import type { Coordinates } from './PositionTypes';
import type { Grid } from './SharedTypes';

/**
 * Extended GameContext with properties that GameStateManager needs access to
 * These are runtime properties that may not be in the core GameContext interface
 */
export interface GameContextWithExtensions extends GameContext {
    // Zone management
    zoneRepository: ZoneRepository;
    zones: Map<string, ZoneData>;

    // Message system
    messageLog: string[];

    // NPC dialogue state
    dialogueState: Map<string, DialogueData>;

    // Zone transition state
    justEnteredZone: boolean;
    lastExitSide: string | null;
    _newGameSpawnPosition: Coordinates | null;

    // Entrance animation state
    _entranceAnimationInProgress: boolean;

    // Text box state
    lastSignMessage: string | null;
    displayingMessageForSign: TextBoxDisplayData | null;
}

/**
 * Extended Player with properties that GameStateManager needs access to
 */
export interface PlayerWithExtensions extends Player {
    spentDiscoveries: number;
}

/**
 * Zone data structure with proper typing
 */
export interface ZoneData {
    grid: Grid;
    enemies: EnemyData[];
    discovered: boolean;
    terrainTextures?: Record<string, string>;
    overlayTextures?: Record<string, string>;
    rotations?: Record<string, number>;
    overlayRotations?: Record<string, number>;
    playerSpawn?: Coordinates;
}

/**
 * Enemy data for zone persistence
 */
export interface EnemyData {
    x: number;
    y: number;
    enemyType: string;
    health: number;
    id: string;
}

/**
 * Board data structure from BoardLoader
 */
export interface BoardData {
    width: number;
    height: number;
    tiles: any[];
    playerSpawn?: Coordinates;
}

/**
 * Board conversion result
 */
export interface BoardConversionResult {
    grid: Grid;
    terrainTextures: Record<string, string>;
    overlayTextures: Record<string, string>;
    rotations: Record<string, number>;
    overlayRotations: Record<string, number>;
    playerSpawn?: Coordinates;
    enemies?: EnemyData[];
}

/**
 * Dialogue state data
 */
export interface DialogueData {
    currentMessageIndex: number;
    messages?: string[];
    npcType?: string;
}

/**
 * Text box display data
 */
export interface TextBoxDisplayData {
    message: string;
    x: number;
    y: number;
    name?: string;
    category?: string;
}

/**
 * Serialized game state - replaces SerializedGameState with proper typing
 */
export interface SerializedGameState {
    player: SavedPlayerData;
    playerStats: SavedPlayerStats;
    zones?: Array<[string, ZoneData]>;
    grid?: Grid;
    enemies?: EnemyData[];
    defeatedEnemies?: string[];
    specialZones?: Array<[string, any]>;
    messageLog?: string[];
    currentRegion?: string;
    zoneGeneration?: ZoneGenerationData;
    zoneStateManager?: LegacyZoneStateData;
}

/**
 * Saved player data
 */
export interface SavedPlayerData {
    x: number;
    y: number;
    currentZone: Coordinates;
    thirst: number;
    hunger: number;
    inventory: any[];
    abilities: string[];
    health: number;
    dead: boolean;
    sprite: string | null;
    points: number;
    visitedZones: string[];
    spentDiscoveries: number;
}

/**
 * Saved player stats
 */
export interface SavedPlayerStats {
    musicEnabled: boolean;
    sfxEnabled: boolean;
}

/**
 * Zone generation data
 */
export interface ZoneGenerationData {
    itemLocations?: Map<string, { x: number; y: number }>;
    visitedRegions?: Set<string>;
}

/**
 * Legacy zone state data for backward compatibility
 */
export interface LegacyZoneStateData {
    [key: string]: unknown;
}

/**
 * Save payload with metadata
 */
export interface SavePayload {
    version: number;
    lastSaved: number;
    state: SerializedGameState;
}

/**
 * Zone with coordinates
 */
export interface ZoneWithCoordinates {
    x: number;
    y: number;
    dimension: number;
    depth?: number;
}

/**
 * Type guard to check if GameContext has extensions
 */
export function isGameContextWithExtensions(game: GameContext): game is GameContextWithExtensions {
    return 'zoneRepository' in game && 'messageLog' in game;
}

/**
 * Type guard to check if Player has extensions
 */
export function isPlayerWithExtensions(player: Player): player is PlayerWithExtensions {
    return 'spentDiscoveries' in player;
}

/**
 * Type guard for SavePayload
 */
export function isSavePayload(data: unknown): data is SavePayload {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return (
        typeof obj.version === 'number' &&
        typeof obj.lastSaved === 'number' &&
        typeof obj.state === 'object' &&
        obj.state !== null
    );
}
