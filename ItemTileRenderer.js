import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from './constants.js';

export class ItemTileRenderer {
    constructor(images, tileSize) {
        this.images = images;
        this.tileSize = tileSize;
    }

    isImageLoaded(key) {
        const image = this.images[key];
        return image && image.complete && image.naturalWidth > 0;
    }

    renderFoodTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // Use the stored foodType from the grid tile
        const tile = grid[y][x];
        const foodAsset = tile.foodType;
        const foodKey = foodAsset.replace('.png', '').replace('/', '_');

        // First draw the base tile
        if (zoneLevel >= 4 && this.isImageLoaded('desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Try to draw the food image if loaded, otherwise use fallback
        if (this.isImageLoaded(foodKey)) {
            ctx.drawImage(this.images[foodKey], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FOOD];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#8B4513';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🥖', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderAxeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        if (zoneLevel >= 4 && this.isImageLoaded('desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Try to draw the axe image if loaded, otherwise use fallback
        if (this.isImageLoaded('axe')) {
            ctx.drawImage(this.images.axe, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.ROCK]; // Use rock color for axe
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#666666';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🪓', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderHammerTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the hammer image if loaded, otherwise use fallback
        if (this.isImageLoaded('hammer')) {
            ctx.drawImage(this.images.hammer, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.HAMMER];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#666666';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔨', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderSpearTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the spear image if loaded, otherwise use fallback
        if (this.isImageLoaded('spear')) {
            // Scale spear to fit within tile while maintaining aspect ratio
            const spearImage = this.images.spear;
            const aspectRatio = spearImage.width / spearImage.height;

            let scaledWidth, scaledHeight;
            if (aspectRatio > 1) {
                // Image is wider than tall
                scaledWidth = TILE_SIZE;
                scaledHeight = TILE_SIZE / aspectRatio;
            } else {
                // Image is taller than wide (or square)
                scaledHeight = TILE_SIZE;
                scaledWidth = TILE_SIZE * aspectRatio;
            }

            // Center the image in the tile
            const offsetX = (TILE_SIZE - scaledWidth) / 2;
            const offsetY = (TILE_SIZE - scaledHeight) / 2;

            ctx.drawImage(
                spearImage,
                pixelX + offsetX,
                pixelY + offsetY,
                scaledWidth,
                scaledHeight
            );
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.SPEAR];
            ctx.fillRect(pixelX + 2, pixelY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            ctx.fillStyle = '#666666';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔱', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderHorseIconTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the horse image if loaded, otherwise use fallback
        if (this.isImageLoaded('horse')) {
            // Scale horse to fit within tile while maintaining aspect ratio
            const horseImage = this.images.horse;
            const aspectRatio = horseImage.width / horseImage.height;

            let scaledWidth, scaledHeight;
            if (aspectRatio > 1) {
                // Image is wider than tall
                scaledWidth = TILE_SIZE;
                scaledHeight = TILE_SIZE / aspectRatio;
            } else {
                // Image is taller than wide (or square)
                scaledHeight = TILE_SIZE;
                scaledWidth = TILE_SIZE * aspectRatio;
            }

            // Center the image in the tile
            const offsetX = (TILE_SIZE - scaledWidth) / 2;
            const offsetY = (TILE_SIZE - scaledHeight) / 2;

            ctx.drawImage(
                horseImage,
                pixelX + offsetX,
                pixelY + offsetY,
                scaledWidth,
                scaledHeight
            );
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.HORSE_ICON];
            ctx.fillRect(pixelX + 2, pixelY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            ctx.fillStyle = '#8B4513';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐎', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderBombTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the bomb image if loaded, otherwise use fallback
        if (this.isImageLoaded('bomb')) {
            ctx.drawImage(this.images.bomb, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.BOMB];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#333333';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderHeartTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the heart image if loaded, otherwise use fallback
        if (this.isImageLoaded('heart')) {
            ctx.drawImage(this.images.heart, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.HEART];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FF0000';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💖', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderNoteTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the note image if loaded, otherwise use fallback
        if (this.isImageLoaded('note')) {
            ctx.drawImage(this.images.note, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.NOTE];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFE4C4'; // Cream color for note
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📄', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderSignTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the sign image if loaded, otherwise use fallback
        if (this.isImageLoaded('sign')) {
            ctx.drawImage(this.images.sign, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.SIGN];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('S', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }
}
