import { TILE_COLORS, TILE_TYPES, TILE_SIZE, GRID_SIZE } from './constants.js';

export class TileRenderer {
    constructor(images, textureDetectorClass, multiTileHandlerClass, tileSize) {
        this.images = images;
        this.textureDetector = textureDetectorClass;
        this.multiTileHandler = multiTileHandlerClass;
        this.tileSize = tileSize;
    }

    isImageLoaded(key) {
        const image = this.images[key];
        return image && image.complete && image.naturalWidth > 0;
    }

    // Main tile rendering dispatcher
    renderTile(ctx, x, y, tileType, grid, zoneLevel) {
        const pixelX = x * TILE_SIZE;
        const pixelY = y * TILE_SIZE;

        // Handle object tiles (like notes)
        const actualType = tileType && tileType.type ? tileType.type : tileType;

        if (actualType === TILE_TYPES.EXIT) {
            this.renderExitTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.WALL) {
            this.renderWallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType >= TILE_TYPES.PINK_FLOOR && actualType <= TILE_TYPES.YELLOW_FLOOR) {
            // Tinted floors - render with color
            this.renderFloorTile(ctx, pixelX, pixelY, actualType);
        } else if (actualType === TILE_TYPES.FLOOR) {
            this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.ROCK) {
            this.renderRockTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.GRASS) {
            this.renderGrassTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.HOUSE) {
            this.renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.WATER) {
            this.renderWaterTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.FOOD) {
            this.renderFoodTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.ENEMY) {
            this.renderEnemyTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.AXE) {
            this.renderAxeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.HAMMER) {
            this.renderHammerTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.BISHOP_SPEAR) {
            this.renderSpearTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.BOMB) {
            this.renderBombTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.NOTE) {
            this.renderNoteTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.SIGN) {
            this.renderSignTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.SHRUBBERY) {
            this.renderGrassTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.WELL) {
            this.renderWellTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.DEADTREE) {
            this.renderDeadTreeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.LION) {
            this.renderLionTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.SQUIG) {
            this.renderSquigTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else if (actualType === TILE_TYPES.SIGN) {
            this.renderSignTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        } else {
            this.renderFloorTile(ctx, pixelX, pixelY, actualType);
        }

        // Add a faint alternating tint to non-wall tiles for a chessboard effect
        if (actualType !== TILE_TYPES.WALL) {
            let darkTint = 'rgba(0, 0, 0, 0.05)';
            let lightTint = 'rgba(255, 255, 255, 0.05)';

            if (zoneLevel >= 4) { // Frontier
                darkTint = 'rgba(0, 0, 0, 0.12)';
                lightTint = 'rgba(255, 255, 255, 0.02)'; // Reduce white opacity on bright desert tiles
            }
            ctx.save();
            ctx.fillStyle = (x + y) % 2 === 0 ? darkTint : lightTint;
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            ctx.restore();
        }
    }

    renderExitTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // Frontier zones (level >=4) use desert background for exit tiles
        if (zoneLevel >= 4 && this.isImageLoaded('desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            return;
        }
        // ...existing code...
        if (this.shouldUseDirtTunnelHorizontal(x, y, grid) && this.isImageLoaded('dirt_tunnel')) {
            ctx.drawImage(this.images.dirt_tunnel, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtTunnelVertical(x, y, grid) && this.isImageLoaded('dirt_tunnel')) {
            this.drawRotatedImage(ctx, this.images.dirt_tunnel, pixelX, pixelY, Math.PI / 2);
        } else if (this.shouldUseDirtCorner2NorthSouth(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            ctx.drawImage(this.images.dirt_corner2, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtCorner2EastWest(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, Math.PI / 2);
        } else if (this.shouldUseDirtCorner2SouthNorth(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, Math.PI);
        } else if (this.shouldUseDirtCorner2WestEast(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, -Math.PI / 2);
        } else if (this.shouldUseDirtNorth(x, y, grid) && this.isImageLoaded('dirt_north')) {
            ctx.drawImage(this.images.dirt_north, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtSouth(x, y, grid) && this.isImageLoaded('dirt_north')) {
            this.drawFlippedImage(ctx, this.images.dirt_north, pixelX, pixelY, false, true);
        } else if (this.shouldUseDirtEast(x, y, grid) && this.isImageLoaded('dirt_north')) {
            this.drawRotatedImage(ctx, this.images.dirt_north, pixelX, pixelY, Math.PI / 2);
        } else if (this.shouldUseDirtWest(x, y, grid) && this.isImageLoaded('dirt_north')) {
            this.drawRotatedImage(ctx, this.images.dirt_north, pixelX, pixelY, -Math.PI / 2);
        } else if (this.shouldUseDirtCornerNE(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            ctx.drawImage(this.images.dirt_corner, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtCornerSE(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, Math.PI / 2);
        } else if (this.shouldUseDirtCornerSW(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, Math.PI);
        } else if (this.shouldUseDirtCornerNW(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, -Math.PI / 2);
        } else {
            this.renderFloorTile(ctx, pixelX, pixelY, TILE_TYPES.FLOOR);
        }
    }

    renderWallTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // Frontier zones (level >=4) use desert background and succulent on top
        if (zoneLevel >= 4) {
            if (this.isImageLoaded('desert')) {
                ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            if (this.isImageLoaded('succulent')) {
                ctx.drawImage(this.images.succulent, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#228B22'; // Green for succulent fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }
        // Wilds zones (level 3) use blocklily.png for walls
        else if (zoneLevel === 3) {
            // First draw dirt background
            if (this.isImageLoaded('dircle')) {
                ctx.drawImage(this.images.dircle, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            // Then overlay blocklily on top
            if (this.isImageLoaded('blocklily')) {
                ctx.drawImage(this.images.blocklily, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#228B22'; // Green fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }
        // Woods zones (level 2) use stump.png for walls
        else if (zoneLevel === 2) {
            // First draw dirt background
            if (this.isImageLoaded('dircle')) {
                ctx.drawImage(this.images.dircle, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            // Then overlay stump on top
            if (this.isImageLoaded('stump')) {
                ctx.drawImage(this.images.stump, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#8B4513'; // Brown fallback
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }
        // First draw background dirt
        if (this.isImageLoaded('dircle')) {
            ctx.drawImage(this.images.dircle, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }

        // Then draw bush on top
        if (this.isImageLoaded('bush')) {
            ctx.drawImage(this.images.bush, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.WALL];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderFloorTile(ctx, pixelX, pixelY, tileType) {
        // Use dirt image for normal floor, or fall back to colors for tinted floors
        if (tileType === TILE_TYPES.FLOOR && this.isImageLoaded('dirt')) {
            ctx.drawImage(this.images.dirt, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // For tinted floors or when dirt image is not loaded, use the tile color
            ctx.fillStyle = TILE_COLORS[tileType] || '#ffcb8d';
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // Frontier zones (level >=4) use desert texture for all passable tiles
        if (zoneLevel >= 4) {
            if (this.isImageLoaded('desert')) {
                ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#C2B280'; // Tarnished gold for desert
                ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
            return;
        }

        // Floor tiles use the same sophisticated directional logic as exits
        if (this.shouldUseDirtCorner2NorthSouth(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            ctx.drawImage(this.images.dirt_corner2, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtCorner2EastWest(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, Math.PI / 2);
        } else if (this.shouldUseDirtCorner2SouthNorth(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, Math.PI);
        } else if (this.shouldUseDirtCorner2WestEast(x, y, grid) && this.isImageLoaded('dirt_corner2')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner2, pixelX, pixelY, -Math.PI / 2);
        } else if (this.shouldUseDirtNorth(x, y, grid) && this.isImageLoaded('dirt_north')) {
            ctx.drawImage(this.images.dirt_north, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtSouth(x, y, grid) && this.isImageLoaded('dirt_north')) {
            this.drawFlippedImage(ctx, this.images.dirt_north, pixelX, pixelY, false, true);
        } else if (this.shouldUseDirtEast(x, y, grid) && this.isImageLoaded('dirt_north')) {
            this.drawRotatedImage(ctx, this.images.dirt_north, pixelX, pixelY, Math.PI / 2);
        } else if (this.shouldUseDirtWest(x, y, grid) && this.isImageLoaded('dirt_north')) {
            this.drawRotatedImage(ctx, this.images.dirt_north, pixelX, pixelY, -Math.PI / 2);
        } else if (this.shouldUseDirtCornerNE(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            ctx.drawImage(this.images.dirt_corner, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (this.shouldUseDirtCornerSE(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, Math.PI / 2);
        } else if (this.shouldUseDirtCornerSW(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, Math.PI);
        } else if (this.shouldUseDirtCornerNW(x, y, grid) && this.isImageLoaded('dirt_corner')) {
            this.drawRotatedImage(ctx, this.images.dirt_corner, pixelX, pixelY, -Math.PI / 2);
        } else if (this.isImageLoaded('dirt')) {
            ctx.drawImage(this.images.dirt, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderRockTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // Rock tiles: draw dirt background first, then rock on top
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then draw rock on top
        if (this.isImageLoaded('rock')) {
            ctx.drawImage(this.images.rock, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.ROCK];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderGrassTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // Grass tiles: draw dirt background first, then shrubbery on top
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then draw shrubbery on top
        if (this.isImageLoaded('shrubbery')) {
            ctx.drawImage(this.images.shrubbery, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.GRASS];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First render dirt background
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the house part
        if (this.isImageLoaded('house')) {
            // For a 3x3 house, we need to determine which part of the house image to draw
            // Find the house area bounds to determine the position within the house
            const houseInfo = this.findHousePosition(x, y, grid);

            if (houseInfo) {
                // Calculate which part of the house image to use
                const partX = x - houseInfo.startX;
                const partY = y - houseInfo.startY;

                // Draw the corresponding part of the house image
                // Divide the house image into 3x3 parts
                const partWidth = this.images.house.width / 3;
                const partHeight = this.images.house.height / 3;

                ctx.drawImage(
                    this.images.house,
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

    renderWellTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First render dirt background
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the well part
        if (this.isImageLoaded('well')) {
            // For a 2x2 well, we need to determine which part of the well image to draw
            // Find the well area bounds to determine the position within the well
            const wellInfo = this.findWellPosition(x, y, grid);

            if (wellInfo) {
                // Calculate which part of the well image to use
                const partX = x - wellInfo.startX;
                const partY = y - wellInfo.startY;

                // Draw the corresponding part of the well image
                // Divide the well image into 2x2 parts
                const partWidth = this.images.well.width / 2;
                const partHeight = this.images.well.height / 2;

                ctx.drawImage(
                    this.images.well,
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

    renderDeadTreeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First render dirt background
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the dead tree part
        if (this.isImageLoaded('deadtree')) {
            // For a 2x2 dead tree, we need to determine which part of the dead tree image to draw
            // Find the dead tree area bounds to determine the position within the dead tree
            const deadtreeInfo = this.findDeadTreePosition(x, y, grid);

            if (deadtreeInfo) {
                // Calculate which part of the dead tree image to use
                const partX = x - deadtreeInfo.startX;
                const partY = y - deadtreeInfo.startY;

                // Draw the corresponding part of the dead tree image
                // Divide the dead tree image into 2x2 parts
                const partWidth = this.images.deadtree.width / 2;
                const partHeight = this.images.deadtree.height / 2;

                ctx.drawImage(
                    this.images.deadtree,
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

    renderWaterTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First draw the directional floor background (like rock, shrubbery, etc.)
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the water image if loaded, otherwise use fallback
        if (this.isImageLoaded('water')) {
            ctx.drawImage(this.images.water, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.WATER];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#87CEEB';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💧', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderFoodTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // Use the stored foodType from the grid tile
        const tile = grid[y][x];
        const foodAsset = tile.foodType;
        const foodKey = foodAsset.replace('.png', '').replace('/', '_');

        // First draw the base tile
        if (zoneLevel >= 4 && this.isImageLoaded('desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Try to draw the food image if loaded, otherwise use fallback
        if (this.isImageLoaded(foodKey)) {
            ctx.drawImage(this.images[foodKey], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.FOOD];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#8B4513';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🥖', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderEnemyTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // Use the stored enemyType from the grid tile
        const tile = grid[y][x];
        let enemyKey = 'fauna/lizardy';

        // First draw the base tile
        if (zoneLevel >= 4 && this.isImageLoaded('desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
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

    renderAxeTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First draw the base tile
        if (zoneLevel >= 4 && this.isImageLoaded('desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Try to draw the axe image if loaded, otherwise use fallback
        if (this.isImageLoaded('axe')) {
            ctx.drawImage(this.images.axe, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.ROCK]; // Use rock color for axe
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#666666';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🪓', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderHammerTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First draw the base tile
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the hammer image if loaded, otherwise use fallback
        if (this.isImageLoaded('hammer')) {
            ctx.drawImage(this.images.hammer, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.HAMMER];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#666666';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔨', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderSpearTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First draw the base tile
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the spear image if loaded, otherwise use fallback
        if (this.isImageLoaded('spear')) {
            // Scale spear to fit within tile while maintaining aspect ratio
            const spearImage = this.images.spear;
            const aspectRatio = spearImage.width / spearImage.height;

            let scaledWidth, scaledHeight;
            if (aspectRatio > 1) {
                // Image is wider than tall
                scaledWidth = TILE_SIZE;
                scaledHeight = TILE_SIZE / aspectRatio;
            } else {
                // Image is taller than wide (or square)
                scaledHeight = TILE_SIZE;
                scaledWidth = TILE_SIZE * aspectRatio;
            }

            // Center the image in the tile
            const offsetX = (TILE_SIZE - scaledWidth) / 2;
            const offsetY = (TILE_SIZE - scaledHeight) / 2;

            ctx.drawImage(
                spearImage,
                pixelX + offsetX,
                pixelY + offsetY,
                scaledWidth,
                scaledHeight
            );
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.SPEAR];
            ctx.fillRect(pixelX + 2, pixelY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            ctx.fillStyle = '#666666';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔱', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderBombTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First draw the base tile
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the bomb image if loaded, otherwise use fallback
        if (this.isImageLoaded('bomb')) {
            ctx.drawImage(this.images.bomb, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.BOMB];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#333333';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderLionTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First draw the base tile
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

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

    renderSquigTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First draw the base tile
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

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

    renderNoteTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First draw the base tile
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the note image if loaded, otherwise use fallback
        if (this.isImageLoaded('note')) {
            ctx.drawImage(this.images.note, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.NOTE];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFE4C4'; // Cream color for note
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📄', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    renderSignTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel) {
        // First draw the base tile
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the sign image if loaded, otherwise use fallback
        if (this.isImageLoaded('sign')) {
            ctx.drawImage(this.images.sign, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.SIGN];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('S', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }

    // Utility methods for drawing
    drawRotatedImage(ctx, image, x, y, rotation) {
        ctx.save();
        ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
        ctx.rotate(rotation);
        ctx.drawImage(image, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
        ctx.restore();
    }

    drawFlippedImage(ctx, image, x, y, flipX = false, flipY = false) {
        ctx.save();
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        const drawX = flipX ? -(x + TILE_SIZE) : x;
        const drawY = flipY ? -(y + TILE_SIZE) : y;
        ctx.drawImage(image, drawX, drawY, TILE_SIZE, TILE_SIZE);
        ctx.restore();
    }

    // Static method for configuring canvas
    static configureCanvas(ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
    }

    // Delegate to TextureDetector
    shouldUseDirtTunnelHorizontal(x, y, grid) {
        return this.textureDetector.shouldUseDirtTunnelHorizontal(x, y, grid);
    }

    shouldUseDirtTunnelVertical(x, y, grid) {
        return this.textureDetector.shouldUseDirtTunnelVertical(x, y, grid);
    }

    shouldUseDirtCorner2NorthSouth(x, y, grid) {
        return this.textureDetector.shouldUseDirtCorner2NorthSouth(x, y, grid);
    }

    shouldUseDirtCorner2EastWest(x, y, grid) {
        return this.textureDetector.shouldUseDirtCorner2EastWest(x, y, grid);
    }

    shouldUseDirtCorner2SouthNorth(x, y, grid) {
        return this.textureDetector.shouldUseDirtCorner2SouthNorth(x, y, grid);
    }

    shouldUseDirtCorner2WestEast(x, y, grid) {
        return this.textureDetector.shouldUseDirtCorner2WestEast(x, y, grid);
    }

    shouldUseDirtNorth(x, y, grid) {
        return this.textureDetector.shouldUseDirtNorth(x, y, grid);
    }

    shouldUseDirtSouth(x, y, grid) {
        return this.textureDetector.shouldUseDirtSouth(x, y, grid);
    }

    shouldUseDirtEast(x, y, grid) {
        return this.textureDetector.shouldUseDirtEast(x, y, grid);
    }

    shouldUseDirtWest(x, y, grid) {
        return this.textureDetector.shouldUseDirtWest(x, y, grid);
    }

    shouldUseDirtCornerNE(x, y, grid) {
        return this.textureDetector.shouldUseDirtCornerNE(x, y, grid);
    }

    shouldUseDirtCornerSE(x, y, grid) {
        return this.textureDetector.shouldUseDirtCornerSE(x, y, grid);
    }

    shouldUseDirtCornerSW(x, y, grid) {
        return this.textureDetector.shouldUseDirtCornerSW(x, y, grid);
    }

    shouldUseDirtCornerNW(x, y, grid) {
        return this.textureDetector.shouldUseDirtCornerNW(x, y, grid);
    }

    findHousePosition(x, y, grid) {
        return this.multiTileHandler.findHousePosition(x, y, grid);
    }

    findWellPosition(x, y, grid) {
        return this.multiTileHandler.findWellPosition(x, y, grid);
    }

    findDeadTreePosition(x, y, grid) {
        return this.multiTileHandler.findDeadTreePosition(x, y, grid);
    }
}
