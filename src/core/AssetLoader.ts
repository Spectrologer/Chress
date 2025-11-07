import { FOOD_ASSETS } from './constants/index';
import { logger } from './logger';
import type { GameContext } from './context/GameContextCore';

/**
 * AssetLoader
 *
 * Responsible for loading and managing game assets.
 * Handles texture loading, food asset filtering, and asset availability checks.
 */
export class AssetLoader {
    private game: GameContext;
    private availableFoodAssets: string[] = [];

    constructor(game: GameContext) {
        this.game = game;
        this.availableFoodAssets = [];
    }

    /**
     * Loads all game assets and filters available food items.
     */
    async loadAssets(): Promise<void> {
        try {
            await this.game.textureManager.loadAssets();

            // Filter food assets to only those that loaded successfully
            this.availableFoodAssets = FOOD_ASSETS.filter(foodAsset => {
                // Extract just the filename for the image key (e.g., 'items/consumables/meat.png' -> 'meat')
                const foodKey = foodAsset.split('/').pop()!.replace('.png', '');
                return this.game.textureManager.isImageLoaded(foodKey);
            });

            // Store on game instance for backward compatibility
            (this.game as any).availableFoodAssets = this.availableFoodAssets;
        } catch (error) {
            logger.error('Error loading assets:', error);
            this.availableFoodAssets = [];
            (this.game as any).availableFoodAssets = [];
        }
    }

    /**
     * Refreshes available food assets (useful after zone generation).
     */
    refreshFoodAssets(): void {
        this.availableFoodAssets = FOOD_ASSETS.filter(foodAsset => {
            // Extract just the filename for the image key (e.g., 'items/consumables/meat.png' -> 'meat')
            const foodKey = foodAsset.split('/').pop()!.replace('.png', '');
            return this.game.textureManager.isImageLoaded(foodKey);
        });
        (this.game as any).availableFoodAssets = this.availableFoodAssets;
    }

    /**
     * Checks if a specific asset is loaded.
     */
    isAssetLoaded(assetKey: string): boolean {
        return this.game.textureManager.isImageLoaded(assetKey);
    }

    /**
     * Gets all available food assets.
     */
    getAvailableFoodAssets(): string[] {
        return this.availableFoodAssets;
    }
}
