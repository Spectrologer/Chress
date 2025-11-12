import { TileRenderStrategy } from './TileRenderStrategy.js';
import type { BaseRenderer } from '@renderers/types.js';

/**
 * Base class for render strategies that simply delegate to another renderer's method.
 * Eliminates code duplication for simple wrapper strategies.
 *
 * Example usage:
 * ```ts
 * export class GrateRenderStrategy extends DelegatorRenderStrategy<StructureTileRenderer> {
 *     constructor(images: ImageCache, tileSize: number, structureRenderer: StructureTileRenderer) {
 *         super(images, tileSize, structureRenderer, 'renderGrateTile');
 *     }
 * }
 * ```
 */
export class DelegatorRenderStrategy<T = any> extends TileRenderStrategy {
    protected delegate: T;
    protected methodName: keyof T;

    constructor(
        images: Record<string, HTMLImageElement>,
        tileSize: number,
        delegate: T,
        methodName: keyof T
    ) {
        super(images, tileSize);
        this.delegate = delegate;
        this.methodName = methodName;
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: any[][] | any,
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        const method = this.delegate[this.methodName];
        if (typeof method === 'function') {
            (method as any).call(this.delegate, ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
        } else {
            throw new Error(`Method ${String(this.methodName)} not found on delegate`);
        }
    }
}
