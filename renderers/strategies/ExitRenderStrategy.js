import { TileRenderStrategy } from './TileRenderStrategy.js';

export class ExitRenderStrategy extends TileRenderStrategy {
    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        baseRenderer.renderExitTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        // Exit tiles do not have checkerboard shading
    }
}
