/**
 * NPC tile renderer - handles rendering of NPC characters
 */

import { TILE_SIZE, TILE_TYPES, TILE_COLORS } from '@core/constants/index';
import { renderOverlay } from '../BaseRendererHelpers';
import { BaseStructureRenderer } from './BaseStructureRenderer';
import type { ImageCache, GridManager, BaseRenderer } from '../types';

export class NPCRenderer extends BaseStructureRenderer {
    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer,
        npcKey: string,
        tileType: number,
        fallbackEmoji: string = '🙋'
    ): void {
        // First draw the base tile
        this.renderBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);

        // Render the NPC
        renderOverlay(
            ctx,
            this.images,
            npcKey,
            pixelX,
            pixelY,
            TILE_SIZE,
            TILE_COLORS[tileType] || '#FFD700',
            fallbackEmoji,
            { font: '32px Arial', fillStyle: '#FFD700' },
            { fullTile: true }
        );
    }
}
