import { TileRenderStrategy } from './TileRenderStrategy.js';

/**
 * Strategy for rendering WALL tiles.
 * Delegates to WallTileRenderer for backward compatibility.
 */
export class WallRenderStrategy extends TileRenderStrategy {
    constructor(images, tileSize, wallRenderer) {
        super(images, tileSize);
        this.wallRenderer = wallRenderer;
    }

    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        this.wallRenderer.renderWallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
    }
}
