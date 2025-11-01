import { TileRenderStrategy } from './TileRenderStrategy.js';
import { TILE_SIZE, TILE_TYPES } from '../../core/constants/index.js';

export class FloorRenderStrategy extends TileRenderStrategy {
    render(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer, tileType, terrainTextures, rotations) {
        // First check if there's a custom terrain texture for this floor tile
        const coord = `${x},${y}`;
        const customTexture = terrainTextures && terrainTextures[coord];

        if (customTexture) {
            // Use renderFloorTile which handles custom textures properly
            baseRenderer.renderFloorTile(ctx, pixelX, pixelY, TILE_TYPES.FLOOR, terrainTextures, rotations, x, y);
            // Apply checker shading on top
            baseRenderer.applyCheckerShading(ctx, x, y, pixelX, pixelY, zoneLevel);
        } else {
            // Fall back to default directional textures based on zone level
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }
    }
}
