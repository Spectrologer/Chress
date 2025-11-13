import { IMAGE_ASSETS, FOOD_ASSETS, TOTAL_IMAGES } from '@core/constants/index';
import { logger } from '@core/logger';
import { RendererUtils } from './RendererUtils';
import type { ImageCache } from './types';

interface AtlasFrame {
    frame: { x: number; y: number; w: number; h: number };
    rotated: boolean;
    trimmed: boolean;
    spriteSourceSize: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
    pivot: { x: number; y: number };
}

interface AtlasData {
    frames: Record<string, AtlasFrame>;
    meta: {
        app: string;
        version: string;
        image: string;
        format: string;
        size: { w: number; h: number };
        scale: number;
    };
}

/**
 * Texture loader that supports loading from texture atlases
 * Provides same interface as TextureLoader for backward compatibility
 */
export class AtlasTextureLoader {
    private images: ImageCache = {};
    private atlasImages: Record<string, HTMLImageElement> = {};
    private atlasData: Record<string, AtlasData> = {};
    private imagesLoaded = 0;
    private totalImages: number = TOTAL_IMAGES;
    private onAllImagesLoaded: (() => void) | null = null;

    // List of atlases to load
    private readonly ATLASES = [
        'enemies',
        'environment',
        'items',
        'npcs',
        'player',
        'ui'
    ];

    async loadAssets(): Promise<void> {
        return new Promise((resolve) => {
            this.onAllImagesLoaded = resolve;

            // Load all atlases first
            this.loadAllAtlases().then(() => {
                // After atlases are loaded, create virtual images for each sprite
                this.createVirtualImages();

                if (this.onAllImagesLoaded) {
                    this.onAllImagesLoaded();
                }
            });

            // Fallback timeout
            setTimeout(() => {
                if (this.imagesLoaded < this.totalImages) {
                    logger.warn(`[AtlasTextureLoader] Timeout reached, loaded ${this.imagesLoaded}/${this.totalImages} images`);
                    this.imagesLoaded = this.totalImages;
                    resolve();
                }
            }, 5000);
        });
    }

    private async loadAllAtlases(): Promise<void> {
        const promises = this.ATLASES.map(atlasName => this.loadAtlas(atlasName));
        await Promise.all(promises);
    }

    private async loadAtlas(atlasName: string): Promise<void> {
        try {
            // Load JSON metadata
            const jsonUrl = new URL(`atlases/${atlasName}.json`, document.baseURI).href;
            const response = await fetch(jsonUrl);
            const data: AtlasData = await response.json();
            this.atlasData[atlasName] = data;

            // Load atlas image (WebP or PNG)
            const imageName = data.meta.image;
            const imageUrl = new URL(`atlases/${imageName}`, document.baseURI).href;
            const img = new Image();

            await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                    this.atlasImages[atlasName] = img;
                    const format = imageName.endsWith('.webp') ? 'WebP' : 'PNG';
                    logger.debug(`[AtlasTextureLoader] Loaded atlas: ${atlasName} (${img.width}x${img.height}, ${format})`);
                    resolve();
                };
                img.onerror = (error) => {
                    logger.error(`[AtlasTextureLoader] Failed to load atlas image: ${atlasName}`, error);
                    reject(error);
                };
                img.src = imageUrl;
            });
        } catch (error) {
            logger.error(`[AtlasTextureLoader] Failed to load atlas: ${atlasName}`, error);
        }
    }

    /**
     * Create virtual image elements by extracting sprites from atlases
     * Also creates key aliases to match TextureLoader's key generation logic
     */
    private createVirtualImages(): void {
        for (const [atlasName, atlas] of Object.entries(this.atlasData)) {
            const atlasImage = this.atlasImages[atlasName];
            if (!atlasImage) continue;

            for (const [spriteName, frameData] of Object.entries(atlas.frames)) {
                // Create a canvas for this sprite
                const canvas = document.createElement('canvas');
                canvas.width = frameData.sourceSize.w;
                canvas.height = frameData.sourceSize.h;

                const ctx = canvas.getContext('2d', { alpha: true });
                if (!ctx) {
                    logger.error(`[AtlasTextureLoader] Failed to get canvas context for sprite: ${spriteName}`);
                    continue;
                }

                // Explicitly clear the canvas to ensure transparency
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw the sprite from the atlas using spriteSourceSize for proper positioning
                // This accounts for trimmed sprites where frame size differs from source size
                ctx.drawImage(
                    atlasImage,
                    frameData.frame.x,
                    frameData.frame.y,
                    frameData.frame.w,
                    frameData.frame.h,
                    frameData.spriteSourceSize.x,
                    frameData.spriteSourceSize.y,
                    frameData.frame.w,
                    frameData.frame.h
                );

                // Convert canvas to image and store it
                // Explicitly specify PNG format to ensure transparency is preserved
                const img = new Image();
                img.src = canvas.toDataURL('image/png');

                // Store with full path as key
                this.images[spriteName] = img;

                // Create aliases to match TextureLoader's key generation logic
                this.createKeyAliases(spriteName, img, atlasName);

                this.imagesLoaded++;
            }
        }

        logger.debug(`[AtlasTextureLoader] Created ${this.imagesLoaded} virtual images from atlases`);
    }

    /**
     * Create key aliases to match TextureLoader's naming conventions
     */
    private createKeyAliases(fullPath: string, img: HTMLImageElement, atlasName: string): void {
        // For sprites from specific atlases, create prefixed aliases
        // UI atlas sprites need 'ui/' prefix
        if (atlasName === 'ui' && !fullPath.includes('/')) {
            this.images[`ui/${fullPath}`] = img;
        }

        // Items atlas sprites need appropriate prefixes
        if (atlasName === 'items' && !fullPath.includes('/')) {
            // Items could be equipment, consumables, or misc
            this.images[`items/${fullPath}`] = img;
        }

        // Match TextureLoader's key generation patterns
        if (fullPath.startsWith('walls/') || fullPath.startsWith('floors/')) {
            // For walls and floors: strip the prefix
            const shortKey = fullPath.split('/').pop()!;
            this.images[shortKey] = img;
        } else if (fullPath.includes('/')) {
            // For paths with subdirectories, create both full and short keys
            const parts = fullPath.split('/');
            const shortKey = parts[parts.length - 1];
            this.images[shortKey] = img;

            // Also try with the immediate parent directory
            if (parts.length > 1) {
                const parentKey = `${parts[parts.length - 2]}/${shortKey}`;
                this.images[parentKey] = img;
            }
        }

        // Special handling for specific paths that TextureLoader handles specially
        if (fullPath.startsWith('trim/')) {
            // Keep the full trim path as TextureLoader does
            const trimKey = `environment/${fullPath}`;
            this.images[trimKey] = img;
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

    /**
     * Get the atlas data for debugging
     */
    getAtlasData(): Record<string, AtlasData> {
        return this.atlasData;
    }

    /**
     * Get loaded atlas count for debugging
     */
    getLoadedAtlasCount(): number {
        return Object.keys(this.atlasImages).length;
    }
}
