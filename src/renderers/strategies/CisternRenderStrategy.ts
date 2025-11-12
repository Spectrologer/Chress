import { DelegatorRenderStrategy } from './DelegatorRenderStrategy.js';
import type { StructureTileRenderer } from '@renderers/StructureTileRenderer.js';

/**
 * Strategy for rendering Grate tiles.
 * Delegates to StructureTileRenderer for backward compatibility.
 */
export class GrateRenderStrategy extends DelegatorRenderStrategy<StructureTileRenderer> {
    constructor(images: Record<string, HTMLImageElement>, tileSize: number, structureRenderer: StructureTileRenderer) {
        super(images, tileSize, structureRenderer, 'renderGrateTile');
    }
}
