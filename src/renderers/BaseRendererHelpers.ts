import { RendererUtils } from './RendererUtils';
import { STROKE_CONSTANTS } from '@core/constants/index';
import type { ImageCache, TextStyle, RenderOverlayOptions } from './types';
import { logger } from '@core/logger';

// Small helper to render an overlay image with a base already drawn by caller.
// Options:
//  - fullTile: boolean -> draw to full tile area instead of inset
//  - offsetX, offsetY: numbers -> pixel offsets applied to draw position
//  - filter: CSS filter string to apply while drawing
//  - scaleToFit: boolean -> scale image to maxSize (scaleMaxSize) and center
//  - scaleMaxSize: number -> maximum side when scaleToFit is true
// If the image is not loaded, draw a fallback colored square and optional text/emoji.
export function renderOverlay(
    ctx: CanvasRenderingContext2D,
    images: ImageCache,
    imageKey: string,
    pixelX: number,
    pixelY: number,
    tileSize: number,
    fallbackColor = '#7e7e8f',
    fallbackText = '?',
    textStyle: TextStyle = { font: '20px Arial', fillStyle: '#ffffeb' },
    options: RenderOverlayOptions = {}
): boolean {
    const {
        fullTile = false,
        offsetX = 0,
        offsetY = 0,
        filter = null,
        scaleToFit = false,
        scaleMaxSize = tileSize - 16,
        rotate = 0
    } = options;

    if (RendererUtils.isImageLoaded(images, imageKey)) {
        const img = images[imageKey];
        try {
            ctx.save();

            // Ensure proper alpha blending for transparency
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;

            if (filter) ctx.filter = filter;

            // If a rotation is requested, draw with transform around the tile center.
            if (rotate && rotate !== 0) {
                // Translate to center of tile, apply rotation, then draw centered
                ctx.translate(pixelX + tileSize / 2 + offsetX, pixelY + tileSize / 2 + offsetY);
                ctx.rotate(rotate);

                if (scaleToFit && img) {
                    const dims = RendererUtils.calculateScaledDimensions(img, scaleMaxSize);
                    ctx.drawImage(img, -dims.width / 2, -dims.height / 2, dims.width, dims.height);
                } else if (fullTile) {
                    ctx.drawImage(img, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
                } else {
                    const inset = 8;
                    const drawSize = tileSize - inset * 2;
                    ctx.drawImage(img, -drawSize / 2 + offsetX, -drawSize / 2 + offsetY, drawSize, drawSize);
                }
            } else {
                // No rotation path (preserves existing behaviour)
                if (scaleToFit && img) {
                    const dims = RendererUtils.calculateScaledDimensions(img, scaleMaxSize);
                    const drawX = pixelX + Math.round((tileSize - dims.width) / 2) + offsetX;
                    const drawY = pixelY + Math.round((tileSize - dims.height) / 2) + offsetY;
                    ctx.drawImage(img, drawX, drawY, dims.width, dims.height);
                } else if (fullTile) {
                    ctx.drawImage(img, pixelX + offsetX, pixelY + offsetY, tileSize, tileSize);
                } else {
                    // Draw inset smaller square by default
                    const inset = 8;
                    ctx.drawImage(img, pixelX + inset + offsetX, pixelY + inset + offsetY, tileSize - inset * 2, tileSize - inset * 2);
                }
            }

            ctx.restore();
            return true;
        } catch (e: any) {
            // Fallthrough to fallback on draw error
            logger.warn('[renderOverlay] drawImage failed for', imageKey, e && e.message);
            ctx.restore();
        }
    }

    // Fallback: draw colored square and optional text/emoji
    // Log which images are failing to load for debugging
    logger.warn(`[renderOverlay] Image not loaded: "${imageKey}" - using fallback color ${fallbackColor}`);

    // Wrap fallback rendering in save/restore to prevent canvas state pollution
    ctx.save();

    if (fullTile) {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(pixelX + offsetX, pixelY + offsetY, tileSize, tileSize);
    } else {
        const padding = STROKE_CONSTANTS.FALLBACK_TILE_PADDING;
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(pixelX + padding + offsetX, pixelY + padding + offsetY, tileSize - padding * 2, tileSize - padding * 2);
    }

    if (fallbackText) {
        ctx.fillStyle = textStyle.fillStyle || '#ffffeb';
        ctx.font = textStyle.font || '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fallbackText, pixelX + tileSize / 2 + offsetX, pixelY + tileSize / 2 + offsetY);
    }

    ctx.restore();
    return false;
}
