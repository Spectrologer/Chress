export class Enemy {
    constructor(data) {
        this.x = data.x;
        this.y = data.y;
        this.enemyType = data.enemyType || 'lizard';
        this.id = data.id;
        this.health = 1;
        this.attack = 1;
        this.justAttacked = false;
        this.attackAnimation = 0; // Frames remaining for attack animation
        this.deathAnimation = 0; // Frames remaining for death animation
        this.bumpOffsetX = 0;
        this.bumpOffsetY = 0;
        this.bumpFrames = 0;
    }

    planMoveTowards(player, grid, enemies, playerPos) {
        const playerX = playerPos.x;
        const playerY = playerPos.y;

        // Check if player is already at the same position
        if (this.x === playerX && this.y === playerY) {
            return null; // Can't move onto player
        }

        // Use BFS to find the shortest path to the player
        const path = this.findPath(this.x, this.y, playerX, playerY, grid);

        if (path && path.length > 1) {
            const next = path[1];
            const newX = next.x;
            const newY = next.y;

            // Check if within bounds and walkable (should be, since path found)
            if (this.isWalkable(newX, newY, grid)) {
                // Check if the target position has the player
                if (newX === playerX && newY === playerY) {
                    // Enemy tries to move onto player - register attack
                    console.log('Enemy tries to move onto player - registering one attack!');
                    player.takeDamage(this.attack);
                    player.startBump(this.x - playerX, this.y - playerY);
                    this.justAttacked = true;
                    console.log(`Enemy hit player! Player health: ${player.getHealth()}`);
                    if (player.isDead()) {
                        console.log('Player died!');
                    }
                    // Enemy does not move
                    return null;
                } else {
                    // Check if another enemy is already at the target position
                    const enemyAtTarget = enemies.find(enemy => enemy.x === newX && enemy.y === newY);
                    if (enemyAtTarget) {
                        // Can't move onto another enemy, stay put
                        return null;
                    } else {
                        // Return intended move
                        return { x: newX, y: newY };
                    }
                }
            }
        }

        // No path found or no valid move, stay put
        return null;
    }

    // For backward compatibility or single enemy move (though we won't use this anymore)
    moveTowards(player, grid) {
        const move = this.planMoveTowards(player, grid, [], player.getPosition());
        if (move) {
            this.x = move.x;
            this.y = move.y;
        }
    }

    findPath(startX, startY, targetX, targetY, grid) {
        let directions;
        if (this.enemyType === 'lizardo') {
            // Lizardo can move orthogonally AND diagonally (8 directions)
            directions = [
                { x: 0, y: -1 }, // North
                { x: 0, y: 1 },  // South
                { x: -1, y: 0 }, // West
                { x: 1, y: 0 },  // East
                { x: -1, y: -1 }, // Northwest
                { x: 1, y: -1 },  // Northeast
                { x: -1, y: 1 },  // Southwest
                { x: 1, y: 1 }    // Southeast
            ];
        } else {
            // Regular lizard: only orthogonal movement (4 directions)
            directions = [
                { x: 0, y: -1 }, // North
                { x: 0, y: 1 },  // South
                { x: -1, y: 0 }, // West
                { x: 1, y: 0 }   // East
            ];
        }

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

                if (!visited.has(key) && this.isWalkable(nx, ny, grid)) {
                    visited.add(key);
                    parent.set(key, current);
                    queue.push({ x: nx, y: ny });
                }
            }
        }

        return null; // No path found
    }

    isWalkable(x, y, grid) {
        // Same logic as Player.isWalkable but enemies can also walk on water/food
        // Enemies avoid walls, rocks, grass, house, but can walk on floor, exit, water, food, notes
        if (x < 0 || x >= grid.length || y < 0 || y >= grid.length) {
            return false;
        }

        const tile = grid[y][x];
        return tile === 0 || tile === 3 || tile === 6 || (tile && tile.type === 7) || (tile && tile.type === 10);  // FLOOR, EXIT, WATER, FOOD, NOTE
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    isDead() {
        return this.health <= 0;
    }



    startDeathAnimation() {
        this.deathAnimation = 15; // 15 frames of death animation
    }

    startBump(deltaX, deltaY) {
        // Set initial bump offset (towards the other entity)
        this.bumpOffsetX = deltaX * 16; // Half tile (TILE_SIZE is 64, but 16 for subtle bump)
        this.bumpOffsetY = deltaY * 16;
        this.bumpFrames = 10; // 10 frames of bump animation
    }

    updateAnimations() {
        if (this.deathAnimation > 0) {
            this.deathAnimation--;
        }
        if (this.bumpFrames > 0) {
            this.bumpFrames--;
            // Gradually reduce the offset
            this.bumpOffsetX *= 0.8;
            this.bumpOffsetY *= 0.8;
        }
    }
}
