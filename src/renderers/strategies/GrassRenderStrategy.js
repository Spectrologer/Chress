import { TileRenderStrategy } from './TileRenderStrategy.js';

/**
 * Strategy for rendering GRASS and SHRUBBERY tiles.
 * Delegates to WallTileRenderer for backward compatibility.
 */
export class GrassRenderStrategy extends TileRenderStrategy {
    constructor(images, tileSize, wallRenderer) {
        super(images, tileSize);
        this.wallRenderer = wallRenderer;
    }

    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        this.wallRenderer.renderGrassTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
