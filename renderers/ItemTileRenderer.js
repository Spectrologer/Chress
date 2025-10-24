import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from '../core/constants.js';
import { RendererUtils } from './RendererUtils.js';
import { logger } from '../core/logger.js';

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
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the food image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, foodKey)) {
            if (foodAsset === 'food/aquamelon.png') {
                // Draw aquamelon pixel-perfect, no scaling, aligned to tile
                ctx.drawImage(this.images[foodKey], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                // Scale other food to 70%
                const scaledSize = TILE_SIZE * 0.7;
                const offsetX = (TILE_SIZE - scaledSize) / 2;
                const offsetY = (TILE_SIZE - scaledSize) / 2;
                ctx.drawImage(this.images[foodKey], pixelX + offsetX, pixelY + offsetY, scaledSize, scaledSize);
            }
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.FOOD], '🥖');
        }
    }

    renderAxeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the axe image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'axe')) {
            ctx.drawImage(this.images.axe, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.ROCK], '🪓');
        }
    }

    renderHammerTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the hammer image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'hammer')) {
            ctx.drawImage(this.images.hammer, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.HAMMER], '🔨');
        }
    }

    renderSpearTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the spear image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'spear')) {
            // Scale spear to fit within tile while maintaining aspect ratio
            const spearImage = this.images.spear;
            const { width: scaledWidth, height: scaledHeight } = RendererUtils.calculateScaledDimensions(spearImage, TILE_SIZE);

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
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the horse image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'horse')) {
            // Scale horse to fit within tile while maintaining aspect ratio
            const horseImage = this.images.horse;
            const { width: scaledWidth, height: scaledHeight } = RendererUtils.calculateScaledDimensions(horseImage, TILE_SIZE * 0.7);

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
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Get the bomb image
        const bombImage = this.images.bomb;

    logger.debug('Bomb image loaded:', bombImage && bombImage.complete, 'naturalWidth:', bombImage?.naturalWidth);

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
                logger.debug('Using fallback for object bomb');
            }
        } else if (bombImage && bombImage.complete) {
            // Primitive bomb (randomly generated) - render normally without animation
            ctx.drawImage(bombImage, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.BOMB], '💣');
            logger.debug('Using fallback for primitive bomb');
        }
    }

    renderHeartTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the heart image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'heart')) {
            // Scale heart to ~65% to be visually smaller on ground and draw crisply
            const scaledSize = Math.round(TILE_SIZE * 0.65);
            const offsetX = Math.round((TILE_SIZE - scaledSize) / 2);
            const offsetY = Math.round((TILE_SIZE - scaledSize) / 2);
            // Disable smoothing for a pixel-crisp draw, but restore context state afterwards
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            // Align to integer pixels for crisper blitting
            const drawX = Math.round(pixelX + offsetX);
            const drawY = Math.round(pixelY + offsetY);
            ctx.drawImage(this.images.heart, drawX, drawY, scaledSize, scaledSize);
            ctx.restore();
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.HEART], '💖');
        }
    }

    renderNoteTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the note image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'note')) {
            // Scale note to fit within tile while maintaining aspect ratio, 70% size
            const noteImage = this.images.note;
            const { width: scaledWidth, height: scaledHeight } = RendererUtils.calculateScaledDimensions(noteImage, TILE_SIZE * 0.7);

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
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the sign image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'sign')) {
            ctx.drawImage(this.images.sign, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.SIGN], 'S', 24);
        }
    }

    renderBookTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the book image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'book')) {
            // Scale book to fit within tile while maintaining aspect ratio, 70% size
            const bookImage = this.images.book;
            const { width: scaledWidth, height: scaledHeight } = RendererUtils.calculateScaledDimensions(bookImage, TILE_SIZE * 0.7);

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
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

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

    renderShovelTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the shovel image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'shovel')) {
            // Scale shovel to fit within tile while maintaining aspect ratio
            const shovelImage = this.images.shovel;
            ctx.drawImage(shovelImage, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.SHOVEL], '⛏️');
        }
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
