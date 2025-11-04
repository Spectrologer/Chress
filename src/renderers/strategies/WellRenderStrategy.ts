import { TILE_TYPES } from '@core/constants/index.js';
import { MultiTileRenderStrategy } from './MultiTileRenderStrategy.js';
import type { MultiTileHandler } from '@renderers/MultiTileHandler.js';

/**
 * Strategy for rendering WELL tiles (2x2 structure).
 * Uses MultiTileRenderStrategy to eliminate code duplication.
 */
export class WellRenderStrategy extends MultiTileRenderStrategy {
    constructor(images: Record<string, HTMLImageElement>, tileSize: number, multiTileHandler: typeof MultiTileHandler) {
        super(images, tileSize, multiTileHandler, {
            spriteKey: 'doodads/well',
            width: 2,
            height: 2,
            tileType: TILE_TYPES.WELL,
            positionFinderMethod: 'findWellPosition'
        });
    }
}
