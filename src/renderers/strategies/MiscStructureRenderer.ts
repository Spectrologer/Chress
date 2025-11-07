/**
 * Miscellaneous structure renderer - handles various single-tile structures
 */

import { TILE_SIZE, TILE_TYPES, TILE_COLORS } from '@core/constants/index';
import { RendererUtils } from '../RendererUtils';
import { renderOverlay } from '../BaseRendererHelpers';
import { BaseStructureRenderer } from './BaseStructureRenderer';
import type { ImageCache, GridManager, BaseRenderer } from '../types';

export class EnemyTileRenderer extends BaseStructureRenderer {
    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        gridManager: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        const tile = (gridManager as any).getTile ? (gridManager as any).getTile(x, y) : (gridManager as any)[y]?.[x];
        let enemyKey = 'lizardy';

        // First draw the base tile
        if (zoneLevel >= 4 && zoneLevel !== 5 && zoneLevel !== 6 && RendererUtils.isImageLoaded(this.images, 'desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, gridManager, zoneLevel);
        }

        // Draw the enemy
        renderOverlay(ctx, this.images, enemyKey, pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.ENEMY], '🦎', { font: '32px Arial', fillStyle: '#FF1493' }, { fullTile: true });
    }
}

export class PitfallRenderer extends BaseStructureRenderer {
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
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Draw the pitfall image if loaded
        if (RendererUtils.isImageLoaded(this.images, 'pitfall')) {
            renderOverlay(ctx, this.images, 'pitfall', pixelX, pixelY, TILE_SIZE, '', '', { font: '', fillStyle: '' }, { fullTile: true });
        }
    }
}

export class TableRenderer extends BaseStructureRenderer {
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
        // First render the base tile (interior floor)
        this.renderBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);

        // Then render the table image on top
        renderOverlay(ctx, this.images, 'doodads/table', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.TABLE], '', { font: '', fillStyle: '' }, { fullTile: true });
    }
}
