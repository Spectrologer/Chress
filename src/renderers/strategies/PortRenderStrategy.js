import { TILE_SIZE } from '../../core/constants/index.js';
import { RendererUtils } from '../RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';

export class PortRenderStrategy extends TileRenderStrategy {
    constructor(images, tileSize, multiTileHandler) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
    }

    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer, tileType) {
        // PORT tiles are invisible overlays. Render the structure tile underneath them.
        const cisternInfo = this.multiTileHandler.findCisternPosition(x, y, grid);
        if (cisternInfo) {
            // The PORT is the top part of the cistern.
            this.renderCisternTop(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
            return; // Return to avoid chessboard tinting on this tile
        }

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

        // If it's not a door or cistern and not interior, it's a simple hole from a shovel
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        // If this PORT has a portKind (stairdown/stairup), draw the corresponding doodad
        if (tileType && tileType.portKind) {
            if (tileType.portKind === 'stairdown' && RendererUtils.isImageLoaded(this.images, 'stairdown')) {
                ctx.drawImage(this.images.stairdown, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                return;
            } else if (tileType.portKind === 'stairup' && RendererUtils.isImageLoaded(this.images, 'stairup')) {
                ctx.drawImage(this.images.stairup, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                return;
            }
        }
        if (RendererUtils.isImageLoaded(this.images, 'hole')) {
            ctx.drawImage(this.images.hole, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    // Helper methods - these should ideally delegate to the appropriate strategies
    // For now, keeping them here to avoid circular dependencies
    renderCisternTop(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First render dirt background so transparency works
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        if (RendererUtils.isImageLoaded(this.images, 'doodads/cistern')) {
            const cisternImage = this.images['doodads/cistern'];
            const partWidth = cisternImage.width; // 16
            const partHeight = cisternImage.height / 2; // 9

            // Pixel perfect scaling: 16x9 -> 64x36
            // Position at the bottom of the tile
            const destW = partWidth * 4; // 64
            const destH = partHeight * 4; // 36
            const destX = pixelX; // Left justified
            const destY = pixelY + TILE_SIZE - destH; // Bottom of tile

            ctx.drawImage(
                cisternImage,
                0, 0, // Source position (top part)
                partWidth, partHeight, // Source size
                destX, destY, // Destination position, aligned to top of tile
                destW, destH // Destination size
            );
        }
    }

    renderShackTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // Delegate to helper - in a full implementation, this would use ShackRenderStrategy
        baseRenderer.structureRenderer.renderShackTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }

    renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // Delegate to helper - in a full implementation, this would use HouseRenderStrategy
        baseRenderer.structureRenderer.renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
