import { TILE_TYPES, TILE_SIZE, TILE_COLORS } from '../../core/constants/index.js';
import { RendererUtils } from '../RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';

export class FoodRenderStrategy extends TileRenderStrategy {
    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
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
            if (foodAsset === 'food/aguamelin.png') {
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
        ctx.fillStyle = color;
        ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

        if (emoji) {
            ctx.fillStyle = '#000000';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }
}
