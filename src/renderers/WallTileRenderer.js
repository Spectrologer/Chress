import { TILE_COLORS, TILE_TYPES, TILE_SIZE, GRID_SIZE } from '../core/constants/index.js';
import { RendererUtils } from './RendererUtils.js';

export class WallTileRenderer {
    constructor(images, tileSize) {
        this.images = images;
        this.tileSize = tileSize;
    }

    renderWallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, terrainTextures = {}, rotations = {}) {
        // Check if there's a custom terrain texture for this wall position
        const coord = `${x},${y}`;
        const customTexture = terrainTextures[coord];
        const rotation = rotations[coord] || 0;

        if (customTexture) {
            // Strip folder prefix if present (e.g., 'walls/clubwall5' -> 'clubwall5')
            const textureName = customTexture.includes('/') ? customTexture.split('/')[1] : customTexture;

            if (RendererUtils.isImageLoaded(this.images, textureName)) {
                ctx.save();
                // Apply rotation if present
                if (rotation !== 0) {
                    const centerX = pixelX + this.tileSize / 2;
                    const centerY = pixelY + this.tileSize / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotation * Math.PI) / 180);
                    ctx.drawImage(this.images[textureName], -this.tileSize / 2, -this.tileSize / 2, this.tileSize, this.tileSize);
                } else {
                    ctx.drawImage(this.images[textureName], pixelX, pixelY, this.tileSize, this.tileSize);
                }
                ctx.restore();
                return;
            }
        }

        // Interior zones use house wall textures based on position
        if (zoneLevel === 5) {
            this.renderInteriorWallTile(ctx, x, y, pixelX, pixelY, grid);
            return;
        }

        // Underground zones use rockwall.png for walls
        if (zoneLevel === 6) {
            // First draw gravel background
            if (RendererUtils.isImageLoaded(this.images, 'gravel')) {
                ctx.drawImage(this.images.gravel, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            // Then overlay rockwall on top
            if (RendererUtils.isImageLoaded(this.images, 'rockwall')) {
                ctx.drawImage(this.images.rockwall, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#696969'; // Dark gray fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }

        // Frontier zones (level >=4) use desert background and succulent on top
        if (zoneLevel >= 4) {
                if (RendererUtils.isImageLoaded(this.images, 'desert')) {
                ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
                if (RendererUtils.isImageLoaded(this.images, 'succulent')) {
                ctx.drawImage(this.images.succulent, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#228B22'; // Green for succulent fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }
        // Wilds zones (level 3) use blocklily.png for walls
        else if (zoneLevel === 3) {
            // First draw grass background
            if (RendererUtils.isImageLoaded(this.images, 'grass')) {
                ctx.drawImage(this.images.grass, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            // Then overlay blocklily on top
            if (RendererUtils.isImageLoaded(this.images, 'blocklily')) {
                ctx.drawImage(this.images.blocklily, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#228B22'; // Green fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }
        // Woods zones (level 2) use stump.png for walls
        else if (zoneLevel === 2) {
            // First draw mulch background
            if (RendererUtils.isImageLoaded(this.images, 'mulch')) {
                ctx.drawImage(this.images.mulch, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            // Then overlay stump on top
            if (RendererUtils.isImageLoaded(this.images, 'stump')) {
                ctx.drawImage(this.images.stump, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#8B4513'; // Brown fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }
        // First draw background dirt
        if (RendererUtils.isImageLoaded(this.images, 'dirt')) {
            ctx.drawImage(this.images.dirt, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }

        // Then draw bush on top
        if (RendererUtils.isImageLoaded(this.images, 'bush')) {
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
        if (RendererUtils.isImageLoaded(this.images, 'rock')) {
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
        if (RendererUtils.isImageLoaded(this.images, 'shrubbery')) {
            ctx.drawImage(this.images.shrubbery, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.GRASS];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderInteriorWallTile(ctx, x, y, pixelX, pixelY, grid) {
        // Draw housetile background
        if (RendererUtils.isImageLoaded(this.images, 'housetile')) {
            ctx.drawImage(this.images.housetile, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }

        // Draw clubwall on top
        if (RendererUtils.isImageLoaded(this.images, 'clubwall')) {
            ctx.drawImage(this.images.clubwall, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = '#8B4513'; // Brown fallback
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }
}
