import { TILE_TYPES, TILE_SIZE, TILE_COLORS, STROKE_CONSTANTS } from '../../core/constants/index.js';
import { RendererUtils } from '../RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';
import type { BaseRenderer } from '../types.js';

export class WaterRenderStrategy extends TileRenderStrategy {
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
        // First draw the directional floor background (like rock, shrubbery, etc.)
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the water image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'water')) {
            // Scale water to 70% to make it slightly smaller
            const scaledSize = TILE_SIZE * 0.7;
            const offsetX = (TILE_SIZE - scaledSize) / 2;
            const offsetY = (TILE_SIZE - scaledSize) / 2;
            ctx.drawImage(this.images.water, pixelX + offsetX, pixelY + offsetY, scaledSize, scaledSize);
        } else {
            // Fallback to colored square with emoji
            const padding = STROKE_CONSTANTS.FALLBACK_TILE_PADDING;
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.WATER];
            ctx.fillRect(pixelX + padding, pixelY + padding, TILE_SIZE - padding * 2, TILE_SIZE - padding * 2);

            ctx.fillStyle = '#87CEEB';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💧', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }
}
