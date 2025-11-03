import { TileRenderStrategy } from './TileRenderStrategy';
import type { BaseRenderer } from '../types';

export class ExitRenderStrategy extends TileRenderStrategy {
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
        baseRenderer.renderExitTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        // Exit tiles do not have checkerboard shading
    }
}
