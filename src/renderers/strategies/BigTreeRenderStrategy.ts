import { TILE_TYPES, TILE_SIZE } from '@core/constants/index.js';
import { MultiTileRenderStrategy } from './MultiTileRenderStrategy.js';
import { RendererUtils } from '@renderers/RendererUtils.js';
import type { MultiTileHandler } from '@renderers/MultiTileHandler.js';
import type { BaseRenderer } from '@renderers/types.js';

/**
 * Strategy for rendering BIG_TREE tiles (2x3 structure).
 * Uses MultiTileRenderStrategy but skips floor background rendering
 * to allow it to overlay other structures.
 */
export class BigTreeRenderStrategy extends MultiTileRenderStrategy {
    constructor(images: Record<string, HTMLImageElement>, tileSize: number, multiTileHandler: typeof MultiTileHandler) {
        super(images, tileSize, multiTileHandler, {
            spriteKey: 'doodads/big_tree',
            width: 2,
            height: 3,
            tileType: TILE_TYPES.BIG_TREE,
            positionFinderMethod: 'findBigTreePosition'
        });
    }

    /**
     * Override render to skip floor background for overlay functionality
     */
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
        // Skip floor background rendering - render directly on top of existing content

        // Render the multi-tile structure part
        if (RendererUtils.isImageLoaded(this.images, this.config.spriteKey)) {
            // Find the position within the multi-tile structure
            const positionInfo = this.findPosition(x, y, grid);

            if (positionInfo) {
                // Calculate which part of the image to use
                const partX = x - positionInfo.startX;
                const partY = y - positionInfo.startY;

                // Draw the corresponding part of the image
                const image = this.images[this.config.spriteKey];

                this.renderImageSlice(ctx, image, partX, partY, pixelX, pixelY);
                return; // Successfully rendered
            }
            // Position not found - skip rendering silently for overlays
            return;
        }

        // Fallback rendering (without floor background) - should rarely reach here
        this.renderFallback(ctx, pixelX, pixelY);
    }
}
