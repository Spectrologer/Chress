import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from '../core/constants/index.js';
import { RendererUtils } from './RendererUtils.js';
import { TextureDetector } from './TextureDetector.js';
import { WallTileRenderer } from './WallTileRenderer.js';
import { ItemTileRenderer } from './ItemTileRenderer.js';
import { StructureTileRenderer } from './StructureTileRenderer.js';
import { TileStrategyRegistry } from './strategies/TileStrategyRegistry.js';

export class BaseTileRenderer {
    constructor(images, textureDetector, multiTileHandler, tileSize) {
        this.images = images;
        this.textureDetector = textureDetector;
        this.multiTileHandler = multiTileHandler;
        this.tileSize = tileSize;

        this.wallRenderer = new WallTileRenderer(images, tileSize);
        this.itemRenderer = new ItemTileRenderer(images, tileSize);
        this.structureRenderer = new StructureTileRenderer(images, multiTileHandler, tileSize);

        // Initialize the strategy registry
        this.strategyRegistry = new TileStrategyRegistry(
            images,
            tileSize,
            multiTileHandler,
            this.wallRenderer,
            this.structureRenderer
        );
    }

    // Main tile rendering dispatcher for basic tiles
    renderTile(ctx, x, y, tileType, grid, zoneLevel) {
        const pixelX = x * TILE_SIZE;
        const pixelY = y * TILE_SIZE;

        // Handle object tiles
        const actualType = tileType && tileType.type ? tileType.type : tileType;

        // Try to use strategy pattern
        const strategy = this.strategyRegistry.getStrategy(actualType);
        if (strategy) {
            strategy.render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this, tileType);
        } else {
            // Fallback to floor tile for unknown types
            this.renderFloorTile(ctx, pixelX, pixelY, actualType);
        }

        // Add a faint alternating tint to non-wall tiles for a chessboard effect
        if (actualType !== TILE_TYPES.WALL) {
            let darkTint = 'rgba(0, 0, 0, 0.05)';
            let lightTint = 'rgba(255, 255, 255, 0.05)';

            if (zoneLevel >= 4) { // Frontier
                darkTint = 'rgba(0, 0, 0, 0.12)';
                lightTint = 'rgba(255, 255, 255, 0.02)'; // Reduce white opacity on bright desert tiles
            }
            ctx.save();
            ctx.fillStyle = (x + y) % 2 === 0 ? darkTint : lightTint;
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            ctx.restore();
        }
    }

    renderExitTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
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
            this.renderFloorTile(ctx, pixelX, pixelY, TILE_TYPES.FLOOR);
        }
    }

    renderFloorTile(ctx, pixelX, pixelY, tileType) {
        // Use dirt image for normal floor, or fall back to colors for tinted floors
        if (tileType === TILE_TYPES.FLOOR && RendererUtils.isImageLoaded(this.images, 'dirt')) {
            ctx.drawImage(this.images.dirt, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // For tinted floors or when dirt image is not loaded, use the tile color
            ctx.fillStyle = TILE_COLORS[tileType] || '#ffcb8d';
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // Interior zones use housetile for floors
        if (zoneLevel === 5) {
            if (RendererUtils.isImageLoaded(this.images, 'housetile')) {
                ctx.drawImage(this.images.housetile, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }

        // Frontier zones (level >=4) use desert texture for all passable tiles
        if (zoneLevel >= 4) {
            if (RendererUtils.isImageLoaded(this.images, 'desert')) {
                ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#C2B280'; // Tarnished gold for desert
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }

        // Floor tiles use the same sophisticated directional logic as exits
        if (TextureDetector.shouldUseDirtCorner2NorthSouth(x, y, grid) && RendererUtils.isImageLoaded(this.images, 'dirt_corner2')) {
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
        } else if (RendererUtils.isImageLoaded(this.images, 'dirt')) {
            ctx.drawImage(this.images.dirt, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderWaterTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First draw the directional floor background (like rock, shrubbery, etc.)
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the water image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'water')) {
            // Scale water to 70% to make it slightly smaller
            const scaledSize = TILE_SIZE * 0.7;
            const offsetX = (TILE_SIZE - scaledSize) / 2;
            const offsetY = (TILE_SIZE - scaledSize) / 2;
            ctx.drawImage(this.images.water, pixelX + offsetX, pixelY + offsetY, scaledSize, scaledSize);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.WATER];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#87CEEB';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💧', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    // Utility method to render base floor tiles for items and structures (reduces duplication)
    renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        if (zoneLevel >= 4 && RendererUtils.isImageLoaded(this.images, 'desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }
    }

}
