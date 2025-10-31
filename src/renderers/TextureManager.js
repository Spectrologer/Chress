import { IMAGE_ASSETS, FOOD_ASSETS, TOTAL_IMAGES, TILE_COLORS, TILE_TYPES, TILE_SIZE, GRID_SIZE } from '../core/constants/index.js';
import { TextureLoader } from './TextureLoader.js'; // This seems to be a duplicate import in the original file.
import { TextureDetector } from './TextureDetector.js';
import { TileRenderer } from './TileRenderer.js';
import { MultiTileHandler } from './MultiTileHandler.js';
import { logger } from '../core/logger.js';

export class TextureManager {
    constructor() {
        this.loader = new TextureLoader();
        this.renderer = null;
        this.onAllImagesLoaded = null;
    }

    async loadAssets() {
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

    getImage(key) {
        return this.loader.getImage(key);
    }

    isImageLoaded(key) {
        return this.loader.isImageLoaded(key);
    }

    // Main tile rendering method - delegate to TileRenderer
    renderTile(ctx, x, y, tileType, grid, zoneLevel, terrainTextures = {}, rotations = {}) {
        if (this.renderer) {
            this.renderer.renderTile(ctx, x, y, tileType, grid, zoneLevel, terrainTextures, rotations);
        } else {
            // Fallback rendering if renderer is not initialized
            logger.warn('[TextureManager] Renderer not initialized, using fallback rendering');
            const tileColor = TILE_COLORS[tileType] || TILE_COLORS[TILE_TYPES.FLOOR] || '#ffcb8d';
            ctx.fillStyle = tileColor;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Static method for configuring canvas
    static configureCanvas(ctx) {
        ctx.imageSmoothingEnabled = false;
    }
}
