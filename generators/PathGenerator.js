import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';
import { isPort } from '../utils/TileUtils.js';
import GridIterator from '../utils/GridIterator.js';

export class PathGenerator {
    constructor(grid) {
        this.grid = grid;
    }

    ensureExitAccess() {
        // Find all exit tiles and PORT tiles (for escape routes) and ensure they have clear paths
        const exits = GridIterator.findTiles(this.grid, tile => tile === TILE_TYPES.EXIT);
        const ports = GridIterator.findTiles(this.grid, isPort);

        // For each exit, ensure there's a clear path inward
        exits.forEach(({ x, y }) => {
            this.clearPathToExit(x, y);
        });

        // For each port, ensure there's a clear path to the center
        ports.forEach(({ x, y }) => {
            this.clearPathToCenter(x, y);
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

        // Clear the adjacent tile only if it's an obstacle (preserve PORT/CISTERN and other structures)
        const adjacentTile = this.grid[inwardY][inwardX];
        if (adjacentTile === TILE_TYPES.WALL || adjacentTile === TILE_TYPES.ROCK || adjacentTile === TILE_TYPES.SHRUBBERY) {
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
                    if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY) {
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

        // First, clear immediate adjacent tiles around the start position to prevent isolation
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = startX + dx;
                const ny = startY + dy;
                if (nx >= 1 && nx < GRID_SIZE - 1 && ny >= 1 && ny < GRID_SIZE - 1) {
                    const tile = this.grid[ny][nx];
                    // Don't overwrite PORTs, EXITs, or other important tiles
                    const isPortTile = isPort(tile);
                    const isExit = tile === TILE_TYPES.EXIT;
                    if (!isPortTile && !isExit && (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY)) {
                        this.grid[ny][nx] = TILE_TYPES.FLOOR;
                    }
                }
            }
        }

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

            // Clear this tile if it's not already floor, exit, or port
            const tile = this.grid[currentY][currentX];
            const isPortTile = isPort(tile);
            const isExit = tile === TILE_TYPES.EXIT;
            if (!isPortTile && !isExit && (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY)) {
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
