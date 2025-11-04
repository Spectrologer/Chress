import { TILE_SIZE, TILE_COLORS } from '@core/constants/index.js';
import { RendererUtils } from '@renderers/RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';
import type { BaseRenderer } from '@renderers/types.js';
import type { MultiTileHandler } from '@renderers/MultiTileHandler.js';

/**
 * Configuration for multi-tile rendering
 */
export interface MultiTileConfig {
    /** Sprite key in the image cache (e.g., 'doodads/well') */
    spriteKey: string;
    /** Width of the multi-tile structure in tiles (e.g., 2 for 2x2, 3 for 3x3) */
    width: number;
    /** Height of the multi-tile structure in tiles (e.g., 2 for 2x2, 3 for 3x3) */
    height: number;
    /** Tile type constant for fallback rendering */
    tileType: number;
    /** Name of the MultiTileHandler method to find position (e.g., 'findWellPosition') */
    positionFinderMethod: string;
    /** Optional fallback character for rendering */
    fallbackChar?: string;
    /** Optional custom fallback color override */
    fallbackColor?: string;
}

/**
 * Base class for render strategies that handle multi-tile structures (2x2, 3x3, 4x3, etc.).
 * Eliminates code duplication for structures that:
 * 1. Render a dirt/floor background
 * 2. Slice and render a portion of a large sprite image based on position within the structure
 *
 * This pattern appears in: DeadTreeRenderStrategy, WellRenderStrategy, ShackRenderStrategy,
 * HouseRenderStrategy, and others.
 *
 * Example usage:
 * ```ts
 * export class WellRenderStrategy extends MultiTileRenderStrategy {
 *     constructor(images: ImageCache, tileSize: number, multiTileHandler: typeof MultiTileHandler) {
 *         super(images, tileSize, multiTileHandler, {
 *             spriteKey: 'doodads/well',
 *             width: 2,
 *             height: 2,
 *             tileType: TILE_TYPES.WELL,
 *             positionFinderMethod: 'findWellPosition'
 *         });
 *     }
 * }
 * ```
 */
export abstract class MultiTileRenderStrategy extends TileRenderStrategy {
    protected multiTileHandler: typeof MultiTileHandler;
    protected config: MultiTileConfig;

    constructor(
        images: Record<string, HTMLImageElement>,
        tileSize: number,
        multiTileHandler: typeof MultiTileHandler,
        config: MultiTileConfig
    ) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
        this.config = config;
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
        // First render dirt/floor background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the multi-tile structure part
        if (RendererUtils.isImageLoaded(this.images, this.config.spriteKey)) {
            // Find the position within the multi-tile structure
            const positionInfo = this.findPosition(x, y, grid);

            if (positionInfo) {
                // Calculate which part of the image to use
                const partX = x - positionInfo.startX;
                const partY = y - positionInfo.startY;

                // Draw the corresponding part of the image
                const image = this.images[this.config.spriteKey];

                if (this.renderImageSlice(ctx, image, partX, partY, pixelX, pixelY)) {
                    return; // Successfully rendered
                }
            }
        }

        // Fallback rendering
        this.renderFallback(ctx, pixelX, pixelY);
    }

    /**
     * Find the position of this tile within the multi-tile structure.
     * Uses the configured position finder method on MultiTileHandler.
     */
    protected findPosition(x: number, y: number, grid: any[][] | any): { startX: number; startY: number } | null {
        const method = (this.multiTileHandler as any)[this.config.positionFinderMethod];
        if (typeof method === 'function') {
            return method.call(this.multiTileHandler, x, y, grid);
        }
        return null;
    }

    /**
     * Render a slice of the multi-tile image.
     * Can be overridden for custom slicing logic.
     */
    protected renderImageSlice(
        ctx: CanvasRenderingContext2D,
        image: HTMLImageElement,
        partX: number,
        partY: number,
        pixelX: number,
        pixelY: number
    ): boolean {
        // For structures like shacks that use RendererUtils.renderImageSlice
        if (this.config.width >= 3 || this.config.height >= 3) {
            return RendererUtils.renderImageSlice(
                ctx,
                image,
                partX,
                partY,
                this.config.width,
                this.config.height,
                pixelX,
                pixelY,
                TILE_SIZE
            );
        }

        // For 2x2 structures, use simple division
        const partWidth = image.width / this.config.width;
        const partHeight = image.height / this.config.height;

        try {
            ctx.drawImage(
                image,
                partX * partWidth,
                partY * partHeight, // Source position
                partWidth,
                partHeight, // Source size
                pixelX,
                pixelY, // Destination position
                TILE_SIZE,
                TILE_SIZE // Destination size
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Render fallback when image is not available.
     * Can be overridden for custom fallback rendering.
     */
    protected renderFallback(ctx: CanvasRenderingContext2D, pixelX: number, pixelY: number): void {
        const color = this.config.fallbackColor || TILE_COLORS[this.config.tileType];
        RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, color, this.config.fallbackChar);
    }
}
