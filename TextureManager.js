import { IMAGE_ASSETS, FOOD_ASSETS, TOTAL_IMAGES, TILE_COLORS, TILE_TYPES, TILE_SIZE, GRID_SIZE } from './constants.js';

export class TextureManager {
    constructor() {
        this.images = {};
        this.imagesLoaded = 0;
        this.totalImages = TOTAL_IMAGES;
        this.onAllImagesLoaded = null;
    }

    async loadAssets() {
        return new Promise((resolve) => {
            this.onAllImagesLoaded = resolve;

            // Load regular assets
            IMAGE_ASSETS.forEach(assetName => {
                const imageKey = assetName.replace('.png', '');
                this.loadImage(imageKey, assetName);
            });

            // Load food assets
            FOOD_ASSETS.forEach(assetName => {
                const imageKey = assetName.replace('.png', '').replace('/', '_');
                this.loadImage(imageKey, assetName);
            });

            // Fallback timeout in case images take too long
            setTimeout(() => {
                if (this.imagesLoaded < this.totalImages) {
                    console.log('Image loading timeout, starting with fallback colors');
                    this.imagesLoaded = this.totalImages;
                    resolve();
                }
            }, 2000);
        });
    }

    loadImage(key, filename) {
        this.images[key] = new Image();

        this.images[key].onload = () => {
            console.log(`${filename} texture loaded successfully`);
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages && this.onAllImagesLoaded) {
                this.onAllImagesLoaded();
            }
        };

        this.images[key].onerror = () => {
            console.log(`Could not load Images/${filename}, using fallback colors`);
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages && this.onAllImagesLoaded) {
                this.onAllImagesLoaded();
            }
        };

        this.images[key].src = `Images/${filename}`;
    }

    getImage(key) {
        return this.images[key];
    }

    isImageLoaded(key) {
        const image = this.images[key];
        return image && image.complete && image.naturalWidth > 0;
    }

    // Texture direction detection methods
    shouldUseDirtTunnelHorizontal(x, y, grid) {
        const GRID_SIZE = grid.length;
        if (x === 0 || x === GRID_SIZE - 1) return false;

        const hasWestWall = grid[y][x - 1] === TILE_TYPES.WALL;
        const hasEastWall = grid[y][x + 1] === TILE_TYPES.WALL;

        if (!hasWestWall || !hasEastWall) return false;

        const passableDirections = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
            { dx: 1, dy: 1 }, { dx: -1, dy: 1 }
        ];

        return this.checkPassableDirections(x, y, grid, passableDirections);
    }

    shouldUseDirtTunnelVertical(x, y, grid) {
        const GRID_SIZE = grid.length;
        if (y === 0 || y === GRID_SIZE - 1) return false;

        const hasNorthWall = grid[y - 1][x] === TILE_TYPES.WALL;
        const hasSouthWall = grid[y + 1][x] === TILE_TYPES.WALL;

        if (!hasNorthWall || !hasSouthWall) return false;

        const passableDirections = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];

        return this.checkPassableDirections(x, y, grid, passableDirections);
    }

    shouldUseDirtNorth(x, y, grid) {
        const GRID_SIZE = grid.length;
        if (y === 0) return false; // Can't check north if at top edge

        // Must have wall to the north
        const hasNorthWall = grid[y - 1][x] === TILE_TYPES.WALL;
        if (!hasNorthWall) return false;

        // Check for additional wall patterns that work with dirt_north
        let hasValidPattern = false;

        // Pattern 1: North + Northeast walls, passable elsewhere
        if (x < GRID_SIZE - 1) {
            const hasNorthEastWall = grid[y - 1][x + 1] === TILE_TYPES.WALL;
            if (hasNorthEastWall) {
                // Check that other directions are passable
                const passableCount = this.countPassableDirections(x, y, grid, [
                    { dx: -1, dy: -1 }, // NW
                    { dx: 1, dy: 0 },   // E
                    { dx: 0, dy: 1 },   // S
                    { dx: -1, dy: 0 },  // W
                    { dx: 1, dy: 1 },   // SE
                    { dx: -1, dy: 1 }   // SW
                ]);
                if (passableCount >= 4) hasValidPattern = true;
            }
        }

        // Pattern 2: North + Northwest walls, passable elsewhere
        if (!hasValidPattern && x > 0) {
            const hasNorthWestWall = grid[y - 1][x - 1] === TILE_TYPES.WALL;
            if (hasNorthWestWall) {
                // Check that other directions are passable
                const passableCount = this.countPassableDirections(x, y, grid, [
                    { dx: 1, dy: -1 },  // NE
                    { dx: 1, dy: 0 },   // E
                    { dx: 0, dy: 1 },   // S
                    { dx: -1, dy: 0 },  // W
                    { dx: 1, dy: 1 },   // SE
                    { dx: -1, dy: 1 }   // SW
                ]);
                if (passableCount >= 4) hasValidPattern = true;
            }
        }

        return hasValidPattern;
    }

    shouldUseDirtSouth(x, y, grid) {
        const GRID_SIZE = grid.length;
        if (y === GRID_SIZE - 1) return false; // Can't check south if at bottom edge

        // Must have wall to the south
        const hasSouthWall = grid[y + 1][x] === TILE_TYPES.WALL;
        if (!hasSouthWall) return false;

        // Check for additional wall patterns that work with dirt_south (rotated dirt_north)
        let hasValidPattern = false;

        // Pattern 1: South + Southeast walls, passable elsewhere
        if (x < GRID_SIZE - 1) {
            const hasSouthEastWall = grid[y + 1][x + 1] === TILE_TYPES.WALL;
            if (hasSouthEastWall) {
                const passableCount = this.countPassableDirections(x, y, grid, [
                    { dx: 0, dy: -1 },  // N
                    { dx: 1, dy: -1 },  // NE
                    { dx: 1, dy: 0 },   // E
                    { dx: -1, dy: 0 },  // W
                    { dx: -1, dy: -1 }, // NW
                    { dx: -1, dy: 1 }   // SW
                ]);
                if (passableCount >= 4) hasValidPattern = true;
            }
        }

        // Pattern 2: South + Southwest walls, passable elsewhere
        if (!hasValidPattern && x > 0) {
            const hasSouthWestWall = grid[y + 1][x - 1] === TILE_TYPES.WALL;
            if (hasSouthWestWall) {
                const passableCount = this.countPassableDirections(x, y, grid, [
                    { dx: 0, dy: -1 },  // N
                    { dx: 1, dy: -1 },  // NE
                    { dx: 1, dy: 0 },   // E
                    { dx: -1, dy: 0 },  // W
                    { dx: -1, dy: -1 }, // NW
                    { dx: 1, dy: 1 }    // SE
                ]);
                if (passableCount >= 4) hasValidPattern = true;
            }
        }

        return hasValidPattern;
    }

    shouldUseDirtEast(x, y, grid) {
        const GRID_SIZE = grid.length;
        if (x === GRID_SIZE - 1) return false; // Can't check east if at right edge

        // Must have wall to the east
        const hasEastWall = grid[y][x + 1] === TILE_TYPES.WALL;
        if (!hasEastWall) return false;

        // Check for additional wall patterns that work with dirt_east (rotated dirt_north)
        let hasValidPattern = false;

        // Pattern 1: East + Northeast walls, passable elsewhere
        if (y > 0) {
            const hasNorthEastWall = grid[y - 1][x + 1] === TILE_TYPES.WALL;
            if (hasNorthEastWall) {
                const passableCount = this.countPassableDirections(x, y, grid, [
                    { dx: 0, dy: -1 },  // N
                    { dx: 0, dy: 1 },   // S
                    { dx: -1, dy: 0 },  // W
                    { dx: -1, dy: -1 }, // NW
                    { dx: 1, dy: 1 },   // SE
                    { dx: -1, dy: 1 }   // SW
                ]);
                if (passableCount >= 4) hasValidPattern = true;
            }
        }

        // Pattern 2: East + Southeast walls, passable elsewhere
        if (!hasValidPattern && y < GRID_SIZE - 1) {
            const hasSouthEastWall = grid[y + 1][x + 1] === TILE_TYPES.WALL;
            if (hasSouthEastWall) {
                const passableCount = this.countPassableDirections(x, y, grid, [
                    { dx: 0, dy: -1 },  // N
                    { dx: 0, dy: 1 },   // S
                    { dx: -1, dy: 0 },  // W
                    { dx: 1, dy: -1 },  // NE
                    { dx: -1, dy: -1 }, // NW
                    { dx: -1, dy: 1 }   // SW
                ]);
                if (passableCount >= 4) hasValidPattern = true;
            }
        }

        return hasValidPattern;
    }

    shouldUseDirtWest(x, y, grid) {
        const GRID_SIZE = grid.length;
        if (x === 0) return false; // Can't check west if at left edge

        // Must have wall to the west
        const hasWestWall = grid[y][x - 1] === TILE_TYPES.WALL;
        if (!hasWestWall) return false;

        // Check for additional wall patterns that work with dirt_west (rotated dirt_north)
        let hasValidPattern = false;

        // Pattern 1: West + Northwest walls, passable elsewhere
        if (y > 0) {
            const hasNorthWestWall = grid[y - 1][x - 1] === TILE_TYPES.WALL;
            if (hasNorthWestWall) {
                const passableCount = this.countPassableDirections(x, y, grid, [
                    { dx: 0, dy: -1 },  // N
                    { dx: 1, dy: 0 },   // E
                    { dx: 0, dy: 1 },   // S
                    { dx: 1, dy: -1 },  // NE
                    { dx: 1, dy: 1 },   // SE
                    { dx: -1, dy: 1 }   // SW
                ]);
                if (passableCount >= 4) hasValidPattern = true;
            }
        }

        // Pattern 2: West + Southwest walls, passable elsewhere
        if (!hasValidPattern && y < GRID_SIZE - 1) {
            const hasSouthWestWall = grid[y + 1][x - 1] === TILE_TYPES.WALL;
            if (hasSouthWestWall) {
                const passableCount = this.countPassableDirections(x, y, grid, [
                    { dx: 0, dy: -1 },  // N
                    { dx: 1, dy: 0 },   // E
                    { dx: 0, dy: 1 },   // S
                    { dx: 1, dy: -1 },  // NE
                    { dx: -1, dy: -1 }, // NW
                    { dx: 1, dy: 1 }    // SE
                ]);
                if (passableCount >= 4) hasValidPattern = true;
            }
        }

        return hasValidPattern;
    }

    countPassableDirections(x, y, grid, directions) {
        const GRID_SIZE = grid.length;
        let passableCount = 0;

        for (let dir of directions) {
            const checkX = x + dir.dx;
            const checkY = y + dir.dy;

            // Count as passable if out of bounds or not a wall
            if (checkX < 0 || checkX >= GRID_SIZE || checkY < 0 || checkY >= GRID_SIZE) {
                passableCount++;
            } else if (grid[checkY][checkX] !== TILE_TYPES.WALL) {
                passableCount++;
            }
        }

        return passableCount;
    }

    checkPassableDirections(x, y, grid, directions) {
        const GRID_SIZE = grid.length;

        for (let dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;

            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
                continue;
            }

            if (grid[newY][newX] === TILE_TYPES.WALL) {
                return false;
            }
        }

        return true;
    }

    // Add other texture direction methods (corner detection, etc.)
    shouldUseDirtCornerNE(x, y, grid) {
        const GRID_SIZE = grid.length;
        // Use dirt_corner for northeast corner: walls to N and E, passable tiles to S and W
        if (x === GRID_SIZE - 1 || y === 0) return false; // Can't check if at edges

        // Must have walls to the north and east
        const hasNorthWall = grid[y - 1][x] === TILE_TYPES.WALL;
        const hasEastWall = grid[y][x + 1] === TILE_TYPES.WALL;

        if (!hasNorthWall || !hasEastWall) {
            return false;
        }

        // Must have passable tiles to the south and west
        const hasSouthPassable = (y < GRID_SIZE - 1) ? grid[y + 1][x] !== TILE_TYPES.WALL : true;
        const hasWestPassable = (x > 0) ? grid[y][x - 1] !== TILE_TYPES.WALL : true;

        return hasSouthPassable && hasWestPassable;
    }

    shouldUseDirtCornerSE(x, y, grid) {
        const GRID_SIZE = grid.length;
        // Use dirt_corner rotated 90° for southeast corner: walls to S and E, passable tiles to N and W
        if (x === GRID_SIZE - 1 || y === GRID_SIZE - 1) return false; // Can't check if at edges

        // Must have walls to the south and east
        const hasSouthWall = grid[y + 1][x] === TILE_TYPES.WALL;
        const hasEastWall = grid[y][x + 1] === TILE_TYPES.WALL;

        if (!hasSouthWall || !hasEastWall) {
            return false;
        }

        // Must have passable tiles to the north and west
        const hasNorthPassable = (y > 0) ? grid[y - 1][x] !== TILE_TYPES.WALL : true;
        const hasWestPassable = (x > 0) ? grid[y][x - 1] !== TILE_TYPES.WALL : true;

        return hasNorthPassable && hasWestPassable;
    }

    shouldUseDirtCornerSW(x, y, grid) {
        const GRID_SIZE = grid.length;
        // Use dirt_corner rotated 180° for southwest corner: walls to S and W, passable tiles to N and E
        if (x === 0 || y === GRID_SIZE - 1) return false; // Can't check if at edges

        // Must have walls to the south and west
        const hasSouthWall = grid[y + 1][x] === TILE_TYPES.WALL;
        const hasWestWall = grid[y][x - 1] === TILE_TYPES.WALL;

        if (!hasSouthWall || !hasWestWall) {
            return false;
        }

        // Must have passable tiles to the north and east
        const hasNorthPassable = (y > 0) ? grid[y - 1][x] !== TILE_TYPES.WALL : true;
        const hasEastPassable = (x < GRID_SIZE - 1) ? grid[y][x + 1] !== TILE_TYPES.WALL : true;

        return hasNorthPassable && hasEastPassable;
    }

    shouldUseDirtCornerNW(x, y, grid) {
        const GRID_SIZE = grid.length;
        // Use dirt_corner rotated 270° for northwest corner: walls to N and W, passable tiles to S and E
        if (x === 0 || y === 0) return false; // Can't check if at edges

        // Must have walls to the north and west
        const hasNorthWall = grid[y - 1][x] === TILE_TYPES.WALL;
        const hasWestWall = grid[y][x - 1] === TILE_TYPES.WALL;

        if (!hasNorthWall || !hasWestWall) {
            return false;
        }

        // Must have passable tiles to the south and east
        const hasSouthPassable = (y < GRID_SIZE - 1) ? grid[y + 1][x] !== TILE_TYPES.WALL : true;
        const hasEastPassable = (x < GRID_SIZE - 1) ? grid[y][x + 1] !== TILE_TYPES.WALL : true;

        return hasSouthPassable && hasEastPassable;
    }

    // Corner2 texture methods
    shouldUseDirtCorner2NorthSouth(x, y, grid) {
        const GRID_SIZE = grid.length;
        if (y === 0 || y === GRID_SIZE - 1 || x === 0 || x === GRID_SIZE - 1) return false;

        const hasNorthEastWall = grid[y - 1][x + 1] === TILE_TYPES.WALL;
        const hasNorthWestWall = grid[y - 1][x - 1] === TILE_TYPES.WALL;

        if (!hasNorthEastWall || !hasNorthWestWall) return false;

        const passableDirections = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
            { dx: 1, dy: 1 }, { dx: -1, dy: 1 }
        ];

        return this.checkPassableDirections(x, y, grid, passableDirections);
    }

    shouldUseDirtCorner2EastWest(x, y, grid) {
        const GRID_SIZE = grid.length;
        if (y === 0 || y === GRID_SIZE - 1 || x === 0 || x === GRID_SIZE - 1) return false;

        const hasNorthEastWall = grid[y - 1][x + 1] === TILE_TYPES.WALL;
        const hasSouthEastWall = grid[y + 1][x + 1] === TILE_TYPES.WALL;

        if (!hasNorthEastWall || !hasSouthEastWall) return false;

        const passableDirections = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
            { dx: -1, dy: -1 }, { dx: -1, dy: 1 }
        ];

        return this.checkPassableDirections(x, y, grid, passableDirections);
    }

    shouldUseDirtCorner2SouthNorth(x, y, grid) {
        const GRID_SIZE = grid.length;
        if (y === 0 || y === GRID_SIZE - 1 || x === 0 || x === GRID_SIZE - 1) return false;

        const hasSouthEastWall = grid[y + 1][x + 1] === TILE_TYPES.WALL;
        const hasSouthWestWall = grid[y + 1][x - 1] === TILE_TYPES.WALL;

        if (!hasSouthEastWall || !hasSouthWestWall) return false;

        const passableDirections = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
            { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
        ];

        return this.checkPassableDirections(x, y, grid, passableDirections);
    }

    shouldUseDirtCorner2WestEast(x, y, grid) {
        const GRID_SIZE = grid.length;
        if (y === 0 || y === GRID_SIZE - 1 || x === 0) return false;

        const hasSouthWestWall = grid[y + 1][x - 1] === TILE_TYPES.WALL;
        const hasNorthWestWall = grid[y - 1][x - 1] === TILE_TYPES.WALL;

        if (!hasSouthWestWall || !hasNorthWestWall) return false;

        const passableDirections = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
            { dx: 1, dy: -1 }, { dx: 1, dy: 1 }
        ];

        return this.checkPassableDirections(x, y, grid, passableDirections);
    }

    // Render a single tile with appropriate texture
    renderTile(ctx, x, y, tileType, grid) {
        const pixelX = x * TILE_SIZE;
        const pixelY = y * TILE_SIZE;

        // Handle object tiles (like notes)
        const actualType = tileType && tileType.type ? tileType.type : tileType;

        if (actualType === TILE_TYPES.EXIT) {
            this.renderExitTile(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.WALL) {
            this.renderWallTile(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.FLOOR) {
            this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.ROCK) {
            this.renderRockTile(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.GRASS) {
            this.renderGrassTile(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.HOUSE) {
            this.renderHouseTile(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.WATER) {
            this.renderWaterTile(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.FOOD) {
            this.renderFoodTile(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.ENEMY) {
            this.renderEnemyTile(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.AXE) {
            this.renderAxeTile(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.HAMMER) {
            this.renderHammerTile(ctx, x, y, pixelX, pixelY, grid);
        } else if (actualType === TILE_TYPES.NOTE) {
        this.renderNoteTile(ctx, x, y, pixelX, pixelY, grid);
    } else if (actualType === TILE_TYPES.SHRUBBERY) {
        this.renderGrassTile(ctx, x, y, pixelX, pixelY, grid);
    } else {
        this.renderFloorTile(ctx, pixelX, pixelY, actualType);
    }
    }

    renderExitTile(ctx, x, y, pixelX, pixelY, grid) {
        // Complex exit tile rendering with various directional textures
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

    renderWallTile(ctx, x, y, pixelX, pixelY, grid) {
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
        if (this.isImageLoaded('dirt')) {
            ctx.drawImage(this.images.dirt, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[tileType];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid) {
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

    renderRockTile(ctx, x, y, pixelX, pixelY, grid) {
        // Rock tiles: draw dirt background first, then rock on top
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid);

        // Then draw rock on top
        if (this.isImageLoaded('rock')) {
            ctx.drawImage(this.images.rock, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.ROCK];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderGrassTile(ctx, x, y, pixelX, pixelY, grid) {
        // Grass tiles: draw dirt background first, then shrubbery on top
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid);

        // Then draw shrubbery on top
        if (this.isImageLoaded('shrubbery')) {
            ctx.drawImage(this.images.shrubbery, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.GRASS];
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    renderHouseTile(ctx, x, y, pixelX, pixelY, grid) {
        // First render dirt background
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid);

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

    findHousePosition(targetX, targetY, grid) {
        // Find the top-left corner of the house that contains this tile
        for (let startY = Math.max(0, targetY - 2); startY <= Math.min(GRID_SIZE - 3, targetY); startY++) {
            for (let startX = Math.max(0, targetX - 2); startX <= Math.min(GRID_SIZE - 3, targetX); startX++) {
                // Check if there's a 3x3 house starting at this position
                let isHouse = true;
                for (let y = startY; y < startY + 3 && isHouse; y++) {
                    for (let x = startX; x < startX + 3 && isHouse; x++) {
                        if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE &&
                            grid[y][x] !== TILE_TYPES.HOUSE) {
                            isHouse = false;
                        }
                    }
                }

                if (isHouse && targetX >= startX && targetX < startX + 3 &&
                    targetY >= startY && targetY < startY + 3) {
                    return { startX, startY };
                }
            }
        }
        return null;
    }

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

    // Configure canvas for crisp pixel art
    static configureCanvas(ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
    }

    renderWaterTile(ctx, x, y, pixelX, pixelY, grid) {
        // First draw the directional floor background (like rock, shrubbery, etc.)
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid);

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

    renderFoodTile(ctx, x, y, pixelX, pixelY, grid) {
        // Use the stored foodType from the grid tile
        const tile = grid[y][x];
        const foodAsset = tile.foodType;
        const foodKey = foodAsset.replace('.png', '').replace('/', '_');

        // First draw the directional floor background (like rock, shrubbery, etc.)
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid);

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

    renderEnemyTile(ctx, x, y, pixelX, pixelY, grid) {
        // Use the stored enemyType from the grid tile
        const tile = grid[y][x];
        let enemyKey = 'fauna/lizardy';

        // First draw the directional floor background
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid);

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

    renderAxeTile(ctx, x, y, pixelX, pixelY, grid) {
        // First draw the directional floor background
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid);

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

    renderHammerTile(ctx, x, y, pixelX, pixelY, grid) {
        // First draw the directional floor background
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid);

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

    renderNoteTile(ctx, x, y, pixelX, pixelY, grid) {
        // First draw the directional floor background
        this.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid);

        // Try to draw the note image if loaded, otherwise use fallback
        if (this.isImageLoaded('note')) {
            ctx.drawImage(this.images.note, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to colored square with emoji
            ctx.fillStyle = TILE_COLORS[TILE_TYPES.NOTE];
            ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

            ctx.fillStyle = '#000000';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📝', pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        }
    }
}
