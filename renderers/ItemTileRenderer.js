import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from '../core/constants.js';
import { RendererUtils } from './RendererUtils.js';

export class ItemTileRenderer {
    constructor(images, tileSize) {
        this.images = images;
        this.tileSize = tileSize;
    }



    renderFoodTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // Use the stored foodType from the grid tile
        const tile = grid[y][x];
        const foodAsset = tile.foodType;

        // Safeguard against undefined foodAsset
        if (!foodAsset) {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.FOOD], '🥖');
            return;
        }
        const foodKey = foodAsset.replace('.png', '').replace('/', '_');

        // First draw the base tile
        if (zoneLevel >= 4 && RendererUtils.isImageLoaded(this.images, 'desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Try to draw the food image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, foodKey)) {
            ctx.drawImage(this.images[foodKey], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.FOOD], '🥖');
        }
    }

    renderAxeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        if (zoneLevel >= 4 && RendererUtils.isImageLoaded(this.images, 'desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Try to draw the axe image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'axe')) {
            ctx.drawImage(this.images.axe, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.ROCK], '🪓');
        }
    }

    renderHammerTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the hammer image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'hammer')) {
            ctx.drawImage(this.images.hammer, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.HAMMER], '🔨');
        }
    }

    renderSpearTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the spear image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'spear')) {
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
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.SPEAR], '🔱', 24);
        }
    }

    renderHorseIconTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the horse image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'horse')) {
            // Scale horse to fit within tile while maintaining aspect ratio
            const horseImage = this.images.horse;
            const aspectRatio = horseImage.width / horseImage.height;

            let scaledWidth, scaledHeight;
            if (aspectRatio > 1) {
                // Image is wider than tall
                scaledWidth = TILE_SIZE * 0.7;
                scaledHeight = (TILE_SIZE * 0.7) / aspectRatio;
            } else {
                // Image is taller than wide (or square)
                scaledHeight = TILE_SIZE * 0.7;
                scaledWidth = (TILE_SIZE * 0.7) * aspectRatio;
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
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.HORSE_ICON], '🐎', 24);
        }
    }

    renderBombTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        const tile = grid[y][x];

        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Get the bomb image
        const bombImage = this.images.bomb;

        console.log('Bomb image loaded:', bombImage && bombImage.complete, 'naturalWidth:', bombImage?.naturalWidth);

        // Check if it's an object bomb (player-placed with animation timer)
        if (tile && typeof tile === 'object' && tile.type === TILE_TYPES.BOMB) {
            if (bombImage && bombImage.complete) {
                ctx.save();
                // Only animate if bomb is not just placed
                if (!tile.justPlaced) {
                    const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1; // Pulsate
                    const cx = pixelX + TILE_SIZE / 2;
                    const cy = pixelY + TILE_SIZE / 2;
                    ctx.translate(cx, cy);
                    ctx.scale(scale, scale);
                    ctx.translate(-TILE_SIZE / 2, -TILE_SIZE / 2);
                }
                ctx.drawImage(bombImage, 0, 0, TILE_SIZE, TILE_SIZE);
                ctx.restore();
            } else {
                this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.BOMB], '💣');
                console.log('Using fallback for object bomb');
            }
        } else if (bombImage && bombImage.complete) {
            // Primitive bomb (randomly generated) - render normally without animation
            ctx.drawImage(bombImage, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.BOMB], '💣');
            console.log('Using fallback for primitive bomb');
        }
    }

    renderHeartTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the heart image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'heart')) {
            // Scale heart to 70% to make it slightly smaller
            const scaledSize = TILE_SIZE * 0.7;
            const offsetX = (TILE_SIZE - scaledSize) / 2;
            const offsetY = (TILE_SIZE - scaledSize) / 2;
            ctx.drawImage(this.images.heart, pixelX + offsetX, pixelY + offsetY, scaledSize, scaledSize);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.HEART], '💖');
        }
    }

    renderNoteTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the note image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'note')) {
            // Scale note to fit within tile while maintaining aspect ratio, 70% size
            const noteImage = this.images.note;
            const aspectRatio = noteImage.width / noteImage.height;

            let scaledWidth, scaledHeight;
            if (aspectRatio > 1) {
                // Image is wider than tall
                scaledWidth = TILE_SIZE * 0.7;
                scaledHeight = (TILE_SIZE * 0.7) / aspectRatio;
            } else {
                // Image is taller than wide (or square)
                scaledHeight = TILE_SIZE * 0.7;
                scaledWidth = (TILE_SIZE * 0.7) * aspectRatio;
            }

            // Center the image in the tile
            const offsetX = (TILE_SIZE - scaledWidth) / 2;
            const offsetY = (TILE_SIZE - scaledHeight) / 2;

            ctx.drawImage(
                noteImage,
                pixelX + offsetX,
                pixelY + offsetY,
                scaledWidth,
                scaledHeight
            );
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.NOTE], '📄', 24);
        }
    }

    renderSignTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the sign image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'sign')) {
            ctx.drawImage(this.images.sign, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.SIGN], 'S', 24);
        }
    }

    renderBookTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the book image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'book')) {
            // Scale book to fit within tile while maintaining aspect ratio, 70% size
            const bookImage = this.images.book;
            const aspectRatio = bookImage.width / bookImage.height;

            let scaledWidth, scaledHeight;
            if (aspectRatio > 1) {
                // Image is wider than tall
                scaledWidth = TILE_SIZE * 0.7;
                scaledHeight = (TILE_SIZE * 0.7) / aspectRatio;
            } else {
                // Image is taller than wide (or square)
                scaledHeight = TILE_SIZE * 0.7;
                scaledWidth = (TILE_SIZE * 0.7) * aspectRatio;
            }

            // Center the image in the tile
            const offsetX = (TILE_SIZE - scaledWidth) / 2;
            const offsetY = (TILE_SIZE - scaledHeight) / 2;

            ctx.drawImage(
                bookImage,
                pixelX + offsetX,
                pixelY + offsetY,
                scaledWidth,
                scaledHeight
            );
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.BOOK_OF_TIME_TRAVEL], '📖');
        }
    }

    renderBowTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Rotate counter clockwise, maintain proportions, scale to fit tile, pixel perfect
        ctx.save();
        ctx.translate(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        ctx.rotate(-Math.PI / 2);
        const bowImage = this.images.bow;
        const maxDim = Math.max(bowImage.width, bowImage.height);
        const scale = TILE_SIZE / maxDim;
        const scaledWidth = bowImage.width * scale;
        const scaledHeight = bowImage.height * scale;
        ctx.drawImage(
            bowImage,
            -scaledWidth / 2,
            -scaledHeight / 2,
            scaledWidth,
            scaledHeight
        );
        ctx.restore();
    }

    renderFallback(ctx, pixelX, pixelY, color, emoji, fontSize = 32) {
        // Fallback to colored square with emoji
        ctx.fillStyle = color;
        const padding = (fontSize === 32) ? 8 : 2;
        ctx.fillRect(pixelX + padding, pixelY + padding, TILE_SIZE - padding * 2, TILE_SIZE - padding * 2);

        if (emoji) {
            ctx.fillStyle = '#000000'; // Fallback text color
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }
}
