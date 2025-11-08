import { IMAGE_ASSETS, FOOD_ASSETS, TOTAL_IMAGES } from '@core/constants/index';
import { logger } from '@core/logger';
import { RendererUtils } from './RendererUtils';
import type { ImageCache } from './types';

export class TextureLoader {
    private images: ImageCache = {};
    private imagesLoaded = 0;
    private totalImages: number = TOTAL_IMAGES;
    private onAllImagesLoaded: (() => void) | null = null;

    async loadAssets(): Promise<void> {
        return new Promise((resolve) => {
            this.onAllImagesLoaded = resolve;

            // Load regular assets
            IMAGE_ASSETS.forEach(assetName => {
                let imageKey: string;
                // Cast to string for comparison to avoid narrowed type issues
                const assetPath = assetName as string;
                // New paths - environment
                if (assetPath === 'environment/floors/desert.png') {
                    imageKey = 'desert';
                } else if (assetPath === 'environment/floors/housetile.png') {
                    imageKey = 'housetile';
                } else if (assetPath === 'environment/floors/house_wall_corner.png') {
                    imageKey = 'house_wall_corner';
                } else if (assetPath === 'environment/floors/house_wall_open.png') {
                    imageKey = 'house_wall_open';
                } else if (assetPath === 'environment/floors/house_wall_side.png') {
                    imageKey = 'house_wall_side';
                } else if (assetPath === 'environment/walls/succulent.png') {
                    imageKey = 'succulent';
                } else if (assetPath === 'environment/walls/stump.png') {
                    imageKey = 'stump';
                } else if (assetPath === 'environment/walls/blocklily.png') {
                    imageKey = 'blocklily';
                } else if (assetPath === 'environment/walls/boulder.png') {
                    imageKey = 'boulder';
                } else if (assetPath.startsWith('environment/floors/')) {
                    imageKey = assetPath.replace('environment/floors/', '').replace('.png', '');
                } else if (assetPath.startsWith('environment/walls/')) {
                    imageKey = assetPath.replace('environment/walls/', '').replace('.png', '');
                } else if (assetPath.startsWith('environment/trim/')) {
                    // Keep the full path for trim textures to match overlay rendering expectations
                    imageKey = assetPath.replace('.png', '');
                } else if (assetPath.startsWith('items/')) {
                    imageKey = assetPath.replace(/items\/(equipment|misc|consumables)\//, '').replace('.png', '');
                } else if (assetPath.startsWith('characters/npcs/')) {
                    imageKey = assetPath.replace('characters/npcs/', '').replace('.png', '');
                } else if (assetPath.startsWith('characters/enemies/')) {
                    imageKey = assetPath.replace('characters/enemies/', '').replace('.png', '');
                } else if (assetPath.startsWith('characters/player/')) {
                    imageKey = assetPath.replace('characters/player/', '').replace('.png', '');
                } else if (assetPath.startsWith('environment/effects/')) {
                    imageKey = assetPath.replace('environment/effects/', '').replace('.png', '');
                } else if (assetPath === 'environment/doodads/cistern.png') {
                    imageKey = 'doodads/cistern';
                } else if (assetPath === 'environment/doodads/shack.png') {
                    imageKey = 'doodads/shack';
                } else if (assetPath === 'environment/doodads/table.png') {
                    imageKey = 'doodads/table';
                } else if (assetPath === 'environment/doodads/hole.png') {
                    imageKey = 'hole';
                } else if (assetPath === 'environment/doodads/pitfall.png') {
                    imageKey = 'pitfall';
                } else if (assetPath === 'environment/doodads/stairdown.png') {
                    // Register stair doodads under the simple key the renderer expects
                    imageKey = 'stairdown';
                } else if (assetPath === 'environment/doodads/stairup.png') {
                    // stairup doodad
                    imageKey = 'stairup';
                } else if (assetPath === 'environment/obstacles/rock.png') {
                    imageKey = 'rock';
                } else if (assetPath === 'environment/doodads/sign.png') {
                    imageKey = 'sign';
                } else if (assetPath === 'environment/obstacles/shrubbery.png') {
                    imageKey = 'shrubbery';
                } else if (assetPath === 'environment/walls/bush.png') {
                    imageKey = 'bush';
                } else if (assetPath === 'environment/doodads/club.png') {
                    imageKey = 'doodads/club';
                } else if (assetPath === 'environment/doodads/cube.png') {
                    imageKey = 'doodads/cube';
                } else if (assetPath === 'items/misc/branch.png') {
                    imageKey = 'branch';
                } else if (assetPath === 'environment/doodads/well.png') {
                    imageKey = 'doodads/well';
                } else if (assetPath === 'environment/doodads/deadtree.png') {
                    imageKey = 'doodads/deadtree';
                } else {
                    imageKey = assetPath.replace('.png', '');
                }
                this.loadImage(imageKey, assetName);
            });

            // Load food assets
            FOOD_ASSETS.forEach(assetName => {
                // Extract just the filename for the image key (e.g., 'items/consumables/meat.png' -> 'meat')
                const imageKey = assetName.split('/').pop()!.replace('.png', '');
                this.loadImage(imageKey, assetName);
            });

            // Fallback timeout in case images take too long (using window.setTimeout since we don't have game instance here)
            setTimeout(() => {
                if (this.imagesLoaded < this.totalImages) {
                    this.imagesLoaded = this.totalImages;
                    resolve();
                }
            }, 2000);
        });
    }

    private loadImage(key: string, filename: string): void {
        this.images[key] = new Image();

        this.images[key].onload = () => {
            if (key === 'doodads/shack') {
                logger.debug('[TextureLoader] Shack image loaded successfully:', filename, `dimensions: ${this.images[key].width}x${this.images[key].height}`);
                // Validate shack image is at least 3x3 sprite sheet
                const img = this.images[key];
                if (img.width < 48 || img.height < 48) {
                    logger.warn('[TextureLoader] Shack image too small for 3x3 sprite sheet, rendering may fail:', `got ${img.width}x${img.height}, need >=48x48`);
                }
            }

            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages && this.onAllImagesLoaded) {
                this.onAllImagesLoaded();
            }
        };

        this.images[key].onerror = (error) => {
            if (key === 'doodads/shack') {
                logger.error('[TextureLoader] Failed to load shack image:', filename, error);
            }
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages && this.onAllImagesLoaded) {
                this.onAllImagesLoaded();
            }
        };

        // Resolve against document.baseURI so assets work correctly on GitHub Pages
        try {
            this.images[key].src = new URL(`assets/${filename}`, document.baseURI).href;
        } catch (e) {
            // Fallback for environments where document or baseURI isn't available
            this.images[key].src = `assets/${filename}`;
        }
    }

    getImage(key: string): HTMLImageElement | undefined {
        return this.images[key];
    }

    isImageLoaded(key: string): boolean {
        return RendererUtils.isImageLoaded(this.images, key);
    }

    getImages(): ImageCache {
        return this.images;
    }
}
