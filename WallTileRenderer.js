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
        // Interior zones use house wall textures based on position
        if (zoneLevel === 5) {
            this.renderInteriorWallTile(ctx, x, y, pixelX, pixelY, grid);
            return;
        }

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

    renderInteriorWallTile(ctx, x, y, pixelX, pixelY, grid) {
        // Draw housetile background
        if (this.isImageLoaded('housetile')) {
            ctx.drawImage(this.images.housetile, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }

        const GRID_SIZE = 9;
        const middleEnd = GRID_SIZE - 1; // 8

        if (x === 0 && y === 0) {
            // Top-left corner
            if (this.isImageLoaded('house_wall_corner')) {
                ctx.drawImage(this.images.house_wall_corner, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
        } else if (x === middleEnd && y === 0) {
            // Top-right corner
            if (this.isImageLoaded('house_wall_corner')) {
                RendererUtils.drawRotatedImage(ctx, this.images.house_wall_corner, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
            }
        } else if (x === middleEnd && y === middleEnd) {
            // Bottom-right corner
            if (this.isImageLoaded('house_wall_corner')) {
                RendererUtils.drawRotatedImage(ctx, this.images.house_wall_corner, pixelX, pixelY, Math.PI, TILE_SIZE);
            }
        } else if (x === 0 && y === middleEnd) {
            // Bottom-left corner
            if (this.isImageLoaded('house_wall_corner')) {
                RendererUtils.drawRotatedImage(ctx, this.images.house_wall_corner, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
            }
        } else if (x === 0 && y > 0 && y < middleEnd) {
            // Left wall
            if (this.isImageLoaded('house_wall_side')) {
                ctx.drawImage(this.images.house_wall_side, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
        } else if (x === middleEnd && y > 0 && y < middleEnd) {
            // Right wall, flipped horizontally
            if (this.isImageLoaded('house_wall_side')) {
                RendererUtils.drawFlippedImage(ctx, this.images.house_wall_side, pixelX, pixelY, true, false, TILE_SIZE);
            }
        } else if (y === 0 && x > 0 && x < middleEnd) {
            // Top wall, rotated 90°
            if (this.isImageLoaded('house_wall_side')) {
                RendererUtils.drawRotatedImage(ctx, this.images.house_wall_side, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
            }
        } else if (x === 3 && y === middleEnd) {
            // Special case for the open wall next to the door
            if (this.isImageLoaded('house_wall_open')) {
                RendererUtils.drawFlippedImage(ctx, this.images.house_wall_open, pixelX, pixelY, false, true, TILE_SIZE);
            } else if (this.isImageLoaded('house_wall_side')) {
                // Fallback to the regular bottom wall if the special texture isn't loaded
                RendererUtils.drawRotatedImage(ctx, this.images.house_wall_side, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
            }
        } else if (x === 5 && y === middleEnd) {
            // Special case for the open wall two tiles to the right of the door
            if (this.isImageLoaded('house_wall_open')) {
                RendererUtils.drawFlippedImage(ctx, this.images.house_wall_open, pixelX, pixelY, true, true, TILE_SIZE);
            } else if (this.isImageLoaded('house_wall_side')) {
                // Fallback to the regular bottom wall if the special texture isn't loaded
                RendererUtils.drawRotatedImage(ctx, this.images.house_wall_side, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
            }
        } else if (y === middleEnd && x > 0 && x < middleEnd) {
            // Bottom wall, rotated 270°
            if (this.isImageLoaded('house_wall_side')) {
                RendererUtils.drawRotatedImage(ctx, this.images.house_wall_side, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
            }
        }
    }
}
