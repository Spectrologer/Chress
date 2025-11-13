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
     * Also initializes audio system for Strudel music.
     */
    async loadAssets(): Promise<void> {
        try {
            // Load textures and initialize audio in parallel
            await Promise.all([
                this.game.textureManager!.loadAssets(),
                this.initializeAudio()
            ]);

            // Filter food assets to only those that loaded successfully
            this.availableFoodAssets = FOOD_ASSETS.filter(foodAsset => {
                // Extract just the filename for the image key (e.g., 'items/consumables/meat.png' -> 'meat')
                const foodKey = foodAsset.split('/').pop()!.replace('.png', '');
                return this.game.textureManager!.isImageLoaded(foodKey);
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
     * Initializes the audio system for Strudel music.
     * GM soundfont instruments will be lazy-loaded as needed during gameplay.
     */
    private async initializeAudio(): Promise<void> {
        try {
            const soundManager = this.game.soundManager;
            if (!soundManager) {
                logger.warn('[AssetLoader] SoundManager not available for audio initialization');
                return;
            }

            // Access the MusicController's StrudelMusicManager
            const musicController = (soundManager as any).musicController;
            if (!musicController) {
                logger.warn('[AssetLoader] MusicController not available for audio initialization');
                return;
            }

            const strudelManager = musicController.strudelManager;
            if (!strudelManager) {
                logger.warn('[AssetLoader] StrudelMusicManager not available for audio initialization');
                return;
            }

            // Initialize audio system (GM instruments will lazy-load on first use)
            logger.info('[AssetLoader] Initializing audio system...');
            await strudelManager.initializeAudio();
            logger.info('[AssetLoader] Audio system initialized successfully');
        } catch (error) {
            logger.warn('[AssetLoader] Failed to initialize audio system:', error);
            // Non-fatal error - game can continue without audio
        }
    }

    /**
     * Refreshes available food assets (useful after zone generation).
     */
    refreshFoodAssets(): void {
        this.availableFoodAssets = FOOD_ASSETS.filter(foodAsset => {
            // Extract just the filename for the image key (e.g., 'items/consumables/meat.png' -> 'meat')
            const foodKey = foodAsset.split('/').pop()!.replace('.png', '');
            return this.game.textureManager!.isImageLoaded(foodKey);
        });
        (this.game as any).availableFoodAssets = this.availableFoodAssets;
    }

    /**
     * Checks if a specific asset is loaded.
     */
    isAssetLoaded(assetKey: string): boolean {
        return this.game.textureManager!.isImageLoaded(assetKey);
    }

    /**
     * Gets all available food assets.
     */
    getAvailableFoodAssets(): string[] {
        return this.availableFoodAssets;
    }
}
