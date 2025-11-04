import { DelegatorRenderStrategy } from './DelegatorRenderStrategy.js';
import type { StructureTileRenderer } from '@renderers/StructureTileRenderer.js';

/**
 * Strategy for rendering CISTERN tiles.
 * Delegates to StructureTileRenderer for backward compatibility.
 */
export class CisternRenderStrategy extends DelegatorRenderStrategy<StructureTileRenderer> {
    constructor(images: Record<string, HTMLImageElement>, tileSize: number, structureRenderer: StructureTileRenderer) {
        super(images, tileSize, structureRenderer, 'renderCisternTile');
    }
}
