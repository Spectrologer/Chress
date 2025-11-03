import { TILE_COLORS, TILE_TYPES, TILE_SIZE, STROKE_CONSTANTS } from '../core/constants/index';
import { RendererUtils } from './RendererUtils';
import { TextureDetector } from './TextureDetector';
import { WallTileRenderer } from './WallTileRenderer';
import { ItemTileRenderer } from './ItemTileRenderer';
import { StructureTileRenderer } from './StructureTileRenderer';
import { TileStrategyRegistry } from './strategies/TileStrategyRegistry';
import type { ImageCache, GridManager } from './types';

interface MultiTileHandler {
    findHousePosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findWellPosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findDeadTreePosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findShackPosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findCisternPosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
}

export class BaseTileRenderer {
    public images: ImageCache;
    private textureDetector: TextureDetector;
    private multiTileHandler: MultiTileHandler;
    private tileSize: number;
    private wallRenderer: WallTileRenderer;
    private itemRenderer: ItemTileRenderer;
    private structureRenderer: StructureTileRenderer;
    private strategyRegistry: TileStrategyRegistry;

    constructor(images: ImageCache, textureDetector: TextureDetector, multiTileHandler: MultiTileHandler, tileSize: number) {
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
    renderTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        tileType: any,
        grid: GridManager | any[][],
        zoneLevel: number,
        terrainTextures: Record<string, string> = {},
        rotations: Record<string, number> = {}
    ): void {
        const pixelX = x * TILE_SIZE;
        const pixelY = y * TILE_SIZE;

        // Handle object tiles
        const actualType = tileType && tileType.type ? tileType.type : tileType;

        // Try to use strategy pattern
        const strategy = this.strategyRegistry.getStrategy(actualType);
        if (strategy) {
            strategy.render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, this, tileType, terrainTextures, rotations);
        } else {
            // Fallback to floor tile for unknown types
            this.renderFloorTile(ctx, pixelX, pixelY, actualType, terrainTextures, rotations, x, y);
        }
    }

    // Apply checker shading to floor tiles (called by strategies that need it)
    applyCheckerShading(ctx: CanvasRenderingContext2D, x: number, y: number, pixelX: number, pixelY: number, zoneLevel: number): void {
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

    renderExitTile(ctx: CanvasRenderingContext2D, x: number, y: number, pixelX: number, pixelY: number, grid: GridManager | any[][], zoneLevel: number): void {
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

    renderFloorTile(
        ctx: CanvasRenderingContext2D,
        pixelX: number,
        pixelY: number,
        tileType: any,
        terrainTextures: Record<string, string> = {},
        rotations: Record<string, number> = {},
        x?: number,
        y?: number
    ): void {
        // Check if there's a custom terrain texture for this position
        const coord = `${x},${y}`;
        const customTexture = terrainTextures[coord];
        const rotation = rotations[coord] || 0;

        if (customTexture) {
            // Strip folder prefix if present (e.g., 'floors/dirt' -> 'dirt')
            const textureName = customTexture.includes('/') ? customTexture.split('/')[1] : customTexture;

            if (RendererUtils.isImageLoaded(this.images, textureName)) {
                ctx.save();
                // Apply rotation if present
                if (rotation !== 0) {
                    const centerX = pixelX + TILE_SIZE / 2;
                    const centerY = pixelY + TILE_SIZE / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotation * Math.PI) / 180);
                    ctx.drawImage(this.images[textureName], -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
                } else {
                    ctx.drawImage(this.images[textureName], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                }
                ctx.restore();
                return;
            }
        }

        // Fallback to default rendering
        if (tileType === TILE_TYPES.FLOOR && RendererUtils.isImageLoaded(this.images, 'dirt')) {
            ctx.drawImage(this.images.dirt, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // For tinted floors or when dirt image is not loaded, use the tile color
            ctx.fillStyle = TILE_COLORS[tileType] || '#ffcb8d';
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderFloorTileWithDirectionalTextures(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number
    ): void {
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

    renderWaterTile(ctx: CanvasRenderingContext2D, x: number, y: number, pixelX: number, pixelY: number, grid: GridManager | any[][], zoneLevel: number): void {
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
    renderItemBaseTile(ctx: CanvasRenderingContext2D, x: number, y: number, pixelX: number, pixelY: number, grid: GridManager | any[][], zoneLevel: number): void {
        if (zoneLevel >= 4 && zoneLevel !== 5 && zoneLevel !== 6 && RendererUtils.isImageLoaded(this.images, 'desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }
    }
}
