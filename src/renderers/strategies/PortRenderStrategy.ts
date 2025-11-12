import { TILE_SIZE } from '@core/constants/index.js';
import { RendererUtils } from '@renderers/RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';
import type { BaseRenderer } from '@renderers/types.js';
import type { MultiTileHandler } from '@renderers/MultiTileHandler.js';

export class PortRenderStrategy extends TileRenderStrategy {
    private multiTileHandler: typeof MultiTileHandler;

    constructor(images: Record<string, HTMLImageElement>, tileSize: number, multiTileHandler: typeof MultiTileHandler) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: any[][] | any,
        zoneLevel: number,
        baseRenderer: BaseRenderer,
        tileType?: any
    ): void {
        // PORT tiles are invisible overlays. Render the structure tile underneath them.
        const shackInfo = this.multiTileHandler.findShackPosition(x, y, grid);
        if (shackInfo) {
            this.renderShackTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
            return;
        }

        const houseInfo = this.multiTileHandler.findHousePosition(x, y, grid);
        if (houseInfo) {
            this.renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
            return;
        }

        // Interior zones use PORT as doors that transition back to surface; they are not holes.
        // Zone level 5 corresponds to interior zones in RenderManager. Don't render hole sprite there.
        if (zoneLevel === 5) {
            // Render the underlying floor/house texture for interior tiles
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

            // If this PORT has a portKind (stairdown/stairup/interior), draw the corresponding doodad on top
            if (tileType && tileType.portKind) {
                if (tileType.portKind === 'stairdown' && RendererUtils.isImageLoaded(this.images, 'stairdown')) {
                    ctx.drawImage(this.images.stairdown, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                } else if (tileType.portKind === 'stairup' && RendererUtils.isImageLoaded(this.images, 'stairup')) {
                    ctx.drawImage(this.images.stairup, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                } else if (tileType.portKind === 'interior') {
                    // Draw a visual indicator for interior exit ports
                    // Draw a darker rectangle with a lighter border to indicate the exit
                    ctx.save();
                    ctx.fillStyle = 'rgba(139, 69, 19, 0.4)'; // Semi-transparent brown
                    ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                    ctx.strokeStyle = 'rgba(205, 133, 63, 0.7)'; // Lighter brown border
                    ctx.lineWidth = 2;
                    ctx.strokeRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                    ctx.restore();
                }
            }
            return;
        }

        // If it's not a door or grate and not interior, it's a simple hole from a shovel
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        // If this PORT has a portKind (stairdown/stairup/grate), draw the corresponding doodad
        if (tileType && tileType.portKind) {
            if (tileType.portKind === 'stairdown' && RendererUtils.isImageLoaded(this.images, 'stairdown')) {
                ctx.drawImage(this.images.stairdown, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                return;
            } else if (tileType.portKind === 'stairup' && RendererUtils.isImageLoaded(this.images, 'stairup')) {
                ctx.drawImage(this.images.stairup, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                return;
            } else if (tileType.portKind === 'grate' && RendererUtils.isImageLoaded(this.images, 'doodads/grate')) {
                ctx.drawImage(this.images['doodads/grate'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                return;
            }
        }
        if (RendererUtils.isImageLoaded(this.images, 'hole')) {
            ctx.drawImage(this.images.hole, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    // Helper methods - these should ideally delegate to the appropriate strategies
    // For now, keeping them here to avoid circular dependencies
    private renderShackTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: any[][] | any,
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // Delegate to helper - in a full implementation, this would use ShackRenderStrategy
        baseRenderer.structureRenderer.renderShackTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }

    private renderHouseTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: any[][] | any,
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // Delegate to helper - in a full implementation, this would use HouseRenderStrategy
        baseRenderer.structureRenderer.renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
