import { TILE_TYPES } from '@core/constants/index.js';
import { MultiTileRenderStrategy } from './MultiTileRenderStrategy.js';
import type { MultiTileHandler } from '@renderers/MultiTileHandler.js';

/**
 * Strategy for rendering DEADTREE tiles (2x2 structure).
 * Uses MultiTileRenderStrategy to eliminate code duplication.
 */
export class DeadTreeRenderStrategy extends MultiTileRenderStrategy {
    constructor(images: Record<string, HTMLImageElement>, tileSize: number, multiTileHandler: typeof MultiTileHandler) {
        super(images, tileSize, multiTileHandler, {
            spriteKey: 'doodads/deadtree',
            width: 2,
            height: 2,
            tileType: TILE_TYPES.DEADTREE,
            positionFinderMethod: 'findDeadTreePosition'
        });
    }
}
