import { DelegatorRenderStrategy } from './DelegatorRenderStrategy.js';
import type { WallTileRenderer } from '@renderers/WallTileRenderer.js';

/**
 * Strategy for rendering ROCK tiles.
 * Delegates to WallTileRenderer for backward compatibility.
 */
export class RockRenderStrategy extends DelegatorRenderStrategy<WallTileRenderer> {
    constructor(images: Record<string, HTMLImageElement>, tileSize: number, wallRenderer: WallTileRenderer) {
        super(images, tileSize, wallRenderer, 'renderRockTile');
    }
}
