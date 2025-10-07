import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from './constants.js';

export class StructureTileRenderer {
    constructor(images, multiTileHandler, tileSize) {
        this.images = images;
        this.multiTileHandler = multiTileHandler;
        this.tileSize = tileSize;
    }

    isImageLoaded(key) {
        const image = this.images[key];
        return image && image.complete && image.naturalWidth > 0;
    }

    renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the house part
        if (this.isImageLoaded('doodads/house')) {
            // For a 3x3 house, we need to determine which part of the house image to draw
            // Find the house area bounds to determine the position within the house
            const houseInfo = this.multiTileHandler.findHousePosition(x, y, grid);

            if (houseInfo) {
                // Calculate which part of the house image to use
                const partX = x - houseInfo.startX;
                const partY = y - houseInfo.startY;

                // Draw the corresponding part of the house image
                // Divide the house image into 3x3 parts
                const houseImage = this.images['doodads/house'];
                const partWidth = houseImage.width / 3;
                const partHeight = houseImage.height / 3;

                ctx.drawImage(
                    houseImage,
                    partX * partWidth, partY * partHeight, // Source position
                    partWidth, partHeight, // Source size
                    pixelX, pixelY, // Destination position
                    TILE_SIZE, TILE_SIZE // Destination size
                );
            }
        } else {
            // Fallback color rendering
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.HOUSE];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderWellTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the well part
        if (this.isImageLoaded('doodads/well')) {
            // For a 2x2 well, we need to determine which part of the well image to draw
            // Find the well area bounds to determine the position within the well
            const wellInfo = this.multiTileHandler.findWellPosition(x, y, grid);

            if (wellInfo) {
                // Calculate which part of the well image to use
                const partX = x - wellInfo.startX;
                const partY = y - wellInfo.startY;

                // Draw the corresponding part of the well image
                // Divide the well image into 2x2 parts
                const wellImage = this.images['doodads/well'];
                const partWidth = wellImage.width / 2;
                const partHeight = wellImage.height / 2;

                ctx.drawImage(
                    wellImage,
                    partX * partWidth, partY * partHeight, // Source position
                    partWidth, partHeight, // Source size
                    pixelX, pixelY, // Destination position
                    TILE_SIZE, TILE_SIZE // Destination size
                );
            }
        } else {
            // Fallback color rendering
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.WELL];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderDeadTreeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the dead tree part
        if (this.isImageLoaded('doodads/deadtree')) {
            // For a 2x2 dead tree, we need to determine which part of the dead tree image to draw
            // Find the dead tree area bounds to determine the position within the dead tree
            const deadtreeInfo = this.multiTileHandler.findDeadTreePosition(x, y, grid);

            if (deadtreeInfo) {
                // Calculate which part of the dead tree image to use
                const partX = x - deadtreeInfo.startX;
                const partY = y - deadtreeInfo.startY;

                // Draw the corresponding part of the dead tree image
                // Divide the dead tree image into 2x2 parts
                const deadtreeImage = this.images['doodads/deadtree'];
                const partWidth = deadtreeImage.width / 2;
                const partHeight = deadtreeImage.height / 2;

                ctx.drawImage(
                    deadtreeImage,
                    partX * partWidth, partY * partHeight, // Source position
                    partWidth, partHeight, // Source size
                    pixelX, pixelY, // Destination position
                    TILE_SIZE, TILE_SIZE // Destination size
                );
            }
        } else {
            // Fallback color rendering
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.DEADTREE];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderEnemyTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // Use the stored enemyType from the grid tile
        const tile = grid[y][x];
        let enemyKey = 'fauna/lizardy';

        // First draw the base tile
        if (zoneLevel >= 4 && this.isImageLoaded('desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Try to draw the enemy image if loaded, otherwise use fallback
        if (this.isImageLoaded(enemyKey)) {
            ctx.drawImage(this.images[enemyKey], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.ENEMY];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FF1493';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🦎', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderLionTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the lion image if loaded, otherwise use fallback
        if (this.isImageLoaded('lion')) {
            ctx.drawImage(this.images.lion, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.LION];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFD700';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🦁', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderSquigTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the squig image if loaded, otherwise use fallback
        if (this.isImageLoaded('fauna/squig')) {
            ctx.drawImage(this.images['fauna/squig'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.SQUIG];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐸', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }
}
