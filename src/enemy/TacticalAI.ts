/**
 * Tactical AI system for cooperative enemy behavior and movement optimization.
 *
 * This system enables enemies to make intelligent tactical decisions by:
 * - Avoiding clustering in the same direction (flanking behavior)
 * - Maintaining cooperative formations
 * - Making defensive decisions when threatened
 * - Preventing stacking that blocks allies
 *
 * Key Concepts:
 * - Ally Distance: How close enemies are to each other (clustering metric)
 * - Direction Diversity: Distribution of enemies around the player (prevents grouping)
 * - Stacking: When enemies align in a line toward the player (inefficient positioning)
 * - Defensive Moves: Retreating when threatened to increase survival
 */
import { GRID_SIZE, DIRECTION_QUADRANTS } from '../core/constants/index.ts';
import { EnemyPathfinding } from './EnemyPathfinding.js';

export class TacticalAI {
    /**
     * Calculates the average Manhattan distance from a position to all allied enemies.
     * Used to measure clustering - lower values mean tighter formations.
     *
     * Algorithm:
     * 1. Sum Manhattan distance to all other enemies
     * 2. Calculate average distance
     * 3. Return high penalty (100) if no allies exist
     *
     * This metric helps enemies maintain cooperative formations without
     * spreading too far apart or clustering too tightly.
     *
     * @param {number} x - X coordinate to evaluate
     * @param {number} y - Y coordinate to evaluate
     * @param {Array<Enemy>} enemies - All enemies in the zone
     * @param {Enemy} self - The enemy making the calculation (excluded from average)
     * @returns {number} Average Manhattan distance to allies (lower = tighter clustering)
     */
    calculateAllyDistance(x, y, enemies, self) {
        let totalDist = 0;
        let count = 0;

        for (const enemy of enemies) {
            if (enemy === self) continue; // Skip self to avoid zero distance

            // Manhattan distance (grid-based movement distance)
            const dist = Math.abs(x - enemy.x) + Math.abs(y - enemy.y);

            if (dist > 0) { // Ensure not zero (defensive check)
                totalDist += dist;
                count++;
            }
        }

        // Return high value if no allies to penalize isolated positions
        return count > 0 ? totalDist / count : 100;
    }

    /**
     * Calculates directional diversity to encourage flanking behavior.
     * Measures how well-distributed enemies are around the player.
     *
     * Algorithm:
     * 1. Map the position to a directional quadrant relative to player
     *    (8 quadrants: N, NE, E, SE, S, SW, W, NW)
     * 2. Count how many other enemies are in the same quadrant
     * 3. Return diversity score: (total - sameQuadrant) / total
     *
     * Higher values (closer to 1.0) indicate better positioning because
     * fewer allies are attacking from the same direction. This encourages
     * enemies to spread out and flank the player rather than bunch up.
     *
     * Example:
     * - 4 enemies total, 3 in NE quadrant, 1 in SW = low diversity (0.25)
     * - 4 enemies total, 1 in each quadrant = high diversity (0.75)
     *
     * @param {number} x - X coordinate to evaluate
     * @param {number} y - Y coordinate to evaluate
     * @param {number} px - Player X position
     * @param {number} py - Player Y position
     * @param {Array<Enemy>} enemies - All enemies in the zone
     * @param {Enemy} self - The enemy making the calculation
     * @returns {number} Diversity score 0.0-1.0 (higher = more spread out)
     */
    calculateDirectionDiversity(x, y, px, py, enemies, self) {
        // Calculate delta from player to proposed position
        const dx = x - px;
        const dy = y - py;

        // Map position to directional quadrant
        let thisQuad = 0;
        if (dx > 0 && dy > 0) thisQuad = DIRECTION_QUADRANTS.NORTHEAST;
        else if (dx > 0 && dy < 0) thisQuad = DIRECTION_QUADRANTS.SOUTHEAST;
        else if (dx < 0 && dy > 0) thisQuad = DIRECTION_QUADRANTS.NORTHWEST;
        else if (dx < 0 && dy < 0) thisQuad = DIRECTION_QUADRANTS.SOUTHWEST;
        else if (dx > 0 && dy === 0) thisQuad = DIRECTION_QUADRANTS.EAST;
        else if (dx < 0 && dy === 0) thisQuad = DIRECTION_QUADRANTS.WEST;
        else if (dy > 0 && dx === 0) thisQuad = DIRECTION_QUADRANTS.NORTH;
        else if (dy < 0 && dx === 0) thisQuad = DIRECTION_QUADRANTS.SOUTH;

        // Count allies in the same quadrant
        let count = 0;  // Enemies in same quadrant as proposed position
        let total = 0;  // Total other enemies

        for (const enemy of enemies) {
            if (enemy === self) continue;

            // Calculate ally's quadrant relative to player
            const ex = enemy.x - px;
            const ey = enemy.y - py;
            let enemyQuad = 0;

            if (ex > 0 && ey > 0) enemyQuad = DIRECTION_QUADRANTS.NORTHEAST;
            else if (ex > 0 && ey < 0) enemyQuad = DIRECTION_QUADRANTS.SOUTHEAST;
            else if (ex < 0 && ey > 0) enemyQuad = DIRECTION_QUADRANTS.NORTHWEST;
            else if (ex < 0 && ey < 0) enemyQuad = DIRECTION_QUADRANTS.SOUTHWEST;
            else if (ex > 0 && ey === 0) enemyQuad = DIRECTION_QUADRANTS.EAST;
            else if (ex < 0 && ey === 0) enemyQuad = DIRECTION_QUADRANTS.WEST;
            else if (ey > 0 && ex === 0) enemyQuad = DIRECTION_QUADRANTS.NORTH;
            else if (ey < 0 && ex === 0) enemyQuad = DIRECTION_QUADRANTS.SOUTH;

            total++;
            if (enemyQuad === thisQuad) count++;
        }

        // Higher diversity when fewer enemies in same quadrant
        // (total - count) = enemies in different quadrants
        return total > 0 ? (total - count) / total : 1;
    }

    /**
     * Checks if a position is directly behind another enemy from the player's perspective.
     * Stacking is inefficient because blocked enemies can't attack effectively.
     *
     * Algorithm:
     * For each ally, check two stacking scenarios:
     *
     * 1. Orthogonal Stacking (same row/column):
     *    - Both enemies aligned on same axis (same X or same Y)
     *    - Ally is between player and proposed position
     *    - Example: Player at (5,5), Ally at (5,7), Proposed (5,9) = STACKED
     *
     * 2. Diagonal Stacking (45-degree angles):
     *    - Both enemies on same diagonal line (|dx| == |dy|)
     *    - Ally is closer to player than proposed position
     *    - Same directional signs (both NE, both SW, etc.)
     *
     * Returns true if stacking detected, encouraging enemies to find
     * unobstructed attack angles instead of lining up behind allies.
     *
     * @param {number} x - X coordinate to evaluate
     * @param {number} y - Y coordinate to evaluate
     * @param {number} px - Player X position
     * @param {number} py - Player Y position
     * @param {Array<Enemy>} enemies - All enemies in the zone
     * @param {Enemy} self - The enemy making the calculation
     * @returns {boolean} True if position would be stacked behind an ally
     */
    isStackedBehind(x, y, px, py, enemies, self) {
        for (const enemy of enemies) {
            if (enemy === self) continue;

            // Calculate positions relative to player
            const ex = enemy.x - px;  // Ally delta from player
            const ey = enemy.y - py;
            const tx = x - px;        // Proposed position delta from player
            const ty = y - py;

            // Check 1: Orthogonal stacking (same row or column)
            // Both on same vertical line (tx === 0 && ex === 0)
            const verticalStack = tx === 0 && ex === 0 &&
                ((ty > 0 && ey > 0 && ey < ty) ||  // Both north, ally closer
                 (ty < 0 && ey < 0 && ey > ty));   // Both south, ally closer

            // Both on same horizontal line (ty === 0 && ey === 0)
            const horizontalStack = ty === 0 && ey === 0 &&
                ((tx > 0 && ex > 0 && ex < tx) ||  // Both east, ally closer
                 (tx < 0 && ex < 0 && ex > tx));   // Both west, ally closer

            if (verticalStack || horizontalStack) {
                return true;
            }

            // Check 2: Diagonal stacking (45-degree angles)
            const onSameDiagonal = Math.abs(tx) === Math.abs(ty) &&  // Proposed is diagonal
                                   Math.abs(ex) === Math.abs(ey);     // Ally is diagonal

            const allyCloser = Math.abs(tx) + Math.abs(ty) >          // Proposed farther
                              Math.abs(ex) + Math.abs(ey);            // than ally

            const sameDirection = tx * ex > 0 && ty * ey > 0;         // Same quadrant

            if (onSameDiagonal && allyCloser && sameDirection) {
                return true;
            }
        }

        return false;
    }

    /**
     * Finds defensive move alternatives when an enemy feels threatened.
     * Returns positions that increase distance from player to improve survival odds.
     *
     * Algorithm:
     * 1. Get all valid movement directions for this enemy type
     * 2. Filter moves that are walkable and unoccupied
     * 3. Calculate Manhattan distance to player for each move
     * 4. Keep only moves that:
     *    a) Increase distance from current position
     *    b) Reduce vulnerability (move out of attack range if possible)
     * 5. Sort by greatest distance improvement
     *
     * Vulnerability Threshold:
     * - Distance <= 2 is considered "threatened" because:
     *   - Player can move 1 tile per turn
     *   - Enemy needs 2+ tiles distance to safely retreat
     *   - Provides one turn buffer before player can attack
     *
     * Use Case:
     * Called when enemy's aggressive move would keep them in danger zone.
     * Helps wounded enemies retreat or maintain safe positioning.
     *
     * @param {Enemy} self - The enemy considering defensive action
     * @param {number} playerX - Player's X position
     * @param {number} playerY - Player's Y position
     * @param {number} proposedX - Originally proposed move X (unused but kept for API)
     * @param {number} proposedY - Originally proposed move Y (unused but kept for API)
     * @param {Array<Array>} grid - The game grid for walkability checks
     * @param {Array<Enemy>} enemies - All enemies (to avoid occupied tiles)
     * @returns {Array<{x: number, y: number}>} Defensive positions, sorted by best improvement
     */
    getDefensiveMoves(self, playerX, playerY, proposedX, proposedY, grid, enemies) {
        const alternatives = [];
        const dirs = EnemyPathfinding.getMovementDirections(self.enemyType);

        // Calculate current distances
        const currentDist = Math.abs(self.x - playerX) + Math.abs(self.y - playerY);
        const proposedDist = Math.abs(proposedX - playerX) + Math.abs(proposedY - playerY);

        // Evaluate all possible moves for defensive value
        for (const dir of dirs) {
            let newX = self.x + dir.x;
            let newY = self.y + dir.y;

            // Bounds check
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) continue;

            // Must be walkable terrain
            if (!self.isWalkable(newX, newY, grid)) continue;

            // Must not be occupied by another enemy
            if (enemies.find(e => e.x === newX && e.y === newY)) continue;

            // Calculate distance from new position to player
            const newDist = Math.abs(newX - playerX) + Math.abs(newY - playerY);

            // Assess vulnerability at each position
            // Distance <= 2 means player can reach in 1-2 turns (threatened)
            const currentVulnerable = currentDist <= 2;
            const newVulnerable = newDist <= 2;

            // Only consider moves that:
            // 1. Increase distance from current position
            // 2. Either move out of threat range, or don't make things worse
            if (newDist > currentDist && (!newVulnerable || !currentVulnerable)) {
                alternatives.push({
                    x: newX,
                    y: newY,
                    distance: newDist,
                    improvement: newDist - currentDist  // How much safer this move is
                });
            }
        }

        // Sort by greatest distance improvement (best defensive moves first)
        alternatives.sort((a, b) => b.improvement - a.improvement);

        // Return just the positions (strip metadata)
        return alternatives.map(alt => ({ x: alt.x, y: alt.y }));
    }
}
