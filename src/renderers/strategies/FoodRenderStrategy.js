import { TILE_TYPES, TILE_SIZE, TILE_COLORS, STROKE_CONSTANTS } from '../../core/constants/index.js';
import { RendererUtils } from '../RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';

export class FoodRenderStrategy extends TileRenderStrategy {
    render(ctx, x, y, pixelX, pixelY, gridManager, zoneLevel, baseRenderer) {
        // Use the stored foodType from the grid tile
        const tile = gridManager.getTile ? gridManager.getTile(x, y) : gridManager[y]?.[x];
        const foodAsset = tile.foodType;

        // Safeguard against undefined foodAsset
        if (!foodAsset) {
            this.renderFallback(ctx, pixelX, pixelY, TILE_COLORS[TILE_TYPES.FOOD], '🥖');
            return;
        }
        // Extract just the filename for the image key (e.g., 'items/consumables/beaf.png' -> 'beaf')
        const foodKey = foodAsset.split('/').pop().replace('.png', '');

        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, gridManager, zoneLevel);

        // Try to draw the food image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, foodKey)) {
            if (foodAsset === 'items/consumables/aguamelin.png') {
                // Draw aguamelin pixel-perfect, no scaling, aligned to tile
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

    renderFallback(ctx, pixelX, pixelY, color, emoji) {
        const padding = STROKE_CONSTANTS.FALLBACK_TILE_PADDING;
        ctx.fillStyle = color;
        ctx.fillRect(pixelX + padding, pixelY + padding, TILE_SIZE - padding * 2, TILE_SIZE - padding * 2);

        if (emoji) {
            ctx.fillStyle = '#000000';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }
}
