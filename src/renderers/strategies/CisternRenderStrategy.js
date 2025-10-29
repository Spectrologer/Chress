import { TileRenderStrategy } from './TileRenderStrategy.js';

/**
 * Strategy for rendering CISTERN tiles.
 * Delegates to StructureTileRenderer for backward compatibility.
 */
export class CisternRenderStrategy extends TileRenderStrategy {
    constructor(images, tileSize, structureRenderer) {
        super(images, tileSize);
        this.structureRenderer = structureRenderer;
    }

    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        this.structureRenderer.renderCisternTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
