import { IMAGE_ASSETS, FOOD_ASSETS, TOTAL_IMAGES, TILE_COLORS, TILE_TYPES, TILE_SIZE, GRID_SIZE } from '../core/constants.js';
import { TextureLoader } from './TextureLoader.js'; // This seems to be a duplicate import in the original file.
import { TextureDetector } from './TextureDetector.js';
import { TileRenderer } from './TileRenderer.js';
import { MultiTileHandler } from './MultiTileHandler.js';

export class TextureManager {
    constructor() {
        this.loader = new TextureLoader();
        this.renderer = null;
        this.onAllImagesLoaded = null;
    }

    async loadAssets() {
        await this.loader.loadAssets();
        // Initialize TILE_TYPES for TextureDetector
        TextureDetector.TILE_TYPES = TILE_TYPES;
        // Create renderer with dependencies
        this.renderer = new TileRenderer(this.loader.getImages(), TextureDetector, MultiTileHandler, TILE_SIZE);
        // Expose structureRenderer for direct access
        this.structureRenderer = this.renderer.structureRenderer;
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
    renderTile(ctx, x, y, tileType, grid, zoneLevel) {
        if (this.renderer) {
            this.renderer.renderTile(ctx, x, y, tileType, grid, zoneLevel);
        }
    }

    // Static method for configuring canvas
    static configureCanvas(ctx) {
        ctx.imageSmoothingEnabled = false;
    }
}
