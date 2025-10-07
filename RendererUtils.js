// Shared utility functions for tile rendering
import { TILE_SIZE } from './constants.js';

export class RendererUtils {
    // Utility methods moved from TileRenderer
    static drawRotatedImage(ctx, image, x, y, rotation, tileSize = TILE_SIZE) {
        ctx.save();
        ctx.translate(x + tileSize / 2, y + tileSize / 2);
        ctx.rotate(rotation);
        ctx.drawImage(image, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
        ctx.restore();
    }

    static drawFlippedImage(ctx, image, x, y, flipX = false, flipY = false, tileSize = TILE_SIZE) {
        ctx.save();
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        const drawX = flipX ? -(x + tileSize) : x;
        const drawY = flipY ? -(y + tileSize) : y;
        ctx.drawImage(image, drawX, drawY, tileSize, tileSize);
        ctx.restore();
    }

    static configureCanvas(ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
    }
}
