import { TILE_TYPES, TILE_SIZE, TILE_COLORS } from '../../core/constants/index.js';
import { RendererUtils } from '../RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';

export class ShackRenderStrategy extends TileRenderStrategy {
    constructor(images, tileSize, multiTileHandler) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
    }

    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Check for shack image with proper key
        const imageKey = 'doodads/shack';
        const shackImage = this.images[imageKey];
        const imageLoaded = RendererUtils.isImageLoaded(this.images, imageKey) &&
                          shackImage &&
                          shackImage.width >= 48 && shackImage.height >= 48; // Minimum 3x3 expected

        // Then render the shack part
        if (imageLoaded) {
            // Find the shack position using the multi-tile handler
            const shackInfo = this.multiTileHandler.findShackPosition(x, y, grid);

            if (shackInfo) {
                // Calculate position within the 3x3 shack
                const partX = x - shackInfo.startX;
                const partY = y - shackInfo.startY;

                if (RendererUtils.renderImageSlice(ctx, shackImage, partX, partY, 3, 3, pixelX, pixelY, TILE_SIZE)) {
                    return; // Successfully rendered
                }
            }
        }

        // Fallback color rendering with distinctive marking
        RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.SHACK] || '#654321', 'S');
    }
}
