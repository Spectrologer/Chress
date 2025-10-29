/**
 * Base strategy interface for tile rendering.
 * Each concrete strategy encapsulates the rendering logic for a specific tile type.
 */
export class TileRenderStrategy {
    /**
     * @param {Object} images - Image cache
     * @param {number} tileSize - Size of each tile in pixels
     */
    constructor(images, tileSize) {
        this.images = images;
        this.tileSize = tileSize;
    }

    /**
     * Render the tile at the specified position.
     *
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Grid x coordinate
     * @param {number} y - Grid y coordinate
     * @param {number} pixelX - Pixel x coordinate
     * @param {number} pixelY - Pixel y coordinate
     * @param {Array} grid - Game grid
     * @param {number} zoneLevel - Current zone level
     * @param {Object} baseRenderer - Reference to base renderer for helper methods
     * @param {*} tileType - Tile type (may be object or primitive)
     */
    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer, tileType) {
        throw new Error('TileRenderStrategy.render() must be implemented by subclass');
    }
}
