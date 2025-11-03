import { TileRenderStrategy } from './TileRenderStrategy.js';
import type { BaseRenderer } from '../types.js';
import type { WallTileRenderer } from '../WallTileRenderer.js';

/**
 * Strategy for rendering ROCK tiles.
 * Delegates to WallTileRenderer for backward compatibility.
 */
export class RockRenderStrategy extends TileRenderStrategy {
    private wallRenderer: WallTileRenderer;

    constructor(images: Record<string, HTMLImageElement>, tileSize: number, wallRenderer: WallTileRenderer) {
        super(images, tileSize);
        this.wallRenderer = wallRenderer;
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: any[][] | any,
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        this.wallRenderer.renderRockTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
