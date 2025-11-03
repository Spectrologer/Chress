import { IMAGE_ASSETS, FOOD_ASSETS, TOTAL_IMAGES } from '../core/constants/index';
import { logger } from '../core/logger';
import type { ImageCache } from './types';

export class TextureLoader {
    private images: ImageCache = {};
    private imagesLoaded: number = 0;
    private totalImages: number = TOTAL_IMAGES;
    private onAllImagesLoaded: (() => void) | null = null;

    async loadAssets(): Promise<void> {
        return new Promise((resolve) => {
            this.onAllImagesLoaded = resolve;

            // Load regular assets
            IMAGE_ASSETS.forEach(assetName => {
                let imageKey: string;
                // New paths - environment
                if (assetName === 'environment/floors/desert.png') {
                    imageKey = 'desert';
                } else if (assetName === 'environment/floors/housetile.png') {
                    imageKey = 'housetile';
                } else if (assetName === 'environment/floors/house_wall_corner.png') {
                    imageKey = 'house_wall_corner';
                } else if (assetName === 'environment/floors/house_wall_open.png') {
                    imageKey = 'house_wall_open';
                } else if (assetName === 'environment/floors/house_wall_side.png') {
                    imageKey = 'house_wall_side';
                } else if (assetName === 'environment/walls/succulent.png') {
                    imageKey = 'succulent';
                } else if (assetName === 'environment/walls/stump.png') {
                    imageKey = 'stump';
                } else if (assetName === 'environment/walls/blocklily.png') {
                    imageKey = 'blocklily';
                } else if (assetName === 'environment/walls/boulder.png') {
                    imageKey = 'boulder';
                } else if (assetName.startsWith('environment/floors/')) {
                    imageKey = assetName.replace('environment/floors/', '').replace('.png', '');
                } else if (assetName.startsWith('environment/walls/')) {
                    imageKey = assetName.replace('environment/walls/', '').replace('.png', '');
                } else if (assetName.startsWith('environment/trim/')) {
                    // Keep the full path for trim textures to match overlay rendering expectations
                    imageKey = assetName.replace('.png', '');
                } else if (assetName.startsWith('items/')) {
                    imageKey = assetName.replace(/items\/(equipment|misc|consumables)\//, '').replace('.png', '');
                } else if (assetName.startsWith('characters/npcs/')) {
                    imageKey = assetName.replace('characters/npcs/', '').replace('.png', '');
                } else if (assetName.startsWith('characters/enemies/')) {
                    imageKey = assetName.replace('characters/enemies/', '').replace('.png', '');
                } else if (assetName.startsWith('characters/player/')) {
                    imageKey = assetName.replace('characters/player/', '').replace('.png', '');
                } else if (assetName.startsWith('environment/effects/')) {
                    imageKey = assetName.replace('environment/effects/', '').replace('.png', '');
                } else if (assetName === 'environment/doodads/cistern.png') {
                    imageKey = 'doodads/cistern';
                } else if (assetName === 'environment/doodads/shack.png') {
                    imageKey = 'doodads/shack';
                } else if (assetName === 'environment/doodads/table.png') {
                    imageKey = 'doodads/table';
                } else if (assetName === 'environment/doodads/hole.png') {
                    imageKey = 'hole';
                } else if (assetName === 'environment/doodads/pitfall.png') {
                    imageKey = 'pitfall';
                } else if (assetName === 'environment/doodads/stairdown.png') {
                    // Register stair doodads under the simple key the renderer expects
                    imageKey = 'stairdown';
                } else if (assetName === 'environment/doodads/stairup.png') {
                    // stairup doodad
                    imageKey = 'stairup';
                } else if (assetName === 'environment/obstacles/rock.png') {
                    imageKey = 'rock';
                } else if (assetName === 'environment/doodads/sign.png') {
                    imageKey = 'sign';
                } else if (assetName === 'environment/obstacles/shrubbery.png') {
                    imageKey = 'shrubbery';
                } else if (assetName === 'environment/walls/bush.png') {
                    imageKey = 'bush';
                } else if (assetName === 'environment/doodads/club.png') {
                    imageKey = 'doodads/club';
                } else if (assetName === 'environment/doodads/well.png') {
                    imageKey = 'doodads/well';
                } else if (assetName === 'environment/doodads/deadtree.png') {
                    imageKey = 'doodads/deadtree';
                } else {
                    imageKey = assetName.replace('.png', '');
                }
                this.loadImage(imageKey, assetName);
            });

            // Load food assets
            FOOD_ASSETS.forEach(assetName => {
                // Extract just the filename for the image key (e.g., 'items/consumables/beaf.png' -> 'beaf')
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
        const image = this.images[key];
        return image && image.complete && image.naturalWidth > 0;
    }

    getImages(): ImageCache {
        return this.images;
    }
}
