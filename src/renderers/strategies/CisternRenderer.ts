/**
 * Cistern tile renderer - renders simple 1x1 grate tile
 */

import { TILE_SIZE, TILE_TYPES, TILE_COLORS } from '@core/constants/index';
import { RendererUtils } from '../RendererUtils';
import { BaseStructureRenderer } from './BaseStructureRenderer';
import type { ImageCache, GridManager, BaseRenderer } from '../types';

export class CisternRenderer extends BaseStructureRenderer {
    constructor(images: ImageCache, tileSize: number) {
        super(images, tileSize);
    }

    renderCisternTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // Cistern is now a simple 1x1 grate tile
        // First render dirt background
        this.renderBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);

        // Render the grate overlay
        if (RendererUtils.isImageLoaded(this.images, 'doodads/grate')) {
            const grateImage = this.images['doodads/grate'];
            ctx.drawImage(
                grateImage,
                0, 0,
                grateImage.width, grateImage.height,
                pixelX, pixelY,
                TILE_SIZE, TILE_SIZE
            );
        } else {
            // Fallback color rendering
            ctx.fillStyle = `rgba${TILE_COLORS[TILE_TYPES.CISTERN].slice(4, -1)}, 0.7)`;
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#ffffeb';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('C', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        this.renderCisternTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
