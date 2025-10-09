import { GRID_SIZE } from '../constants.js';

export class EnemyPathfinding {
    // BFS-based pathfinding with different movement rules per enemy type
    static findPath(startX, startY, targetX, targetY, grid, enemyType, isWalkableFunc) {
        const directions = this.getMovementDirectionsForType(enemyType);

        const visited = new Set();
        const parent = new Map();
        const queue = [{ x: startX, y: startY }];

        visited.add(`${startX},${startY}`);
        parent.set(`${startX},${startY}`, null);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === targetX && current.y === targetY) {
                // Reconstruct path
                const path = [];
                let pos = current;
                while (pos) {
                    path.unshift(pos);
                    const key = `${pos.x},${pos.y}`;
                    pos = parent.get(key);
                }
                return path; // path[0] is start (this), path[1] is next step
            }

            for (const dir of directions) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                const key = `${nx},${ny}`;

                if (!visited.has(key) && isWalkableFunc(nx, ny, grid)) {
                    visited.add(key);
                    parent.set(key, current);
                    queue.push({ x: nx, y: ny });
                }
            }
        }

        return null; // No path found
    }

    // Get movement directions based on enemy type
    static getMovementDirectionsForType(enemyType) {
        if (enemyType === 'lizardo' || enemyType === 'lazord') {
            // Lizardo and Lazord can move orthogonally AND diagonally (8 directions)
            return [
                { x: 0, y: -1 }, // North
                { x: 0, y: 1 },  // South
                { x: -1, y: 0 }, // West
                { x: 1, y: 0 },  // East
                { x: -1, y: -1 }, // Northwest
                { x: 1, y: -1 },  // Northeast
                { x: -1, y: 1 },  // Southwest
                { x: 1, y: 1 }    // Southeast
            ];
        } else if (enemyType === 'zard') {
            // Zard can only move diagonally (4 directions like a bishop)
            return [
                { x: -1, y: -1 }, // Northwest
                { x: 1, y: -1 },  // Northeast
                { x: -1, y: 1 },  // Southwest
                { x: 1, y: 1 }    // Southeast
            ];
        } else if (enemyType === 'lizord') {
            // Lizord: knight-like movement (L-shape: 1 in one direction, 2 in perpendicular)
            return [
                { x: 1, y: 2 },
                { x: 1, y: -2 },
                { x: -1, y: 2 },
                { x: -1, y: -2 },
                { x: 2, y: 1 },
                { x: 2, y: -1 },
                { x: -2, y: 1 },
                { x: -2, y: -1 }
            ];
        } else if (enemyType === 'lazerd') {
            // Lazerd: queen-like movement (orthogonal and diagonal, any distance)
            return [
                { x: 0, y: -1 }, // North
                { x: 0, y: 1 },  // South
                { x: -1, y: 0 }, // West
                { x: 1, y: 0 },  // East
                { x: -1, y: -1 }, // Northwest
                { x: 1, y: -1 },  // Northeast
                { x: -1, y: 1 },  // Southwest
                { x: 1, y: 1 }    // Southeast
            ];
        } else if (enemyType === 'lizardeaux') {
            // Lizardeaux: rook-like movement (orthogonal, any distance)
            return [
                { x: 0, y: -1 }, // North
                { x: 0, y: 1 },  // South
                { x: -1, y: 0 }, // West
                { x: 1, y: 0 }   // East
            ];
        } else {
            // Regular lizard: only orthogonal movement (4 directions)
            return [
                { x: 0, y: -1 }, // North
                { x: 0, y: 1 },  // South
                { x: -1, y: 0 }, // West
                { x: 1, y: 0 }   // East
            ];
        }
    }

    // Get movement directions for rendering arrows (instance method compatibility)
    static getMovementDirections(enemyType) {
        return this.getMovementDirectionsForType(enemyType);
    }
}
