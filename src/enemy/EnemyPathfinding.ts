/**
 * Enemy pathfinding system using Breadth-First Search (BFS).
 *
 * Implements pathfinding for 6 different enemy types, each with unique
 * movement patterns inspired by chess pieces:
 * - lizardy: Vertical only (pawn-like)
 * - lizardo: 8-way movement (king-like)
 * - lizord: L-shaped jumps (knight-like)
 * - zard: Diagonal only (bishop-like)
 * - lizardeaux: Orthogonal any distance (rook-like)
 * - lazerd: Any direction any distance (queen-like)
 *
 * Uses BFS instead of A* because:
 * 1. Guarantees shortest path in unweighted grid
 * 2. Simpler implementation (no heuristic needed)
 * 3. Sufficient performance for grid sizes used
 */
import { GRID_SIZE } from '@core/constants/index';

export class EnemyPathfinding {
    /**
     * Finds the shortest path from start to target using Breadth-First Search.
     *
     * Algorithm (BFS):
     * 1. Start from current position
     * 2. Explore all neighbors at distance 1
     * 3. Then all neighbors at distance 2, etc.
     * 4. Stop when target found or all reachable tiles explored
     * 5. Reconstruct path by backtracking through parent pointers
     *
     * Why BFS:
     * - Guarantees shortest path (fewest moves)
     * - Explores layer by layer (distance from start)
     * - No heuristic needed (unlike A*)
     *
     * Path Reconstruction:
     * Parent map stores: child -> parent relationships
     * - Walk backwards from target to start
     * - Unshift each position to build path in correct order
     * - path[0] = start, path[1] = first move, path[n] = target
     *
     * @param {number} startX - Enemy's current X position
     * @param {number} startY - Enemy's current Y position
     * @param {number} targetX - Target X position (usually player)
     * @param {number} targetY - Target Y position (usually player)
     * @param {Array<Array>} grid - The game grid for walkability checks
     * @param {string} enemyType - Enemy type (determines movement rules)
     * @param {Function} isWalkableFunc - Function(x, y, grid) -> boolean
     * @returns {Array<{x, y}>|null} Path array or null if unreachable
     */
    static findPath(
        startX: number,
        startY: number,
        targetX: number,
        targetY: number,
        grid: unknown[][],
        enemyType: string,
        isWalkableFunc: (x: number, y: number, grid: unknown[][]) => boolean
    ): Array<{ x: number; y: number }> | null {
        // Get movement directions specific to this enemy type
        const directions: Array<{ x: number; y: number }> = this.getMovementDirectionsForType(enemyType);

        // BFS data structures
        const visited = new Set<string>();           // Tracks explored positions
        const parent = new Map<string, { x: number; y: number } | null>();            // child position -> parent position
        const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];  // BFS queue (FIFO)

        // Initialize starting position
        visited.add(`${startX},${startY}`);
        parent.set(`${startX},${startY}`, null);  // Start has no parent

        // BFS exploration loop
        while (queue.length > 0) {
            const current: { x: number; y: number } | undefined = queue.shift();  // FIFO: explore earliest added position

            if (!current) continue;

            // Check if we reached the target
            if (current.x === targetX && current.y === targetY) {
                // Reconstruct path by backtracking through parents
                const path: Array<{ x: number; y: number }> = [];
                let pos: { x: number; y: number } | null = current;

                while (pos) {
                    path.unshift(pos);  // Add to front (reverse order)
                    const key: string = `${pos.x},${pos.y}`;
                    pos = parent.get(key) ?? null;  // Move to parent
                }

                // path[0] = start, path[1] = next move, path[n] = target
                return path;
            }

            // Explore all neighbors from current position
            for (const dir of directions) {
                const nx: number = current.x + dir.x;
                const ny: number = current.y + dir.y;
                const key: string = `${nx},${ny}`;

                // Only visit if unvisited and walkable
                if (!visited.has(key) && isWalkableFunc(nx, ny, grid)) {
                    visited.add(key);
                    parent.set(key, current);  // Remember how we got here
                    queue.push({ x: nx, y: ny });  // Add to exploration queue
                }
            }
        }

        // Queue empty without finding target = no path exists
        return null;
    }

    /**
     * Returns valid movement directions for a given enemy type.
     * Each enemy has unique movement rules inspired by chess pieces.
     *
     * Enemy Movement Patterns:
     *
     * lizardy (Pawn-like):
     * - Vertical only: North/South
     * - Limited mobility encourages player to avoid direct vertical lines
     * - Attacks diagonally but moves vertically
     *
     * lizardo (King-like):
     * - All 8 directions: orthogonal + diagonal
     * - Most versatile basic enemy
     * - Can reach any adjacent tile
     *
     * lizord (Knight-like):
     * - L-shaped moves: 2 tiles in one direction, 1 perpendicular
     * - Can jump over obstacles (not checked in this function)
     * - 8 possible L-shaped moves
     * - Unpredictable movement pattern
     *
     * zard (Bishop-like):
     * - Diagonal only: 4 directions
     * - Complements orthogonal movers
     * - Creates tactical pressure on diagonal lines
     *
     * lizardeaux (Rook-like):
     * - Orthogonal only: N/S/E/W
     * - Can move any distance (handled in movement logic)
     * - Strong on open straight lines
     *
     * lazerd (Queen-like):
     * - All 8 directions like King
     * - Can move any distance (handled in movement logic)
     * - Most dangerous enemy type
     *
     * Note: "Any distance" movement is handled in actual movement logic,
     * not in these direction vectors. These just define the valid angles.
     *
     * @param {string} enemyType - The enemy type identifier
     * @returns {Array<{x: number, y: number}>} Array of direction vectors
     */
    static getMovementDirectionsForType(enemyType: string): Array<{ x: number; y: number }> {
        // King-like: 8-way movement (orthogonal + diagonal)
        if (enemyType === 'lizardo' || enemyType === 'lazord') {
            return [
                { x: 0, y: -1 },   // North
                { x: 0, y: 1 },    // South
                { x: -1, y: 0 },   // West
                { x: 1, y: 0 },    // East
                { x: -1, y: -1 },  // Northwest
                { x: 1, y: -1 },   // Northeast
                { x: -1, y: 1 },   // Southwest
                { x: 1, y: 1 }     // Southeast
            ];
        }
        // Bishop-like: Diagonal only (4 directions)
        else if (enemyType === 'zard') {
            return [
                { x: -1, y: -1 },  // Northwest
                { x: 1, y: -1 },   // Northeast
                { x: -1, y: 1 },   // Southwest
                { x: 1, y: 1 }     // Southeast
            ];
        }
        // Knight-like: L-shaped jumps (8 positions)
        else if (enemyType === 'lizord') {
            return [
                { x: 1, y: 2 },    // 1 East, 2 South
                { x: 1, y: -2 },   // 1 East, 2 North
                { x: -1, y: 2 },   // 1 West, 2 South
                { x: -1, y: -2 },  // 1 West, 2 North
                { x: 2, y: 1 },    // 2 East, 1 South
                { x: 2, y: -1 },   // 2 East, 1 North
                { x: -2, y: 1 },   // 2 West, 1 South
                { x: -2, y: -1 }   // 2 West, 1 North
            ];
        }
        // Pawn-like: Vertical only (2 directions)
        else if (enemyType === 'lizardy') {
            return [
                { x: 0, y: -1 },   // North
                { x: 0, y: 1 }     // South
            ];
        }
        // Queen-like: All 8 directions, any distance
        else if (enemyType === 'lazerd') {
            return [
                { x: 0, y: -1 },   // North
                { x: 0, y: 1 },    // South
                { x: -1, y: 0 },   // West
                { x: 1, y: 0 },    // East
                { x: -1, y: -1 },  // Northwest
                { x: 1, y: -1 },   // Northeast
                { x: -1, y: 1 },   // Southwest
                { x: 1, y: 1 }     // Southeast
            ];
        }
        // Rook-like: Orthogonal only, any distance
        else if (enemyType === 'lizardeaux') {
            return [
                { x: 0, y: -1 },   // North
                { x: 0, y: 1 },    // South
                { x: -1, y: 0 },   // West
                { x: 1, y: 0 }     // East
            ];
        }
        // Default: Basic orthogonal movement (4 directions)
        else {
            return [
                { x: 0, y: -1 },   // North
                { x: 0, y: 1 },    // South
                { x: -1, y: 0 },   // West
                { x: 1, y: 0 }     // East
            ];
        }
    }

    // Get movement directions for rendering arrows (instance method compatibility)
    static getMovementDirections(enemyType: string): Array<{ x: number; y: number }> {
        return this.getMovementDirectionsForType(enemyType);
    }
}
