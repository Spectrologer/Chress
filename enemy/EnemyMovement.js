import { GRID_SIZE } from '../core/constants.js';
import { EnemyPathfinding } from './EnemyPathfinding.js';
import { EnemyChargeBehaviors } from './EnemyChargeBehaviors.js';
import { EnemyLineOfSight } from './EnemyLineOfSight.js';
import { EnemySpecialActions } from './EnemySpecialActions.js';

export const EnemyMovementMixin = {
    planMoveTowards(player, grid, enemies, playerPos, isSimulation = false, game = null) {
        const playerX = playerPos.x;
        const playerY = playerPos.y;

        // Check if player is already at the same position
        if (this.x === playerX && this.y === playerY) {
            return null; // Can't move onto player
        }

        // Lizardy: pawn-like movement (north/south) and forward diagonal attack
        if (this.enemyType === 'lizardy') {
            // Initialize direction if it doesn't exist, default to South
            if (this.movementDirection === undefined) {
                this.movementDirection = 1; // 1 for South, -1 for North
            }

            const attackDirections = this.movementDirection === -1
                ? [{ x: -1, y: -1 }, { x: 1, y: -1 }] // NW, NE when moving North
                : [{ x: -1, y: 1 }, { x: 1, y: 1 }];   // SW, SE when moving South

            // Check for diagonal attack
            if (!game || !game.playerJustAttacked) {
                for (const dir of attackDirections) {
                    const attackX = this.x + dir.x;
                    const attackY = this.y + dir.y;
                    if (attackX === playerX && attackY === playerY) {
                        // This is a valid diagonal attack. Perform the attack and don't move.
                        if (!isSimulation) {
                            player.takeDamage(this.attack);
                            player.startBump(this.x - playerX, this.y - playerY);
                            this.startBump(playerX - this.x, playerY - this.y);
                            this.justAttacked = true;
                            this.attackAnimation = 15;
                            window.soundManager?.playSound('attack');
                        }
                        // Return null because the attack is the entire move; the lizardy does not change position.
                        return null;
                    }
                }
            }

            // If no attack, plan forward movement
            let nextY = this.y + this.movementDirection;
            let nextX = this.x;

            // Check if moving into the player
            if (nextX === playerX && nextY === playerY) {
                if (!isSimulation) {
                    // Bump player and self, but deal no damage and don't move.
                    player.startBump(this.x - playerX, this.y - playerY);
                    this.startBump(playerX - this.x, playerY - this.y);
                    window.soundManager?.playSound('attack');
                }
                return null; // Do not move onto the player's tile
            }

            // Check if forward move is blocked
            if (!this.isWalkable(nextX, nextY, grid) || enemies.some(e => e.x === nextX && e.y === nextY)) {
                // Blocked, so reverse direction
                this.movementDirection *= -1;
                nextY = this.y + this.movementDirection;

                // If still blocked after reversing, stay put
                if (!this.isWalkable(nextX, nextY, grid) || enemies.some(e => e.x === nextX && e.y === nextY)) {
                    return null; // Stay put
                }

                // After reversing, re-check if the new path moves into the player
                if (nextX === playerX && nextY === playerY) {
                    if (!isSimulation) {
                        // Bump player and self, but deal no damage and don't move.
                        player.startBump(this.x - playerX, this.y - playerY);
                        this.startBump(playerX - this.x, playerY - this.y);
                        window.soundManager?.playSound('attack');
                    }
                    return null; // Do not move onto the player's tile
                }
            }

            // Check if player is orthogonally adjacent (left/right), which is not an attack for lizardy.
            // This prevents falling through to the default attack logic.
            if (Math.abs(this.x - playerX) === 1 && this.y === playerY) {
                // Treat as a blocked path, which will cause it to reverse or stay put.
            } else {
                // If we reach here, a valid N/S move was found after potentially reversing direction.
                return { x: nextX, y: nextY };
            }
            // If we reach here, a valid N/S move was found after potentially reversing direction.

            return { x: nextX, y: nextY };
        }

        // Zard: charge adjacent diagonally and ram if diagonal line of sight
        if (this.enemyType === 'zard') {
            // First, check for a simple adjacent diagonal attack.
            if (!game || !game.playerJustAttacked) {
                const dx_adj = Math.abs(this.x - playerX);
                const dy_adj = Math.abs(this.y - playerY);
                if (dx_adj === 1 && dy_adj === 1) { // Diagonally adjacent
                    if (!isSimulation) {
                        player.takeDamage(this.attack);
                        player.startBump(this.x - playerX, this.y - playerY);
                        this.startBump(playerX - this.x, playerY - this.y);
                        this.justAttacked = true;
                        this.attackAnimation = 15;
                        window.soundManager?.playSound('attack');
                    }
                    return null; // Attack is the move
                }
            }

            // If not adjacent, then consider a charge.
            const result = EnemySpecialActions.executeZardCharge(this, player, playerX, playerY, grid, enemies, isSimulation, game);
            if (result !== false) return result;
            // If can't charge, emergency defensive retreat when already vulnerable
            const dx = Math.abs(this.x - playerX);
            const dy = Math.abs(this.y - playerY);
            const currentDistance = dx + dy;
            if (currentDistance <= 2) {
                const defensiveMoves = this.getDefensiveMoves(playerX, playerY, this.x, this.y, grid, enemies);
                if (defensiveMoves.length > 0) {
                    // Emergency retreat - add smoke for dramatic effect
                    if (Math.abs(defensiveMoves[0].x - this.x) + Math.abs(defensiveMoves[0].y - this.y) > 1) {
                        this.smokeAnimations.push({ x: this.x + (defensiveMoves[0].x - this.x) / 2, y: this.y + (defensiveMoves[0].y - this.y) / 2, frame: 18 });
                    }
                    return { x: defensiveMoves[0].x, y: defensiveMoves[0].y };
                }
            }
        }

        // Lizardeaux: rook charge behavior (handled in special actions)
        if (this.enemyType === 'lizardeaux') {
            const result = EnemySpecialActions.executeLizardeauxCharge(this, player, playerX, playerY, grid, enemies, isSimulation, game);
            if (result !== false) return result;
            // If not adjacent and no charge possible, fall through to normal movement
        }

        // Lazerd: queen-like movement with charge and attack in one turn if orthogonal/diagonal line of sight
        if (this.enemyType === 'lazerd') {
            const result = EnemySpecialActions.executeLazerdCharge(this, player, playerX, playerY, grid, enemies, isSimulation, game);
            if (result !== false) return result;
        }

        // Lizardo: Aggressively close distance. If it can attack, it will.
        if (this.enemyType === 'lizardo') {
            const dx = Math.abs(this.x - playerX);
            const dy = Math.abs(this.y - playerY);
            const distance = Math.max(dx, dy); // Use Chebyshev distance for 8-way adjacency

            if (distance === 1) {
                // If adjacent, attack immediately. This overrides any other logic.
                if (!game || !game.playerJustAttacked) {
                    if (!isSimulation) {
                        player.takeDamage(this.attack);
                        player.startBump(this.x - playerX, this.y - playerY);
                        this.startBump(playerX - this.x, playerY - this.y);
                        this.justAttacked = true;
                        this.attackAnimation = 15;
                        window.soundManager?.playSound('attack');
                    }
                    return null; // Attack is the move, no change in position.
                }
                return null; // Player just attacked, so lizardo can't retaliate this turn.
            }
        }

        // Leader-Follower Pattern: when 3+ enemies, designate leader pursues player, others follow leader
        const totalEnemies = enemies.length;
        const isLargeGroup = totalEnemies >= 3;
        const leader = isLargeGroup ? enemies.find(e => e === enemies[0] || e) : null; // simple leader selection
        const followLeader = isLargeGroup && this !== leader;
        const targetX = followLeader ? leader.x : playerX;
        const targetY = followLeader ? leader.y : playerY;

        // Use BFS to find the shortest path to target (player or leader)
        const path = EnemyPathfinding.findPath(this.x, this.y, targetX, targetY, grid, this.enemyType, (x, y, g) => this.isWalkable(x, y, g));

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

            // Cooperative clustering: adjust move to stay closer to allies and spread out from same areas
            const currentDistToPlayer = Math.abs(next.x - playerX) + Math.abs(next.y - playerY);
            const currentClustering = this.calculateAllyDistance(next.x, next.y, enemies);
            const currentDiversity = this.calculateDirectionDiversity(next.x, next.y, playerX, playerY, enemies);
            const moveDirs = this.getMovementDirections();
            for (const dir of moveDirs) {
                const altX = this.x + dir.x;
                const altY = this.y + dir.y;
                if (altX < 0 || altX >= GRID_SIZE || altY < 0 || altY >= GRID_SIZE) continue;
                if (!this.isWalkable(altX, altY, grid)) continue;
                if (enemies.find(e => e.x === altX && e.y === altY)) continue; // avoid moving onto other enemy
                const altDistToPlayer = Math.abs(altX - playerX) + Math.abs(altY - playerY);
                const altClustering = this.calculateAllyDistance(altX, altY, enemies);
                const altDiversity = this.calculateDirectionDiversity(altX, altY, playerX, playerY, enemies);
                // Prefer moves that improve clustering or diversity, don't significantly increase player distance, and avoid stacking
                const clusteringGain = currentClustering - altClustering;
                const diversityGain = altDiversity - currentDiversity; // higher diversity is better
                if ((clusteringGain > 0.3 || diversityGain > 0) && altDistToPlayer <= currentDistToPlayer + 2 && !this.isStackedBehind(altX, altY, playerX, playerY, enemies)) {
                    next.x = altX;
                    next.y = altY;
                    break; // take first valid improvement
                }
            }

            const newX = next.x;
            const newY = next.y;

            // Check if this move would leave the enemy vulnerable to attack next turn
            const dx = Math.abs(newX - playerX);
            const dy = Math.abs(newY - playerY);
            const newDistance = dx + dy;

            // If moving closer to player but would be vulnerable (adjacent), unless it's an attack move. Lizardo is aggressive and will not retreat.
            if (this.enemyType !== 'lizardo' && newDistance <= 2 && !(newX === playerX && newY === playerY)) {
                // Check alternative moves that increase distance
                const currentDistance = Math.abs(this.x - playerX) + Math.abs(this.y - playerY);
                const alternatives = this.getDefensiveMoves(playerX, playerY, newX, newY, grid, enemies);

                if (alternatives.length > 0) {
                    // Add smoke for defensive retreat
                    if (Math.abs(alternatives[0].x - this.x) + Math.abs(alternatives[0].y - this.y) > 1) {
                        this.smokeAnimations.push({ x: this.x + (alternatives[0].x - this.x) / 2, y: this.y + (alternatives[0].y - this.y) / 2, frame: 18 });
                    }
                    return { x: alternatives[0].x, y: alternatives[0].y };
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
                                if (game) {
                                    this.lastX = this.x;
                                    this.lastY = this.y;
                                }
                                this.x = newX;
                                this.y = newY;
                                if (game && this.enemyType === 'lizord' && (this.lastX !== this.x || this.lastY !== this.y)) {
                                    const dx = this.x - this.lastX;
                                    const dy = this.y - this.lastY;
                                    let midX, midY;
                                    if (dx === 0 || dy === 0) {
                                        // Straight move, midpoint
                                        midX = (this.lastX + this.x) / 2;
                                        midY = (this.lastY + this.y) / 2;
                                    } else {
                                        // Diagonal move, L shape
                                        if (Math.abs(dx) > Math.abs(dy)) {
                                            // Horizontal dominant: move horizontal first
                                            midX = this.x;
                                            midY = this.lastY;
                                        } else if (Math.abs(dy) > Math.abs(dx)) {
                                            // Vertical dominant: move vertical first
                                            midX = this.lastX;
                                            midY = this.y;
                                        } else {
                                            // Equal (45 degree), arbitrary choice
                                            midX = this.x;
                                            midY = this.lastY;
                                        }
                                    }
                                    game.horseChargeAnimations.push({
                                        startPos: { x: this.lastX, y: this.lastY },
                                        midPos: { x: midX, y: midY },
                                        endPos: { x: this.x, y: this.y },
                                        frame: 20
                                    });
                                }
                            }
                        } else {
                            // Enemy tries to move onto player - register attack
                            if (!game || !game.playerJustAttacked) {
                                player.takeDamage(this.attack);
                                player.startBump(this.x - playerX, this.y - playerY);
                                this.startBump(playerX - this.x, playerY - this.y);
                                this.justAttacked = true;
                                this.attackAnimation = 15; // Dramatic attack animation frames
                                window.soundManager?.playSound('attack');
                                if (player.isDead()) {
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

    // Helper: calculate average distance to other enemies (lower is better clustering)
    calculateAllyDistance(x, y, enemies) {
        let totalDist = 0;
        let count = 0;
        for (const enemy of enemies) {
            if (enemy === this) continue; // skip self
            const dist = Math.abs(x - enemy.x) + Math.abs(y - enemy.y);
            if (dist > 0) { // ensure not zero
                totalDist += dist;
                count++;
            }
        }
        return count > 0 ? totalDist / count : 100; // return high value if no allies
    },

    // Helper: calculate direction diversity relative to player (higher is better, means less crowding in same direction)
    calculateDirectionDiversity(x, y, px, py, enemies) {
        const dx = x - px;
        const dy = y - py;
        let thisQuad = 0;
        if (dx > 0 && dy > 0) thisQuad = 1; // NE
        else if (dx > 0 && dy < 0) thisQuad = 2; // SE
        else if (dx < 0 && dy > 0) thisQuad = 3; // NW
        else if (dx < 0 && dy < 0) thisQuad = 4; // SW
        else if (dx > 0 && dy === 0) thisQuad = 10; // East
        else if (dx < 0 && dy === 0) thisQuad = 20; // West
        else if (dy > 0 && dx === 0) thisQuad = 30; // North
        else if (dy < 0 && dx === 0) thisQuad = 40; // South

        let count = 0;
        let total = 0;
        for (const enemy of enemies) {
            if (enemy === this) continue;
            const ex = enemy.x - px;
            const ey = enemy.y - py;
            let enemyQuad = 0;
            if (ex > 0 && ey > 0) enemyQuad = 1;
            else if (ex > 0 && ey < 0) enemyQuad = 2;
            else if (ex < 0 && ey > 0) enemyQuad = 3;
            else if (ex < 0 && ey < 0) enemyQuad = 4;
            else if (ex > 0 && ey === 0) enemyQuad = 10;
            else if (ex < 0 && ey === 0) enemyQuad = 20;
            else if (ey > 0 && ex === 0) enemyQuad = 30;
            else if (ey < 0 && ex === 0) enemyQuad = 40;
            total++;
            if (enemyQuad === thisQuad) count++;
        }
        return total > 0 ? (total - count) / total : 1; // higher diversity when fewer in same quadrant
    },

    // Helper: check if position is stacked behind another enemy from player's perspective (for flanking)
    isStackedBehind(x, y, px, py, enemies) {
        for (const enemy of enemies) {
            if (enemy === this) continue;
            // Check if enemy is in the same line and closer to player
            const ex = enemy.x - px;
            const ey = enemy.y - py;
            const tx = x - px;
            const ty = y - py;

            // Same direction (same row or col) and enemy is between player and x,y
            if ((tx === 0 && ex === 0 && ((ty > 0 && ey > 0 && ey < ty) || (ty < 0 && ey < 0 && ey > ty))) ||
                (ty === 0 && ey === 0 && ((tx > 0 && ex > 0 && ex < tx) || (tx < 0 && ex < 0 && ex > tx)))) {
                return true;
            }

            // Diagonal check
            if (Math.abs(tx) === Math.abs(ty) && Math.abs(ex) === Math.abs(ey) &&
                Math.abs(tx) + Math.abs(ty) > Math.abs(ex) + Math.abs(ey) && tx * ex > 0 && ty * ey > 0) {
                return true;
            }
        }
        return false;
    },

    // Helper: find defensive moves that increase distance from player
    getDefensiveMoves(playerX, playerY, proposedX, proposedY, grid, enemies) {
        const alternatives = [];
        const dirs = this.getMovementDirections();

        const currentDist = Math.abs(this.x - playerX) + Math.abs(this.y - playerY);
        const proposedDist = Math.abs(proposedX - playerX) + Math.abs(proposedY - playerY);

        // Find defensive moves that would be safer than the proposed move
        for (const dir of dirs) {
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
