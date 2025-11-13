import { TILE_TYPES, TILE_SIZE, TILE_COLORS, STROKE_CONSTANTS } from '@core/constants/index.js';
import { RendererUtils } from '@renderers/RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';
import type { BaseRenderer } from '@renderers/types.js';

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
        // Floor tiles are now rendered in Pass 1 by RenderManager
        // This prevents covering up custom terrain textures (like museum floors)
        // baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Save canvas state and ensure proper alpha blending
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;

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

            ctx.fillStyle = '#66FFE3';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💧', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }

        ctx.restore();
    }
}
