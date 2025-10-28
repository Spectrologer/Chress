import { EnemyChargeBehaviors } from './EnemyChargeBehaviors.js';
import { EnemyLineOfSight } from './EnemyLineOfSight.js';
import { EnemyAttackHelper } from './EnemyAttackHelper.js';
import { ANIMATION_CONSTANTS } from '../core/constants/index.js';

export class EnemySpecialActions {
    // Execute charge move for Zard enemy type
    static executeZardCharge(enemy, player, playerX, playerY, grid, enemies, isSimulation = false, game = null) {
        if (EnemyLineOfSight.checkDiagonalLineOfSight(enemy, playerX, playerY, grid)) {
            const chargeMove = EnemyChargeBehaviors.getChargeAdjacentDiagonalMove(enemy, playerX, playerY, grid, enemies);
            if (chargeMove) {
                // Prevent charging into a tile that was occupied at the start of the enemy turn
                const initialSet = (game && game.initialEnemyTilesThisTurn) || new Set();
                const chargeKey = `${chargeMove.x},${chargeMove.y}`;
                const ownStartKey = `${enemy.x},${enemy.y}`;
                if (initialSet.has(chargeKey) && chargeKey !== ownStartKey) {
                    return null; // Treat as no-op this turn to avoid moving into freed tile
                }
                // Move to adjacent tile, leaving smoke trail
                if (!isSimulation) {
                    // Add smoke on each tile traversed during charge
                    const stepsDx = Math.abs(chargeMove.x - enemy.x);
                    let stepX = chargeMove.x > enemy.x ? 1 : -1;
                    let stepY = chargeMove.y > enemy.y ? 1 : -1;
                    for (let i = 1; i < stepsDx; i++) {
                        enemy.smokeAnimations.push({ x: enemy.x + i * stepX, y: enemy.y + i * stepY, frame: ANIMATION_CONSTANTS.SMOKE_FRAME_LIFETIME });
                    }
                    enemy.x = chargeMove.x;
                    enemy.y = chargeMove.y;
                    enemy.liftFrames = ANIMATION_CONSTANTS.LIFT_FRAMES; // Start lift animation
                }
                // After moving, check if adjacent diagonally and ram
                const newDx = Math.abs(chargeMove.x - playerX);
                const newDy = Math.abs(chargeMove.y - playerY);
                if (newDx === 1 && newDy === 1 && (!game || !game.playerJustAttacked)) {
                    enemy.performRamFromDistance(player, playerX, playerY, grid, enemies, isSimulation);
                }
                return null; // All in one turn
            }
            // If no charge move is possible, stay put
            return null;
        }
        return false; // No line of sight
    }

    // Execute charge move for Lizardeaux enemy type
    static executeLizardeauxCharge(enemy, player, playerX, playerY, grid, enemies, isSimulation = false, game = null) {
        if (EnemyLineOfSight.checkOrthogonalLineOfSight(enemy, playerX, playerY, grid, enemies)) {
            const dx = Math.abs(enemy.x - playerX);
            const dy = Math.abs(enemy.y - playerY);
            const distance = Math.max(dx, dy);
            if (distance === 1) {
                // Adjacent: normal attack without knockback
                if (!isSimulation && (!game || !game.playerJustAttacked)) {
                    EnemyAttackHelper.performCompleteAttack(
                        enemy, player, playerX, playerY, grid,
                        'enemy_lizardeaux_attack',
                        { skipKnockback: true }
                    );
                }
                return null; // All in one turn
            } else {
                // Charge to the tile adjacent to the player
                let stepX = playerX > enemy.x ? 1 : (playerX < enemy.x ? -1 : 0);
                let stepY = playerY > enemy.y ? 1 : (playerY < enemy.y ? -1 : 0);

                const chargeMove = { x: playerX - stepX, y: playerY - stepY };

                // Prevent charging into a tile that was occupied at the start of the enemy turn
                const initialSet2 = (game && game.initialEnemyTilesThisTurn) || new Set();
                const chargeKey2 = `${chargeMove.x},${chargeMove.y}`;
                const ownStartKey2 = `${enemy.x},${enemy.y}`;
                if (initialSet2.has(chargeKey2) && chargeKey2 !== ownStartKey2) {
                    return null; // Cancel charge to avoid moving into freed tile
                }

                // Move to adjacent tile
                if (!isSimulation) {
                    // Add smoke on each tile traversed during charge (excluding player tile)
                    const stepsDx = dx;
                    const stepsDy = dy;
                    // Re-calculate stepX/stepY for smoke trail, ensuring it's purely orthogonal
                    stepX = playerX > enemy.x ? 1 : (playerX < enemy.x ? -1 : 0);
                    stepY = playerY > enemy.y ? 1 : (playerY < enemy.y ? -1 : 0);
                    if (dx > 0) stepY = 0; // if horizontal, no vertical step
                    else if (dy > 0) stepX = 0;
                    for (let i = 1; i < distance; i++) {
                        enemy.smokeAnimations.push({ x: enemy.x + i * stepX, y: enemy.y + i * stepY, frame: ANIMATION_CONSTANTS.SMOKE_FRAME_LIFETIME });
                    }
                    enemy.x = chargeMove.x;
                    enemy.y = chargeMove.y;
                    enemy.liftFrames = ANIMATION_CONSTANTS.LIFT_FRAMES; // Start lift animation
                    // Attack upon arriving
                    if (!game || !game.playerJustAttacked) {
                        // The enemy is now at chargeMove.x, chargeMove.y
                        const attackDx = playerX - chargeMove.x;
                        const attackDy = playerY - chargeMove.y;

                        // Calculate knockback in attack direction
                        const knockbackPos = {
                            x: playerX + (attackDx !== 0 ? attackDx : 0),
                            y: playerY + (attackDy !== 0 ? attackDy : 0)
                        };

                        EnemyAttackHelper.performCompleteAttack(
                            enemy, player, playerX, playerY, grid,
                            'enemy_lizardeaux_charge',
                            { knockbackOverride: knockbackPos }
                        );
                    }
                }
                return null; // All in one turn
            }
        }
        return false; // No line of sight
    }

    // Execute charge move for Lazerd enemy type
    static executeLazerdCharge(enemy, player, playerX, playerY, grid, enemies, isSimulation = false, game = null) {
        // Check if orthogonal or diagonal line of sight exists
        const chargeMove = EnemyChargeBehaviors.getQueenChargeAdjacentMove(enemy, playerX, playerY, grid, enemies);
        if (chargeMove) {
            // Prevent charging into a tile that was occupied at the start of the enemy turn
            const initialSet3 = (game && game.initialEnemyTilesThisTurn) || new Set();
            const chargeKey3 = `${chargeMove.x},${chargeMove.y}`;
            const ownStartKey3 = `${enemy.x},${enemy.y}`;
            if (initialSet3.has(chargeKey3) && chargeKey3 !== ownStartKey3) {
                return null; // Don't charge into a tile that was occupied at turn start
            }
            // Set charge position to adjacent of player
            if (!isSimulation) {
                // Add smoke on each tile traversed during charge
                const stepsDx = Math.abs(chargeMove.x - enemy.x);
                const stepsDy = Math.abs(chargeMove.y - enemy.y);
                let stepX = stepsDx > 0 ? (chargeMove.x > enemy.x ? 1 : -1) : 0;
                let stepY = stepsDy > 0 ? (chargeMove.y > enemy.y ? 1 : -1) : 0;
                const steps = Math.max(stepsDx, stepsDy);
                for (let i = 1; i < steps; i++) {
                    enemy.smokeAnimations.push({ x: enemy.x + i * stepX, y: enemy.y + i * stepY, frame: 18 });
                }
                enemy.x = chargeMove.x;
                enemy.y = chargeMove.y;
                // Now adjacent, attack
                if (!isSimulation && (!game || !game.playerJustAttacked)) {
                    // Knockback away from enemy position
                    const dx = playerX - enemy.x;
                    const dy = playerY - enemy.y;
                    const knockbackPos = {
                        x: playerX + (dx !== 0 ? dx : 0),
                        y: playerY + (dy !== 0 ? dy : 0)
                    };

                    EnemyAttackHelper.performCompleteAttack(
                        enemy, player, playerX, playerY, grid,
                        'enemy_lazerd_charge',
                        { knockbackOverride: knockbackPos }
                    );
                }
            }
            return null;
        }
        return false; // No line of sight
    }
}
