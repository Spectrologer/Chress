import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from '../core/constants.js';
import { RendererUtils } from './RendererUtils.js';

export class StructureTileRenderer {
    constructor(images, multiTileHandler, tileSize) {
        this.images = images;
        this.multiTileHandler = multiTileHandler;
        this.tileSize = tileSize;
    }



    renderStatueTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer, tileType) {
        // First draw the base tile (housetile for interiors)
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Draw a pedestal
        ctx.fillStyle = '#a0a0a0'; // Light grey for pedestal
        ctx.fillRect(pixelX + 8, pixelY + TILE_SIZE - 16, TILE_SIZE - 16, 12);
        ctx.fillStyle = '#808080'; // Darker grey for shadow
        ctx.fillRect(pixelX + 8, pixelY + TILE_SIZE - 8, TILE_SIZE - 16, 4);

        const enemySpriteMap = {
            [TILE_TYPES.LIZARDY_STATUE]: 'lizardy',
            [TILE_TYPES.LIZARDO_STATUE]: 'lizardo',
            [TILE_TYPES.LIZARDEAUX_STATUE]: 'lizardeaux',
            [TILE_TYPES.LIZORD_STATUE]: 'lizord',
            [TILE_TYPES.ZARD_STATUE]: 'zard',
            [TILE_TYPES.LAZERD_STATUE]: 'lazerd',
        };

        const spriteKey = enemySpriteMap[tileType];
        if (spriteKey && RendererUtils.isImageLoaded(this.images, spriteKey)) {
            const enemyImage = this.images[spriteKey];
            ctx.save();
            ctx.filter = 'grayscale(100%) brightness(0.8)';
            ctx.drawImage(
                enemyImage,
                pixelX,
                pixelY - 10, // Draw slightly higher on the pedestal
                TILE_SIZE,
                TILE_SIZE
            );
            ctx.restore();
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = TILE_COLORS[tileType] || '#888888';
            ctx.fillRect(pixelX + 12, pixelY + 12, TILE_SIZE - 24, TILE_SIZE - 24);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the club part
        if (RendererUtils.isImageLoaded(this.images, 'doodads/club')) {
            // For a 4x3 club, we need to determine which part of the club image to draw
            // Find the house area bounds to determine the position within the house
            const houseInfo = this.multiTileHandler.findHousePosition(x, y, grid);

            if (houseInfo) {
                // Calculate which part of the house image to use
                const partX = x - houseInfo.startX;
                const partY = y - houseInfo.startY;

                // Draw the corresponding part of the club image
                // Divide the club image into 4x3 parts
                const houseImage = this.images['doodads/club'];
                const partWidth = houseImage.width / 4;
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
        if (RendererUtils.isImageLoaded(this.images, 'doodads/well')) {
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
        if (RendererUtils.isImageLoaded(this.images, 'doodads/deadtree')) {
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
        let enemyKey = 'lizardy';

        // First draw the base tile
        if (zoneLevel >= 4 && RendererUtils.isImageLoaded(this.images, 'desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Try to draw the enemy image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, enemyKey)) {
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

    renderPenneTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the Penne image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'lion')) {
            ctx.drawImage(this.images.lion, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.PENNE];
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
        if (RendererUtils.isImageLoaded(this.images, 'squig')) {
            ctx.drawImage(this.images['squig'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
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

    renderRuneTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the rune image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'rune')) {
            ctx.drawImage(this.images['rune'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.RUNE];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🧙', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderNibTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the nib image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'nib')) {
            ctx.drawImage(this.images['nib'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.NIB];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📖', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderMarkTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the mark image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'mark')) {
            ctx.drawImage(this.images['mark'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.MARK];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🗺️', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderMarkTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the mark image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'mark')) {
            ctx.drawImage(this.images['mark'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.MARK];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🗺️', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderCraynTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the crayn image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'crayn')) {
            ctx.drawImage(this.images['crayn'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.CRAYN];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🦎', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2); // Placeholder lizard emoji for Crayn
        }
    }

    renderFeltTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the felt image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'felt')) {
            ctx.drawImage(this.images['felt'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FELT];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🙋', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2); // Placeholder emoji for Felt
        }
    }

    renderForgeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the forge image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'forge')) {
            ctx.drawImage(this.images['forge'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FORGE];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛠️', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2); // Placeholder emoji for Forge
        }
    }
}
