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
    }

    moveTowards(player, grid) {
        // Improved pathfinding: try up to two directions to better reach the player
        const playerX = player.x;
        const playerY = player.y;

        // Check if player is already at the same position
        if (this.x === playerX && this.y === playerY) {
            return; // Can't move onto player
        }

        // Calculate direction to player
        const dx = playerX - this.x;
        const dy = playerY - this.y;

        // Try movements in order of preference until one succeeds
        const possibleMoves = [];

        if (Math.abs(dx) >= Math.abs(dy)) {
            // Prefer horizontal movement
            possibleMoves.push({x: this.x + (dx > 0 ? 1 : dx < 0 ? -1 : 0), y: this.y}); // Horizontal
            possibleMoves.push({x: this.x, y: this.y + (dy > 0 ? 1 : dy < 0 ? -1 : 0)}); // Vertical
        } else {
            // Prefer vertical movement
            possibleMoves.push({x: this.x, y: this.y + (dy > 0 ? 1 : dy < 0 ? -1 : 0)}); // Vertical
            possibleMoves.push({x: this.x + (dx > 0 ? 1 : dx < 0 ? -1 : 0), y: this.y}); // Horizontal
        }

        // Try each possible move
        for (const move of possibleMoves) {
            const newX = move.x;
            const newY = move.y;

            // Check if within bounds and walkable
            if (this.isWalkable(newX, newY, grid)) {
                // Check if the target position has the player
                if (newX === playerX && newY === playerY) {
                    // Enemy tries to move onto player - register attack
                    console.log('Enemy tries to move onto player - registering one attack!');
                    player.takeDamage(this.attack);
                    this.startAttackAnimation();
                    this.justAttacked = true;
                    console.log(`Enemy hit player! Player health: ${player.getHealth()}`);
                    if (player.isDead()) {
                        console.log('Player died!');
                    }
                    // Enemy does not move
                    return;
                } else {
                    // Move normally
                    this.x = newX;
                    this.y = newY;
                    return;
                }
            }
        }

        // If no movement possible, stay put
    }

    isWalkable(x, y, grid) {
        // Same logic as Player.isWalkable but enemies can also walk on water/food
        // Enemies avoid walls, rocks, grass, house, but can walk on floor, exit, water, food
        if (x < 0 || x >= grid.length || y < 0 || y >= grid.length) {
            return false;
        }

        const tile = grid[y][x];
        return tile === 0 || tile === 3 || tile === 6 || (tile && tile.type === 7);  // FLOOR, EXIT, WATER, FOOD
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

    startAttackAnimation() {
        this.attackAnimation = 10; // 10 frames of attack animation
    }

    startDeathAnimation() {
        this.deathAnimation = 15; // 15 frames of death animation
    }

    updateAnimations() {
        if (this.attackAnimation > 0) {
            this.attackAnimation--;
        }
        if (this.deathAnimation > 0) {
            this.deathAnimation--;
        }
    }
}
