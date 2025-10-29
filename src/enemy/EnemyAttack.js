import { EnemyAttackHelper } from './EnemyAttackHelper.js';
import { checkQueenLineOfSight, checkOrthogonalLineOfSight } from '../utils/LineOfSightUtils.js';

export const EnemyAttackMixin = {
    performRamFromDistance(player, playerX, playerY, grid, enemies, isSimulation = false) {
        // Ram attack from adjacent: check if in straight line (orthogonal or diagonal) with clear line of sight
        const sameDiagonal = Math.abs(this.x - playerX) === Math.abs(this.y - playerY) && (playerX !== this.x) && (playerY !== this.y);

        // Enforce rook-like attacks for lizardeaux: disallow diagonal rams
        if (this.enemyType === 'lizardeaux' && sameDiagonal) {
            return false;
        }

        // Check line of sight using utility function
        const hasLineOfSight = checkQueenLineOfSight(
            this.x, this.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x, y, grid) => this.isWalkable(x, y, grid),
                checkEnemies: true,
                enemies: enemies,
                includeEndpoint: false
            }
        );

        if (!hasLineOfSight) {
            return false;
        }

        // Calculate steps for animation
        const steps = Math.max(Math.abs(playerX - this.x), Math.abs(playerY - this.y));
        const stepX = playerX > this.x ? 1 : playerX < this.x ? -1 : 0;
        const stepY = playerY > this.y ? 1 : playerY < this.y ? -1 : 0;

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
            // Calculate knockback direction using helper
            const attackDx = playerX - this.x;
            const attackDy = playerY - this.y;
            const knockbackPos = EnemyAttackHelper.calculateKnockbackPosition(
                attackDx, attackDy, playerX, playerY
            );

            EnemyAttackHelper.performCompleteAttack(
                this, player, playerX, playerY, grid,
                'enemy_ram',
                { knockbackOverride: knockbackPos }
            );
        }

        return true; // Ram attack performed
    },

    checkRamAttack(playerX, playerY, grid) {
        // Lizardeaux straight line movement: check if player is in straight line with clear line of sight
        const hasLineOfSight = checkOrthogonalLineOfSight(
            this.x, this.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x, y, grid) => this.isWalkable(x, y, grid),
                checkEnemies: false,
                includeEndpoint: false
            }
        );

        if (!hasLineOfSight) {
            return null;
        }

        // Calculate distance and direction
        const distance = Math.max(Math.abs(playerX - this.x), Math.abs(playerY - this.y));
        const direction = {
            x: playerX > this.x ? 1 : playerX < this.x ? -1 : 0,
            y: playerY > this.y ? 1 : playerY < this.y ? -1 : 0
        };

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
            // Perform attack with knockback in charge direction
            const knockbackPos = {
                x: playerX + (dx !== 0 ? (dx > 0 ? 1 : -1) : 0),
                y: playerY + (dy !== 0 ? (dy > 0 ? 1 : -1) : 0)
            };

            EnemyAttackHelper.performCompleteAttack(
                this, player, playerX, playerY, grid,
                'enemy_charge',
                { knockbackOverride: knockbackPos }
            );
        }
    }
};
