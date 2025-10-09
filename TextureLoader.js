import { IMAGE_ASSETS, FOOD_ASSETS, TOTAL_IMAGES } from './constants.js';

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

            // Fallback timeout in case images take too long
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
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages && this.onAllImagesLoaded) {
                this.onAllImagesLoaded();
            }
        };

        this.images[key].onerror = () => {
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages && this.onAllImagesLoaded) {
                this.onAllImagesLoaded();
            }
        };

        this.images[key].src = `images/${filename}`;
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
