/**
 * Base structure renderer - provides common functionality for all structure renderers
 */

import { TILE_SIZE } from '@core/constants/index';
import { RendererUtils } from '../RendererUtils';
import type { ImageCache, GridManager, BaseRenderer } from '../types';

export abstract class BaseStructureRenderer {
    protected images: ImageCache;
    protected tileSize: number;

    constructor(images: ImageCache, tileSize: number) {
        this.images = images;
        this.tileSize = tileSize;
    }

    /**
     * Render the base tile (floor/dirt) before rendering the structure
     * NOTE: This is now deprecated - floor tiles are rendered in Pass 1 by RenderManager
     * to avoid covering up custom terrain textures. This method is kept for backwards
     * compatibility but does nothing.
     */
    protected renderBaseTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // Floor tiles are now rendered in Pass 1 by RenderManager
        // This prevents covering up custom terrain textures (like museum floors)
        // Intentionally left empty
    }

    /**
     * Abstract render method - must be implemented by subclasses
     */
    abstract render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer,
        ...args: any[]
    ): void;
}
