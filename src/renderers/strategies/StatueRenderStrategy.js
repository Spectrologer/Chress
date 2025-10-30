import { TILE_TYPES, TILE_SIZE, TILE_COLORS } from '../../core/constants/index.js';
import { RendererUtils } from '../RendererUtils.js';
import { renderOverlay } from '../BaseRendererHelpers.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';

export class StatueRenderStrategy extends TileRenderStrategy {
    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer, tileType) {
        // First draw the base tile - statues need special handling for zones
        if (zoneLevel === 5 && RendererUtils.isImageLoaded(baseRenderer.images, 'housetile')) {
            ctx.drawImage(baseRenderer.images.housetile, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (zoneLevel >= 4 && zoneLevel !== 6 && RendererUtils.isImageLoaded(baseRenderer.images, 'desert')) {
            ctx.drawImage(baseRenderer.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Draw a pedestal
        ctx.fillStyle = '#a0a0a0'; // Light grey for pedestal
        ctx.fillRect(pixelX + 8, pixelY + TILE_SIZE - 16, TILE_SIZE - 16, 12);
        ctx.fillStyle = '#808080'; // Darker grey for shadow
        ctx.fillRect(pixelX + 8, pixelY + TILE_SIZE - 8, TILE_SIZE - 16, 4);

        const enemySpriteMap = {
            [TILE_TYPES.LIZARDY_STATUE]: 'lizardy',
            [TILE_TYPES.LIZARDO_STATUE]: 'lizardo',
            [TILE_TYPES.LIZARDEAUX_STATUE]: 'lizardeaux',
            [TILE_TYPES.LIZORD_STATUE]: 'lizord',
            [TILE_TYPES.ZARD_STATUE]: 'zard',
            [TILE_TYPES.LAZERD_STATUE]: 'lazerd',
        };

        const itemSpriteMap = {
            [TILE_TYPES.BOMB_STATUE]: 'bomb',
            [TILE_TYPES.SPEAR_STATUE]: 'spear',
            [TILE_TYPES.BOW_STATUE]: 'bow',
            [TILE_TYPES.HORSE_STATUE]: 'horse',
            [TILE_TYPES.BOOK_STATUE]: 'book',
            [TILE_TYPES.SHOVEL_STATUE]: 'shovel'
        };

        // Prefer enemy sprite mapping, otherwise check item statue mapping
        const spriteKey = enemySpriteMap[tileType] || itemSpriteMap[tileType];
        if (spriteKey) {
            const isItemStatue = itemSpriteMap[tileType] !== undefined;
            if (isItemStatue) {
                // Scale item-statues to fit the pedestal and apply grayscale+brightness filter
                // Special case: bow statue needs the bow portion rotated slightly counter-clockwise
                const statueOptions = { scaleToFit: true, scaleMaxSize: TILE_SIZE - 16, filter: 'grayscale(100%) brightness(0.8)' };
                if (tileType === TILE_TYPES.BOW_STATUE) {
                    // Rotate the bow statue 90 degrees counter-clockwise
                    statueOptions.rotate = -Math.PI / 2; // -90 degrees
                }
                renderOverlay(ctx, this.images, spriteKey, pixelX, pixelY, TILE_SIZE, TILE_COLORS[tileType] || '#888888', '?', { font: '20px Arial', fillStyle: '#FFFFFF' }, statueOptions);
            } else {
                // Enemy statues use full-tile draw with a vertical offset and should be rendered as stone (grayscale)
                renderOverlay(ctx, this.images, spriteKey, pixelX, pixelY - 10, TILE_SIZE, TILE_COLORS[tileType] || '#888888', '?', { font: '20px Arial', fillStyle: '#FFFFFF' }, { fullTile: true, filter: 'grayscale(100%) brightness(0.85)' });
            }
        } else {
            RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_COLORS[tileType] || '#888888', '?');
        }
    }
}
