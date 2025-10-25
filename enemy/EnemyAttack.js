import audioService from '../utils/AudioService.js';

export const EnemyAttackMixin = {
    performRamFromDistance(player, playerX, playerY, grid, enemies, isSimulation = false) {
        // Ram attack from adjacent: check if in straight line (orthogonal or diagonal) with clear line of sight
        const sameRow = this.y === playerY;
        const sameCol = this.x === playerX;
        const sameDiagonal = Math.abs(this.x - playerX) === Math.abs(this.y - playerY) && (playerX !== this.x) && (playerY !== this.y);

        // Enforce rook-like attacks for lizardeaux: disallow diagonal rams
        if (this.enemyType === 'lizardeaux' && sameDiagonal) {
            return false;
        }

        if (!sameRow && !sameCol && !sameDiagonal) {
            return false; // Not in straight line
        }

        // Determine direction and steps
        let stepX = 0, stepY = 0;
        let steps = 0;
        if (sameRow) {
            stepX = playerX > this.x ? 1 : -1;
            stepY = 0;
            steps = Math.abs(playerX - this.x);
        } else if (sameCol) {
            stepX = 0;
            stepY = playerY > this.y ? 1 : -1;
            steps = Math.abs(playerY - this.y);
        } else { // sameDiagonal
            stepX = playerX > this.x ? 1 : -1;
            stepY = playerY > this.y ? 1 : -1;
            steps = Math.abs(playerX - this.x);
        }

        // Check line of sight: no walls or enemies blocking
        for (let i = 1; i < steps; i++) {
            const checkX = this.x + i * stepX;
            const checkY = this.y + i * stepY;
            if (!this.isWalkable(checkX, checkY, grid)) {
                return false;
            }
            if (enemies.find(e => e.x === checkX && e.y === checkY)) {
                return false;
            }
        }

        // Add smoke animation for ram attack
        if (!isSimulation) {
            let traveledTiles = [];
            for (let i = 1; i < steps; i++) {
                const checkX = this.x + i * stepX;
                const checkY = this.y + i * stepY;
                traveledTiles.push({x: checkX, y: checkY});
            }
            if (traveledTiles.length > 0) {
                this.smokeAnimations = traveledTiles.map(t => ({x: t.x, y: t.y, frame: 18}));
            } else {
                this.smokeAnimations.push({ x: this.x, y: this.y, frame: 18 });
            }
        }

        // Perform ram attack
        if (!isSimulation) {
            player.takeDamage(this.attack);
            player.startBump(this.x - playerX, this.y - playerY);
            this.startBump(playerX - this.x, playerY - this.y);
            this.justAttacked = true;
            this.attackAnimation = 15;
            audioService.playSound('attack');

            // Calculate knockback direction (away from enemy)
            const attackDx = playerX - this.x;
            const attackDy = playerY - this.y;
            if (attackDx !== 0 || attackDy !== 0) {
                const absDx = Math.abs(attackDx);
                const absDy = Math.abs(attackDy);
                let knockbackX = playerX;
                let knockbackY = playerY;
                if (absDx > absDy) {
                    knockbackX += attackDx > 0 ? 1 : -1;
                } else if (absDy > absDx) {
                    knockbackY += attackDy > 0 ? 1 : -1;
                } else {
                    knockbackX += attackDx > 0 ? 1 : -1;
                    knockbackY += attackDy > 0 ? 1 : -1;
                }
                // Only knockback if the position is walkable
                if (player.isWalkable(knockbackX, knockbackY, grid)) {
                    player.setPosition(knockbackX, knockbackY);
                }
            }
        }

        return true; // Ram attack performed
    },

    checkRamAttack(playerX, playerY, grid) {
        // Lizardeaux straight line movement: check if player is in straight line with clear line of sight
        const sameRow = this.y === playerY;
        const sameCol = this.x === playerX;

        if (!sameRow && !sameCol) {
            return null; // Not in straight line
        }

        let distance = 0;
        let direction = null;

        if (sameRow) {
            // Check horizontal line of sight
            const minX = Math.min(this.x, playerX);
            const maxX = Math.max(this.x, playerX);
            for (let x = minX + 1; x < maxX; x++) {
                if (!this.isWalkable(x, this.y, grid)) {
                    return null; // Obstacle blocks line of sight
                }
            }
            distance = Math.abs(playerX - this.x);
            direction = { x: playerX > this.x ? 1 : -1, y: 0 }; // East or West
        } else {
            // Check vertical line of sight
            const minY = Math.min(this.y, playerY);
            const maxY = Math.max(this.y, playerY);
            for (let y = minY + 1; y < maxY; y++) {
                if (!this.isWalkable(this.x, y, grid)) {
                    return null; // Obstacle blocks line of sight
                }
            }
            distance = Math.abs(playerY - this.y);
            direction = { x: 0, y: playerY > this.y ? 1 : -1 }; // South or North
        }

        // Move 1 tile directly towards player along line of sight (only when distance <= 1 will trigger attack)
        if (distance >= 1) {
            const newX = this.x + direction.x;
            const newY = this.y + direction.y;
            if (this.isWalkable(newX, newY, grid)) {
                return { x: newX, y: newY };
            }
        }

        return null;
    },

    canAttackPosition(player, px, py, grid, enemies) {
        return this.planMoveTowards(player, grid, enemies, {x: px, y: py}, true) === null;
    },

    // Helper for Lazerd: perform queen charge
    performQueenCharge(player, playerX, playerY, grid) {
        // Determine direction of charge
        const dx = playerX - this.x;
        const dy = playerY - this.y;

        // Move directly to adjacent tile next to player (or onto player if they are exactly 1 away)
        let chargeX = this.x;
        let chargeY = this.y;
        if (dx !== 0) chargeX += dx > 0 ? 1 : -1;
        if (dy !== 0) chargeY += dy > 0 ? 1 : -1;

        // Set position (may move onto player)
        this.x = chargeX;
        this.y = chargeY;

        // Check if now on player or adjacent - attack if so
        const newDx = Math.abs(this.x - playerX);
        const newDy = Math.abs(this.y - playerY);
        const onPlayer = (newDx === 0 && newDy === 0);
        const adjacent = (newDx === 1 && newDy === 0) || (newDx === 0 && newDy === 1) || (newDx === 1 && newDy === 1);
        if (onPlayer || adjacent) {
            // Perform attack
            player.takeDamage(this.attack);
            player.startBump(this.x - playerX, this.y - playerY);
            this.startBump(playerX - this.x, playerY - this.y);
            this.justAttacked = true;
            this.attackAnimation = 15;
            audioService.playSound('attack');

            // Knockback away in the attack direction
            let knockbackX = playerX;
            let knockbackY = playerY;
            if (dx !== 0) knockbackX += dx > 0 ? 1 : -1;
            if (dy !== 0) knockbackY += dy > 0 ? 1 : -1;
            // Only knockback if the position is walkable
            if (player.isWalkable(knockbackX, knockbackY, grid)) {
                player.setPosition(knockbackX, knockbackY);
            }
        }
    }
};
