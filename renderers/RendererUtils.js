// Shared utility functions for tile rendering
import { TILE_SIZE, TILE_COLORS } from '../core/constants.js';

export class RendererUtils {
    // Utility methods moved from TileRenderer
    static drawRotatedImage(ctx, image, x, y, rotation, width = TILE_SIZE, height = TILE_SIZE) {
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(rotation);
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
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

    static isImageLoaded(images, key) {
        const image = images[key];
        return image && image.complete && image.naturalWidth > 0;
    }

    // Calculate scaled dimensions maintaining aspect ratio and pixel perfection
    static calculateScaledDimensions(image, maxSize) {
        const aspectRatio = image.width / image.height;
        let scaledWidth, scaledHeight;

        if (aspectRatio > 1) {
            // Image is wider than tall - maintain pixel-perfect scaling
            scaledWidth = maxSize;
            scaledHeight = Math.round(maxSize / aspectRatio);
        } else {
            // Image is taller than wide (or square) - maintain pixel-perfect scaling
            scaledHeight = maxSize;
            scaledWidth = Math.round(maxSize * aspectRatio);
        }

        return { width: scaledWidth, height: scaledHeight };
    }

    /**
     * Renders a slice of an image corresponding to a part of a multi-tile structure.
     * @param {CanvasRenderingContext2D} ctx - The rendering context.
     * @param {Image} image - The image to slice from.
     * @param {number} partX - The x-index of the part within the cols.
     * @param {number} partY - The y-index of the part within the rows.
     * @param {number} cols - Total columns in the structure (e.g., 3 for shack).
     * @param {number} rows - Total rows in the structure (e.g., 3 for shack, 3 for house).
     * @param {number} pixelX - The destination x-coordinate.
     * @param {number} pixelY - The destination y-coordinate.
     * @param {number} destSize - The destination width and height (usually TILE_SIZE).
     * @returns {boolean} True if rendered successfully, false otherwise.
     */
    static renderImageSlice(ctx, image, partX, partY, cols, rows, pixelX, pixelY, destSize) {
        // Validate part coordinates
        if (partX < 0 || partX >= cols || partY < 0 || partY >= rows) {
            console.warn(`[Image Slice Render Warning] Invalid part coordinates: partX=${partX}, partY=${partY}, cols=${cols}, rows=${rows}`);
            return false;
        }

        const sourceW = image.width / cols;
        const sourceH = image.height / rows;

        // Validate source dimensions
        if (sourceW <= 0 || sourceH <= 0 || sourceW > image.width || sourceH > image.height) {
            console.warn(`[Image Slice Render Warning] Invalid source dimensions: width=${image.width}, height=${image.height}, cols=${cols}, rows=${rows}`);
            return false;
        }

        try {
            const sourceX = partX * sourceW;
            const sourceY = partY * sourceH;
            ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, pixelX, pixelY, destSize, destSize);
            return true;
        } catch (error) {
            console.warn(`[Image Slice Render Error] Failed to draw image part at (${partX}, ${partY}): ${error.message}`);
            return false;
        }
    }

    /**
     * Draws a fallback tile with a solid color and an optional emoji/text.
     * @param {CanvasRenderingContext2D} ctx - The rendering context.
     * @param {number} pixelX - The x-coordinate of the tile's top-left corner.
     * @param {number} pixelY - The y-coordinate of the tile's top-left corner.
     * @param {number} tileSize - The size of the tile.
     * @param {string|number} colorOrKey - A hex color string or a key for TILE_COLORS.
     * @param {string|null} emoji - The optional emoji or text to display.
     */
    static drawFallbackTile(ctx, pixelX, pixelY, tileSize, colorOrKey, emoji = null) {
        ctx.fillStyle = TILE_COLORS[colorOrKey] || colorOrKey;
        ctx.fillRect(pixelX, pixelY, tileSize, tileSize);

        if (emoji) {
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, pixelX + tileSize / 2, pixelY + tileSize / 2);
        }
    }
}
