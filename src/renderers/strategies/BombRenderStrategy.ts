import { TILE_TYPES, TILE_SIZE, TILE_COLORS, ANIMATION_CONSTANTS, STROKE_CONSTANTS } from '../../core/constants/index';
import { logger } from '../../core/logger';
import { TileRenderStrategy } from './TileRenderStrategy';
import { isBomb, isTileObject } from '../../utils/TypeChecks';
import type { BaseRenderer } from '../types';

export class BombRenderStrategy extends TileRenderStrategy {
    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        gridManager: any,
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        const tile = gridManager.getTile ? gridManager.getTile(x, y) : gridManager[y]?.[x];

        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, gridManager, zoneLevel);

        // Get the bomb image
        const bombImage = this.images.bomb;

        logger.debug('Bomb image loaded:', bombImage && bombImage.complete, 'naturalWidth:', bombImage?.naturalWidth);

        // Check if it's an object bomb (player-placed with animation timer)
        if (isTileObject(tile) && isBomb(tile)) {
            // Active bomb object - render with pulsation
            if (bombImage && bombImage.complete) {
                ctx.save();
                // Only animate if bomb is not just placed
                if (!tile.justPlaced) {
                    const scale = 1 + Math.sin(Date.now() * ANIMATION_CONSTANTS.BOMB_PULSE_FREQUENCY) * ANIMATION_CONSTANTS.BOMB_PULSE_AMPLITUDE;
                    const cx = pixelX + TILE_SIZE / 2;
                    const cy = pixelY + TILE_SIZE / 2;
                    ctx.translate(cx, cy);
                    ctx.scale(scale, scale);
                    ctx.translate(-TILE_SIZE / 2, -TILE_SIZE / 2);
                }
                ctx.drawImage(bombImage, 0, 0, TILE_SIZE, TILE_SIZE);
                ctx.restore();
            } else {
                this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.BOMB], '💣');
                logger.debug('Using fallback for object bomb');
            }
        } else if (bombImage && bombImage.complete) {
            // Primitive bomb (inactive pickup item) - render normally without animation
            ctx.drawImage(bombImage, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.BOMB], '💣');
            logger.debug('Using fallback for primitive bomb');
        }
    }

    private renderFallback(ctx: CanvasRenderingContext2D, pixelX: number, pixelY: number, color: string, emoji: string): void {
        const padding = STROKE_CONSTANTS.FALLBACK_TILE_PADDING;
        ctx.fillStyle = color;
        ctx.fillRect(pixelX + padding, pixelY + padding, TILE_SIZE - padding * 2, TILE_SIZE - padding * 2);

        if (emoji) {
            ctx.fillStyle = '#000000';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }
}
