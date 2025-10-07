import { TILE_TYPES } from './constants.js';

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
        this.liftOffsetY = 0;
        this.liftFrames = 0;
    }

    planMoveTowards(player, grid, enemies, playerPos, isSimulation = false) {
        const playerX = playerPos.x;
        const playerY = playerPos.y;

        // Check if player is already at the same position
        if (this.x === playerX && this.y === playerY) {
            return null; // Can't move onto player
        }

        // Lizardeaux: charge adjacent and ram in one turn if line of sight
        if (this.enemyType === 'lizardeaux') {
            const dx = Math.abs(this.x - playerX);
            const dy = Math.abs(this.y - playerY);
            const isAdjacent = (dx + dy === 1);

            // If adjacent, perform ram attack
            if (isAdjacent) {
                this.performRamFromDistance(player, playerX, playerY, grid, enemies, isSimulation);
                return null;
            } else {
                // If not adjacent, but line of sight, charge to adjacent tile and ram
                const chargeMove = this.getChargeAdjacentMove(playerX, playerY, grid, enemies);
                if (chargeMove) {
                    // Move to adjacent tile
                    if (!isSimulation) {
                        this.x = chargeMove.x;
                        this.y = chargeMove.y;
                        this.liftFrames = 15; // Start lift animation
                    }
                    // After moving, check if now adjacent and ram
                    const newDx = Math.abs(chargeMove.x - playerX);
                    const newDy = Math.abs(chargeMove.y - playerY);
                    if (newDx + newDy === 1) {
                        this.performRamFromDistance(player, playerX, playerY, grid, enemies, isSimulation);
                    }
                    return null; // All in one turn
                }
            }
        }

        // Zard: bishop-like movement, charge and attack in one turn if diagonal line of sight
        if (this.enemyType === 'zard') {
            // Check if diagonal line of sight exists
            if (this.checkDiagonalLineOfSight(playerX, playerY, grid)) {
                this.performBishopCharge(player, playerX, playerY, grid, isSimulation);
                return null;
            }
        }

        // Lazerd: queen-like movement with charge and attack in one turn if orthogonal/diagonal line of sight
        if (this.enemyType === 'lazerd') {
            // Check if orthogonal or diagonal line of sight exists
            const chargeMove = this.getQueenChargeAdjacentMove(playerX, playerY, grid, enemies);
            if (chargeMove) {
                // Set charge position to adjacent of player
                if (!isSimulation) {
                    this.x = chargeMove.x;
                    this.y = chargeMove.y;
                    // Now adjacent, attack
                    player.takeDamage(this.attack);
                    player.startBump(this.x - playerX, this.y - playerY);
                    this.startBump(playerX - this.x, playerY - this.y);
                    this.justAttacked = true;
                    this.attackAnimation = 15;
                    console.log(`Lazerd queen charges and attacks player!`);
                    if (player.isDead()) console.log('Player died!');
                    // Knockback away
                    const dx = playerX - chargeMove.x; // Since chargeMove is adjacent, dx= +/-1 or 0
                    const dy = playerY - chargeMove.y;
                    let knockbackX = playerX;
                    let knockbackY = playerY;
                    if (dx !== 0) knockbackX += dx;
                    if (dy !== 0) knockbackY += dy;
                    // Only knockback if the position is walkable
                    if (player.isWalkable(knockbackX, knockbackY, grid)) {
                        player.setPosition(knockbackX, knockbackY);
                    }
                }
                return null;
            }
        }

        // Use BFS to find the shortest path to the player
        const path = this.findPath(this.x, this.y, playerX, playerY, grid);

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
            const newX = next.x;
            const newY = next.y;

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
                                console.log(`Lizord bumped you! Player health: ${player.getHealth()}`);
                                if (player.isDead()) console.log('Player died!');
                                // Move to where player was
                                this.x = newX;
                                this.y = newY;
                            }
                        } else {
                            // Enemy tries to move onto player - register attack
                            console.log('Enemy tries to move onto player - registering one attack!');
                            player.takeDamage(this.attack);
                            player.startBump(this.x - playerX, this.y - playerY);
                            this.startBump(playerX - this.x, playerY - this.y);
                            this.justAttacked = true;
                            this.attackAnimation = 15; // Dramatic attack animation frames
                            console.log(`Enemy hit player! Player health: ${player.getHealth()}`);
                            if (player.isDead()) {
                                console.log('Player died!');
                            }
                        }

                        // Special knockback for lizardeaux ram attack
                        if (this.enemyType === 'lizardeaux') {
                            // Calculate knockback direction (away from enemy)
                            const attackDx = newX - this.x;
                            const attackDy = newY - this.y;
                            if (attackDx !== 0 || attackDy !== 0) {
                                // Normalize direction and move player back 1 tile
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
        } else if (this.enemyType === 'zard') {
            // Zard can only move diagonally (4 directions like a bishop)
            directions = [
                { x: -1, y: -1 }, // Northwest
                { x: 1, y: -1 },  // Northeast
                { x: -1, y: 1 },  // Southwest
                { x: 1, y: 1 }    // Southeast
            ];
        } else if (this.enemyType === 'lizord') {
            // Lizord: knight-like movement (L-shape: 1 in one direction, 2 in perpendicular)
            directions = [
                { x: 1, y: 2 },
                { x: 1, y: -2 },
                { x: -1, y: 2 },
                { x: -1, y: -2 },
                { x: 2, y: 1 },
                { x: 2, y: -1 },
                { x: -2, y: 1 },
                { x: -2, y: -1 }
            ];
        } else if (this.enemyType === 'lazerd') {
            // Lwzerd: queen-like movement (orthogonal and diagonal, any distance)
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
        return (tile === 0 || tile === 3 || tile === 6 || (tile && tile.type === 7)) && !((tile && tile.type === TILE_TYPES.SIGN) || tile === TILE_TYPES.SIGN);  // FLOOR, EXIT, WATER, FOOD, but not SIGN
    }

    performRamFromDistance(player, playerX, playerY, grid, enemies, isSimulation = false) {
        // Lizardeaux ram attack from distance: check if player is in straight line with clear line of sight and distance > 1
        // Add enemies as obstacles for line of sight
        const sameRow = this.y === playerY;
        const sameCol = this.x === playerX;

        if (!sameRow && !sameCol) {
            return false; // Not in straight line
        }

        let distance = 0;

        if (sameRow) {
            const minX = Math.min(this.x, playerX);
            const maxX = Math.max(this.x, playerX);
            for (let x = minX + 1; x < maxX; x++) {
                if (!this.isWalkable(x, this.y, grid)) {
                    return false;
                }
                if (player.x !== x || player.y !== this.y) {
                    if (player.x !== x && enemies.find(e => e.x === x && e.y === this.y)) return false;
                } else if (enemies.find(e => e.x === x && e.y === this.y)) return false;
            }
            distance = Math.abs(playerX - this.x);
        } else {
            const minY = Math.min(this.y, playerY);
            const maxY = Math.max(this.y, playerY);
            for (let y = minY + 1; y < maxY; y++) {
                if (!this.isWalkable(this.x, y, grid)) {
                    return false;
                }
                if (player.y !== y || player.x !== this.x) {
                    if (player.y !== y && enemies.find(e => e.x === this.x && e.y === y)) return false;
                } else if (enemies.find(e => e.x === this.x && e.y === y)) return false;
            }
            distance = Math.abs(playerY - this.y);
        }

        // Ram from any distance when line of sight is clear
        // distance >= 1 is already checked by calling this method only when line of sight exists

        if (!isSimulation) {
            // Perform ram attack from distance
            console.log('Lizardeaux rams player from distance!');
            player.takeDamage(this.attack);
            player.startBump(this.x - playerX, this.y - playerY);
            this.startBump(playerX - this.x, playerY - this.y);
            this.justAttacked = true;
            this.attackAnimation = 15; // Dramatic attack animation frames
            console.log(`Lizardeaux rammed player from distance! Player health: ${player.getHealth()}`);
            if (player.isDead()) {
                console.log('Player died from distance ram!');
            }

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

        return true; // Ram attack from distance performed
    }

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
        this.bumpOffsetX = deltaX * 24; // Increased from 16 for more impact
        this.bumpOffsetY = deltaY * 24;
        this.bumpFrames = 15; // Increased from 10 for longer animation
    }

    updateAnimations() {
        if (this.deathAnimation > 0) {
            this.deathAnimation--;
        }
        if (this.bumpFrames > 0) {
            this.bumpFrames--;
            // Gradually reduce the offset
            this.bumpOffsetX *= 0.85; // Adjusted decay for smoother return
            this.bumpOffsetY *= 0.85;
        }
        if (this.attackAnimation > 0) {
            this.attackAnimation--;
        }
        if (this.liftFrames > 0) {
            this.liftFrames--;
            // Lift animation: parabolic curve (lift up then land)
            const progress = this.liftFrames / 15;
            const maxLift = -12; // Lift 12 pixels up (half tile roughly)
            this.liftOffsetY = maxLift * 4 * progress * (1 - progress); // Parabolic lift
        }
    }

    // Helper for lizardeaux: find adjacent tile next to player along line of sight and charge there
    getChargeAdjacentMove(playerX, playerY, grid, enemies) {
        // Only charge if line of sight in straight row or column
        const sameRow = this.y === playerY;
        const sameCol = this.x === playerX;
        if (!sameRow && !sameCol) return null;

        // Determine direction
        let direction = null;
        if (sameRow) {
            direction = { x: playerX > this.x ? 1 : -1, y: 0 };
        } else {
            direction = { x: 0, y: playerY > this.y ? 1 : -1 };
        }

        // Check clear line of sight (walls/obstacles AND other enemies)
        if (sameRow) {
            const minX = Math.min(this.x, playerX);
            const maxX = Math.max(this.x, playerX);
            for (let x = minX + 1; x < maxX; x++) {
                if (!this.isWalkable(x, this.y, grid)) return null;
                if (enemies.find(e => e.x === x && e.y === this.y)) return null;
            }
        } else {
            const minY = Math.min(this.y, playerY);
            const maxY = Math.max(this.y, playerY);
            for (let y = minY + 1; y < maxY; y++) {
                if (!this.isWalkable(this.x, y, grid)) return null;
                if (enemies.find(e => e.x === this.x && e.y === y)) return null;
            }
        }

        // Find adjacent tile next to player in the direction of charge
        const adjX = playerX - direction.x;
        const adjY = playerY - direction.y;

        // Check if that tile is walkable and not occupied by another enemy
        if (this.isWalkable(adjX, adjY, grid) &&
            !enemies.find(e => e.x === adjX && e.y === adjY)) {
            return { x: adjX, y: adjY };
        }

        // If not possible, try other adjacent tiles (orthogonal only)
        const adjacents = [
            { x: playerX + 1, y: playerY },
            { x: playerX - 1, y: playerY },
            { x: playerX, y: playerY + 1 },
            { x: playerX, y: playerY - 1 }
        ];
        for (const pos of adjacents) {
            if (this.isWalkable(pos.x, pos.y, grid) &&
                !enemies.find(e => e.x === pos.x && e.y === pos.y)) {
                // Only allow if line of sight from current position to that tile
                if ((sameRow && pos.y === this.y) || (sameCol && pos.x === this.x)) {
                    return { x: pos.x, y: pos.y };
                }
            }
        }
        return null;
    }

    // Helper for Lazerd: find adjacent tile next to player along ortho/diagonal line of sight and charge there
    getQueenChargeAdjacentMove(playerX, playerY, grid, enemies) {
        // Check if line of sight in row, column, or diagonal
        const dx = Math.abs(this.x - playerX);
        const dy = Math.abs(this.y - playerY);
        const sameRow = this.y === playerY;
        const sameCol = this.x === playerX;
        const sameDiagonal = dx === dy;

        if (!sameRow && !sameCol && !sameDiagonal) return null;

        // Determine direction
        let direction = { x: 0, y: 0 };
        if (sameCol) {
            // Vertical
            direction.y = playerY > this.y ? 1 : -1;
        } else if (sameRow) {
            // Horizontal
            direction.x = playerX > this.x ? 1 : -1;
        } else {
            // Diagonal
            direction.x = playerX > this.x ? 1 : -1;
            direction.y = playerY > this.y ? 1 : -1;
        }

        // Check clear line of sight (walls/obstacles AND other enemies)
        const steps = Math.max(dx, dy);
        for (let i = 1; i < steps; i++) {
            const checkX = this.x + i * direction.x;
            const checkY = this.y + i * direction.y;
            if (!this.isWalkable(checkX, checkY, grid)) return null;
            if (enemies.find(e => e.x === checkX && e.y === checkY)) return null;
        }

        // Find adjacent tile next to player in the direction of charge
        const adjX = playerX - direction.x;
        const adjY = playerY - direction.y;

        // Check if that tile is walkable and not occupied by another enemy
        if (this.isWalkable(adjX, adjY, grid) &&
            !enemies.find(e => e.x === adjX && e.y === adjY)) {
            return { x: adjX, y: adjY };
        }

        return null;
    }

    // Helper for Zard: check diagonal line of sight
    checkDiagonalLineOfSight(playerX, playerY, grid) {
        const dx = Math.abs(this.x - playerX);
        const dy = Math.abs(this.y - playerY);

        if (dx !== dy) return false; // Not on diagonal

        const sameDiagonal1 = (playerX - this.x) === (playerY - this.y);
        const sameDiagonal2 = (playerX - this.x) === -(playerY - this.y);

        if (!sameDiagonal1 && !sameDiagonal2) return false;

        // Determine step direction
        const stepX = playerX > this.x ? 1 : -1;
        const stepY = playerY > this.y ? 1 : -1;

        if (sameDiagonal1) {
            // Step diagonally
            for (let i = 1; i < dx; i++) {
                const x = this.x + i * stepX;
                const y = this.y + i * stepY;
                if (!this.isWalkable(x, y, grid)) return false;
            }
        } else {
            // Other diagonal
            const stepYAlt = playerY > this.y ? -1 : 1;
            for (let i = 1; i < dx; i++) {
                const x = this.x + i * stepX;
                const y = this.y + i * stepYAlt;
                if (!this.isWalkable(x, y, grid)) return false;
            }
        }

        return true;
    }

    // Helper for Zard: perform bishop charge
    performBishopCharge(player, playerX, playerY, grid, isSimulation = false) {
        // Determine direction of charge
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const steps = Math.abs(dx); // Diagonal, dx === dy

        // Move directly to adjacent tile next to player
        if (!isSimulation) {
            let chargeX = this.x;
            let chargeY = this.y;
            if (steps >= 1) {
                chargeX += dx > 0 ? 1 : -1;
                chargeY += dy > 0 ? 1 : -1;
                if (chargeX !== playerX || chargeY !== playerY) {
                    this.x = chargeX;
                    this.y = chargeY;
                }
            }
        }

        // If now adjacent (should be), attack
        const chargeXSim = isSimulation ? (this.x + (dx > 0 ? 1 : -1)) : this.x;
        const chargeYSim = isSimulation ? (this.y + (dy > 0 ? 1 : -1)) : this.y;
        const newDx = Math.abs(chargeXSim - playerX);
        const newDy = Math.abs(chargeYSim - playerY);
        if (newDx + newDy === 2 && newDx === 1 && newDy === 1) { // Adjacent diagonally
            if (!isSimulation) {
                // Perform attack
                console.log('Zard bishop charges and attacks player!');
                player.takeDamage(this.attack);
                player.startBump(chargeXSim - playerX, chargeYSim - playerY);
                this.startBump(playerX - chargeXSim, playerY - chargeYSim);
                this.justAttacked = true;
                this.attackAnimation = 15;

                // Knockback diagonally away
                const knockbackX = playerX + (playerX - chargeXSim);
                const knockbackY = playerY + (playerY - chargeYSim);
                // Only knockback if the position is walkable
                if (player.isWalkable(knockbackX, knockbackY, grid)) {
                    player.setPosition(knockbackX, knockbackY);
                }
            }
        }
    }

    // Helper for Lazerd: check orthogonal/diagonal line of sight
    checkQueenLineOfSight(playerX, playerY, grid) {
        const dx = Math.abs(this.x - playerX);
        const dy = Math.abs(this.y - playerY);

        // Check if same row, column, or diagonal
        const sameRow = this.y === playerY;
        const sameCol = this.x === playerX;
        const sameDiagonal = dx === dy;

        if (!sameRow && !sameCol && !sameDiagonal) return false;

        // Determine direction
        let stepX = 0, stepY = 0;
        if (sameCol) {
            // Vertical
            stepY = playerY > this.y ? 1 : -1;
        } else if (sameRow) {
            // Horizontal
            stepX = playerX > this.x ? 1 : -1;
        } else {
            // Diagonal
            stepX = playerX > this.x ? 1 : -1;
            stepY = playerY > this.y ? 1 : -1;
        }

        // Check line of sight
        const steps = Math.max(dx, dy);
        for (let i = 1; i < steps; i++) {
            const checkX = this.x + i * stepX;
            const checkY = this.y + i * stepY;
            if (!this.isWalkable(checkX, checkY, grid)) return false;
        }

        return true;
    }

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
            console.log('Lazerd queen charges and attacks player!');
            player.takeDamage(this.attack);
            player.startBump(this.x - playerX, this.y - playerY);
            this.startBump(playerX - this.x, playerY - this.y);
            this.justAttacked = true;
            this.attackAnimation = 15;

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

    canAttackPosition(player, px, py, grid, enemies) {
        return this.planMoveTowards(player, grid, enemies, {x: px, y: py}, true) === null;
    }
}
