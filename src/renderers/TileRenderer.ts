import { BaseTileRenderer } from './BaseTileRenderer.js';
import { RendererUtils } from './RendererUtils.js';
import type { ImageCache } from './types.js';
import type { TextureDetector } from './TextureDetector.js';

interface MultiTileHandler {
    findHousePosition(x: number, y: number, grid: any): { startX: number; startY: number } | null;
    findWellPosition(x: number, y: number, grid: any): { startX: number; startY: number } | null;
    findDeadTreePosition(x: number, y: number, grid: any): { startX: number; startY: number } | null;
    findShackPosition(x: number, y: number, grid: any): { startX: number; startY: number } | null;
    findCisternPosition(x: number, y: number, grid: any): { startX: number; startY: number } | null;
}

export class TileRenderer extends BaseTileRenderer {
    constructor(images: ImageCache, textureDetectorClass: TextureDetector, multiTileHandlerClass: MultiTileHandler, tileSize: number) {
        super(images, textureDetectorClass, multiTileHandlerClass, tileSize);
    }

    static configureCanvas(ctx: CanvasRenderingContext2D): void {
        RendererUtils.configureCanvas(ctx);
    }
}
