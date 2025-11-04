import { TILE_TYPES } from '@core/constants/index.js';
import { MultiTileRenderStrategy } from './MultiTileRenderStrategy.js';
import type { MultiTileHandler } from '@renderers/MultiTileHandler.js';

/**
 * Strategy for rendering HOUSE tiles (4x3 structure).
 * Uses MultiTileRenderStrategy to eliminate code duplication.
 */
export class HouseRenderStrategy extends MultiTileRenderStrategy {
    constructor(images: Record<string, HTMLImageElement>, tileSize: number, multiTileHandler: typeof MultiTileHandler) {
        super(images, tileSize, multiTileHandler, {
            spriteKey: 'doodads/club',
            width: 4,
            height: 3,
            tileType: TILE_TYPES.HOUSE,
            positionFinderMethod: 'findHousePosition',
            fallbackChar: 'H'
        });
    }
}
