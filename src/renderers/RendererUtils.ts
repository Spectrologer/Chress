// Shared utility functions for tile rendering
import { TILE_SIZE, TILE_COLORS } from '@core/constants/index.js';
import type { ImageCache, ScaledDimensions } from './types.js';
import { logger } from '@core/logger';

export class RendererUtils {
    // Cache for loaded image states to avoid redundant checks
    private static loadedImages = new Set<string>();

    /**
     * Draw an image rotated around its center
     */
    static drawRotatedImage(
        ctx: CanvasRenderingContext2D,
        image: HTMLImageElement,
        x: number,
        y: number,
        rotation: number,
        width: number = TILE_SIZE,
        height: number = TILE_SIZE
    ): void {
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(rotation);
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
        ctx.restore();
    }

    /**
     * Draw an image flipped horizontally or vertically
     */
    static drawFlippedImage(
        ctx: CanvasRenderingContext2D,
        image: HTMLImageElement,
        x: number,
        y: number,
        flipX = false,
        flipY = false,
        tileSize: number = TILE_SIZE
    ): void {
        ctx.save();
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        const drawX = flipX ? -(x + tileSize) : x;
        const drawY = flipY ? -(y + tileSize) : y;
        ctx.drawImage(image, drawX, drawY, tileSize, tileSize);
        ctx.restore();
    }

    /**
     * Configure canvas for pixel-perfect rendering
     */
    static configureCanvas(ctx: CanvasRenderingContext2D): void {
        ctx.imageSmoothingEnabled = false;
        (ctx as any).webkitImageSmoothingEnabled = false;
        (ctx as any).mozImageSmoothingEnabled = false;
        (ctx as any).msImageSmoothingEnabled = false;
    }

    /**
     * Check if an image is loaded and ready to use
     */
    static isImageLoaded(images: ImageCache, key: string): boolean {
        // First check our cache for faster lookups
        if (this.loadedImages.has(key)) {
            return true;
        }

        // Check the actual image
        const image = images[key];
        const isLoaded = image && image.complete && image.naturalWidth > 0;

        // Cache the result for future checks
        if (isLoaded) {
            this.loadedImages.add(key);
        }

        return isLoaded;
    }

    /**
     * Clear the loaded image cache (useful when images are reloaded or cache is reset)
     */
    static clearImageLoadedCache(): void {
        this.loadedImages.clear();
    }

    /**
     * Invalidate cache for a specific image (useful when an image is replaced)
     */
    static invalidateImageLoadedCache(key: string): void {
        this.loadedImages.delete(key);
    }

    /**
     * Calculate scaled dimensions maintaining aspect ratio and pixel perfection
     */
    static calculateScaledDimensions(image: HTMLImageElement, maxSize: number): ScaledDimensions {
        const aspectRatio = image.width / image.height;
        let scaledWidth: number, scaledHeight: number;

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
     */
    static renderImageSlice(
        ctx: CanvasRenderingContext2D,
        image: HTMLImageElement,
        partX: number,
        partY: number,
        cols: number,
        rows: number,
        pixelX: number,
        pixelY: number,
        destSize: number
    ): boolean {
        // Validate part coordinates
        if (partX < 0 || partX >= cols || partY < 0 || partY >= rows) {
            logger.warn(`[Image Slice Render Warning] Invalid part coordinates: partX=${partX}, partY=${partY}, cols=${cols}, rows=${rows}`);
            return false;
        }

        const sourceW = image.width / cols;
        const sourceH = image.height / rows;

        // Validate source dimensions
        if (sourceW <= 0 || sourceH <= 0 || sourceW > image.width || sourceH > image.height) {
            logger.warn(`[Image Slice Render Warning] Invalid source dimensions: width=${image.width}, height=${image.height}, cols=${cols}, rows=${rows}`);
            return false;
        }

        try {
            const sourceX = partX * sourceW;
            const sourceY = partY * sourceH;
            ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, pixelX, pixelY, destSize, destSize);
            return true;
        } catch (error: any) {
            logger.warn(`[Image Slice Render Error] Failed to draw image part at (${partX}, ${partY}): ${error.message}`);
            return false;
        }
    }

    /**
     * Draws a fallback tile with a solid color and an optional emoji/text
     */
    static drawFallbackTile(
        ctx: CanvasRenderingContext2D,
        pixelX: number,
        pixelY: number,
        tileSize: number,
        colorOrKey: string | number,
        emoji: string | null = null
    ): void {
        ctx.fillStyle = (typeof colorOrKey === 'number' || typeof colorOrKey === 'string' && TILE_COLORS[colorOrKey])
            ? (TILE_COLORS[colorOrKey] || colorOrKey)
            : colorOrKey;
        ctx.fillRect(pixelX, pixelY, tileSize, tileSize);

        if (emoji) {
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, pixelX + tileSize / 2, pixelY + tileSize / 2);
        }
    }
}
