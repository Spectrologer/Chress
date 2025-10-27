// Tactical AI system for cooperative enemy behavior and movement optimization
import { GRID_SIZE, DIRECTION_QUADRANTS } from '../core/constants/index.js';
import { EnemyPathfinding } from './EnemyPathfinding.js';

export class TacticalAI {
    // Calculate average distance to other enemies (lower is better clustering)
    calculateAllyDistance(x, y, enemies, self) {
        let totalDist = 0;
        let count = 0;
        for (const enemy of enemies) {
            if (enemy === self) continue; // skip self
            const dist = Math.abs(x - enemy.x) + Math.abs(y - enemy.y);
            if (dist > 0) { // ensure not zero
                totalDist += dist;
                count++;
            }
        }
        return count > 0 ? totalDist / count : 100; // return high value if no allies
    }

    // Calculate direction diversity relative to player (higher is better, means less crowding in same direction)
    calculateDirectionDiversity(x, y, px, py, enemies, self) {
        const dx = x - px;
        const dy = y - py;
        let thisQuad = 0;
        if (dx > 0 && dy > 0) thisQuad = DIRECTION_QUADRANTS.NORTHEAST;
        else if (dx > 0 && dy < 0) thisQuad = DIRECTION_QUADRANTS.SOUTHEAST;
        else if (dx < 0 && dy > 0) thisQuad = DIRECTION_QUADRANTS.NORTHWEST;
        else if (dx < 0 && dy < 0) thisQuad = DIRECTION_QUADRANTS.SOUTHWEST;
        else if (dx > 0 && dy === 0) thisQuad = DIRECTION_QUADRANTS.EAST;
        else if (dx < 0 && dy === 0) thisQuad = DIRECTION_QUADRANTS.WEST;
        else if (dy > 0 && dx === 0) thisQuad = DIRECTION_QUADRANTS.NORTH;
        else if (dy < 0 && dx === 0) thisQuad = DIRECTION_QUADRANTS.SOUTH;

        let count = 0;
        let total = 0;
        for (const enemy of enemies) {
            if (enemy === self) continue;
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
        return total > 0 ? (total - count) / total : 1; // higher diversity when fewer in same quadrant
    }

    // Check if position is stacked behind another enemy from player's perspective (for flanking)
    isStackedBehind(x, y, px, py, enemies, self) {
        for (const enemy of enemies) {
            if (enemy === self) continue;
            // Check if enemy is in the same line and closer to player
            const ex = enemy.x - px;
            const ey = enemy.y - py;
            const tx = x - px;
            const ty = y - py;

            // Same direction (same row or col) and enemy is between player and x,y
            if ((tx === 0 && ex === 0 && ((ty > 0 && ey > 0 && ey < ty) || (ty < 0 && ey < 0 && ey > ty))) ||
                (ty === 0 && ey === 0 && ((tx > 0 && ex > 0 && ex < tx) || (tx < 0 && ex < 0 && ex > tx)))) {
                return true;
            }

            // Diagonal check
            if (Math.abs(tx) === Math.abs(ty) && Math.abs(ex) === Math.abs(ey) &&
                Math.abs(tx) + Math.abs(ty) > Math.abs(ex) + Math.abs(ey) && tx * ex > 0 && ty * ey > 0) {
                return true;
            }
        }
        return false;
    }

    // Find defensive moves that increase distance from player
    getDefensiveMoves(self, playerX, playerY, proposedX, proposedY, grid, enemies) {
        const alternatives = [];
        const dirs = EnemyPathfinding.getMovementDirections(self.enemyType);

        const currentDist = Math.abs(self.x - playerX) + Math.abs(self.y - playerY);
        const proposedDist = Math.abs(proposedX - playerX) + Math.abs(proposedY - playerY);

        // Find defensive moves that would be safer than the proposed move
        for (const dir of dirs) {
            let newX = self.x + dir.x;
            let newY = self.y + dir.y;

            // Check if move would be out of bounds
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) continue;

            // Must be walkable and not occupied
            if (!self.isWalkable(newX, newY, grid)) continue;
            if (enemies.find(e => e.x === newX && e.y === newY)) continue;

            // Calculate distance from new position to player
            const newDist = Math.abs(newX - playerX) + Math.abs(newY - playerY);

            // Only consider moves that increase distance AND make the position less vulnerable
            // Vulnerability is being adjacent (distance <= 2)
            const currentVulnerable = currentDist <= 2;
            const newVulnerable = newDist <= 2;

            if (newDist > currentDist && (!newVulnerable || !currentVulnerable)) {
                alternatives.push({
                    x: newX,
                    y: newY,
                    distance: newDist,
                    improvement: newDist - currentDist
                });
            }
        }

        // Sort by greatest distance improvement
        alternatives.sort((a, b) => b.improvement - a.improvement);

        // Return just the positions
        return alternatives.map(alt => ({ x: alt.x, y: alt.y }));
    }
}
