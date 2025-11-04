/**
 * EnemyAttackMixin - Special attack patterns for advanced enemy types.
 *
 * Provides attack abilities for enemies with extended range:
 * - Ram attacks: Charge from distance with knockback (lizardeaux, zard, lazerd)
 * - Queen charges: Multi-directional charge attacks (lazerd)
 * - Line-of-sight validation: Ensure clear path before attacking
 *
 * Attack Types:
 * 1. Ram (Rook/Bishop): Charge along straight line, knock player back
 * 2. Queen Charge: Move diagonally + orthogonally, then attack
 *
 * These abilities make advanced enemies more dangerous and tactical.
 */
import { EnemyAttackHelper } from './EnemyAttackHelper';
import { checkQueenLineOfSight, checkOrthogonalLineOfSight } from '@utils/LineOfSightUtils';

export const EnemyAttackMixin = {
    /**
     * Executes a ram attack from distance with line-of-sight validation.
     * Enemy charges toward player along a straight line and delivers knockback.
     *
     * Algorithm:
     * 1. Validate line-of-sight:
     *    a. Check if player is on straight line (orthogonal or diagonal)
     *    b. Verify no obstacles between enemy and player
     *    c. Ensure no other enemies blocking path
     * 2. Calculate charge path and animation steps
     * 3. Generate smoke trail along charge path
     * 4. Calculate knockback direction (continues charge momentum)
     * 5. Execute attack with knockback
     *
     * Movement Restrictions:
     * - lizardeaux: Orthogonal only (rook-like) - diagonal rams blocked
     * - zard: Diagonal only (bishop-like)
     * - lazerd: Any direction (queen-like)
     *
     * Line-of-Sight:
     * - Must have clear path (walkable tiles)
     * - Other enemies block line-of-sight
     * - Player position (endpoint) not checked for walkability
     *
     * Knockback:
     * - Direction matches charge direction
     * - Player pushed 1 tile away from enemy
     * - If no valid knockback position, player stays in place
     *
     * @param {Player} player - The player being attacked
     * @param {number} playerX - Player's X position
     * @param {number} playerY - Player's Y position
     * @param {Array<Array>} grid - Game grid
     * @param {Array<Enemy>} enemies - All enemies (to check blocking)
     * @param {boolean} [isSimulation=false] - If true, skip visual/audio effects
     * @returns {boolean} True if ram attack was performed, false otherwise
     */
    performRamFromDistance(player, playerX, playerY, grid, enemies, isSimulation = false) {
        // Check if player is on diagonal line
        const sameDiagonal = Math.abs(this.x - playerX) === Math.abs(this.y - playerY) &&
                            (playerX !== this.x) && (playerY !== this.y);

        // Enforce rook-like movement: lizardeaux cannot ram diagonally
        if (this.enemyType === 'lizardeaux' && sameDiagonal) {
            return false;
        }

        // Validate line-of-sight (no obstacles or enemies blocking path)
        const hasLineOfSight = checkQueenLineOfSight(
            this.x, this.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x, y, grid) => this.isWalkable(x, y, grid),
                checkEnemies: true,  // Other enemies block line-of-sight
                enemies: enemies,
                includeEndpoint: false  // Don't check player's position
            }
        );

        if (!hasLineOfSight) {
            return false;
        }

        // Calculate number of tiles in charge path (Chebyshev distance)
        const steps = Math.max(Math.abs(playerX - this.x), Math.abs(playerY - this.y));

        // Calculate step direction (+1, -1, or 0 for each axis)
        const stepX = playerX > this.x ? 1 : playerX < this.x ? -1 : 0;
        const stepY = playerY > this.y ? 1 : playerY < this.y ? -1 : 0;

        // Generate smoke trail animation along charge path
        if (!isSimulation) {
            let traveledTiles = [];

            // Add smoke at each intermediate tile
            for (let i = 1; i < steps; i++) {
                const checkX = this.x + i * stepX;
                const checkY = this.y + i * stepY;
                traveledTiles.push({ x: checkX, y: checkY });
            }

            if (traveledTiles.length > 0) {
                this.smokeAnimations = traveledTiles.map(t => ({ x: t.x, y: t.y, frame: 18 }));
            } else {
                // Edge case: adjacent ram (1 tile away)
                this.smokeAnimations.push({ x: this.x, y: this.y, frame: 18 });
            }
        }

        // Execute ram attack with knockback
        if (!isSimulation) {
            // Calculate knockback direction (continues charge momentum)
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

        return true;  // Ram attack successfully performed
    },

    /**
     * Checks if enemy can perform a ram attack and returns the next move toward player.
     * Used specifically for lizardeaux (rook-like) orthogonal ram attacks.
     *
     * Algorithm:
     * 1. Validate orthogonal line-of-sight to player
     * 2. Calculate distance and direction
     * 3. Move 1 tile toward player along the clear line
     * 4. When adjacent (distance 1), ram attack will trigger
     *
     * Movement Strategy:
     * - Only moves if clear line-of-sight exists
     * - Moves 1 tile per turn toward player
     * - Continues until adjacent, then attacks
     *
     * Line-of-Sight:
     * - Orthogonal only (N/S/E/W)
     * - Ignores other enemies (they don't block)
     * - Must have walkable path
     *
     * @param {number} playerX - Player's X position
     * @param {number} playerY - Player's Y position
     * @param {Array<Array>} grid - Game grid
     * @returns {{x: number, y: number}|null} Next position or null if no valid move
     */
    checkRamAttack(playerX, playerY, grid) {
        // Validate orthogonal line-of-sight (rook-like movement)
        const hasLineOfSight = checkOrthogonalLineOfSight(
            this.x, this.y,
            playerX, playerY,
            grid,
            {
                isWalkable: (x, y, grid) => this.isWalkable(x, y, grid),
                checkEnemies: false,  // Other enemies don't block ram setup
                includeEndpoint: false
            }
        );

        if (!hasLineOfSight) {
            return null;
        }

        // Calculate Chebyshev distance to player
        const distance = Math.max(Math.abs(playerX - this.x), Math.abs(playerY - this.y));

        // Calculate unit direction vector
        const direction = {
            x: playerX > this.x ? 1 : playerX < this.x ? -1 : 0,
            y: playerY > this.y ? 1 : playerY < this.y ? -1 : 0
        };

        // Move 1 tile toward player
        // When distance reaches 1, the ram attack will trigger
        if (distance >= 1) {
            const newX = this.x + direction.x;
            const newY = this.y + direction.y;

            if (this.isWalkable(newX, newY, grid)) {
                return { x: newX, y: newY };
            }
        }

        return null;
    },

    /**
     * Checks if enemy can attack a specific position.
     * Used for AI decision-making and threat assessment.
     *
     * @param {Player} player - The player
     * @param {number} px - Target X position
     * @param {number} py - Target Y position
     * @param {Array<Array>} grid - Game grid
     * @param {Array<Enemy>} enemies - All enemies
     * @returns {boolean} True if position can be attacked
     */
    canAttackPosition(player, px, py, grid, enemies) {
        return this.planMoveTowards(player, grid, enemies, { x: px, y: py }, true) === null;
    },

    /**
     * Executes queen-style charge attack (lazerd enemy).
     * Moves diagonally toward player and attacks when adjacent.
     *
     * Algorithm:
     * 1. Calculate direction to player (dx, dy)
     * 2. Move 1 tile toward player (can be diagonal)
     * 3. Check if now adjacent or on top of player
     * 4. If yes, perform charge attack with directional knockback
     *
     * Movement:
     * - Moves in both X and Y directions simultaneously if needed
     * - Creates diagonal charges toward player
     * - Can move onto player position directly
     *
     * Attack Conditions:
     * - On player position (dx=0, dy=0): Attack
     * - Adjacent orthogonally (dx=1,dy=0 or dx=0,dy=1): Attack
     * - Adjacent diagonally (dx=1,dy=1): Attack
     *
     * Knockback:
     * - Direction continues the charge momentum
     * - Pushes player 1 tile in charge direction
     * - If no valid knockback tile, player stays in place
     *
     * @param {Player} player - The player being attacked
     * @param {number} playerX - Player's X position
     * @param {number} playerY - Player's Y position
     * @param {Array<Array>} grid - Game grid
     */
    performQueenCharge(player, playerX, playerY, grid) {
        // Calculate direction to player
        const dx = playerX - this.x;
        const dy = playerY - this.y;

        // Move 1 tile toward player (can be diagonal)
        let chargeX = this.x;
        let chargeY = this.y;

        if (dx !== 0) chargeX += dx > 0 ? 1 : -1;  // Move horizontally
        if (dy !== 0) chargeY += dy > 0 ? 1 : -1;  // Move vertically

        // Update enemy position (may land on or adjacent to player)
        this.x = chargeX;
        this.y = chargeY;

        // Check distance to player after move
        const newDx = Math.abs(this.x - playerX);
        const newDy = Math.abs(this.y - playerY);

        // Determine if in attack range
        const onPlayer = (newDx === 0 && newDy === 0);
        const adjacentOrthogonal = (newDx === 1 && newDy === 0) || (newDx === 0 && newDy === 1);
        const adjacentDiagonal = (newDx === 1 && newDy === 1);
        const adjacent = adjacentOrthogonal || adjacentDiagonal;

        if (onPlayer || adjacent) {
            // Calculate knockback position (continues charge direction)
            const knockbackPos = {
                x: playerX + (dx !== 0 ? (dx > 0 ? 1 : -1) : 0),
                y: playerY + (dy !== 0 ? (dy > 0 ? 1 : -1) : 0)
            };

            // Execute charge attack
            EnemyAttackHelper.performCompleteAttack(
                this, player, playerX, playerY, grid,
                'enemy_charge',
                { knockbackOverride: knockbackPos }
            );
        }
    }
};
