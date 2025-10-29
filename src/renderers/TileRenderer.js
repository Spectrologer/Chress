import { BaseTileRenderer } from './BaseTileRenderer.js';
import { RendererUtils } from './RendererUtils.js';

export class TileRenderer extends BaseTileRenderer {
    constructor(images, textureDetectorClass, multiTileHandlerClass, tileSize) {
        super(images, textureDetectorClass, multiTileHandlerClass, tileSize);
    }

    static configureCanvas(ctx) {
        RendererUtils.configureCanvas(ctx);
    }
}
