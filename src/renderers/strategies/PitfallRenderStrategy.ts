import { DelegatorRenderStrategy } from './DelegatorRenderStrategy.js';
import type { StructureTileRenderer } from '@renderers/StructureTileRenderer.js';

/**
 * Strategy for rendering PITFALL tiles.
 * Delegates to StructureTileRenderer for backward compatibility.
 */
export class PitfallRenderStrategy extends DelegatorRenderStrategy<StructureTileRenderer> {
    constructor(images: Record<string, HTMLImageElement>, tileSize: number, structureRenderer: StructureTileRenderer) {
        super(images, tileSize, structureRenderer, 'renderPitfallTile');
    }
}
