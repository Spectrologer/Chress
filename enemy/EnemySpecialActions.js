import { EnemyChargeBehaviors } from './EnemyChargeBehaviors.js';
import { EnemyLineOfSight } from './EnemyLineOfSight.js';

export class EnemySpecialActions {
    // Execute charge move for Zard enemy type
    static executeZardCharge(enemy, player, playerX, playerY, grid, enemies, isSimulation = false, game = null) {
        if (EnemyLineOfSight.checkDiagonalLineOfSight(enemy, playerX, playerY, grid)) {
            const chargeMove = EnemyChargeBehaviors.getChargeAdjacentDiagonalMove(enemy, playerX, playerY, grid, enemies);
            if (chargeMove) {
                // Move to adjacent tile, leaving smoke trail
                if (!isSimulation) {
                    // Add smoke on each tile traversed during charge
                    const stepsDx = Math.abs(chargeMove.x - enemy.x);
                    let stepX = chargeMove.x > enemy.x ? 1 : -1;
                    let stepY = chargeMove.y > enemy.y ? 1 : -1;
                    for (let i = 1; i < stepsDx; i++) {
                        enemy.smokeAnimations.push({ x: enemy.x + i * stepX, y: enemy.y + i * stepY, frame: 18 });
                    }
                    enemy.x = chargeMove.x;
                    enemy.y = chargeMove.y;
                    enemy.liftFrames = 15; // Start lift animation
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
                    player.takeDamage(enemy.attack);
                    player.startBump(enemy.x - playerX, enemy.y - playerY);
                    enemy.startBump(playerX - enemy.x, playerY - enemy.y);
                    enemy.justAttacked = true;
                    enemy.attackAnimation = 15;
                    window.soundManager?.playSound('attack');
                }
                return null; // All in one turn
            } else {
                // Charge to the tile adjacent to the player
                let stepX = playerX > enemy.x ? 1 : (playerX < enemy.x ? -1 : 0);
                let stepY = playerY > enemy.y ? 1 : (playerY < enemy.y ? -1 : 0);

                const chargeMove = { x: playerX - stepX, y: playerY - stepY };

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
                        enemy.smokeAnimations.push({ x: enemy.x + i * stepX, y: enemy.y + i * stepY, frame: 18 });
                    }
                    enemy.x = chargeMove.x;
                    enemy.y = chargeMove.y;
                    enemy.liftFrames = 15; // Start lift animation
                    // Attack upon arriving
                    if (!game || !game.playerJustAttacked) {
                        // The enemy is now at chargeMove.x, chargeMove.y
                        const attackDx = playerX - chargeMove.x;
                        const attackDy = playerY - chargeMove.y;

                        player.takeDamage(enemy.attack); // Damage player
                        player.startBump(attackDx, attackDy); // Bump player away from enemy
                        enemy.startBump(-attackDx, -attackDy); // Bump enemy away from player

                        // Knockback player backward
                        let knockbackX = playerX;
                        let knockbackY = playerY;
                        if (attackDx !== 0) knockbackX += attackDx;
                        if (attackDy !== 0) knockbackY += attackDy;

                        // Only knockback if walkable, else stay
                        if (player.isWalkable(knockbackX, knockbackY, grid)) {
                            player.setPosition(knockbackX, knockbackY);
                        }
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
                    player.takeDamage(enemy.attack);
                    player.startBump(enemy.x - playerX, enemy.y - playerY);
                    enemy.startBump(playerX - enemy.x, playerY - enemy.y);
                    enemy.justAttacked = true;
                    enemy.attackAnimation = 15;
                    window.soundManager?.playSound('attack');
                    window.soundManager?.playSound('attack');
                    // Knockback away
                    const dx = playerX - enemy.x; // Since enemy is at charge position (adjacent), dx= +/-1 or 0
                    const dy = playerY - enemy.y;
                    let knockbackX = playerX;
                    let knockbackY = playerY;
                    if (dx !== 0) knockbackX += dx;
                    if (dy !== 0) knockbackY += dy;
                    // Only knockback if the position is walkable
                    if (player.isWalkable(knockbackX, knockbackY, grid)) {
                        player.setPosition(knockbackX, knockbackY);
                    }
                }
            }
            return null;
        }
        return false; // No line of sight
    }
}
