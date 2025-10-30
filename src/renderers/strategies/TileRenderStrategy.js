// @ts-check

/**
 * @typedef {Object} ImageCache
 * @property {Record<string, HTMLImageElement>} [key] - Loaded images indexed by name
 */

/**
 * @typedef {Object} BaseRenderer
 * @property {Function} drawWallTile - Draw a wall tile
 * @property {Function} drawFloorTile - Draw a floor tile
 * @property {Function} drawPitTile - Draw a pit/hole tile
 * @property {Function} [drawDoorTile] - Draw a door tile
 * @property {any} [images] - Image cache
 */

/**
 * Base strategy interface for tile rendering.
 * Each concrete strategy encapsulates the rendering logic for a specific tile type.
 */
export class TileRenderStrategy {
    /**
     * @param {ImageCache} images - Image cache
     * @param {number} tileSize - Size of each tile in pixels
     */
    constructor(images, tileSize) {
        /** @type {ImageCache} */
        this.images = images;

        /** @type {number} */
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
     * @param {Array<Array<any>>} grid - Game grid
     * @param {number} zoneLevel - Current zone level
     * @param {BaseRenderer} baseRenderer - Reference to base renderer for helper methods
     * @param {any} tileType - Tile type (may be object or primitive)
     * @returns {void}
     */
    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer, tileType) {
        throw new Error('TileRenderStrategy.render() must be implemented by subclass');
    }
}
