/**
 * Statue tile renderer - handles rendering of statue tiles
 */

import { TILE_SIZE, TILE_TYPES, TILE_COLORS } from '@core/constants/index';
import { RendererUtils } from '../RendererUtils';
import { renderOverlay } from '../BaseRendererHelpers';
import { BaseStructureRenderer } from './BaseStructureRenderer';
import type { ImageCache, GridManager, BaseRenderer } from '../types';

export class StatueRenderer extends BaseStructureRenderer {
    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer,
        tileType: number
    ): void {
        // Note: Floor tiles are now rendered in Pass 1 by RenderManager, so we don't re-render them here
        // This prevents covering up custom terrain textures (like museum floors)

        // Draw a pedestal
        ctx.fillStyle = '#7e7e8f';
        ctx.fillRect(pixelX + 8, pixelY + TILE_SIZE - 16, TILE_SIZE - 16, 12);
        ctx.fillStyle = '#7e7e8f';
        ctx.fillRect(pixelX + 8, pixelY + TILE_SIZE - 8, TILE_SIZE - 16, 4);

        const enemySpriteMap: Record<string, string> = {
            [TILE_TYPES.LIZARDY_STATUE]: 'lizardy',
            [TILE_TYPES.LIZARDO_STATUE]: 'lizardo',
            [TILE_TYPES.LIZARDEAUX_STATUE]: 'lizardeaux',
            [TILE_TYPES.LIZORD_STATUE]: 'lizord',
            [TILE_TYPES.ZARD_STATUE]: 'zard',
            [TILE_TYPES.LAZERD_STATUE]: 'lazerd',
        };

        const itemSpriteMap: Record<string, string> = {
            [TILE_TYPES.BOMB_STATUE]: 'bomb',
            [TILE_TYPES.SPEAR_STATUE]: 'spear',
            [TILE_TYPES.BOW_STATUE]: 'bow',
            [TILE_TYPES.HORSE_STATUE]: 'horse',
            [TILE_TYPES.BOOK_STATUE]: 'book',
            [TILE_TYPES.SHOVEL_STATUE]: 'shovel'
        };

        // Prefer enemy sprite mapping, otherwise check item statue mapping
        const spriteKey = enemySpriteMap[tileType] || itemSpriteMap[tileType];
        if (spriteKey) {
            const isItemStatue = itemSpriteMap[tileType] !== undefined;
            if (isItemStatue) {
                const statueOptions: any = {
                    scaleToFit: true,
                    scaleMaxSize: TILE_SIZE - 16,
                    filter: 'grayscale(100%) brightness(0.8)'
                };
                if (tileType === TILE_TYPES.BOW_STATUE) {
                    statueOptions.rotate = -Math.PI / 2;
                }
                renderOverlay(ctx, this.images, spriteKey, pixelX, pixelY, TILE_SIZE, TILE_COLORS[tileType] || '#7e7e8f', '?', { font: '20px Arial', fillStyle: '#ffffeb' }, statueOptions);
            } else {
                renderOverlay(ctx, this.images, spriteKey, pixelX, pixelY - 10, TILE_SIZE, TILE_COLORS[tileType] || '#7e7e8f', '?', { font: '20px Arial', fillStyle: '#ffffeb' }, { fullTile: true, filter: 'grayscale(100%) brightness(0.85)' });
            }
        } else {
            RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_COLORS[tileType] || '#7e7e8f', '?');
        }
    }
}
