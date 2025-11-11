import { TILE_TYPES, TILE_COLORS } from '@core/constants/index.js';
import { MultiTileRenderStrategy } from './MultiTileRenderStrategy.js';
import type { MultiTileHandler } from '@renderers/MultiTileHandler.js';

/**
 * Strategy for rendering SHACK tiles (3x3 structure).
 * Uses MultiTileRenderStrategy to eliminate code duplication.
 */
export class ShackRenderStrategy extends MultiTileRenderStrategy {
    constructor(images: Record<string, HTMLImageElement>, tileSize: number, multiTileHandler: typeof MultiTileHandler) {
        super(images, tileSize, multiTileHandler, {
            spriteKey: 'doodads/shack',
            width: 3,
            height: 3,
            tileType: TILE_TYPES.SHACK,
            positionFinderMethod: 'findShackPosition',
            fallbackChar: 'S',
            fallbackColor: TILE_COLORS[TILE_TYPES.SHACK] || '#57294b'
        });
    }
}
