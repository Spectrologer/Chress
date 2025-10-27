import { FOOD_ASSETS } from './constants/index.js';
import { logger } from './logger.js';

/**
 * AssetLoader
 *
 * Responsible for loading and managing game assets.
 * Handles texture loading, food asset filtering, and asset availability checks.
 */
export class AssetLoader {
    constructor(game) {
        this.game = game;
        this.availableFoodAssets = [];
    }

    /**
     * Loads all game assets and filters available food items.
     * @returns {Promise<void>}
     */
    async loadAssets() {
        try {
            await this.game.textureManager.loadAssets();

            // Filter food assets to only those that loaded successfully
            this.availableFoodAssets = FOOD_ASSETS.filter(foodAsset => {
                const foodKey = foodAsset.replace('.png', '').replace('/', '_');
                return this.game.textureManager.isImageLoaded(foodKey);
            });

            // Store on game instance for backward compatibility
            this.game.availableFoodAssets = this.availableFoodAssets;
        } catch (error) {
            logger.error('Error loading assets:', error);
            this.availableFoodAssets = [];
            this.game.availableFoodAssets = [];
        }
    }

    /**
     * Refreshes available food assets (useful after zone generation).
     */
    refreshFoodAssets() {
        this.availableFoodAssets = FOOD_ASSETS.filter(foodAsset => {
            const foodKey = foodAsset.replace('.png', '').replace('/', '_');
            return this.game.textureManager.isImageLoaded(foodKey);
        });
        this.game.availableFoodAssets = this.availableFoodAssets;
    }

    /**
     * Checks if a specific asset is loaded.
     * @param {string} assetKey - The key of the asset to check
     * @returns {boolean}
     */
    isAssetLoaded(assetKey) {
        return this.game.textureManager.isImageLoaded(assetKey);
    }

    /**
     * Gets all available food assets.
     * @returns {string[]}
     */
    getAvailableFoodAssets() {
        return this.availableFoodAssets;
    }
}
