import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';
import { EnemyPathfinding } from './EnemyPathfinding.js';
import { EnemySpecialActions } from './EnemySpecialActions.js';

// Base strategy for enemy movement calculation (now used for default enemy types)
class BaseMoveCalculator {
    constructor() {
        this.tacticalAI = null; // Will be set by movement mixin
    }

    /**
     * Calculate the next move for the enemy
     * @param {Enemy} enemy - The enemy instance
     * @param {Player} player - The player instance
     * @param {Object} playerPos - Player position {x, y}
     * @param {Array} grid - The game grid
     * @param {Array} enemies - List of all enemies
     * @param {boolean} isSimulation - Whether this is a simulation
     * @param {Game} game - The game instance
     * @returns {Object|null} Move coordinates {x, y} or null if no move
     */
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        // Default implementation - use pathfinding
        return this.findPathedMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }

    /**
     * Find a move using pathfinding, considering tactical AI
     */
    findPathedMove(enemy, player, playerPos, grid, enemies, isSimulation, game) {
        const { x: playerX, y: playerY } = playerPos;

        // Leader-Follower Pattern for cooperative behavior
        const totalEnemies = enemies.length;
        const isLargeGroup = totalEnemies >= 3;
        const leader = isLargeGroup ? enemies.find(e => e === enemies[0] || e) : null; // simple leader selection
        const followLeader = isLargeGroup && enemy !== leader;
        const targetX = followLeader ? leader.x : playerX;
        const targetY = followLeader ? leader.y : playerY;
        
        // Use BFS to find the shortest path to target (player or leader)
        const path = EnemyPathfinding.findPath(enemy.x, enemy.y, targetX, targetY, grid, enemy.enemyType, (x, y, g) => enemy.isWalkable(x, y, g));

        if (path && path.length > 1) {
            let next = path[1];
            // For enemy types that can move multiple tiles, apply aggressive distance closing
            next = this.applyAggressiveMovement(enemy, path, next);

            // Apply cooperative clustering and defensive tactics
            next = this.applyTacticalAdjustments(enemy, next, playerX, playerY, grid, enemies);

            // Check if move would be vulnerable and needs defensive retreat
            next = this.applyDefensiveMoves(enemy, player, next, playerX, playerY, grid, enemies, isSimulation, game);

            // Add smoke animations for long moves
            if (!isSimulation && (Math.abs(next.x - enemy.x) + Math.abs(next.y - enemy.y) > 1)) {
                this.addSmokeTrail(enemy, next);
            }

            // Check if within bounds and walkable
            if (enemy.isWalkable(next.x, next.y, grid)) {
                // Check for pitfall traps before handling player interactions
                if (!isSimulation && grid[next.y][next.x] === TILE_TYPES.PITFALL) {
                    // Enemy falls through pitfall trap
                    this.handleEnemyPitfallTransition(enemy, next.x, next.y, game);
                    return null; // Don't move, enemy is being transitioned
                }

                // Check for player interactions
                return this.handlePlayerInteraction(enemy, next, player, playerX, playerY, grid, enemies, isSimulation, game);
            }
        }

        return null; // No path found or no valid move
    }

    /**
     * Apply enemy-specific aggressive movement along straight lines
     */
    applyAggressiveMovement(enemy, path, next) {
        // Check enemy types that can move multiple tiles
        const multiMoveTypes = new Set(['lazerd', 'lizardeaux', 'zard']);

        if (!multiMoveTypes.has(enemy.enemyType)) {
            return next;
        }

        // Find the maximum distance along a straight line
        const directions = this.getMultiMoveDirections(enemy.enemyType);
        for (const dir of directions) {
            if (next.x - enemy.x === dir.x && next.y - enemy.y === dir.y) {
                let maxMoveIndex = 1;
                for (let i = 2; i < path.length; i++) {
                    if (!this.isPathConsistent(path, dir, enemy, maxMoveIndex, i)) continue;
                    if (!enemy.isWalkable(path[i].x, path[i].y, path[0].g || [])) continue; // Rough grid check
                    maxMoveIndex = i;
                }
                next = path[maxMoveIndex];
                break;
            }
        }

        return next;
    }

    /**
     * Get possible directions for multi-tile moves based on enemy type
     */
    getMultiMoveDirections(enemyType) {
        switch (enemyType) {
            case 'lazerd':
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
            case 'lizardeaux':
                return [
                    { x: 0, y: -1 }, // North
                    { x: 0, y: 1 },  // South
                    { x: -1, y: 0 }, // West
                    { x: 1, y: 0 },  // East
                ];
            case 'zard':
                return [
                    { x: -1, y: -1 }, // Northwest
                    { x: 1, y: -1 },  // Northeast
                    { x: -1, y: 1 },  // Southwest
                    { x: 1, y: 1 }    // Southeast
                ];
            default:
                return [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        }
    }

    /**
     * Check if path consistency is maintained for multi-tile moves
     */
    isPathConsistent(path, dir, enemy, maxMoveIndex, i) {
        const checkX = path[i].x - dir.x * (i - maxMoveIndex);
        const checkY = path[i].y - dir.y * (i - maxMoveIndex);
        return checkX === enemy.x && checkY === enemy.y;
    }

    /**
     * Apply cooperative clustering and direction diversity adjustments
     */
    applyTacticalAdjustments(enemy, next, playerX, playerY, grid, enemies) {
        if (!this.tacticalAI) return next;

        const currentDistToPlayer = Math.abs(next.x - playerX) + Math.abs(next.y - playerY);
        const currentClustering = this.tacticalAI.calculateAllyDistance(next.x, next.y, enemies, enemy);
        const currentDiversity = this.tacticalAI.calculateDirectionDiversity(next.x, next.y, playerX, playerY, enemies, enemy);
        const moveDirs = EnemyPathfinding.getMovementDirections(enemy.enemyType);

        for (const dir of moveDirs) {
            const altX = enemy.x + dir.x;
            const altY = enemy.y + dir.y;
            if (altX < 0 || altX >= GRID_SIZE || altY < 0 || altY >= GRID_SIZE) continue;
            if (!enemy.isWalkable(altX, altY, grid)) continue;
            if (enemies.some(e => e.x === altX && e.y === altY)) continue; // avoid moving onto other enemy

            const altDistToPlayer = Math.abs(altX - playerX) + Math.abs(altY - playerY);
            const altClustering = this.tacticalAI.calculateAllyDistance(altX, altY, enemies, enemy);
            const altDiversity = this.tacticalAI.calculateDirectionDiversity(altX, altY, playerX, playerY, enemies, enemy);

            const clusteringGain = currentClustering - altClustering;
            const diversityGain = altDiversity - currentDiversity;
            if ((clusteringGain > 0.3 || diversityGain > 0) &&
                altDistToPlayer <= currentDistToPlayer + 2 &&
                !this.tacticalAI.isStackedBehind(altX, altY, playerX, playerY, enemies, enemy)) {
                next.x = altX;
                next.y = altY;
                break; // take first valid improvement
            }
        }

        return next;
    }

    /**
     * Apply defensive moves if the enemy is vulnerable to player attacks
     */
    applyDefensiveMoves(enemy, player, next, playerX, playerY, grid, enemies, isSimulation, game) {
        if (!this.tacticalAI) return next;

        const dx = Math.abs(next.x - playerX);
        const dy = Math.abs(next.y - playerY);
        const nextDistance = dx + dy;

        // If next move makes enemy adjacent to player (vulnerable), try to find defensive retreat
        if (nextDistance <= 2) {
            const defensiveMoves = this.tacticalAI.getDefensiveMoves(enemy, playerX, playerY, next.x, next.y, grid, enemies);
            if (defensiveMoves.length > 0) {
                // Add smoke animation for defensive retreat if it's a multi-tile move
                if (!isSimulation && this.calculateMoveDistance(enemy.x, enemy.y, defensiveMoves[0].x, defensiveMoves[0].y) > 1) {
                    enemy.smokeAnimations.push({
                        x: enemy.x + (defensiveMoves[0].x - enemy.x) / 2,
                        y: enemy.y + (defensiveMoves[0].y - enemy.y) / 2,
                        frame: 18
                    });
                }
                return { x: defensiveMoves[0].x, y: defensiveMoves[0].y };
            }
        }

        return next;
    }

    /**
     * Calculate chebyshev distance for smoke animations
     */
    calculateMoveDistance(x1, y1, x2, y2) {
        return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    }

    /**
     * Handle interactions when enemy moves onto player or adjacent positions
     */
    handlePlayerInteraction(enemy, next, player, playerX, playerY, grid, enemies, isSimulation, game) {
        // Check if this move puts enemy adjacent to player
        const dx = Math.abs(next.x - playerX);
        const dy = Math.abs(next.y - playerY);

        // Perform attack based on enemy type
        if (enemy.enemyType === 'lizord' && !isSimulation) {
            // Lizord has special bump attack, but only if the planned move would land on
            // or adjacent to the player. Previously this ran unconditionally which could
            // teleport the lizord from anywhere.
            const maxDist = Math.max(dx, dy);
            if (maxDist <= 1) {
                // Planned move is on or adjacent to player: perform bump attack
                this.performLizordBumpAttack(enemy, player, playerX, playerY, grid, enemies, game);
                return null;
            }
            // Otherwise fall through and allow the move to proceed normally
        }

        if (dx === 1 && dy === 1) {
            // Diagonal adjacent - most enemies attack, but lizardeaux should not
            if (enemy.enemyType !== 'lizardeaux') {
                this.performAttack(enemy, player, playerX, playerY, grid, enemies, game);
                return null;
            } else {
                // For lizardeaux, do not perform a diagonal attack; proceed with move instead
                return next;
            }
        }
        else if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            // Orthogonal adjacent - perform attack in place
            this.performAttack(enemy, player, playerX, playerY, grid, enemies, game);
            return null;
        }
        else {
            // Not adjacent to player, proceed with move
            return next;
        }
    }

    /**
     * Handle enemy falling through a pitfall trap
     */
    handleEnemyPitfallTransition(enemy, x, y, game) {
        // Change pitfall to PORT tile
        game.grid[y][x] = TILE_TYPES.PORT;

        // Set up the same portTransitionData that the player uses for pitfalls
        game.portTransitionData = { from: 'pitfall', x, y };

        // Temporarily remove enemy from current zone
        const enemyIndex = game.enemies.indexOf(enemy);
        if (enemyIndex > -1) {
            game.enemies.splice(enemyIndex, 1);
        }

        // Transition enemy to underground zone immediately using zone transition logic
        const currentZone = game.player.currentZone;

        // Create the underground zone key
        const undergroundZoneKey = `${currentZone.x},${currentZone.y}:2`;

        // Generate the underground zone if it doesn't exist yet
        if (!game.zones.has(undergroundZoneKey)) {
            const undergroundZoneData = game.zoneGenerator.generateZone(
                currentZone.x,
                currentZone.y,
                2, // underground dimension
                game.zones,
                game.connectionManager.zoneConnections,
                game.availableFoodAssets,
                'port'
            );
            game.zones.set(undergroundZoneKey, undergroundZoneData);
        }

        // Get the existing underground zone data
        const undergroundZoneData = game.zones.get(undergroundZoneKey);

        // Create a fresh copy with the enemy added
        const updatedZoneData = {
            ...undergroundZoneData,
            enemies: [...(undergroundZoneData.enemies || []), {
                ...enemy, // Copy enemy data including position
                x: enemy.x,
                y: enemy.y,
                enemyType: enemy.enemyType,
                health: enemy.health,
                id: enemy.id
            }]
        };

        // Save the updated underground zone with the enemy
        game.zones.set(undergroundZoneKey, updatedZoneData);

        // Add visual/sound effects for falling
        if (window.soundManager) {
            window.soundManager.playSound('pitfall');
        }

        console.log(`Enemy ${enemy.enemyType} fell through pitfall at (${x}, ${y}) and is now in underground zone`);
    }

    /**
     * Perform Lizord's special bump attack
     */
    performLizordBumpAttack(enemy, player, playerX, playerY, grid, enemies, game) {
        const possiblePositions = [
            { x: playerX, y: playerY - 1 },
            { x: playerX, y: playerY + 1 },
            { x: playerX - 1, y: playerY },
            { x: playerX + 1, y: playerY }
        ];
        let displaced = false;
        for (const pos of possiblePositions) {
            if (player.isWalkable(pos.x, pos.y, grid) && !enemies.some(e => e.x === pos.x && e.y === pos.y)) {
                player.setPosition(pos.x, pos.y);
                displaced = true;
                break;
            }
        }
        if (displaced) {
            // Damage player and move enemy to player's old position
            player.takeDamage(enemy.attack);
            player.startBump(enemy.x - playerX, enemy.y - playerY);
            enemy.startBump(playerX - enemy.x, playerY - enemy.y);
            enemy.justAttacked = true;
            enemy.attackAnimation = 15;
            if (window.soundManager) window.soundManager.playSound('attack');

            // Move enemy to where player was
            enemy.lastX = enemy.x;
            enemy.lastY = enemy.y;
            enemy.x = playerX;
            enemy.y = playerY;

            // Add horse charge animation for lizord
            if (game && enemy.enemyType === 'lizord') {
                const dx = enemy.x - enemy.lastX;
                const dy = enemy.y - enemy.lastY;
                let midX, midY;
                if (dx === 0 || dy === 0) {
                    midX = (enemy.lastX + enemy.x) / 2;
                    midY = (enemy.lastY + enemy.y) / 2;
                } else {
                    // L-shaped path for diagonal movement
                    if (Math.abs(dx) > Math.abs(dy)) {
                        midX = enemy.x;
                        midY = enemy.lastY;
                    } else if (Math.abs(dy) > Math.abs(dx)) {
                        midX = enemy.lastX;
                        midY = enemy.y;
                    } else {
                        midX = enemy.x;
                        midY = enemy.lastY;
                    }
                }
                game.horseChargeAnimations.push({
                    startPos: { x: enemy.lastX, y: enemy.lastY },
                    midPos: { x: midX, y: midY },
                    endPos: { x: enemy.x, y: enemy.y },
                    frame: 20
                });
            }
        }
    }

    /**
     * Perform regular attack on player
     */
    performAttack(enemy, player, playerX, playerY, grid, enemies, game) {
        if (game && game.playerJustAttacked) return; // Player just attacked, no retaliation

        // Prevent lizardeaux from performing regular diagonal attacks
        const dx = Math.abs(enemy.x - playerX);
        const dy = Math.abs(enemy.y - playerY);
        if (enemy.enemyType === 'lizardeaux' && dx === 1 && dy === 1) return;

        player.takeDamage(enemy.attack);
        player.startBump(enemy.x - playerX, enemy.y - playerY);
        enemy.startBump(playerX - enemy.x, playerY - enemy.y);
        enemy.justAttacked = true;
        enemy.attackAnimation = 15;
        if (window.soundManager) window.soundManager.playSound('attack');

        if (player.isDead()) {
            // Handle player death if needed
        }
    }

    /**
     * Add smoke trail animation for multi-tile moves
     */
    addSmokeTrail(enemy, next) {
        const chargeTypes = new Set(['lizardeaux', 'zard']);
        if (chargeTypes.has(enemy.enemyType)) {
            // Add smoke on each tile along the path
            const startX = enemy.x;
            const startY = enemy.y;
            const dx = next.x - startX;
            const dy = next.y - startY;
            const distX = Math.abs(dx);
            const distY = Math.abs(dy);

            if (distX >= distY) {
                // Horizontal dominant
                const stepX = dx > 0 ? 1 : -1;
                const stepY = dy === 0 ? 0 : dy / distX;
                for (let i = 1; i < distX; i++) {
                    enemy.smokeAnimations.push({
                        x: startX + i * stepX,
                        y: startY + Math.round((i * dy) / distX),
                        frame: 18
                    });
                }
            } else {
                // Vertical dominant
                const stepY = dy > 0 ? 1 : -1;
                const stepX = dx === 0 ? 0 : dx / distY;
                for (let i = 1; i < distY; i++) {
                    enemy.smokeAnimations.push({
                        x: startX + Math.round((i * dx) / distY),
                        y: startY + i * stepY,
                        frame: 18
                    });
                }
            }
        }
    }
}

// Strategy pattern for enemy-specific movement calculations
export class EnemyMoveCalculatorFactory {
    /**
     * Get the appropriate move calculator for an enemy type
     */
    static getCalculator(enemyType) {
        switch (enemyType) {
            case 'lizardy':
                return new LizardyMoveCalculator();
            case 'zard':
                return new ZardMoveCalculator();
            case 'lizardeaux':
                return new LizardeauxMoveCalculator();
            case 'lazerd':
                return new LazerdMoveCalculator();
            case 'lizardo':
                return new LizardoMoveCalculator();
            case 'lizord':
                return new LizordMoveCalculator();
            case 'crayn':
            case 'felt':
            case 'forge':
            case 'lion':
            case 'nib':
            case 'rune':
            case 'squig':
            default:
                return new BaseMoveCalculator();
        }
    }
}

// Lizardy: pawn-like movement with forward diagonal attack
export class LizardyMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        const { x: playerX, y: playerY } = playerPos;

        // Initialize direction if it doesn't exist, default to South (1)
        if (enemy.movementDirection === undefined) {
            enemy.movementDirection = 1;
        }

        const attackDirections = enemy.movementDirection === -1
            ? [{ x: -1, y: -1 }, { x: 1, y: -1 }] // NW, NE when moving North
            : [{ x: -1, y: 1 }, { x: 1, y: 1 }];   // SW, SE when moving South

        // Check for diagonal attack first
        if (!game || !game.playerJustAttacked) {
            for (const dir of attackDirections) {
                const attackX = enemy.x + dir.x;
                const attackY = enemy.y + dir.y;
                if (attackX === playerX && attackY === playerY) {
                    this.performDiagonalAttack(enemy, player, attackX, attackY, isSimulation);
                    return null;
                }
            }
        }

        // Check for orthogonally adjacent player (not an attack for lizardy, treat as blocked path)
        if (Math.abs(enemy.x - playerX) === 1 && enemy.y === playerY) {
            // This will cause it to reverse or stay put
        }

        // Plan forward movement
        let nextY = enemy.y + enemy.movementDirection;
        let nextX = enemy.x;

        // If moving onto player, perform bump attack
        if (nextX === playerX && nextY === playerY) {
            this.performBumpAttack(enemy, player, isSimulation);
            return null;
        }

        // Check if forward move is blocked
        if (!enemy.isWalkable(nextX, nextY, grid) || enemies.some(e => e.x === nextX && e.y === nextY)) {
            // Reverse direction
            enemy.movementDirection *= -1;
            nextY = enemy.y + enemy.movementDirection;

            // If still blocked after reversing, stay put
            if (!enemy.isWalkable(nextX, nextY, grid) || enemies.some(e => e.x === nextX && e.y === nextY)) {
                // Re-check if new path moves into player
                if (nextX === playerX && nextY === playerY) {
                    this.performBumpAttack(enemy, player, isSimulation);
                }
                return null;
            }

            // Check if after reversing we move onto player
            if (nextX === playerX && nextY === playerY) {
                this.performBumpAttack(enemy, player, isSimulation);
                return null;
            }
        }

        return { x: nextX, y: nextY };
    }

    performDiagonalAttack(enemy, player, attackX, attackY, isSimulation) {
        if (isSimulation) return;
        player.takeDamage(enemy.attack);
        player.startBump(enemy.x - attackX, enemy.y - attackY);
        enemy.startBump(attackX - enemy.x, attackY - enemy.y);
        enemy.justAttacked = true;
        enemy.attackAnimation = 15;
        if (window.soundManager) window.soundManager.playSound('attack');
    }

    performBumpAttack(enemy, player, isSimulation) {
        if (isSimulation) return;
        player.startBump(enemy.x - player.x, enemy.y - player.y);
        enemy.startBump(player.x - enemy.x, player.y - enemy.y);
        if (window.soundManager) window.soundManager.playSound('attack');
    }
}

// Zard: charge adjacent diagonally and defensive retreat
export class ZardMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        const { x: playerX, y: playerY } = playerPos;

        // Check for simple adjacent diagonal attack first
        const dx_adj = Math.abs(enemy.x - playerX);
        const dy_adj = Math.abs(enemy.y - playerY);
        if (dx_adj === 1 && dy_adj === 1) {
            this.performDiagonalAttack(enemy, player, isSimulation);
            return null;
        }

        // Try charge attack
        const chargeResult = EnemySpecialActions.executeZardCharge(enemy, player, playerX, playerY, grid, enemies, isSimulation, game);
        if (chargeResult !== false) return chargeResult;

        // No charge possible - defensive retreat if vulnerable
        const dx = Math.abs(enemy.x - playerX);
        const dy = Math.abs(enemy.y - playerY);
        const currentDistance = dx + dy;
        if (currentDistance <= 2) {
            const defensiveMoves = this.tacticalAI ?
                this.tacticalAI.getDefensiveMoves(enemy, playerX, playerY, enemy.x, enemy.y, grid, enemies) : [];
            if (defensiveMoves.length > 0) {
                // Emergency retreat with smoke
                if (!isSimulation && this.calculateMoveDistance(enemy.x, enemy.y, defensiveMoves[0].x, defensiveMoves[0].y) > 1) {
                    enemy.smokeAnimations.push({
                        x: enemy.x + (defensiveMoves[0].x - enemy.x) / 2,
                        y: enemy.y + (defensiveMoves[0].y - enemy.y) / 2,
                        frame: 18
                    });
                }
                return { x: defensiveMoves[0].x, y: defensiveMoves[0].y };
            }
        }

        return null;
    }

    performDiagonalAttack(enemy, player, isSimulation) {
        if (!isSimulation && (!game || !game.playerJustAttacked)) {
            player.takeDamage(enemy.attack);
            player.startBump(enemy.x - player.x, enemy.y - player.y);
            enemy.startBump(player.x - enemy.x, player.y - enemy.y);
            enemy.justAttacked = true;
            enemy.attackAnimation = 15;
            if (window.soundManager) window.soundManager.playSound('attack');
        }
        return null;
    }

    calculateMoveDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }
}

// Lizardeaux: orthogonal charge behavior
export class LizardeauxMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        // Try charge attack
        const chargeResult = EnemySpecialActions.executeLizardeauxCharge(enemy, player, playerPos.x, playerPos.y, grid, enemies, isSimulation, game);
        if (chargeResult !== false) return chargeResult;

        // Fall back to normal movement
        return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }
}

// Lazerd: queen-like charge and movement
export class LazerdMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        // Try charge attack
        const chargeResult = EnemySpecialActions.executeLazerdCharge(enemy, player, playerPos.x, playerPos.y, grid, enemies, isSimulation, game);
        if (chargeResult !== false) return chargeResult;

        // Fall back to base movement with aggressive multi-tile moves
        return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }
}

// Lizardo: Aggressive close-distance attacker
export class LizardoMoveCalculator extends BaseMoveCalculator {
    calculateMove(enemy, player, playerPos, grid, enemies, isSimulation = false, game = null) {
        const dx = Math.abs(enemy.x - playerPos.x);
        const dy = Math.abs(enemy.y - playerPos.y);
        const distance = Math.max(dx, dy); // Chebyshev distance

        // If adjacent, always attack if possible
        if (distance === 1) {
            this.performAdjacentAttack(enemy, player, playerPos.x, playerPos.y, isSimulation, game);
            return null;
        }

        // Otherwise, use aggressive pathfinding
        return super.calculateMove(enemy, player, playerPos, grid, enemies, isSimulation, game);
    }

    performAdjacentAttack(enemy, player, playerX, playerY, isSimulation, game) {
        if (isSimulation || (game && game.playerJustAttacked)) return;

        player.takeDamage(enemy.attack);
        player.startBump(enemy.x - playerX, enemy.y - playerY);
        enemy.startBump(playerX - enemy.x, playerY - enemy.y);
        enemy.justAttacked = true;
        enemy.attackAnimation = 15;
        if (window.soundManager) window.soundManager.playSound('attack');
    }
}

// Lizord: Horse-like charging attacker
export class LizordMoveCalculator extends BaseMoveCalculator {
    // Lizord uses the default behavior, but with special handling already in BaseMoveCalculator
}
