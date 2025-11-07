/**
 * Shared type definitions for the game
 * This file consolidates common interfaces used across the codebase
 */

import { Position } from '@core/Position';
import type { Coordinates, ZoneCoordinates } from '@core/PositionTypes';
import type { Enemy } from '@entities/Enemy';
import type { Player } from '@entities/Player';

// Sound Manager interface
export interface SoundManager {
    playSound(soundId: string): void;
    stopMusic?(): void;
    playMusic?(trackId: string): void;
    setMusicForZone?(options: { dimension: number } | any): void;
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
    getDisplayingSignMessage(): SignData | null;
    setDisplayingSignMessage(data: SignData | null): void;
    hasSaveFile(): boolean;
}

// Sign Data interface
export interface SignData {
    message?: string;
    x?: number;
    y?: number;
}

// Grid Manager interface
export interface GridManager {
    getSize(): number;
    getTile(x: number, y: number): any;
    setTile(x: number, y: number, tileType: any): void;
    forEachTile?(callback: (tile: any, x: number, y: number) => void): void;
    iterateTiles?(callback: (tile: any, x: number, y: number) => void): void;
}

// Zone Manager interface (simplified for compatibility)
export interface ZoneManager {
    getCurrentZone?(): Coordinates;
    getZoneAt?(x: number, y: number): any;
    handlePortTransition?(direction: string): void;
    handleExitTap?(exitX?: number, exitY?: number): void;
    checkForZoneTransitionGesture?(pos: Position): boolean;
    isTransitionEligible?(): boolean;
    [key: string]: any; // Allow additional properties
}

// NPC Manager interface
export interface NPCManager {
    getNPCs(): any[];
    getNPCAt(x: number, y: number): any;
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
    interactWithDynamicNPC?(npc: any): void;
    forceInteractAt?(x: number, y: number): void;
}

// Item type definitions
export interface BaseItem {
    type: string;
    [key: string]: any;
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
    [key: string]: any;
}

// Game Instance interface - consolidates all game systems
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

    // Allow for additional properties
    [key: string]: any;
}

// IGame interface for backward compatibility
export interface IGame extends GameInstance {
    // Legacy properties that might still be in use
    justEnteredZone?: boolean;
    isInPitfallZone?: boolean;
    pitfallTurnsSurvived?: number;
    displayingMessageForSign?: SignData;
}

// Coordinates interface - now just an alias for the core Coordinates type
export type ICoordinates = Coordinates;

// Tile type
export type Tile = number | object | any;

// Grid type
export type Grid = any[][];