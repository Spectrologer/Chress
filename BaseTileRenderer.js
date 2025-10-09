import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from './constants.js';
import { RendererUtils } from './RendererUtils.js';
import { WallTileRenderer } from './WallTileRenderer.js';
import { ItemTileRenderer } from './ItemTileRenderer.js';
import { StructureTileRenderer } from './StructureTileRenderer.js';

export class BaseTileRenderer {
    constructor(images, textureDetector, multiTileHandler, tileSize) {
        this.images = images;
        this.textureDetector = textureDetector;
        this.multiTileHandler = multiTileHandler;
        this.tileSize = tileSize;

        this.wallRenderer = new WallTileRenderer(images, tileSize);
        this.itemRenderer = new ItemTileRenderer(images, tileSize);
        this.structureRenderer = new StructureTileRenderer(images, multiTileHandler, tileSize);
    }

    isImageLoaded(key) {
        const image = this.images[key];
        return image && image.complete && image.naturalWidth > 0;
    }

    // Main tile rendering dispatcher for basic tiles
    renderTile(ctx, x, y, tileType, grid, zoneLevel) {
        const pixelX = x * TILE_SIZE;
        const pixelY = y * TILE_SIZE;

        // Handle object tiles (like notes, but defer to subRenderer for most)
        const actualType = tileType && tileType.type ? tileType.type : tileType;

        if (actualType >= TILE_TYPES.PINK_FLOOR && actualType <= TILE_TYPES.YELLOW_FLOOR) {
            // Tinted floors - render with color
            this.renderFloorTile(ctx, pixelX, pixelY, actualType);
        } else if (actualType === TILE_TYPES.FLOOR) {
            this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.EXIT) {
            this.renderExitTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.WALL) {
            this.wallRenderer.renderWallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.ROCK) {
            this.wallRenderer.renderRockTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.GRASS || actualType === TILE_TYPES.SHRUBBERY) {
            this.wallRenderer.renderGrassTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.WATER) {
            this.renderWaterTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.FOOD) {
            this.itemRenderer.renderFoodTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.AXE) {
            this.itemRenderer.renderAxeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.HAMMER) {
            this.itemRenderer.renderHammerTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.BISHOP_SPEAR) {
            this.itemRenderer.renderSpearTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.HORSE_ICON) {
            this.itemRenderer.renderHorseIconTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.BOMB) {
            this.itemRenderer.renderBombTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.HEART) {
            this.itemRenderer.renderHeartTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.NOTE) {
            this.itemRenderer.renderNoteTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.SIGN) {
            this.itemRenderer.renderSignTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.HOUSE) {
            this.structureRenderer.renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.WELL) {
            this.structureRenderer.renderWellTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.DEADTREE) {
            this.structureRenderer.renderDeadTreeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.ENEMY) {
            this.structureRenderer.renderEnemyTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.LION) {
            this.structureRenderer.renderLionTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.SQUIG) {
            this.structureRenderer.renderSquigTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.LIZARDY_STATUE ||
                   actualType === TILE_TYPES.LIZARDO_STATUE ||
                   actualType === TILE_TYPES.LIZARDEAUX_STATUE ||
                   actualType === TILE_TYPES.ZARD_STATUE ||
                   actualType === TILE_TYPES.LAZERD_STATUE ||
                   actualType === TILE_TYPES.LIZORD_STATUE) {
            this.structureRenderer.renderStatueTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this, actualType);
        } else if (actualType === TILE_TYPES.PORT) {
            // PORT tiles are invisible overlays. Render the tile underneath them.
            this.structureRenderer.renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else {
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
        if (zoneLevel >= 4 && this.isImageLoaded('desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            return;
        }
        // ...existing code...
        if (this.shouldUseDirtTunnelHorizontal(x, y, grid) && this.isImageLoaded('dirt_tunnel')) {
            ctx.drawImage(this.images.dirt_tunnel, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtTunnelVertical(x, y, grid) && this.isImageLoaded('dirt_tunnel')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_tunnel, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtCorner2NorthSouth(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            ctx.drawImage(this.images.dirt_corner2, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtCorner2EastWest(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtCorner2SouthNorth(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, Math.PI, TILE_SIZE);
        } else if (this.shouldUseDirtCorner2WestEast(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtNorth(x, y, grid) && this.isImageLoaded('dirt_north')) {
            ctx.drawImage(this.images.dirt_north, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtSouth(x, y, grid) && this.isImageLoaded('dirt_north')) {
            RendererUtils.drawFlippedImage(ctx, this.images.dirt_north, pixelX, pixelY, false, true, TILE_SIZE);
        } else if (this.shouldUseDirtEast(x, y, grid) && this.isImageLoaded('dirt_north')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_north, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtWest(x, y, grid) && this.isImageLoaded('dirt_north')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_north, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtCornerNE(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            ctx.drawImage(this.images.dirt_corner, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtCornerSE(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtCornerSW(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, Math.PI, TILE_SIZE);
        } else if (this.shouldUseDirtCornerNW(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
        } else {
            this.renderFloorTile(ctx, pixelX, pixelY, TILE_TYPES.FLOOR);
        }
    }

    renderFloorTile(ctx, pixelX, pixelY, tileType) {
        // Use dirt image for normal floor, or fall back to colors for tinted floors
        if (tileType === TILE_TYPES.FLOOR && this.isImageLoaded('dirt')) {
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
            if (this.isImageLoaded('housetile')) {
                ctx.drawImage(this.images.housetile, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }

        // Frontier zones (level >=4) use desert texture for all passable tiles
        if (zoneLevel >= 4) {
            if (this.isImageLoaded('desert')) {
                ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#C2B280'; // Tarnished gold for desert
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }

        // Floor tiles use the same sophisticated directional logic as exits
        if (this.shouldUseDirtCorner2NorthSouth(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            ctx.drawImage(this.images.dirt_corner2, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtCorner2EastWest(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtCorner2SouthNorth(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, Math.PI, TILE_SIZE);
        } else if (this.shouldUseDirtCorner2WestEast(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtNorth(x, y, grid) && this.isImageLoaded('dirt_north')) {
            ctx.drawImage(this.images.dirt_north, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtSouth(x, y, grid) && this.isImageLoaded('dirt_north')) {
            RendererUtils.drawFlippedImage(ctx, this.images.dirt_north, pixelX, pixelY, false, true, TILE_SIZE);
        } else if (this.shouldUseDirtEast(x, y, grid) && this.isImageLoaded('dirt_north')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_north, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtWest(x, y, grid) && this.isImageLoaded('dirt_north')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_north, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtCornerNE(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            ctx.drawImage(this.images.dirt_corner, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtCornerSE(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, Math.PI / 2, TILE_SIZE);
        } else if (this.shouldUseDirtCornerSW(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, Math.PI, TILE_SIZE);
        } else if (this.shouldUseDirtCornerNW(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            RendererUtils.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, -Math.PI / 2, TILE_SIZE);
        } else if (this.isImageLoaded('dirt')) {
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
        if (this.isImageLoaded('water')) {
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

    // Delegate to TextureDetector
    shouldUseDirtTunnelHorizontal(x, y, grid) {
        return this.textureDetector.shouldUseDirtTunnelHorizontal(x, y, grid);
    }

    shouldUseDirtTunnelVertical(x, y, grid) {
        return this.textureDetector.shouldUseDirtTunnelVertical(x, y, grid);
    }

    shouldUseDirtCorner2NorthSouth(x, y, grid) {
        return this.textureDetector.shouldUseDirtCorner2NorthSouth(x, y, grid);
    }

    shouldUseDirtCorner2EastWest(x, y, grid) {
        return this.textureDetector.shouldUseDirtCorner2EastWest(x, y, grid);
    }

    shouldUseDirtCorner2SouthNorth(x, y, grid) {
        return this.textureDetector.shouldUseDirtCorner2SouthNorth(x, y, grid);
    }

    shouldUseDirtCorner2WestEast(x, y, grid) {
        return this.textureDetector.shouldUseDirtCorner2WestEast(x, y, grid);
    }

    shouldUseDirtNorth(x, y, grid) {
        return this.textureDetector.shouldUseDirtNorth(x, y, grid);
    }

    shouldUseDirtSouth(x, y, grid) {
        return this.textureDetector.shouldUseDirtSouth(x, y, grid);
    }

    shouldUseDirtEast(x, y, grid) {
        return this.textureDetector.shouldUseDirtEast(x, y, grid);
    }

    shouldUseDirtWest(x, y, grid) {
        return this.textureDetector.shouldUseDirtWest(x, y, grid);
    }

    shouldUseDirtCornerNE(x, y, grid) {
        return this.textureDetector.shouldUseDirtCornerNE(x, y, grid);
    }

    shouldUseDirtCornerSE(x, y, grid) {
        return this.textureDetector.shouldUseDirtCornerSE(x, y, grid);
    }

    shouldUseDirtCornerSW(x, y, grid) {
        return this.textureDetector.shouldUseDirtCornerSW(x, y, grid);
    }

    shouldUseDirtCornerNW(x, y, grid) {
        return this.textureDetector.shouldUseDirtCornerNW(x, y, grid);
    }

    findHousePosition(x, y, grid) {
        return this.multiTileHandler.findHousePosition(x, y, grid);
    }

    findWellPosition(x, y, grid) {
        return this.multiTileHandler.findWellPosition(x, y, grid);
    }

    findDeadTreePosition(x, y, grid) {
        return this.multiTileHandler.findDeadTreePosition(x, y, grid);
    }
}
