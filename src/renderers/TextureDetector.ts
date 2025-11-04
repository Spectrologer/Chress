import type { GridManager } from './types';

interface Direction {
    dx: number;
    dy: number;
}

export class TextureDetector {
    static TILE_TYPES: any = {}; // Will be set when importing

    static shouldUseDirtTunnelHorizontal(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        if (x === 0 || x === GRID_SIZE - 1) return false;

        const hasWestWall = gridManager.getTile(x - 1, y) === TextureDetector.TILE_TYPES.WALL;
        const hasEastWall = gridManager.getTile(x + 1, y) === TextureDetector.TILE_TYPES.WALL;

        if (!hasWestWall || !hasEastWall) return false;

        const passableDirections: Direction[] = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
            { dx: 1, dy: 1 }, { dx: -1, dy: 1 }
        ];

        return TextureDetector.checkPassableDirections(x, y, gridManager, passableDirections);
    }

    static shouldUseDirtTunnelVertical(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        if (y === 0 || y === GRID_SIZE - 1) return false;

        const hasNorthWall = gridManager.getTile(x, y - 1) === TextureDetector.TILE_TYPES.WALL;
        const hasSouthWall = gridManager.getTile(x, y + 1) === TextureDetector.TILE_TYPES.WALL;

        if (!hasNorthWall || !hasSouthWall) return false;

        const passableDirections: Direction[] = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];

        return TextureDetector.checkPassableDirections(x, y, gridManager, passableDirections);
    }

    static shouldUseDirtNorth(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        if (y === 0) return false; // Can't check north if at top edge

        // Must have wall to the north
        const hasNorthWall = gridManager.getTile(x, y - 1) === TextureDetector.TILE_TYPES.WALL;
        if (!hasNorthWall) return false;

        // Check for additional wall patterns that work with dirt_north
        let hasValidPattern = false;

        // Pattern 1: North + Northeast walls, passable elsewhere
        if (x < GRID_SIZE - 1) {
            const hasNorthEastWall = gridManager.getTile(x + 1, y - 1) === TextureDetector.TILE_TYPES.WALL;
            if (hasNorthEastWall) {
                // Check that other directions are passable
                const passableCount = TextureDetector.countPassableDirections(x, y, gridManager, [
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
            const hasNorthWestWall = gridManager.getTile(x - 1, y - 1) === TextureDetector.TILE_TYPES.WALL;
            if (hasNorthWestWall) {
                // Check that other directions are passable
                const passableCount = TextureDetector.countPassableDirections(x, y, gridManager, [
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

    static shouldUseDirtSouth(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        if (y === GRID_SIZE - 1) return false; // Can't check south if at bottom edge

        // Must have wall to the south
        const hasSouthWall = gridManager.getTile(x, y + 1) === TextureDetector.TILE_TYPES.WALL;
        if (!hasSouthWall) return false;

        // Check for additional wall patterns that work with dirt_south (rotated dirt_north)
        let hasValidPattern = false;

        // Pattern 1: South + Southeast walls, passable elsewhere
        if (x < GRID_SIZE - 1) {
            const hasSouthEastWall = gridManager.getTile(x + 1, y + 1) === TextureDetector.TILE_TYPES.WALL;
            if (hasSouthEastWall) {
                const passableCount = TextureDetector.countPassableDirections(x, y, gridManager, [
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
            const hasSouthWestWall = gridManager.getTile(x - 1, y + 1) === TextureDetector.TILE_TYPES.WALL;
            if (hasSouthWestWall) {
                const passableCount = TextureDetector.countPassableDirections(x, y, gridManager, [
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

    static shouldUseDirtEast(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        if (x === GRID_SIZE - 1) return false; // Can't check east if at right edge

        // Must have wall to the east
        const hasEastWall = gridManager.getTile(x + 1, y) === TextureDetector.TILE_TYPES.WALL;
        if (!hasEastWall) return false;

        // Check for additional wall patterns that work with dirt_east (rotated dirt_north)
        let hasValidPattern = false;

        // Pattern 1: East + Northeast walls, passable elsewhere
        if (y > 0) {
            const hasNorthEastWall = gridManager.getTile(x + 1, y - 1) === TextureDetector.TILE_TYPES.WALL;
            if (hasNorthEastWall) {
                const passableCount = TextureDetector.countPassableDirections(x, y, gridManager, [
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
            const hasSouthEastWall = gridManager.getTile(x + 1, y + 1) === TextureDetector.TILE_TYPES.WALL;
            if (hasSouthEastWall) {
                const passableCount = TextureDetector.countPassableDirections(x, y, gridManager, [
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

    static shouldUseDirtWest(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        if (x === 0) return false; // Can't check west if at left edge

        // Must have wall to the west
        const hasWestWall = gridManager.getTile(x - 1, y) === TextureDetector.TILE_TYPES.WALL;
        if (!hasWestWall) return false;

        // Check for additional wall patterns that work with dirt_west (rotated dirt_north)
        let hasValidPattern = false;

        // Pattern 1: West + Northwest walls, passable elsewhere
        if (y > 0) {
            const hasNorthWestWall = gridManager.getTile(x - 1, y - 1) === TextureDetector.TILE_TYPES.WALL;
            if (hasNorthWestWall) {
                const passableCount = TextureDetector.countPassableDirections(x, y, gridManager, [
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
            const hasSouthWestWall = gridManager.getTile(x - 1, y + 1) === TextureDetector.TILE_TYPES.WALL;
            if (hasSouthWestWall) {
                const passableCount = TextureDetector.countPassableDirections(x, y, gridManager, [
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

    static countPassableDirections(x: number, y: number, gridManager: GridManager, directions: Direction[]): number {
        const GRID_SIZE = gridManager.getSize();
        let passableCount = 0;

        for (let dir of directions) {
            const checkX = x + dir.dx;
            const checkY = y + dir.dy;

            // Count as passable if out of bounds or not a wall
            if (checkX < 0 || checkX >= GRID_SIZE || checkY < 0 || checkY >= GRID_SIZE) {
                passableCount++;
            } else if (gridManager.getTile(checkX, checkY) !== TextureDetector.TILE_TYPES.WALL) {
                passableCount++;
            }
        }

        return passableCount;
    }

    static checkPassableDirections(x: number, y: number, gridManager: GridManager, directions: Direction[]): boolean {
        const GRID_SIZE = gridManager.getSize();

        for (let dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;

            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
                continue;
            }

            if (gridManager.getTile(newX, newY) === TextureDetector.TILE_TYPES.WALL) {
                return false;
            }
        }

        return true;
    }

    static shouldUseDirtCornerNE(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        // Use dirt_corner for northeast corner: walls to N and E, passable tiles to S and W
        if (x === GRID_SIZE - 1 || y === 0) return false; // Can't check if at edges

        // Must have walls to the north and east
        const hasNorthWall = gridManager.getTile(x, y - 1) === TextureDetector.TILE_TYPES.WALL;
        const hasEastWall = gridManager.getTile(x + 1, y) === TextureDetector.TILE_TYPES.WALL;

        if (!hasNorthWall || !hasEastWall) {
            return false;
        }

        // Must have passable tiles to the south and west
        const hasSouthPassable = (y < GRID_SIZE - 1) ? gridManager.getTile(x, y + 1) !== TextureDetector.TILE_TYPES.WALL : true;
        const hasWestPassable = (x > 0) ? gridManager.getTile(x - 1, y) !== TextureDetector.TILE_TYPES.WALL : true;

        return hasSouthPassable && hasWestPassable;
    }

    static shouldUseDirtCornerSE(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        // Use dirt_corner rotated 90° for southeast corner: walls to S and E, passable tiles to N and W
        if (x === GRID_SIZE - 1 || y === GRID_SIZE - 1) return false; // Can't check if at edges

        // Must have walls to the south and east
        const hasSouthWall = gridManager.getTile(x, y + 1) === TextureDetector.TILE_TYPES.WALL;
        const hasEastWall = gridManager.getTile(x + 1, y) === TextureDetector.TILE_TYPES.WALL;

        if (!hasSouthWall || !hasEastWall) {
            return false;
        }

        // Must have passable tiles to the north and west
        const hasNorthPassable = (y > 0) ? gridManager.getTile(x, y - 1) !== TextureDetector.TILE_TYPES.WALL : true;
        const hasWestPassable = (x > 0) ? gridManager.getTile(x - 1, y) !== TextureDetector.TILE_TYPES.WALL : true;

        return hasNorthPassable && hasWestPassable;
    }

    static shouldUseDirtCornerSW(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        // Use dirt_corner rotated 180° for southwest corner: walls to S and W, passable tiles to N and E
        if (x === 0 || y === GRID_SIZE - 1) return false; // Can't check if at edges

        // Must have walls to the south and west
        const hasSouthWall = gridManager.getTile(x, y + 1) === TextureDetector.TILE_TYPES.WALL;
        const hasWestWall = gridManager.getTile(x - 1, y) === TextureDetector.TILE_TYPES.WALL;

        if (!hasSouthWall || !hasWestWall) {
            return false;
        }

        // Must have passable tiles to the north and east
        const hasNorthPassable = (y > 0) ? gridManager.getTile(x, y - 1) !== TextureDetector.TILE_TYPES.WALL : true;
        const hasEastPassable = (x < GRID_SIZE - 1) ? gridManager.getTile(x + 1, y) !== TextureDetector.TILE_TYPES.WALL : true;

        return hasNorthPassable && hasEastPassable;
    }

    static shouldUseDirtCornerNW(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        // Use dirt_corner rotated 270° for northwest corner: walls to N and W, passable tiles to S and E
        if (x === 0 || y === 0) return false; // Can't check if at edges

        // Must have walls to the north and west
        const hasNorthWall = gridManager.getTile(x, y - 1) === TextureDetector.TILE_TYPES.WALL;
        const hasWestWall = gridManager.getTile(x - 1, y) === TextureDetector.TILE_TYPES.WALL;

        if (!hasNorthWall || !hasWestWall) {
            return false;
        }

        // Must have passable tiles to the south and east
        const hasSouthPassable = (y < GRID_SIZE - 1) ? gridManager.getTile(x, y + 1) !== TextureDetector.TILE_TYPES.WALL : true;
        const hasEastPassable = (x < GRID_SIZE - 1) ? gridManager.getTile(x + 1, y) !== TextureDetector.TILE_TYPES.WALL : true;

        return hasSouthPassable && hasEastPassable;
    }

    // Corner2 texture methods
    static shouldUseDirtCorner2NorthSouth(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        if (y === 0 || y === GRID_SIZE - 1 || x === 0 || x === GRID_SIZE - 1) return false;

        const hasNorthEastWall = gridManager.getTile(x + 1, y - 1) === TextureDetector.TILE_TYPES.WALL;
        const hasNorthWestWall = gridManager.getTile(x - 1, y - 1) === TextureDetector.TILE_TYPES.WALL;

        if (!hasNorthEastWall || !hasNorthWestWall) return false;

        const passableDirections: Direction[] = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
            { dx: 1, dy: 1 }, { dx: -1, dy: 1 }
        ];

        return TextureDetector.checkPassableDirections(x, y, gridManager, passableDirections);
    }

    static shouldUseDirtCorner2EastWest(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        if (y === 0 || y === GRID_SIZE - 1 || x === 0 || x === GRID_SIZE - 1) return false;

        const hasNorthEastWall = gridManager.getTile(x + 1, y - 1) === TextureDetector.TILE_TYPES.WALL;
        const hasSouthEastWall = gridManager.getTile(x + 1, y + 1) === TextureDetector.TILE_TYPES.WALL;

        if (!hasNorthEastWall || !hasSouthEastWall) return false;

        const passableDirections: Direction[] = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
            { dx: -1, dy: -1 }, { dx: -1, dy: 1 }
        ];

        return TextureDetector.checkPassableDirections(x, y, gridManager, passableDirections);
    }

    static shouldUseDirtCorner2SouthNorth(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        if (y === 0 || y === GRID_SIZE - 1 || x === 0 || x === GRID_SIZE - 1) return false;

        const hasSouthEastWall = gridManager.getTile(x + 1, y + 1) === TextureDetector.TILE_TYPES.WALL;
        const hasSouthWestWall = gridManager.getTile(x - 1, y + 1) === TextureDetector.TILE_TYPES.WALL;

        if (!hasSouthEastWall || !hasSouthWestWall) return false;

        const passableDirections: Direction[] = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
            { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
        ];

        return TextureDetector.checkPassableDirections(x, y, gridManager, passableDirections);
    }

    static shouldUseDirtCorner2WestEast(x: number, y: number, gridManager: GridManager): boolean {
        const GRID_SIZE = gridManager.getSize();
        if (y === 0 || y === GRID_SIZE - 1 || x === 0) return false;

        const hasSouthWestWall = gridManager.getTile(x - 1, y + 1) === TextureDetector.TILE_TYPES.WALL;
        const hasNorthWestWall = gridManager.getTile(x - 1, y - 1) === TextureDetector.TILE_TYPES.WALL;

        if (!hasSouthWestWall || !hasNorthWestWall) return false;

        const passableDirections: Direction[] = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
            { dx: 1, dy: -1 }, { dx: 1, dy: 1 }
        ];

        return TextureDetector.checkPassableDirections(x, y, gridManager, passableDirections);
    }
}
