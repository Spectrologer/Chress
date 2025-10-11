import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';

export class PathGenerator {
    constructor(grid) {
        this.grid = grid;
    }

    ensureExitAccess() {
        // Find all exit tiles and ensure they have clear paths
        const exits = [];

        // Collect all exits
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] === TILE_TYPES.EXIT) {
                    exits.push({ x, y });
                }
            }
        }

        // For each exit, ensure there's a clear path inward
        exits.forEach(exit => {
            this.clearPathToExit(exit.x, exit.y);
        });
    }

    clearPathToExit(exitX, exitY) {
        // Clear at least one adjacent tile inward from the exit
        let inwardX = exitX;
        let inwardY = exitY;

        // Determine inward direction based on exit position
        if (exitY === 0) {
            // Top edge - clear downward
            inwardY = 1;
        } else if (exitY === GRID_SIZE - 1) {
            // Bottom edge - clear upward
            inwardY = GRID_SIZE - 2;
        } else if (exitX === 0) {
            // Left edge - clear rightward
            inwardX = 1;
        } else if (exitX === GRID_SIZE - 1) {
            // Right edge - clear leftward
            inwardX = GRID_SIZE - 2;
        }

        // Check if this is the special tinted zone - only clear non-tinted tiles
        const isSpecialZone = (this.zoneX === 8 && this.zoneY === 8);
        const currentTile = this.grid[inwardY][inwardX];
        const isTintedTile = currentTile >= TILE_TYPES.PINK_FLOOR && currentTile <= TILE_TYPES.YELLOW_FLOOR;

        if (!isSpecialZone || !isTintedTile) {
            // Clear the adjacent tile
            this.grid[inwardY][inwardX] = TILE_TYPES.FLOOR;
        }

        // Clear adjacent inward tiles to create wider entry area (3x3 around inward tile)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = inwardX + dx;
                const ny = inwardY + dy;
                if (nx >= 1 && nx < GRID_SIZE - 1 && ny >= 1 && ny < GRID_SIZE - 1) {
                    const tile = this.grid[ny][nx];
                    const isTinted = tile >= TILE_TYPES.PINK_FLOOR && tile <= TILE_TYPES.YELLOW_FLOOR;
                    if ((!isSpecialZone || !isTinted) && (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY)) {
                        this.grid[ny][nx] = TILE_TYPES.FLOOR;
                    }
                }
            }
        }

        // Also clear a path toward the center to ensure connectivity
        this.clearPathToCenter(inwardX, inwardY);
    }

    clearPathToCenter(startX, startY) {
        // Clear a simple path toward the center area
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);

        let currentX = startX;
        let currentY = startY;

        // Check if this is the special tinted zone - don't clear tinted tiles
        const isSpecialZone = (this.zoneX === 8 && this.zoneY === 8);

        // Clear tiles along a path toward center (simplified pathfinding)
        while (Math.abs(currentX - centerX) > 1 || Math.abs(currentY - centerY) > 1) {
            // Move toward center one step at a time
            if (currentX < centerX) {
                currentX++;
            } else if (currentX > centerX) {
                currentX--;
            } else if (currentY < centerY) {
                currentY++;
            } else if (currentY > centerY) {
                currentY--;
            }

            // Clear this tile if it's not already floor or exit, and not a tinted tile in special zone
            const currentTile = this.grid[currentY][currentX];
            const isTintedTile = currentTile >= TILE_TYPES.PINK_FLOOR && currentTile <= TILE_TYPES.YELLOW_FLOOR;
            if ((this.grid[currentY][currentX] === TILE_TYPES.WALL || this.grid[currentY][currentX] === TILE_TYPES.ROCK || this.grid[currentY][currentX] === TILE_TYPES.SHRUBBERY) &&
                !(isSpecialZone && isTintedTile)) {
                this.grid[currentY][currentX] = TILE_TYPES.FLOOR;
            }

            // Prevent infinite loops
            if (currentX === centerX && currentY === centerY) {
                break;
            }
        }
    }

    clearPathToCenterForItem(startX, startY, zoneX, zoneY) {
        // Update zone coordinates for clearance logic
        this.zoneX = zoneX;
        this.zoneY = zoneY;
        this.clearPathToCenter(startX, startY);
    }

    clearPathToExitWithZoneContext(exitX, exitY, zoneX, zoneY) {
        // Update zone coordinates for clearance logic
        this.zoneX = zoneX;
        this.zoneY = zoneY;
        this.clearPathToExit(exitX, exitY);
    }
}
