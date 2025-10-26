import { TILE_TYPES, TILE_SIZE } from '../../core/constants.js';
import { RendererUtils } from '../RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';

export class HouseRenderStrategy extends TileRenderStrategy {
    constructor(images, tileSize, multiTileHandler) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
    }

    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the club part
        if (RendererUtils.isImageLoaded(this.images, 'doodads/club')) {
            // For a 4x3 club, we need to determine which part of the club image to draw
            // Find the house area bounds to determine the position within the house
            const houseInfo = this.multiTileHandler.findHousePosition(x, y, grid);

            if (houseInfo) {
                // Calculate which part of the house image to use
                const partX = x - houseInfo.startX;
                const partY = y - houseInfo.startY;

                // Draw the corresponding part of the club image using utility
                const houseImage = this.images['doodads/club'];
                if (!RendererUtils.renderImageSlice(ctx, houseImage, partX, partY, 4, 3, pixelX, pixelY, TILE_SIZE)) {
                    // Fallback if slicing fails
                    RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_TYPES.HOUSE, 'H');
                }
            }
        } else {
            // Fallback color rendering
            RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_TYPES.HOUSE);
        }
    }
}
