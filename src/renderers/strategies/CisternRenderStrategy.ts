import { TileRenderStrategy } from './TileRenderStrategy';
import type { BaseRenderer } from '../types';
import type { StructureTileRenderer } from '../StructureTileRenderer';

/**
 * Strategy for rendering CISTERN tiles.
 * Delegates to StructureTileRenderer for backward compatibility.
 */
export class CisternRenderStrategy extends TileRenderStrategy {
    private structureRenderer: StructureTileRenderer;

    constructor(images: Record<string, HTMLImageElement>, tileSize: number, structureRenderer: StructureTileRenderer) {
        super(images, tileSize);
        this.structureRenderer = structureRenderer;
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
        this.structureRenderer.renderCisternTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
