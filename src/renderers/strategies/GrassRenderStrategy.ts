import { TileRenderStrategy } from './TileRenderStrategy';
import type { BaseRenderer } from '../types';
import type { WallTileRenderer } from '../WallTileRenderer';

/**
 * Strategy for rendering GRASS and SHRUBBERY tiles.
 * Delegates to WallTileRenderer for backward compatibility.
 */
export class GrassRenderStrategy extends TileRenderStrategy {
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
        this.wallRenderer.renderGrassTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
