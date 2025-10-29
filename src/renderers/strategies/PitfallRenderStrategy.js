import { TileRenderStrategy } from './TileRenderStrategy.js';

/**
 * Strategy for rendering PITFALL tiles.
 * Delegates to StructureTileRenderer for backward compatibility.
 */
export class PitfallRenderStrategy extends TileRenderStrategy {
    constructor(images, tileSize, structureRenderer) {
        super(images, tileSize);
        this.structureRenderer = structureRenderer;
    }

    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        this.structureRenderer.renderPitfallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
