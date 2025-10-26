import { TILE_SIZE, TILE_COLORS } from '../../core/constants.js';
import { RendererUtils } from '../RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';

/**
 * Generic strategy for simple item tiles that just need a sprite or fallback.
 * Can be configured with scaling, rotation, and other rendering options.
 */
export class SimpleItemRenderStrategy extends TileRenderStrategy {
    constructor(images, tileSize, spriteKey, tileTypeConstant, fallbackEmoji, options = {}) {
        super(images, tileSize);
        this.spriteKey = spriteKey;
        this.tileTypeConstant = tileTypeConstant;
        this.fallbackEmoji = fallbackEmoji;
        this.options = {
            scale: options.scale || 1.0,
            rotation: options.rotation || 0,
            scaleToFit: options.scaleToFit || false,
            disableSmoothing: options.disableSmoothing || false,
            ...options
        };
    }

    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the item image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, this.spriteKey)) {
            const itemImage = this.images[this.spriteKey];

            if (this.options.rotation !== 0) {
                this.renderRotated(ctx, itemImage, pixelX, pixelY);
            } else if (this.options.scaleToFit) {
                this.renderScaledToFit(ctx, itemImage, pixelX, pixelY);
            } else {
                this.renderScaled(ctx, itemImage, pixelX, pixelY);
            }
        } else {
            this.renderFallback(ctx, pixelX, pixelY);
        }
    }

    renderRotated(ctx, image, pixelX, pixelY) {
        ctx.save();
        ctx.translate(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        ctx.rotate(this.options.rotation);
        const maxDim = Math.max(image.width, image.height);
        const scale = TILE_SIZE / maxDim;
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;
        ctx.drawImage(
            image,
            -scaledWidth / 2,
            -scaledHeight / 2,
            scaledWidth,
            scaledHeight
        );
        ctx.restore();
    }

    renderScaledToFit(ctx, image, pixelX, pixelY) {
        const { width: scaledWidth, height: scaledHeight } = RendererUtils.calculateScaledDimensions(
            image,
            TILE_SIZE * this.options.scale
        );

        const offsetX = (TILE_SIZE - scaledWidth) / 2;
        const offsetY = (TILE_SIZE - scaledHeight) / 2;

        ctx.drawImage(
            image,
            pixelX + offsetX,
            pixelY + offsetY,
            scaledWidth,
            scaledHeight
        );
    }

    renderScaled(ctx, image, pixelX, pixelY) {
        if (this.options.disableSmoothing) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
        }

        if (this.options.scale === 1.0) {
            ctx.drawImage(image, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            const scaledSize = Math.round(TILE_SIZE * this.options.scale);
            const offsetX = Math.round((TILE_SIZE - scaledSize) / 2);
            const offsetY = Math.round((TILE_SIZE - scaledSize) / 2);
            const drawX = Math.round(pixelX + offsetX);
            const drawY = Math.round(pixelY + offsetY);
            ctx.drawImage(image, drawX, drawY, scaledSize, scaledSize);
        }

        if (this.options.disableSmoothing) {
            ctx.restore();
        }
    }

    renderFallback(ctx, pixelX, pixelY) {
        const color = TILE_COLORS[this.tileTypeConstant];
        ctx.fillStyle = color;
        const padding = this.options.fallbackPadding || 8;
        ctx.fillRect(pixelX + padding, pixelY + padding, TILE_SIZE - padding * 2, TILE_SIZE - padding * 2);

        if (this.fallbackEmoji) {
            ctx.fillStyle = '#000000';
            ctx.font = `${this.options.fallbackFontSize || 32}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.fallbackEmoji, pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }
}
