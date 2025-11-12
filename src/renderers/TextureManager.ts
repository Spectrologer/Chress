import { IMAGE_ASSETS, FOOD_ASSETS, TOTAL_IMAGES, TILE_COLORS, TILE_TYPES, TILE_SIZE, GRID_SIZE } from '@core/constants/index';
import { TextureLoader } from './TextureLoader';
import { AtlasTextureLoader } from './AtlasTextureLoader';
import { TextureDetector } from './TextureDetector';
import { TileRenderer } from './TileRenderer';
import { MultiTileHandler } from './MultiTileHandler';
import { logger } from '@core/logger';
import type { ImageCache } from './types';
import type { Tile } from '@core/SharedTypes';

// Set this to true to use atlas-based texture loading (recommended for production)
const USE_ATLAS_LOADING = true;

export class TextureManager {
    private loader: TextureLoader | AtlasTextureLoader;
    renderer: TileRenderer | null = null;
    structureRenderer: unknown = null;
    onAllImagesLoaded: (() => void) | null = null;

    constructor() {
        this.loader = USE_ATLAS_LOADING ? new AtlasTextureLoader() : new TextureLoader();
        logger.debug(`[TextureManager] Using ${USE_ATLAS_LOADING ? 'AtlasTextureLoader' : 'TextureLoader'}`);
    }

    async loadAssets(): Promise<void> {
        logger.debug('[TextureManager] Loading assets...');
        await this.loader.loadAssets();
        logger.debug('[TextureManager] Assets loaded, initializing renderer...');
        // Initialize TILE_TYPES for TextureDetector
        TextureDetector.TILE_TYPES = TILE_TYPES;
        // Create renderer with dependencies
        this.renderer = new TileRenderer(this.loader.getImages(), TextureDetector, MultiTileHandler, TILE_SIZE);
        // Expose structureRenderer for direct access
        this.structureRenderer = this.renderer.structureRenderer;
        logger.debug('[TextureManager] Renderer initialized successfully');
        if (this.onAllImagesLoaded) {
            this.onAllImagesLoaded();
        }
    }

    getImage(key: string): HTMLImageElement | undefined {
        return this.loader.getImage(key);
    }

    isImageLoaded(key: string): boolean {
        return this.loader.isImageLoaded(key);
    }

    // Main tile rendering method - delegate to TileRenderer
    renderTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        tileType: Tile,
        grid: unknown,
        zoneLevel: number,
        terrainTextures: Record<string, string> = {},
        rotations: Record<string, number> = {}
    ): void {
        if (this.renderer) {
            this.renderer.renderTile(ctx, x, y, tileType, grid, zoneLevel, terrainTextures, rotations);
        } else {
            // Fallback rendering if renderer is not initialized
            logger.warn('[TextureManager] Renderer not initialized, using fallback rendering');
            const tileTypeNum = typeof tileType === 'number' ? tileType : (typeof tileType === 'object' && tileType !== null ? (tileType as any).type : TILE_TYPES.FLOOR);
            const tileColor = TILE_COLORS[tileTypeNum] || TILE_COLORS[TILE_TYPES.FLOOR] || '#ffe478';
            ctx.fillStyle = tileColor;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Static method for configuring canvas
    static configureCanvas(ctx: CanvasRenderingContext2D): void {
        ctx.imageSmoothingEnabled = false;
    }
}
