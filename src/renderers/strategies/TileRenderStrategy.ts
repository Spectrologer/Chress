import type { ImageCache, BaseRenderer } from '@renderers/types.js';

/**
 * Base strategy interface for tile rendering.
 * Each concrete strategy encapsulates the rendering logic for a specific tile type.
 */
export abstract class TileRenderStrategy {
    protected images: ImageCache;
    protected tileSize: number;

    constructor(images: ImageCache, tileSize: number) {
        this.images = images;
        this.tileSize = tileSize;
    }

    /**
     * Render the tile at the specified position.
     *
     * @param ctx - Canvas rendering context
     * @param x - Grid x coordinate
     * @param y - Grid y coordinate
     * @param pixelX - Pixel x coordinate
     * @param pixelY - Pixel y coordinate
     * @param grid - Game grid
     * @param zoneLevel - Current zone level
     * @param baseRenderer - Reference to base renderer for helper methods
     * @param tileType - Tile type (may be object or primitive)
     */
    abstract render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: any[][] | any,
        zoneLevel: number,
        baseRenderer: BaseRenderer,
        tileType?: any,
        terrainTextures?: Record<string, string>,
        rotations?: Record<string, number>
    ): void;
}
