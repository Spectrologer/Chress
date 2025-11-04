import { BaseTileRenderer } from './BaseTileRenderer';
import { RendererUtils } from './RendererUtils';
import type { ImageCache } from './types';
import type { TextureDetector } from './TextureDetector';

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
