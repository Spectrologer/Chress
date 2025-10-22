import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from '../core/constants.js';
import { RendererUtils } from './RendererUtils.js';
import { TextureDetector } from './TextureDetector.js';
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

    // Main tile rendering dispatcher for basic tiles
    renderTile(ctx, x, y, tileType, grid, zoneLevel) {
        const pixelX = x * TILE_SIZE;
        const pixelY = y * TILE_SIZE;

        // Handle object tiles
        const actualType = tileType && tileType.type ? tileType.type : tileType;

        if (actualType === TILE_TYPES.FLOOR) {
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
        } else if (actualType === TILE_TYPES.BOOK_OF_TIME_TRAVEL) {
            this.itemRenderer.renderBookTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.BOW) {
            this.itemRenderer.renderBowTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.HOUSE) {
            this.structureRenderer.renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.WELL) {
            this.structureRenderer.renderWellTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.DEADTREE) {
            this.structureRenderer.renderDeadTreeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.ENEMY) {
            this.structureRenderer.renderEnemyTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.PENNE) {
            this.structureRenderer.renderPenneTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.SQUIG) {
            this.structureRenderer.renderSquigTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.RUNE) {
            this.structureRenderer.renderRuneTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.NIB) {
            this.structureRenderer.renderNibTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.MARK) {
            this.structureRenderer.renderMarkTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.LIZARDY_STATUE ||
                   actualType === TILE_TYPES.LIZARDO_STATUE ||
                   actualType === TILE_TYPES.LIZARDEAUX_STATUE ||
                   actualType === TILE_TYPES.ZARD_STATUE ||
                   actualType === TILE_TYPES.LAZERD_STATUE ||
                   actualType === TILE_TYPES.LIZORD_STATUE) {
            this.structureRenderer.renderStatueTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this, actualType);
         } else if (actualType === TILE_TYPES.BOMB_STATUE ||
                 actualType === TILE_TYPES.SPEAR_STATUE ||
                 actualType === TILE_TYPES.BOW_STATUE ||
                 actualType === TILE_TYPES.HORSE_STATUE ||
                 actualType === TILE_TYPES.BOOK_STATUE ||
                 actualType === TILE_TYPES.SHOVEL_STATUE) {
             this.structureRenderer.renderStatueTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this, actualType);
        } else if (actualType === TILE_TYPES.CRAYN) {
            this.structureRenderer.renderCraynTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.FELT) {
            this.structureRenderer.renderFeltTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.FORGE) {
            this.structureRenderer.renderForgeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.SHACK) {
            this.structureRenderer.renderShackTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.AXELOTL) {
            this.structureRenderer.renderAxelotlTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.GOUGE) {
            this.structureRenderer.renderGougeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.CISTERN) {
            this.structureRenderer.renderCisternTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.SHOVEL) {
            this.itemRenderer.renderShovelTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.PITFALL) {
            this.structureRenderer.renderPitfallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
        } else if (actualType === TILE_TYPES.PORT) {
            // PORT tiles are invisible overlays. Render the structure tile underneath them.
            const cisternInfo = this.multiTileHandler.findCisternPosition(x, y, grid);
            if (cisternInfo) {
                // The PORT is the top part of the cistern.
                this.structureRenderer.renderCisternTop(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
                return; // Return to avoid chessboard tinting on this tile
            }

            const shackInfo = this.multiTileHandler.findShackPosition(x, y, grid);
            if (shackInfo) {
                this.structureRenderer.renderShackTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
                return;
            }

            const houseInfo = this.multiTileHandler.findHousePosition(x, y, grid);
            if (houseInfo) {
                this.structureRenderer.renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
                return;
            }

            // Interior zones use PORT as doors that transition back to surface; they are not holes.
            // Zone level 5 corresponds to interior zones in RenderManager. Don't render hole sprite there.
            if (zoneLevel === 5) {
                // Render the underlying floor/house texture for interior tiles and return.
                this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
                return;
            }

            // If it's not a door or cistern and not interior, it's a simple hole from a shovel
            this.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
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
        } else if (actualType === TILE_TYPES.TABLE) {
            this.structureRenderer.renderTableTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this);
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
