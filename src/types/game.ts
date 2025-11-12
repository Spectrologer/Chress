/**
 * Shared type definitions for the game
 * This file consolidates common interfaces used across the codebase
 */

import { Position } from '@core/Position';
import type { Coordinates, ZoneCoordinates } from '@core/PositionTypes';
import type { Enemy } from '@entities/Enemy';
import type { Player } from '@entities/Player';
import type { PortKind } from '@core/SharedTypes';

// Tile types (for backwards compatibility)
// NOTE: For new code, use StrictTileObject from @types/StrictTypes
export interface TileObject {
    type: number;
    uses?: number;
    message?: string;
    foodType?: string;
    enemyType?: string;
    name?: string;
    icon?: string;
    npcType?: string;
    direction?: string;
    discovered?: boolean;
    portKind?: PortKind;
    // Legacy compatibility - avoid using this in new code
    actionsSincePlaced?: number;
    justPlaced?: boolean;
}

// Zone Data interface
// NOTE: For new code, use StrictZoneData from @types/StrictTypes
export interface ZoneData {
    grid?: (number | TileObject | null)[][];
    enemies?: Array<{
        x: number;
        y: number;
        enemyType: string;
        health: number;
        id: string;
    }>;
    discovered?: boolean;
    // No index signature - all properties must be explicitly defined
}

// NPC interface
// NOTE: For new code, use StrictNPC from @types/StrictTypes
export interface NPC {
    x: number;
    y: number;
    type: string;
    name?: string;
    // No index signature - all properties must be explicitly defined
}

// Sound Manager interface
export interface SoundManager {
    playSound(soundId: string): void;
    stopMusic?(): void;
    playMusic?(trackId: string): void;
    setMusicForZone?(options: { dimension: number; zone?: string }): void;
    resumeAudioContext?(): Promise<void>;
    setMusicEnabled?(enabled: boolean): void;
    setSfxEnabled?(enabled: boolean): void;
    sfxEnabled?: boolean;
    musicEnabled?: boolean;
}

// UI Manager interface
export interface UIManager {
    showOverlayMessage(
        text: string,
        imageSrc: string,
        isPersistent?: boolean,
        isLargeText?: boolean,
        useTypewriter?: boolean
    ): void;
    hideOverlayMessage(): void;
    showSignMessage(
    text: string,
    imageSrc: string | null,
    name: string | null,
    buttonText: string | null,
    category?: string,
        portraitBackground?: string
    ): void;
    updatePlayerPosition(): void;
    updateUI?(player: Player): void;
}

// Transient Game State interface
export interface TransientGameState {
    getDisplayingSignMessage(): TextBoxData | null;
    setDisplayingSignMessage(data: TextBoxData | null): void;
    hasSaveFile(): boolean;
}

// TextBox Data interface
export interface TextBoxData {
    message?: string;
    x?: number;
    y?: number;
}

// Grid Manager interface
export interface GridManager {
    getSize(): number;
    getTile(x: number, y: number): number | TileObject | null | undefined;
    setTile(x: number, y: number, tileType: number | TileObject | null): void;
    forEachTile?(callback: (tile: number | TileObject | null | undefined, x: number, y: number) => void): void;
    iterateTiles?(callback: (tile: number | TileObject | null | undefined, x: number, y: number) => void): void;
}

// Zone Manager interface (simplified for compatibility)
export interface ZoneManager {
    getCurrentZone?(): Coordinates;
    getZoneAt?(x: number, y: number): ZoneData | undefined;
    handlePortTransition?(direction: string): void;
    handleExitTap?(exitX?: number, exitY?: number): void;
    checkForZoneTransitionGesture?(tapCoords: Coordinates | Position, playerPos?: Coordinates | Position): boolean;
    isTransitionEligible?(gridCoords?: Coordinates, playerPos?: Coordinates): boolean;
    // Note: Removed index signature to be compatible with actual ZoneManager implementation
}

// NPC Manager interface
export interface NPCManager {
    getNPCs(): NPC[];
    getNPCAt(x: number, y: number): NPC | null | undefined;
    interactWithPenne?(): void;
    interactWithSquig?(): void;
    interactWithRune?(): void;
    interactWithNib?(): void;
    interactWithMark?(): void;
    interactWithCrayn?(): void;
    interactWithFelt?(): void;
    interactWithAxelotl?(): void;
    interactWithGouge?(): void;
    interactWithForge?(): void;
    interactWithDynamicNPC?(npc: NPC): void;
    forceInteractAt?(x: number, y: number): void;
}

// Item type definitions
// NOTE: For new code, use StrictInventoryItem from @types/StrictTypes
export interface BaseItem {
    type: string;
    name?: string;
    icon?: string;
    // No index signature - all properties must be explicitly defined
    uses?: number;
    foodType?: string;
}

export interface FoodItem extends BaseItem {
    type: 'food';
    foodType: string;
}

export interface ToolItem extends BaseItem {
    type: 'tool';
    uses: number;
}

export type InventoryItem = FoodItem | ToolItem | BaseItem;

export interface Item {
    type: string;
    name?: string;
    icon?: string;
    uses?: number;
    foodType?: string;
    // No index signature - all properties must be explicitly defined
}

// Game Instance interface - consolidates all game systems
// NOTE: For new code, prefer using GameContext from @core/context
export interface GameInstance {
    player?: Player;
    enemies?: Enemy[];
    gridManager?: GridManager;
    zoneManager?: ZoneManager;
    npcManager?: NPCManager;
    soundManager?: SoundManager;
    uiManager?: UIManager;
    transientGameState?: TransientGameState;

    // Additional properties commonly used
    dimension?: number;
    currentZone?: Coordinates;
    zones?: Map<string, ZoneData>; // Zone storage

    // No index signature - all properties must be explicitly defined
    // If you need additional properties, add them explicitly here
}

// IGame interface for backward compatibility
export interface IGame extends GameInstance {
    // Legacy properties that might still be in use
    justEnteredZone?: boolean;
    isInPitfallZone?: boolean;
    pitfallTurnsSurvived?: number;
    displayingMessageForSign?: TextBoxData;

    // Game mode system
    gameMode: any; // GameModeConfig from @core/GameMode

    // Legacy chess mode flags (deprecated - use gameMode instead)
    chessMode: boolean;
    selectedUnit: any | null; // Enemy | null
}

// Coordinates interface - now just an alias for the core Coordinates type
export type ICoordinates = Coordinates;

// Tile type
export type Tile = number | TileObject | null | undefined;

// Grid type
export type Grid = Tile[][];