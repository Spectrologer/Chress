/**
 * Multi-tile structure renderer - handles structures that span multiple tiles
 */

import { TILE_SIZE, TILE_TYPES } from '@core/constants/index';
import { RendererUtils } from '../RendererUtils';
import { BaseStructureRenderer } from './BaseStructureRenderer';
import type { ImageCache, GridManager, BaseRenderer } from '../types';

interface MultiTileHandler {
    findHousePosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findWellPosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findDeadTreePosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findShackPosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findCisternPosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
}

export class HouseRenderer extends BaseStructureRenderer {
    private multiTileHandler: MultiTileHandler;

    constructor(images: ImageCache, multiTileHandler: MultiTileHandler, tileSize: number) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First render dirt background
        this.renderBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);

        // Then render the museum part
        if (RendererUtils.isImageLoaded(this.images, 'doodads/museum')) {
            // For a 4x3 museum, we need to determine which part of the museum image to draw
            const houseInfo = this.multiTileHandler.findHousePosition(x, y, grid);

            if (houseInfo) {
                // Calculate which part of the house image to use
                const partX = x - houseInfo.startX;
                const partY = y - houseInfo.startY;

                // Draw the corresponding part of the museum image
                const houseImage = this.images['doodads/museum'];
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

export class WellRenderer extends BaseStructureRenderer {
    private multiTileHandler: MultiTileHandler;

    constructor(images: ImageCache, multiTileHandler: MultiTileHandler, tileSize: number) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First render dirt background
        this.renderBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);

        // Then render the well part
        if (RendererUtils.isImageLoaded(this.images, 'doodads/well')) {
            const wellInfo = this.multiTileHandler.findWellPosition(x, y, grid);

            if (wellInfo) {
                // Calculate which part of the well image to use
                const partX = x - wellInfo.startX;
                const partY = y - wellInfo.startY;

                // Draw the corresponding part of the well image
                const wellImage = this.images['doodads/well'];
                const partWidth = wellImage.width / 2;
                const partHeight = wellImage.height / 2;

                ctx.drawImage(
                    wellImage,
                    partX * partWidth, partY * partHeight,
                    partWidth, partHeight,
                    pixelX, pixelY,
                    TILE_SIZE, TILE_SIZE
                );
            }
        } else {
            // Fallback color rendering
            RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_TYPES.WELL);
        }
    }
}

export class DeadTreeRenderer extends BaseStructureRenderer {
    private multiTileHandler: MultiTileHandler;

    constructor(images: ImageCache, multiTileHandler: MultiTileHandler, tileSize: number) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First render dirt background
        this.renderBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);

        // Then render the dead tree part
        if (RendererUtils.isImageLoaded(this.images, 'doodads/deadtree')) {
            const deadtreeInfo = this.multiTileHandler.findDeadTreePosition(x, y, grid);

            if (deadtreeInfo) {
                // Calculate which part of the dead tree image to use
                const partX = x - deadtreeInfo.startX;
                const partY = y - deadtreeInfo.startY;

                // Draw the corresponding part of the dead tree image
                const deadtreeImage = this.images['doodads/deadtree'];
                const partWidth = deadtreeImage.width / 2;
                const partHeight = deadtreeImage.height / 2;

                ctx.drawImage(
                    deadtreeImage,
                    partX * partWidth, partY * partHeight,
                    partWidth, partHeight,
                    pixelX, pixelY,
                    TILE_SIZE, TILE_SIZE
                );
            }
        } else {
            // Fallback color rendering
            RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_TYPES.DEADTREE);
        }
    }
}

export class ShackRenderer extends BaseStructureRenderer {
    private multiTileHandler: MultiTileHandler;

    constructor(images: ImageCache, multiTileHandler: MultiTileHandler, tileSize: number) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First render dirt background
        this.renderBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);

        // Check for shack image with proper key
        const imageKey = 'doodads/shack';
        const shackImage = this.images[imageKey];
        const imageLoaded = RendererUtils.isImageLoaded(this.images, imageKey) &&
                          shackImage &&
                          shackImage.width >= 48 && shackImage.height >= 48;

        // Then render the shack part
        if (imageLoaded) {
            const shackInfo = this.multiTileHandler.findShackPosition(x, y, grid);

            if (shackInfo) {
                // Calculate position within the 3x3 shack
                const partX = x - shackInfo.startX;
                const partY = y - shackInfo.startY;

                if (RendererUtils.renderImageSlice(ctx, shackImage, partX, partY, 3, 3, pixelX, pixelY, TILE_SIZE)) {
                    return;
                }
            }
        }

        // Fallback color rendering
        RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_TYPES.SHACK || '#57294b', 'S');
    }
}
