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
                } else if (assetName === 'flora/succulent.png') {
                    imageKey = 'succulent';
                } else if (assetName === 'flora/stump.png') {
                    imageKey = 'stump';
                } else if (assetName === 'flora/blocklily.png') {
                    imageKey = 'blocklily';
                } else if (assetName.startsWith('floors/dirt/')) {
                    imageKey = assetName.replace('floors/dirt/', '').replace('.png', '');
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
                    console.log('Image loading timeout, starting with fallback colors');
                    this.imagesLoaded = this.totalImages;
                    resolve();
                }
            }, 2000);
        });
    }

    loadImage(key, filename) {
        this.images[key] = new Image();

        this.images[key].onload = () => {
            console.log(`${filename} texture loaded successfully`);
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages && this.onAllImagesLoaded) {
                this.onAllImagesLoaded();
            }
        };

        this.images[key].onerror = () => {
            console.log(`Could not load Images/${filename}, using fallback colors`);
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages && this.onAllImagesLoaded) {
                this.onAllImagesLoaded();
            }
        };

        this.images[key].src = `Images/${filename}`;
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
