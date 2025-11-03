// Type definitions for renderer classes

import type { Position } from '../core/Position';
import type { Grid, Tile } from '../core/SharedTypes';

export type { Position, Grid, Tile };

export interface ImageCache {
    [key: string]: HTMLImageElement;
}

export interface TapFeedback {
    x: number;
    y: number;
    startTime: number;
    duration: number;
    hold?: boolean;
}

export interface ScaledDimensions {
    width: number;
    height: number;
}

export interface TextStyle {
    font?: string;
    fillStyle?: string;
}

export interface RenderOverlayOptions {
    fullTile?: boolean;
    offsetX?: number;
    offsetY?: number;
    filter?: string | null;
    scaleToFit?: boolean;
    scaleMaxSize?: number;
    rotate?: number;
}

export interface SimpleItemRenderOptions {
    scale?: number;
    rotation?: number;
    scaleToFit?: boolean;
    disableSmoothing?: boolean;
    fallbackPadding?: number;
    fallbackFontSize?: number;
}

export interface GridManager {
    getTile(x: number, y: number): Tile;
    getSize(): number;
    [y: number]: Tile[];
}

export interface BaseRenderer {
    images: ImageCache;
    structureRenderer: any; // StructureTileRenderer - avoiding circular dependency
    renderFloorTile(ctx: CanvasRenderingContext2D, pixelX: number, pixelY: number, tileType: Tile, terrainTextures?: Record<string, string>, rotations?: Record<string, number>, x?: number, y?: number): void;
    renderFloorTileWithDirectionalTextures(ctx: CanvasRenderingContext2D, x: number, y: number, pixelX: number, pixelY: number, grid: GridManager | Grid, zoneLevel: number): void;
    renderItemBaseTile(ctx: CanvasRenderingContext2D, x: number, y: number, pixelX: number, pixelY: number, grid: GridManager | Grid, zoneLevel: number): void;
    renderExitTile(ctx: CanvasRenderingContext2D, x: number, y: number, pixelX: number, pixelY: number, grid: GridManager | Grid, zoneLevel: number): void;
    applyCheckerShading(ctx: CanvasRenderingContext2D, x: number, y: number, pixelX: number, pixelY: number, zoneLevel: number): void;
}

export interface SplodeAnimation {
    x: number;
    y: number;
    frame: number;
    totalFrames?: number;
}

export interface HorseChargeAnimation {
    startPos: Position;
    midPos: Position;
    endPos: Position;
    frame: number;
}

export interface ArrowAnimation {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    frame: number;
}

export interface PointAnimation {
    x: number;
    y: number;
    amount: number;
    frame: number;
}

export interface MultiplierAnimation {
    x: number;
    y: number;
    multiplier: number;
    frame: number;
}

export interface SmokeAnimation {
    x: number;
    y: number;
    frame: number;
}
