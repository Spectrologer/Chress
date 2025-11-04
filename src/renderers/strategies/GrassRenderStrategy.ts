import { DelegatorRenderStrategy } from './DelegatorRenderStrategy.js';
import type { WallTileRenderer } from '@renderers/WallTileRenderer.js';

/**
 * Strategy for rendering GRASS and SHRUBBERY tiles.
 * Delegates to WallTileRenderer for backward compatibility.
 */
export class GrassRenderStrategy extends DelegatorRenderStrategy<WallTileRenderer> {
    constructor(images: Record<string, HTMLImageElement>, tileSize: number, wallRenderer: WallTileRenderer) {
        super(images, tileSize, wallRenderer, 'renderGrassTile');
    }
}
