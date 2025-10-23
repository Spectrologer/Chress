import { IMAGE_ASSETS, FOOD_ASSETS, TOTAL_IMAGES } from '../core/constants.js';
import { logger } from '../core/logger.js';

export class TextureLoader {
    constructor() {
        this.images = {};
        this.imagesLoaded = 0;
        this.totalImages = TOTAL_IMAGES;
        this.onAllImagesLoaded = null;
    }

    async loadAssets() {
        return new Promise((resolve) => {
            this.onAllImagesLoaded = resolve;

            // Load regular assets
            IMAGE_ASSETS.forEach(assetName => {
                let imageKey;
                if (assetName === 'floors/frontier/desert.png') {
                    imageKey = 'desert';
                } else if (assetName === 'floors/interior/housetile.png') {
                    imageKey = 'housetile';
                } else if (assetName === 'floors/interior/house_wall_corner.png') {
                    imageKey = 'house_wall_corner';
                } else if (assetName === 'floors/interior/house_wall_open.png') {
                    imageKey = 'house_wall_open';
                } else if (assetName === 'floors/interior/house_wall_side.png') {
                    imageKey = 'house_wall_side';
                } else if (assetName === 'flora/succulent.png') {
                    imageKey = 'succulent';
                } else if (assetName === 'flora/stump.png') {
                    imageKey = 'stump';
                } else if (assetName === 'flora/blocklily.png') {
                    imageKey = 'blocklily';
                } else if (assetName === 'flora/boulder.png') {
                    imageKey = 'boulder';
                } else if (assetName.startsWith('floors/dirt/')) {
                    imageKey = assetName.replace('floors/dirt/', '').replace('.png', '');
                } else if (assetName.startsWith('items/')) {
                    imageKey = assetName.replace('items/', '').replace('.png', '');
                } else if (assetName.startsWith('fauna/')) {
                    imageKey = assetName.replace('fauna/', '').replace('.png', '');
                } else if (assetName.startsWith('protag/')) {
                    imageKey = assetName.replace('protag/', '').replace('.png', '');
                } else if (assetName.startsWith('fx/smoke/')) {
                    imageKey = assetName.replace('fx/smoke/', '').replace('.png', '');
                } else if (assetName === 'doodads/cistern.png') {
                    imageKey = 'doodads/cistern';
                } else if (assetName === 'doodads/shack.png') {
                    imageKey = 'doodads/shack';
                } else if (assetName === 'doodads/table.png') {
                    imageKey = 'doodads/table';
                } else if (assetName === 'doodads/hole.png') {
                    imageKey = 'hole';
                } else if (assetName === 'doodads/pitfall.png') {
                    imageKey = 'pitfall';
                } else if (assetName === 'doodads/stairdown.png') {
                    // Register stair doodads under the simple key the renderer expects
                    imageKey = 'stairdown';
                } else if (assetName === 'doodads/stairup.png') {
                    // stairup doodad
                    imageKey = 'stairup';
                } else {
                    imageKey = assetName.replace('.png', '');
                }
                this.loadImage(imageKey, assetName);
            });

            // Load food assets
            FOOD_ASSETS.forEach(assetName => {
                const imageKey = assetName.replace('.png', '').replace('/', '_');
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

    loadImage(key, filename) {
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
                    // Targeted matte removal for known assets that use a solid background
                    const keysWithMatte = new Set(['doodads/club', 'spear', 'shovel', 'axe', 'hammer', 'bow']);
            if (keysWithMatte.has(key)) {
                try {
                    const img = this.images[key];
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const cx = canvas.getContext('2d');
                    cx.drawImage(img, 0, 0);

                    // Try to read pixel data; may throw for cross-origin images
                    const imgData = cx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imgData.data;

                    // If image already has alpha anywhere, skip
                    let hasAlpha = false;
                    for (let i = 3; i < data.length; i += 4) {
                        if (data[i] < 255) { hasAlpha = true; break; }
                    }

                    if (!hasAlpha && canvas.width > 0 && canvas.height > 0) {
                        const r = data[0];
                        const g = data[1];
                        const b = data[2];
                        const tolerance = 12; // slightly higher tolerance for compressed assets

                        for (let i = 0; i < data.length; i += 4) {
                            const dr = Math.abs(data[i] - r);
                            const dg = Math.abs(data[i + 1] - g);
                            const db = Math.abs(data[i + 2] - b);
                            if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
                                data[i + 3] = 0;
                            }
                        }
                        cx.putImageData(imgData, 0, 0);
                        this.images[key] = canvas;
                    }
                } catch (e) {
                    // Cross-origin or other error — leave original image untouched
                    // console.warn('[TextureLoader] targeted matte removal failed for', key, e);
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

    getImage(key) {
        return this.images[key];
    }

    isImageLoaded(key) {
        const image = this.images[key];
        return image && image.complete && image.naturalWidth > 0;
    }

    getImages() {
        return this.images;
    }
}
