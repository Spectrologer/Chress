/**
 * PathGenerator - Ensures zone connectivity by creating clear paths.
 *
 * Solves the problem of procedurally generated zones where exits or important
 * structures might be blocked by obstacles (walls, rocks, shrubbery).
 *
 * Key Responsibilities:
 * - Clear paths from exits inward to zone interior
 * - Clear paths from ports/special structures to zone center
 * - Ensure 3x3 clearance around entry points
 * - Preserve important structures (ports, cisterns, exits)
 *
 * Algorithm Strategy:
 * 1. Find all exits and ports in the zone
 * 2. For each exit: Clear immediate inward tile + 3x3 area + path to center
 * 3. For each port: Clear 3x3 area + path to center
 * 4. Use greedy pathfinding toward center (not BFS/A* - simpler is sufficient)
 */
import { TILE_TYPES, GRID_SIZE } from '../core/constants/index';
import { isPort, isTileType, isExit, isWall, isRock, isShrubbery } from '../utils/TypeChecks';
import GridIterator from '../utils/GridIterator';

export class PathGenerator {
    constructor(gridManager) {
        this.gridManager = gridManager;
    }

    ensureExitAccess() {
        // Find all exit tiles and PORT tiles (for escape routes) and ensure they have clear paths
        const exits = this.gridManager.findTiles(tile => isExit(tile));
        const ports = this.gridManager.findTiles(isPort);

        // For each exit, ensure there's a clear path inward
        exits.forEach(({ x, y }) => {
            this.clearPathToExit(x, y);
        });

        // For each port, ensure there's a clear path to the center
        ports.forEach(({ x, y }) => {
            this.clearPathToCenter(x, y);
        });
    }

    /**
     * Clears a path from an exit tile inward into the zone.
     * Ensures exits are accessible by removing obstacles blocking entry.
     *
     * Algorithm:
     * 1. Determine inward direction based on which edge the exit is on:
     *    - Top edge (y=0) -> move downward (y=1)
     *    - Bottom edge (y=MAX) -> move upward (y=MAX-1)
     *    - Left edge (x=0) -> move rightward (x=1)
     *    - Right edge (x=MAX) -> move leftward (x=MAX-1)
     *
     * 2. Clear the immediately adjacent inward tile if it's an obstacle
     *
     * 3. Clear a 3x3 area around the inward tile for wider entry:
     *    - Prevents narrow chokepoints at zone entries
     *    - Makes exits more visible and accessible
     *    - Creates natural "landing zone" when entering
     *
     * 4. Clear a path from inward tile to zone center
     *
     * Preservation Rules:
     * - Only clears walls, rocks, and shrubbery
     * - Preserves ports, cisterns, exits, and other special tiles
     * - Avoids overwriting already-clear floor tiles
     *
     * @param {number} exitX - X coordinate of the exit tile
     * @param {number} exitY - Y coordinate of the exit tile
     */
    clearPathToExit(exitX, exitY) {
        // Step 1: Calculate inward position (one tile from exit toward interior)
        let inwardX = exitX;
        let inwardY = exitY;

        // Determine inward direction based on exit edge position
        if (exitY === 0) {
            // Top edge exit - clear downward
            inwardY = 1;
        } else if (exitY === GRID_SIZE - 1) {
            // Bottom edge exit - clear upward
            inwardY = GRID_SIZE - 2;
        } else if (exitX === 0) {
            // Left edge exit - clear rightward
            inwardX = 1;
        } else if (exitX === GRID_SIZE - 1) {
            // Right edge exit - clear leftward
            inwardX = GRID_SIZE - 2;
        }

        // Step 2: Clear the immediately adjacent inward tile
        const adjacentTile = this.gridManager.getTile(inwardX, inwardY);
        if (isWall(adjacentTile) || isRock(adjacentTile) || isShrubbery(adjacentTile)) {
            this.gridManager.setTile(inwardX, inwardY, TILE_TYPES.FLOOR);
        }

        // Step 3: Clear 3x3 area around inward tile for wider entry zone
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;  // Skip center (already cleared above)

                const nx = inwardX + dx;
                const ny = inwardY + dy;

                // Stay within interior bounds (avoid edges)
                if (nx >= 1 && nx < GRID_SIZE - 1 && ny >= 1 && ny < GRID_SIZE - 1) {
                    const tile = this.gridManager.getTile(nx, ny);

                    // Only clear obstacles, preserve special tiles
                    if (isWall(tile) || isRock(tile) || isShrubbery(tile)) {
                        this.gridManager.setTile(nx, ny, TILE_TYPES.FLOOR);
                    }
                }
            }
        }

        // Step 4: Ensure connectivity to zone center
        this.clearPathToCenter(inwardX, inwardY);
    }

    /**
     * Clears a path from a starting position toward the zone center.
     * Uses greedy pathfinding (not optimal, but simple and sufficient).
     *
     * Algorithm:
     * 1. Clear 3x3 area around starting position to prevent isolation
     * 2. Iteratively move toward center one tile at a time:
     *    - Prioritize X movement if |deltaX| > 0
     *    - Then Y movement if |deltaY| > 0
     *    - Clear each tile along the path
     * 3. Stop when within 1 tile of center (Chebyshev distance)
     *
     * Why Greedy Instead of A*:
     * - Simpler implementation (no priority queue, heuristics)
     * - Sufficient for this use case (just need *a* path, not *optimal* path)
     * - Faster execution for small grids
     * - Creates straight-ish paths that look natural
     *
     * Movement Priority (X before Y):
     * Creates paths that tend to move horizontally first, then vertically.
     * This creates more rectangular-feeling paths rather than diagonal.
     *
     * Preservation:
     * - Exits: Must preserve for zone transitions
     * - Ports: Must preserve for escape mechanics
     * - Only clears walls, rocks, and shrubbery
     *
     * @param {number} startX - Starting X coordinate
     * @param {number} startY - Starting Y coordinate
     */
    clearPathToCenter(startX, startY) {
        // Calculate zone center
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);

        let currentX = startX;
        let currentY = startY;

        // Step 1: Clear 3x3 area around starting position
        // Prevents isolated starting positions completely surrounded by obstacles
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = startX + dx;
                const ny = startY + dy;

                // Stay within interior bounds
                if (nx >= 1 && nx < GRID_SIZE - 1 && ny >= 1 && ny < GRID_SIZE - 1) {
                    const tile = this.gridManager.getTile(nx, ny);

                    // Preserve important structures
                    const isPortTile = isPort(tile);
                    const isExitTile = isExit(tile);

                    if (!isPortTile && !isExitTile && (isWall(tile) || isRock(tile) || isShrubbery(tile))) {
                        this.gridManager.setTile(nx, ny, TILE_TYPES.FLOOR);
                    }
                }
            }
        }

        // Step 2: Greedy pathfinding toward center
        // Continue until within 1 tile of center (Chebyshev distance <= 1)
        while (Math.abs(currentX - centerX) > 1 || Math.abs(currentY - centerY) > 1) {
            // Move one step toward center
            // Priority: X movement first, then Y movement
            if (currentX < centerX) {
                currentX++;  // Move right
            } else if (currentX > centerX) {
                currentX--;  // Move left
            } else if (currentY < centerY) {
                currentY++;  // Move down
            } else if (currentY > centerY) {
                currentY--;  // Move up
            }

            // Clear current tile if it's an obstacle
            const tile = this.gridManager.getTile(currentX, currentY);
            const isPortTile = isPort(tile);
            const isExitTile = isExit(tile);

            if (!isPortTile && !isExitTile && (isWall(tile) || isRock(tile) || isShrubbery(tile))) {
                this.gridManager.setTile(currentX, currentY, TILE_TYPES.FLOOR);
            }

            // Safety check: prevent infinite loops
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
