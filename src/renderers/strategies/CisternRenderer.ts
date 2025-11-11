/**
 * Cistern tile renderer - handles rendering of cistern structures
 */

import { TILE_SIZE, TILE_TYPES, TILE_COLORS } from '@core/constants/index';
import { RendererUtils } from '../RendererUtils';
import { BaseStructureRenderer } from './BaseStructureRenderer';
import type { ImageCache, GridManager, BaseRenderer } from '../types';

interface MultiTileHandler {
    findCisternPosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
}

export class CisternRenderer extends BaseStructureRenderer {
    private multiTileHandler: MultiTileHandler;

    constructor(images: ImageCache, multiTileHandler: MultiTileHandler, tileSize: number) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
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
        // This renders a CISTERN tile (bottom part)
        const cisternInfo = this.multiTileHandler.findCisternPosition(x, y, grid);
        const getTile = (gx: number, gy: number) => (grid as any).getTile ? (grid as any).getTile(gx, gy) : (grid as any)[gy]?.[gx];
        const tileAbove = y > 0 ? getTile(x, y - 1) : null;
        const tileBelow = y < 9 ? getTile(x, y + 1) : null;
        const isDoubleBottom = (tileAbove === TILE_TYPES.CISTERN || tileBelow === TILE_TYPES.CISTERN);

        // First render dirt background
        this.renderBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);

        if (RendererUtils.isImageLoaded(this.images, 'doodads/cistern')) {
            const cisternImage = this.images['doodads/cistern'];
            const partWidth = cisternImage.width;
            const partHeight = cisternImage.height / 2;

            // Pixel perfect scaling: 16x9 -> 64x36
            const destW = partWidth * 4;
            const destH = partHeight * 4;
            const destX = pixelX;
            const destY = pixelY;

            // Always use the bottom part of the sprite for CISTERN tiles
            ctx.drawImage(
                cisternImage,
                0, partHeight,
                partWidth, partHeight,
                destX, destY,
                destW, destH
            );
        } else {
            // Fallback color rendering
            const partHeight = 9;
            const scaleFactor = 4;
            const destW = 16 * scaleFactor;
            const destH = partHeight * scaleFactor;
            const destX = pixelX;
            const destY = pixelY;
            ctx.fillStyle = `rgba${TILE_COLORS[TILE_TYPES.CISTERN].slice(4, -1)}, 0.7)`;
            ctx.fillRect(destX, destY, destW, destH);
            ctx.fillStyle = '#ffffeb';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('C', pixelX + TILE_SIZE / 2, pixelY + destH / 2);
        }
    }

    renderCisternTop(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // This is the TOP part of the cistern (the PORT/entrance)

        // First render dirt background
        this.renderBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);

        if (RendererUtils.isImageLoaded(this.images, 'doodads/cistern')) {
            const cisternImage = this.images['doodads/cistern'];
            const partWidth = cisternImage.width;
            const partHeight = cisternImage.height / 2;

            // Pixel perfect scaling: 16x9 -> 64x36
            const destW = partWidth * 4;
            const destH = partHeight * 4;
            const destX = pixelX;
            const destY = pixelY + TILE_SIZE - destH;

            ctx.drawImage(
                cisternImage,
                0, 0,
                partWidth, partHeight,
                destX, destY,
                destW, destH
            );
        } else {
            // Fallback rendering
            const partHeight = 9;
            const scaleFactor = 4;
            const destW = 16 * scaleFactor;
            const destH = partHeight * scaleFactor;
            const destX = pixelX;
            const destY = pixelY + TILE_SIZE - destH;

            ctx.fillStyle = `rgba${TILE_COLORS[TILE_TYPES.CISTERN].slice(4, -1)}, 0.7)`;
            ctx.fillRect(destX, destY, destW, destH);
            ctx.fillStyle = '#ffffeb';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('C', destX + destW / 2, destY + destH / 2 + 2);
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
