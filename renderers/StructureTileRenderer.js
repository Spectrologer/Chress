import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from '../core/constants.js';
import { RendererUtils } from './RendererUtils.js';

export class StructureTileRenderer {
    constructor(images, multiTileHandler, tileSize) {
        this.images = images;
        this.multiTileHandler = multiTileHandler;
        this.tileSize = tileSize;
    }



    renderStatueTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer, tileType) {
        // First draw the base tile - statues need special handling for zones
        if (zoneLevel === 5 && RendererUtils.isImageLoaded(baseRenderer.images, 'housetile')) {
            ctx.drawImage(baseRenderer.images.housetile, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (zoneLevel >= 4 && RendererUtils.isImageLoaded(baseRenderer.images, 'desert')) {
            ctx.drawImage(baseRenderer.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

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

        const itemSpriteMap = {
            [TILE_TYPES.BOMB_STATUE]: 'bomb',
            [TILE_TYPES.SPEAR_STATUE]: 'spear',
            [TILE_TYPES.BOW_STATUE]: 'bow',
            [TILE_TYPES.HORSE_STATUE]: 'horse',
            [TILE_TYPES.BOOK_STATUE]: 'book',
            [TILE_TYPES.SHOVEL_STATUE]: 'shovel'
        };

        // Prefer enemy sprite mapping, otherwise check item statue mapping
        const spriteKey = enemySpriteMap[tileType] || itemSpriteMap[tileType];
        if (spriteKey && RendererUtils.isImageLoaded(this.images, spriteKey)) {
            const image = this.images[spriteKey];
            ctx.save();
            ctx.filter = 'grayscale(100%) brightness(0.8)';

            // If this is an item-statue, scale to maintain aspect ratio and center on pedestal
            const isItemStatue = itemSpriteMap[tileType] !== undefined;
            if (isItemStatue) {
                // Leave a small margin so statue sits nicely on the pedestal
                const maxSize = TILE_SIZE - 16;
                const dims = RendererUtils.calculateScaledDimensions(image, maxSize);
                const drawX = pixelX + Math.round((TILE_SIZE - dims.width) / 2);
                const drawY = pixelY + Math.round((TILE_SIZE - dims.height) / 2) - 6; // slightly higher

                // Special-case rotation for the bow statue: rotate 90deg CCW
                if (tileType === TILE_TYPES.BOW_STATUE) {
                    ctx.translate(drawX + dims.width / 2, drawY + dims.height / 2);
                    ctx.rotate(-Math.PI / 2);
                    ctx.drawImage(image, -dims.width / 2, -dims.height / 2, dims.width, dims.height);
                } else {
                    // General scaled draw (handles spear, bomb, horse, book, shovel)
                    ctx.drawImage(image, drawX, drawY, dims.width, dims.height);
                }
            } else {
                // Enemy statues use full tile draw like before
                ctx.drawImage(image, pixelX, pixelY - 10, TILE_SIZE, TILE_SIZE);
            }

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

    renderShackTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Check for shack image with proper key
        const imageKey = 'doodads/shack';
        const shackImage = this.images[imageKey];
        const imageLoaded = RendererUtils.isImageLoaded(this.images, imageKey) &&
                          shackImage &&
                          shackImage.width >= 48 && shackImage.height >= 48; // Minimum 3x3 expected

        // Then render the shack part
        if (imageLoaded) {
            // Find the shack position using the multi-tile handler
            const shackInfo = this.multiTileHandler.findShackPosition(x, y, grid);

            if (shackInfo) {
                // Calculate position within the 3x3 shack
                const partX = x - shackInfo.startX;
                const partY = y - shackInfo.startY;

                // Validate coordinates are within bounds
                if (partX >= 0 && partX < 3 && partY >= 0 && partY < 3) {
                    // Divide the shack image into 3x3 parts
                    const partWidth = shackImage.width / 3;
                    const partHeight = shackImage.height / 3;

                    // Ensure dimensions are reasonable
                    if (partWidth > 0 && partHeight > 0 && partWidth <= shackImage.width && partHeight <= shackImage.height) {
                        try {
                            ctx.drawImage(
                                shackImage,
                                partX * partWidth, partY * partHeight, // Source position
                                partWidth, partHeight, // Source size
                                pixelX, pixelY, // Destination position
                                TILE_SIZE, TILE_SIZE // Destination size
                            );
                            return; // Successfully rendered
                        } catch (error) {
                            console.warn('[Shack Render Error] Failed to draw shack part:', partX, partY, error.message);
                        }
                    } else {
                        console.warn('[Shack Render Warning] Invalid shack image dimensions:', shackImage.width, shackImage.height);
                    }
                } else {
                    console.warn('[Shack Render Warning] Invalid shack part coordinates:', partX, partY);
                }
            }
        }

        // Fallback color rendering with distinctive marking
        ctx.fillStyle = TILE_COLORS[TILE_TYPES.SHACK] || '#654321';
        ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);

        // Add distinguishable 'S' marker for fallback
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
    }

    renderCisternTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // This is the BOTTOM part of the cistern.
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        if (RendererUtils.isImageLoaded(this.images, 'doodads/cistern')) {
            const cisternImage = this.images['doodads/cistern'];
            const partWidth = cisternImage.width; // 16
            const partHeight = cisternImage.height / 2; // 9

            // Pixel perfect scaling: 16x9 -> 64x36
            const destW = partWidth * 4; // 64
            const destH = partHeight * 4; // 36
            const destX = pixelX; // Left justified
            const destY = pixelY; // Top of tile

            ctx.drawImage(
                cisternImage,
                0, partHeight, // Source position (bottom part)
                partWidth, partHeight, // Source size
                destX, destY, // Destination position, aligned to top of tile
                destW, destH // Destination size
            );
        } else {
            // Fallback color rendering - semi-transparent slab to show dirt behind
            const partHeight = 9;
            const scaleFactor = 4;
            const destW = 16 * scaleFactor;
            const destH = partHeight * scaleFactor;
            const destX = pixelX;
            const destY = pixelY;
            ctx.fillStyle = `rgba${TILE_COLORS[TILE_TYPES.CISTERN].slice(4, -1)}, 0.7)`;
            ctx.fillRect(destX, destY, destW, destH);
            // Debug for gh-pages - show cistern location with 'C'
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('C', pixelX + TILE_SIZE / 2, pixelY + destH / 2);
        }
    }

    renderCisternTop(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // This is the TOP part of the cistern (the PORT/entrance).

        // First render dirt background so transparency works
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        if (RendererUtils.isImageLoaded(this.images, 'doodads/cistern')) {
            const cisternImage = this.images['doodads/cistern'];
            const partWidth = cisternImage.width; // 16
            const partHeight = cisternImage.height / 2; // 9

            // Pixel perfect scaling: 16x9 -> 64x36
            // Position at the bottom of the tile
            const destW = partWidth * 4; // 64
            const destH = partHeight * 4; // 36
            const destX = pixelX; // Left justified
            const destY = pixelY + TILE_SIZE - destH; // Bottom of tile

            ctx.drawImage(
                cisternImage,
                0, 0, // Source position (top part)
                partWidth, partHeight, // Source size
                destX, destY, // Destination position, aligned to top of tile
                destW, destH // Destination size
            );
        } else {
            // Fallback rendering - semi-transparent slab to show dirt behind
            const partHeight = 9;
            const scaleFactor = 4;
            const destW = 16 * scaleFactor;
            const destH = partHeight * scaleFactor;
            const destX = pixelX;
            const destY = pixelY + TILE_SIZE - destH;

            ctx.fillStyle = `rgba${TILE_COLORS[TILE_TYPES.CISTERN].slice(4, -1)}, 0.7)`;
            ctx.fillRect(destX, destY, destW, destH);
            // Debug for gh-pages - show cistern top with small 'C'
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('C', destX + destW / 2, destY + destH / 2 + 2);
        }
    }

    renderAxelotlTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the axelotl image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'axolotl')) {
            ctx.drawImage(this.images['axolotl'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.AXELOTL] || '#FF69B4';
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#000000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('AXL', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderGougeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the gouge image if loaded, otherwise use fallback
        if (RendererUtils.isImageLoaded(this.images, 'gouge')) {
            ctx.drawImage(this.images['gouge'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.GOUGE] || '#8A2BE2';
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GOU', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderPitfallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer) {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the pitfall image if loaded, otherwise it's invisible
        if (RendererUtils.isImageLoaded(this.images, 'pitfall')) {
            ctx.save();
            ctx.globalAlpha = 0.7; // Make it slightly transparent to blend in
            ctx.drawImage(this.images.pitfall, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            ctx.restore();
        }
    }
}
