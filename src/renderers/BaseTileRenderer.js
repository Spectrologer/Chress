import { TILE_COLORS, TILE_TYPES, TILE_SIZE, STROKE_CONSTANTS } from '../core/constants/index.js';
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
    }

    // Apply checker shading to floor tiles (called by strategies that need it)
    applyCheckerShading(ctx, x, y, pixelX, pixelY, zoneLevel) {
        let darkTint = 'rgba(0, 0, 0, 0.05)';
        let lightTint = 'rgba(255, 255, 255, 0.05)';

        if (zoneLevel === 1) { // Surface home zones - visible checkerboard on dirt
            darkTint = 'rgba(0, 0, 0, 0.15)';
            lightTint = 'rgba(255, 255, 255, 0.15)';
        } else if (zoneLevel === 5) { // Interior/Home - subtle checkerboard on housetile
            darkTint = 'rgba(0, 0, 0, 0.1)';
            lightTint = 'rgba(255, 255, 255, 0.05)';
        } else if (zoneLevel === 6) { // Underground - strong white tint for visibility on dark gravel
            darkTint = 'rgba(0, 0, 0, 0.2)';
            lightTint = 'rgba(255, 255, 255, 0.15)'; // Increased white opacity for dark background
        } else if (zoneLevel >= 4) { // Frontier
            darkTint = 'rgba(0, 0, 0, 0.12)';
            lightTint = 'rgba(255, 255, 255, 0.02)'; // Reduce white opacity on bright desert tiles
        } else if (zoneLevel === 3) { // Wilds - good contrast on grass
            darkTint = 'rgba(0, 0, 0, 0.18)';
            lightTint = 'rgba(255, 255, 255, 0.15)';
        } else if (zoneLevel === 2) { // Woods
            darkTint = 'rgba(0, 0, 0, 0.15)';
            lightTint = 'rgba(255, 255, 255, 0.10)';
        }
        ctx.save();
        ctx.fillStyle = (x + y) % 2 === 0 ? darkTint : lightTint;
        ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        ctx.restore();
    }

    renderExitTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // Frontier zones (level >=4, but not interior or underground) use desert background for exit tiles
        if (zoneLevel >= 4 && zoneLevel !== 5 && zoneLevel !== 6 && RendererUtils.isImageLoaded(this.images, 'desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            return;
        }
        // Wilds zones (level 3) use grass background for exit tiles
        if (zoneLevel === 3 && RendererUtils.isImageLoaded(this.images, 'grass')) {
            ctx.drawImage(this.images.grass, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            return;
        }
        // Woods zones (level 2) use mulch background for exit tiles
        if (zoneLevel === 2 && RendererUtils.isImageLoaded(this.images, 'mulch')) {
            ctx.drawImage(this.images.mulch, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            return;
        }
        // Underground zones (level 6) use gravel background for exit tiles
        if (zoneLevel === 6) {
            if (RendererUtils.isImageLoaded(this.images, 'gravel')) {
                ctx.drawImage(this.images.gravel, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }
        // Just use simple dirt texture for all other exit tiles
        this.renderFloorTile(ctx, pixelX, pixelY, TILE_TYPES.FLOOR);
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
            this.applyCheckerShading(ctx, x, y, pixelX, pixelY, zoneLevel);
            return;
        }

        // Frontier zones (level >=4, but not interior or underground) use desert texture for all passable tiles
        if (zoneLevel >= 4 && zoneLevel !== 5 && zoneLevel !== 6) {
            if (RendererUtils.isImageLoaded(this.images, 'desert')) {
                ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#C2B280'; // Tarnished gold for desert
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            this.applyCheckerShading(ctx, x, y, pixelX, pixelY, zoneLevel);
            return;
        }

        // Wilds zones (level 3) use grass texture for floors
        if (zoneLevel === 3) {
            if (RendererUtils.isImageLoaded(this.images, 'grass')) {
                ctx.drawImage(this.images.grass, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#90EE90'; // Light green fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            this.applyCheckerShading(ctx, x, y, pixelX, pixelY, zoneLevel);
            return;
        }

        // Woods zones (level 2) use mulch texture for floors
        if (zoneLevel === 2) {
            if (RendererUtils.isImageLoaded(this.images, 'mulch')) {
                ctx.drawImage(this.images.mulch, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#8B4513'; // Brown fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            this.applyCheckerShading(ctx, x, y, pixelX, pixelY, zoneLevel);
            return;
        }

        // Underground zones (level 6) use gravel texture for floors
        if (zoneLevel === 6) {
            if (RendererUtils.isImageLoaded(this.images, 'gravel')) {
                ctx.drawImage(this.images.gravel, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#808080'; // Gray fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            this.applyCheckerShading(ctx, x, y, pixelX, pixelY, zoneLevel);
            return;
        }

        // Just use simple dirt texture for all other floor tiles
        if (RendererUtils.isImageLoaded(this.images, 'dirt')) {
            ctx.drawImage(this.images.dirt, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
        this.applyCheckerShading(ctx, x, y, pixelX, pixelY, zoneLevel);
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
            const padding = STROKE_CONSTANTS.FALLBACK_TILE_PADDING;
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.WATER];
            ctx.fillRect(pixelX + padding, pixelY + padding, TILE_SIZE - padding * 2, TILE_SIZE - padding * 2);

            ctx.fillStyle = '#87CEEB';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💧', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    // Utility method to render base floor tiles for items and structures (reduces duplication)
    renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        if (zoneLevel >= 4 && zoneLevel !== 5 && zoneLevel !== 6 && RendererUtils.isImageLoaded(this.images, 'desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }
    }

}
