import { TileRenderStrategy } from './TileRenderStrategy.js';

/**
 * Strategy for rendering ROCK tiles.
 * Delegates to WallTileRenderer for backward compatibility.
 */
export class RockRenderStrategy extends TileRenderStrategy {
    constructor(images, tileSize, wallRenderer) {
        super(images, tileSize);
        this.wallRenderer = wallRenderer;
    }

    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        this.wallRenderer.renderRockTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
