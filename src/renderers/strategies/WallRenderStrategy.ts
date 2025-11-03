import { TileRenderStrategy } from './TileRenderStrategy.js';
import type { BaseRenderer } from '../types.js';
import type { WallTileRenderer } from '../WallTileRenderer.js';

/**
 * Strategy for rendering WALL tiles.
 * Delegates to WallTileRenderer for backward compatibility.
 */
export class WallRenderStrategy extends TileRenderStrategy {
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
        baseRenderer: BaseRenderer,
        tileType?: any,
        terrainTextures?: Record<string, string>,
        rotations?: Record<string, number>
    ): void {
        this.wallRenderer.renderWallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, terrainTextures, rotations);
    }
}
