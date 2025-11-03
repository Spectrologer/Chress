import { TILE_COLORS, TILE_TYPES, TILE_SIZE, GRID_SIZE } from '../core/constants/index';
import { RendererUtils } from './RendererUtils';
import type { ImageCache, GridManager, BaseRenderer } from './types';

export class WallTileRenderer {
    private images: ImageCache;
    private tileSize: number;

    constructor(images: ImageCache, tileSize: number) {
        this.images = images;
        this.tileSize = tileSize;
    }

    renderWallTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        terrainTextures: Record<string, string> = {},
        rotations: Record<string, number> = {}
    ): void {
        // Check if there's a custom terrain texture for this wall position
        const coord = `${x},${y}`;
        const customTexture = terrainTextures[coord];
        const rotation = rotations[coord] || 0;

        if (customTexture) {
            // Strip folder prefix if present (e.g., 'walls/clubwall5' -> 'clubwall5')
            const textureName = customTexture.includes('/') ? customTexture.split('/')[1] : customTexture;

            if (RendererUtils.isImageLoaded(this.images, textureName)) {
                // First draw background dirt so transparency works properly
                if (RendererUtils.isImageLoaded(this.images, 'dirt')) {
                    ctx.drawImage(this.images.dirt, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                } else {
                    ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                    ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                }

                // Then draw the wall texture on top
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

        // Underground zones use cobble for walls
        if (zoneLevel === 6) {
            // First draw gravel background
            if (RendererUtils.isImageLoaded(this.images, 'gravel')) {
                ctx.drawImage(this.images.gravel, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            // Then overlay cobble on top
            if (RendererUtils.isImageLoaded(this.images, 'cobble')) {
                ctx.drawImage(this.images.cobble, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
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

    renderRockTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
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

    renderGrassTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
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

    private renderInteriorWallTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][]
    ): void {
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
