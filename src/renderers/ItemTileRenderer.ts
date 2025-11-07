import { TILE_COLORS, TILE_TYPES, TILE_SIZE, SCALE_CONSTANTS, PULSATE_CONSTANTS } from '@core/constants/index';
import { RendererUtils } from './RendererUtils';
import { logger } from '@core/logger';
import { isBomb, isTileObject } from '@utils/TypeChecks';
import type { ImageCache, GridManager, BaseRenderer } from './types';

export class ItemTileRenderer {
    private images: ImageCache;
    private tileSize: number;

    constructor(images: ImageCache, tileSize: number) {
        this.images = images;
        this.tileSize = tileSize;
    }

    renderFoodTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        gridManager: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // Use the stored foodType from the grid tile
        const tile = (gridManager as any).getTile ? (gridManager as any).getTile(x, y) : (gridManager as any)[y]?.[x];
        const foodAsset = tile.foodType;

        // Safeguard against undefined foodAsset
        if (!foodAsset) {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.FOOD], '🥖');
            return;
        }
        // Extract just the filename for the image key (e.g., 'items/consumables/meat.png' -> 'meat')
        const foodKey = foodAsset.split('/').pop().replace('.png', '');

        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, gridManager, zoneLevel);

        // Try to draw the food image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, foodKey)) {
            if (foodAsset === 'items/consumables/aguamelin.png') {
                // Draw aguamelin pixel-perfect, no scaling, aligned to tile
                ctx.drawImage(this.images[foodKey], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                // Scale other food
                const scaledSize = TILE_SIZE * SCALE_CONSTANTS.ITEM_RENDER_SCALE;
                const offsetX = (TILE_SIZE - scaledSize) / 2;
                const offsetY = (TILE_SIZE - scaledSize) / 2;
                ctx.drawImage(this.images[foodKey], pixelX + offsetX, pixelY + offsetY, scaledSize, scaledSize);
            }
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.FOOD], '🥖');
        }
    }

    renderAxeTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the axe image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'axe')) {
            ctx.drawImage(this.images.axe, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.ROCK], '🪓');
        }
    }

    renderHammerTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the hammer image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'hammer')) {
            ctx.drawImage(this.images.hammer, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.HAMMER], '🔨');
        }
    }

    renderSpearTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
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
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.BISHOP_SPEAR], '🔱', 24);
        }
    }

    renderHorseIconTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the horse image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'horse')) {
            // Scale horse to fit within tile while maintaining aspect ratio
            const horseImage = this.images.horse;
            const { width: scaledWidth, height: scaledHeight } = RendererUtils.calculateScaledDimensions(horseImage, TILE_SIZE * SCALE_CONSTANTS.ITEM_RENDER_SCALE);

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

    renderBombTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        gridManager: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        const tile = (gridManager as any).getTile ? (gridManager as any).getTile(x, y) : (gridManager as any)[y]?.[x];

        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, gridManager, zoneLevel);

        // Get the bomb image
        const bombImage = this.images.bomb;

        logger.debug('Bomb image loaded:', bombImage && bombImage.complete, 'naturalWidth:', bombImage?.naturalWidth);

        // Check if it's an object bomb (player-placed with animation timer)
        if (isTileObject(tile) && isBomb(tile)) {
            // Active bomb object - render with pulsation
            if (bombImage && bombImage.complete) {
                ctx.save();
                // Only animate if bomb is not just placed
                if (!tile.justPlaced) {
                    const scale = 1 + Math.sin(Date.now() * PULSATE_CONSTANTS.HORSE_PULSATE_FREQUENCY) * PULSATE_CONSTANTS.HORSE_PULSATE_AMPLITUDE;
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
            // Primitive bomb (inactive pickup item) - render normally without animation
            ctx.drawImage(bombImage, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.BOMB], '💣');
            logger.debug('Using fallback for primitive bomb');
        }
    }

    renderHeartTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the heart image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'heart')) {
            // Scale heart to be visually smaller on ground and draw crisply
            const scaledSize = Math.round(TILE_SIZE * SCALE_CONSTANTS.FOOD_RENDER_SCALE);
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

    renderNoteTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the note image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'note')) {
            // Scale note to fit within tile while maintaining aspect ratio, 70% size
            const noteImage = this.images.note;
            const { width: scaledWidth, height: scaledHeight } = RendererUtils.calculateScaledDimensions(noteImage, TILE_SIZE * SCALE_CONSTANTS.ITEM_RENDER_SCALE);

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

    renderSignTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the sign image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'sign')) {
            ctx.drawImage(this.images.sign, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.SIGN], 'S', 24);
        }
    }

    renderBookTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the book image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'book')) {
            // Scale book to fit within tile while maintaining aspect ratio, 70% size
            const bookImage = this.images.book;
            const { width: scaledWidth, height: scaledHeight } = RendererUtils.calculateScaledDimensions(bookImage, TILE_SIZE * SCALE_CONSTANTS.ITEM_RENDER_SCALE);

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

    renderBowTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
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

    renderShovelTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
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

    private renderFallback(
        ctx: CanvasRenderingContext2D,
        pixelX: number,
        pixelY: number,
        color: string,
        emoji: string,
        fontSize = 32
    ): void {
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
