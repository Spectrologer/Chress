import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from './constants.js';
import { RendererUtils } from './RendererUtils.js';

export class WallTileRenderer {
    constructor(images, tileSize) {
        this.images = images;
        this.tileSize = tileSize;
    }

    isImageLoaded(key) {
        const image = this.images[key];
        return image && image.complete && image.naturalWidth > 0;
    }

    renderWallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // Frontier zones (level >=4) use desert background and succulent on top
        if (zoneLevel >= 4) {
            if (this.isImageLoaded('desert')) {
                ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            if (this.isImageLoaded('succulent')) {
                ctx.drawImage(this.images.succulent, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#228B22'; // Green for succulent fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }
        // Wilds zones (level 3) use blocklily.png for walls
        else if (zoneLevel === 3) {
            // First draw dirt background
            if (this.isImageLoaded('dircle')) {
                ctx.drawImage(this.images.dircle, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            // Then overlay blocklily on top
            if (this.isImageLoaded('blocklily')) {
                ctx.drawImage(this.images.blocklily, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#228B22'; // Green fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }
        // Woods zones (level 2) use stump.png for walls
        else if (zoneLevel === 2) {
            // First draw dirt background
            if (this.isImageLoaded('dircle')) {
                ctx.drawImage(this.images.dircle, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            // Then overlay stump on top
            if (this.isImageLoaded('stump')) {
                ctx.drawImage(this.images.stump, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#8B4513'; // Brown fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }
        // First draw background dirt
        if (this.isImageLoaded('dircle')) {
            ctx.drawImage(this.images.dircle, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }

        // Then draw bush on top
        if (this.isImageLoaded('bush')) {
            ctx.drawImage(this.images.bush, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.WALL];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderRockTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // Rock tiles: draw dirt background first, then rock on top
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then draw rock on top
        if (this.isImageLoaded('rock')) {
            ctx.drawImage(this.images.rock, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.ROCK];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderGrassTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // Grass tiles: draw dirt background first, then shrubbery on top
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then draw shrubbery on top
        if (this.isImageLoaded('shrubbery')) {
            ctx.drawImage(this.images.shrubbery, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.GRASS];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }
}
