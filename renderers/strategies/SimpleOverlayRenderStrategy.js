import { TILE_SIZE, TILE_COLORS } from '../../core/constants/index.js';
import { renderOverlay } from '../BaseRendererHelpers.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';

/**
 * Generic strategy for tiles that render as a simple overlay on a base tile.
 * Used for enemies, NPCs, and other entities that sit on top of floor tiles.
 */
export class SimpleOverlayRenderStrategy extends TileRenderStrategy {
    constructor(images, tileSize, spriteKey, tileTypeConstant, fallbackEmoji, fallbackTextOptions = null) {
        super(images, tileSize);
        this.spriteKey = spriteKey;
        this.tileTypeConstant = tileTypeConstant;
        this.fallbackEmoji = fallbackEmoji;
        this.fallbackTextOptions = fallbackTextOptions || { font: '32px Arial', fillStyle: '#FF1493' };
    }

    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        if (zoneLevel >= 4 && baseRenderer.images.desert && baseRenderer.images.desert.complete) {
            ctx.drawImage(baseRenderer.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Try to draw the overlay image if loaded, otherwise use fallback
        renderOverlay(
            ctx,
            this.images,
            this.spriteKey,
            pixelX,
            pixelY,
            TILE_SIZE,
            TILE_COLORS[this.tileTypeConstant],
            this.fallbackEmoji,
            this.fallbackTextOptions,
            { fullTile: true }
        );
    }
}
