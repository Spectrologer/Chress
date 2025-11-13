import { TILE_SIZE, TILE_COLORS } from '@core/constants/index.js';
import { renderOverlay } from '@renderers/BaseRendererHelpers.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';
import type { BaseRenderer, TextStyle } from '@renderers/types.js';

/**
 * Generic strategy for tiles that render as a simple overlay on a base tile.
 * Used for enemies, NPCs, and other entities that sit on top of floor tiles.
 */
export class SimpleOverlayRenderStrategy extends TileRenderStrategy {
    private spriteKey: string;
    private tileTypeConstant: number;
    private fallbackEmoji: string | null;
    private fallbackTextOptions: TextStyle;

    constructor(
        images: Record<string, HTMLImageElement>,
        tileSize: number,
        spriteKey: string,
        tileTypeConstant: number,
        fallbackEmoji: string | null,
        fallbackTextOptions: TextStyle | null = null
    ) {
        super(images, tileSize);
        this.spriteKey = spriteKey;
        this.tileTypeConstant = tileTypeConstant;
        this.fallbackEmoji = fallbackEmoji;
        this.fallbackTextOptions = fallbackTextOptions || { font: '32px Arial', fillStyle: '#BD4882' };
    }

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
        // Note: Floor tiles are now rendered in Pass 1 by RenderManager, so we don't re-render them here
        // This prevents covering up custom terrain textures (like museum floors)

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
