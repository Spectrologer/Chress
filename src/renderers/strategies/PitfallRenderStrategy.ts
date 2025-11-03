import { TileRenderStrategy } from './TileRenderStrategy.js';
import type { BaseRenderer } from '../types.js';
import type { StructureTileRenderer } from '../StructureTileRenderer.js';

/**
 * Strategy for rendering PITFALL tiles.
 * Delegates to StructureTileRenderer for backward compatibility.
 */
export class PitfallRenderStrategy extends TileRenderStrategy {
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
        this.structureRenderer.renderPitfallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
