import { TILE_TYPES, TILE_SIZE } from '../../core/constants.js';
import { RendererUtils } from '../RendererUtils.js';
import { TextureDetector } from '../TextureDetector.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';

export class ExitRenderStrategy extends TileRenderStrategy {
    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // Frontier zones (level >=4) use desert background for exit tiles
        if (zoneLevel >= 4 && RendererUtils.isImageLoaded(this.images, 'desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            return;
        }
        if (TextureDetector.shouldUseDirtTunnelHorizontal(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_tunnel')) {
            ctx.drawImage(this.images.dirt_tunnel, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtTunnelVertical(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_tunnel')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_tunnel, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtCorner2NorthSouth(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_corner2')) {
            ctx.drawImage(this.images.dirt_corner2, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtCorner2EastWest(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_corner2')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtCorner2SouthNorth(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_corner2')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, Math.PI, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtCorner2WestEast(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_corner2')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtNorth(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_north')) {
            ctx.drawImage(this.images.dirt_north, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtSouth(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_north')) {
            RendererUtils.drawFlippedImage(ctx, this.images.dirt_north, pixelX, pixelY, false, true, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtEast(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_north')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_north, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtWest(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_north')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_north, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtCornerNE(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_corner')) {
            ctx.drawImage(this.images.dirt_corner, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtCornerSE(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_corner')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtCornerSW(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_corner')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, Math.PI, TILE_SIZE);
        } else if (TextureDetector.shouldUseDirtCornerNW(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_corner')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTile(ctx, pixelX, pixelY, TILE_TYPES.FLOOR);
        }
    }
}
