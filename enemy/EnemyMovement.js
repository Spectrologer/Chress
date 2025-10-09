import { GRID_SIZE } from '../constants.js';
import { EnemyPathfinding } from './EnemyPathfinding.js';
import { EnemyChargeBehaviors } from './EnemyChargeBehaviors.js';
import { EnemyLineOfSight } from './EnemyLineOfSight.js';
import { EnemySpecialActions } from './EnemySpecialActions.js';

export const EnemyMovementMixin = {
    planMoveTowards(player, grid, enemies, playerPos, isSimulation = false) {
        const playerX = playerPos.x;
        const playerY = playerPos.y;

        // Check if player is already at the same position
        if (this.x === playerX && this.y === playerY) {
            return null; // Can't move onto player
        }

        // For Zard: emergency defensive retreat when already vulnerable
        if (this.enemyType === 'zard') {
            const dx = Math.abs(this.x - playerX);
            const dy = Math.abs(this.y - playerY);
            const currentDistance = dx + dy;

            // If Zard is currently vulnerable (adjacent to player), prioritize escape
            if (currentDistance <= 2) {
                const defensiveMoves = this.getDefensiveDiagonalMoves(playerX, playerY, this.x, this.y, grid, enemies);
                if (defensiveMoves.length > 0) {
                    // Emergency retreat - add smoke for dramatic effect
                    if (Math.abs(defensiveMoves[0].x - this.x) + Math.abs(defensiveMoves[0].y - this.y) > 1) {
                        this.smokeAnimations.push({ x: this.x + (defensiveMoves[0].x - this.x) / 2, y: this.y + (defensiveMoves[0].y - this.y) / 2, frame: 18 });
                    }
                    return { x: defensiveMoves[0].x, y: defensiveMoves[0].y };
                }
            }
        }

        // Zard: charge adjacent diagonally and ram if diagonal line of sight
        if (this.enemyType === 'zard') {
            const result = EnemySpecialActions.executeZardCharge(this, player, playerX, playerY, grid, enemies, isSimulation);
            if (result !== false) return result;
        }

        // Lizardeaux: charge adjacent and ram if orthogonal line of sight
        if (this.enemyType === 'lizardeaux') {
            const result = EnemySpecialActions.executeLizardeauxCharge(this, player, playerX, playerY, grid, enemies, isSimulation);
            if (result !== false) return result;
        }

        // Lazerd: queen-like movement with charge and attack in one turn if orthogonal/diagonal line of sight
        if (this.enemyType === 'lazerd') {
            const result = EnemySpecialActions.executeLazerdCharge(this, player, playerX, playerY, grid, enemies, isSimulation);
            if (result !== false) return result;
        }

        // Use BFS to find the shortest path to the player
        const path = EnemyPathfinding.findPath(this.x, this.y, playerX, playerY, grid, this.enemyType, (x, y, g) => this.isWalkable(x, y, g));

        if (path && path.length > 1) {
            let next = path[1];
            // For lazerd, aggressively close distance by moving multiple tiles along straight lines
            if (this.enemyType === 'lazerd' && path.length > 2) {
                // Find the maximum distance along a straight orthogonal/diagonal line
                const directions = [
                    { x: 0, y: -1 }, // North
                    { x: 0, y: 1 },  // South
                    { x: -1, y: 0 }, // West
                    { x: 1, y: 0 },  // East
                    { x: -1, y: -1 }, // Northwest
                    { x: 1, y: -1 },  // Northeast
                    { x: -1, y: 1 },  // Southwest
                    { x: 1, y: 1 }    // Southeast
                ];
                const dir = directions.find(d => d.x === next.x - this.x && d.y === next.y - this.y);
                if (dir) {
                    let maxMoveIndex = 1;
                    for (let i = 2; i < path.length; i++) {
                        const checkX = path[i].x - dir.x * (i - maxMoveIndex);
                        const checkY = path[i].y - dir.y * (i - maxMoveIndex);
                        if (checkX !== this.x || checkY !== this.y) break;
                        if (!this.isWalkable(path[i].x, path[i].y, grid)) break;
                        if (enemies.find(e => e.x === path[i].x && e.y === path[i].y)) break;
                        maxMoveIndex = i;
                    }
                    next = path[maxMoveIndex];
                }
            }
            // For lizardeaux, aggressively close distance by moving multiple tiles along straight orthogonal lines
            if (this.enemyType === 'lizardeaux' && path.length > 2) {
                // Find the maximum distance along a straight orthogonal line
                const directions = [
                    { x: 0, y: -1 }, // North
                    { x: 0, y: 1 },  // South
                    { x: -1, y: 0 }, // West
                    { x: 1, y: 0 },  // East
                ];
                const dir = directions.find(d => d.x === next.x - this.x && d.y === next.y - this.y);
                if (dir) {
                    let maxMoveIndex = 1;
                    for (let i = 2; i < path.length; i++) {
                        const checkX = path[i].x - dir.x * (i - maxMoveIndex);
                        const checkY = path[i].y - dir.y * (i - maxMoveIndex);
                        if (checkX !== this.x || checkY !== this.y) break;
                        if (!this.isWalkable(path[i].x, path[i].y, grid)) break;
                        if (enemies.find(e => e.x === path[i].x && e.y === path[i].y)) break;
                        maxMoveIndex = i;
                    }
                    next = path[maxMoveIndex];
                }
            }
            // For zard, move multiple tiles along straight diagonal lines for faster approach
            if (this.enemyType === 'zard' && path.length > 2) {
                // Find the maximum distance along a straight diagonal line
                const directions = [
                    { x: -1, y: -1 }, // Northwest
                    { x: 1, y: -1 },  // Northeast
                    { x: -1, y: 1 },  // Southwest
                    { x: 1, y: 1 }    // Southeast
                ];
                const dir = directions.find(d => d.x === next.x - this.x && d.y === next.y - this.y);
                if (dir) {
                    let maxMoveIndex = 1;
                    for (let i = 2; i < path.length; i++) {
                        const checkX = path[i].x - dir.x * (i - maxMoveIndex);
                        const checkY = path[i].y - dir.y * (i - maxMoveIndex);
                        if (checkX !== this.x || checkY !== this.y) break;
                        if (!this.isWalkable(path[i].x, path[i].y, grid)) break;
                        if (enemies.find(e => e.x === path[i].x && e.y === path[i].y)) break;
                        maxMoveIndex = i;
                    }
                    next = path[maxMoveIndex];
                }
            }
            const newX = next.x;
            const newY = next.y;

            // For Zard: check if this move would leave it vulnerable to diagonal attack next turn
            if (this.enemyType === 'zard') {
                const dx = Math.abs(newX - playerX);
                const dy = Math.abs(newY - playerY);
                const newDistance = dx + dy;

                // If moving closer to player but would be vulnerable (adjacent diagonally or orthogonally)
                if (newDistance <= 2) {
                    // Check alternative diagonal moves that increase distance
                    const currentDistance = Math.abs(this.x - playerX) + Math.abs(this.y - playerY);
                    const alternatives = this.getDefensiveDiagonalMoves(playerX, playerY, newX, newY, grid, enemies);

                    if (alternatives.length > 0) {
                        // Add smoke for defensive retreat
                        if (Math.abs(alternatives[0].x - this.x) + Math.abs(alternatives[0].y - this.y) > 1) {
                            this.smokeAnimations.push({ x: this.x + (alternatives[0].x - this.x) / 2, y: this.y + (alternatives[0].y - this.y) / 2, frame: 18 });
                        }
                        return { x: alternatives[0].x, y: alternatives[0].y };
                    }
                }
            }

            // Add smoke animations for ram attack enemies when they perform long moves
            if ( (this.enemyType === 'lizardeaux' || this.enemyType === 'zard') && (Math.abs(newX - this.x) + Math.abs(newY - this.y) > 1) ) {
                // Add smoke on each tile along the path
                const startX = this.x;
                const startY = this.y;
                const dx = newX - startX;
                const dy = newY - startY;
                const distX = Math.abs(dx);
                const distY = Math.abs(dy);
            if (distX >= distY) {
                // Horizontal dominant
                const stepX = dx > 0 ? 1 : -1;
                const stepY = dy === 0 ? 0 : (dy / distX) * stepX;
                for (let i = 1; i < distX; i++) {
                    this.smokeAnimations.push({ x: startX + i * stepX, y: startY + Math.round((i * dy) / distX), frame: 18 });
                }
            } else {
                // Vertical dominant
                const stepY = dy > 0 ? 1 : -1;
                const stepX = dx === 0 ? 0 : (dx / distY) * stepY;
                for (let i = 1; i < distY; i++) {
                    this.smokeAnimations.push({ x: startX + Math.round((i * dx) / distY), y: startY + i * stepY, frame: 18 });
                }
            }
            }

            // Check if within bounds and walkable (should be, since path found)
            if (this.isWalkable(newX, newY, grid)) {
                // Check if the target position has the player
                if (newX === playerX && newY === playerY) {
                    if (!isSimulation) {
                        if (this.enemyType === 'lizord') {
                            // Lizord bump attack: displace player to nearest walkable tile and take the spot
                            const possiblePositions = [
                                { x: playerX, y: playerY - 1 },
                                { x: playerX, y: playerY + 1 },
                                { x: playerX - 1, y: playerY },
                                { x: playerX + 1, y: playerY }
                            ];
                            let displaced = false;
                            for (const pos of possiblePositions) {
                                if (player.isWalkable(pos.x, pos.y, grid) && !enemies.find(e => e.x === pos.x && e.y === pos.y)) {
                                    player.setPosition(pos.x, pos.y);
                                    displaced = true;
                                    break;
                                }
                            }
                            if (displaced) {
                                // Damage player
                                player.takeDamage(this.attack);
                                player.startBump(this.x - newX, this.y - newY);
                                this.startBump(newX - this.x, newY - this.y);
                                this.justAttacked = true;
                                this.attackAnimation = 15;
                                window.soundManager?.playSound('attack');
                                // Move to where player was
                                this.x = newX;
                                this.y = newY;
                            }
                        } else {
                            // Enemy tries to move onto player - register attack
                            player.takeDamage(this.attack);
                            player.startBump(this.x - playerX, this.y - playerY);
                            this.startBump(playerX - this.x, playerY - this.y);
                            this.justAttacked = true;
                            this.attackAnimation = 15; // Dramatic attack animation frames
                            window.soundManager?.playSound('attack');
                            if (player.isDead()) {
                            }
                        }

                        // Special ram knockback for lizardeaux
                        if (this.enemyType === 'lizardeaux') {
                            // Calculate knockback direction (away from enemy)
                            const attackDx = newX - this.x;
                            const attackDy = newY - this.y;
                            if (attackDx !== 0 || attackDy !== 0) {
                                const absDx = Math.abs(attackDx);
                                const absDy = Math.abs(attackDy);
                                let knockbackX = playerX;
                                let knockbackY = playerY;
                                if (absDx > absDy) {
                                    // Horizontal dominant
                                    knockbackX += attackDx > 0 ? 1 : -1;
                                } else if (absDy > absDx) {
                                    // Vertical dominant
                                    knockbackY += attackDy > 0 ? 1 : -1;
                                } else {
                                    // Diagonal, knock back in both directions
                                    knockbackX += attackDx > 0 ? 1 : -1;
                                    knockbackY += attackDy > 0 ? 1 : -1;
                                }
                                // Only knockback if the position is walkable
                                if (player.isWalkable(knockbackX, knockbackY, grid)) {
                                    player.setPosition(knockbackX, knockbackY);
                                }
                            }
                        }

                        // For lizord, already moved; for others, does not move
                        return null;
                    } else {
                        // In simulation, if it would attack, return null
                        return null;
                    }
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
    },

    // For backward compatibility or single enemy move (though we won't use this anymore)
    moveTowards(player, grid) {
        const move = this.planMoveTowards(player, grid, [], player.getPosition());
        if (move) {
            this.x = move.x;
            this.y = move.y;
        }
    },

    // Get movement directions for rendering arrows
    getMovementDirections() {
        return EnemyPathfinding.getMovementDirections(this.enemyType);
    },

    // Helper for Zard: find defensive diagonal moves that increase distance from player
    getDefensiveDiagonalMoves(playerX, playerY, proposedX, proposedY, grid, enemies) {
        const alternatives = [];
        const diagonalDirs = [
            { x: -1, y: -1 }, // Northwest
            { x: 1, y: -1 },  // Northeast
            { x: -1, y: 1 },  // Southwest
            { x: 1, y: 1 }    // Southeast
        ];

        const currentDist = Math.abs(this.x - playerX) + Math.abs(this.y - playerY);
        const proposedDist = Math.abs(proposedX - playerX) + Math.abs(proposedY - playerY);

        // Find diagonal moves that would be safer than the proposed move
        for (const dir of diagonalDirs) {
            let newX = this.x + dir.x;
            let newY = this.y + dir.y;

            // Check if move would be out of bounds
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) continue;

            // Must be walkable and not occupied
            if (!this.isWalkable(newX, newY, grid)) continue;
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
};
