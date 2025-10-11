import { TILE_TYPES, TILE_SIZE } from '../core/constants.js';

export class ActionManager {
    constructor(game) {
        this.game = game;
        this.bombActionCounter = 0;
    }

    addBomb() {
        if (this.game.player.inventory.length < 6) {
            this.game.player.inventory.push({ type: 'bomb' });
            this.game.uiManager.updatePlayerStats();
        }
    }

    incrementBombActions() {
        // Find any bombs on the grid and increment their timer
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const tile = this.game.grid[y][x];
                if (tile && typeof tile === 'object' && tile.type === 'BOMB') {
                    if (tile.justPlaced) {
                        // This is the turn the bomb was placed, don't increment the timer yet.
                        tile.justPlaced = false;
                        continue;
                    }
                    tile.actionsSincePlaced = (tile.actionsSincePlaced || 0) + 1; // Increment on subsequent actions
                    if (tile.actionsSincePlaced >= 2) {
                        this.explodeBomb(x, y);
                    }
                }
            }
        }
    }

    performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy) {
        const playerPos = this.game.player.getPosition();
        const startX = playerPos.x;
        const startY = playerPos.y;

        item.uses--;
        if (item.uses <= 0) {
            const index = this.game.player.inventory.findIndex(i => i === item);
            if (index !== -1) this.game.player.inventory.splice(index, 1);
        }

        // Add smoke animations along the diagonal charge path
        for (let i = 1; i < Math.abs(dx); i++) {
            const px = startX + i * Math.sign(dx);
            const py = startY + i * Math.sign(dy);
            this.game.player.smokeAnimations.push({ x: px, y: py, frame: 18 });
        }

        if (enemy) {
            enemy.takeDamage(999);
            this.game.combatManager.addPointAnimation(enemy.x, enemy.y, enemy.getPoints());
            this.game.player.addPoints(enemy.getPoints());
            this.game.enemies = this.game.enemies.filter(e => e !== enemy);
        }

        this.game.player.setPosition(targetX, targetY);
        this.game.player.startSmokeAnimation();
        this.game.soundManager.playSound('whoosh');
        this.game.startEnemyTurns();
        this.game.updatePlayerStats();
    }

    performHorseIconCharge(item, targetX, targetY, enemy, dx, dy) {
        item.uses--;
        if (item.uses <= 0) {
            const index = this.game.player.inventory.findIndex(i => i === item);
            if (index !== -1) this.game.player.inventory.splice(index, 1);
        }

        // Get current player position
        const playerPos = this.game.player.getPosition();
        const startX = playerPos.x;
        const startY = playerPos.y;
        const endX = targetX;
        const endY = targetY;

        // Calculate the L-shape path: determine mid point
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        let midX, midY;
        if (absDx > absDy) {
            // Horizontal dominant: move horizontal first
            midX = startX + dx;
            midY = startY;
        } else {
            // Vertical dominant: move vertical first
            midX = startX;
            midY = startY + dy;
        }

        // Add the L-shape charge animation
        this.game.horseChargeAnimations.push({
            startPos: { x: startX, y: startY },
            midPos: { x: midX, y: midY },
            endPos: { x: endX, y: endY },
            frame: 20
        });

        // Add smoke animations along the path
        const distX = Math.abs(endX - startX);
        const distY = Math.abs(endY - startY);
        if (distX >= distY) {
            // Horizontal dominant
            const stepX = dx > 0 ? 1 : -1;
            for (let i = 1; i < distX; i++) {
                this.game.player.smokeAnimations.push({ x: startX + i * stepX, y: startY + Math.round((i * dy) / distX), frame: 18 });
            }
        } else {
            // Vertical dominant
            const stepY = dy > 0 ? 1 : -1;
            for (let i = 1; i < distY; i++) {
                this.game.player.smokeAnimations.push({ x: startX + Math.round((i * dx) / distY), y: startY + i * stepY, frame: 18 });
            }
        }

        if (enemy) {
            enemy.takeDamage(999);
            this.game.combatManager.addPointAnimation(enemy.x, enemy.y, enemy.getPoints());
            this.game.player.addPoints(enemy.getPoints());
            this.game.enemies = this.game.enemies.filter(e => e !== enemy);
        }

        this.game.player.setPosition(targetX, targetY);
        this.game.player.startSmokeAnimation();
        this.game.soundManager.playSound('whoosh');
        this.game.startEnemyTurns();
        this.game.updatePlayerStats();
    }

    performBowShot(item, targetX, targetY) {
        item.uses--;
        if (item.uses <= 0) {
            const index = this.game.player.inventory.findIndex(i => i === item);
            if (index !== -1) this.game.player.inventory.splice(index, 1);
        }

        const playerPos = this.game.player.getPosition();
        const enemy = this.game.pendingCharge.enemy; // Use stored enemy reference

        // Add arrow animation
        this.game.arrowAnimations.push({
            startX: playerPos.x,
            startY: playerPos.y,
            endX: targetX,
            endY: targetY,
            frame: 20 // 20 frames for the arrow to travel
        });

        // Player has acted. Prevent enemies from moving until the action resolves.
        this.game.playerJustAttacked = true;

        // After a delay for the arrow to travel, check for hit
        setTimeout(() => {
            if (enemy && this.game.enemies.includes(enemy)) { // Check if enemy still exists
                enemy.takeDamage(999);
                this.game.combatManager.addPointAnimation(enemy.x, enemy.y, enemy.getPoints());
                this.game.player.addPoints(enemy.getPoints());
                this.game.enemies = this.game.enemies.filter(e => e !== enemy);
                const currentZone = this.game.player.getCurrentZone();
                this.game.defeatedEnemies.add(`${currentZone.x},${currentZone.y}:${currentZone.dimension}:${enemy.id}`);

                // Remove from zone data
                const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
                if (this.game.zones.has(zoneKey)) {
                    const zoneData = this.game.zones.get(zoneKey);
                    zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
                    this.game.zones.set(zoneKey, zoneData);
                }
                this.game.updatePlayerStats();
            }
            // Now that the arrow has hit, enemies can take their turn.
            this.game.playerJustAttacked = false;
            this.game.startEnemyTurns();
        }, 300); // 300ms delay

        this.game.soundManager.playSound('whoosh');
    }

    explodeBomb(bx, by) {
        this.game.grid[by][bx] = TILE_TYPES.FLOOR;
        this.game.soundManager.playSound('splode');
        this.game.player.startSplodeAnimation(bx, by);

        const directions = [
            { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
        ];

        for (const dir of directions) {
            const nx = bx + dir.dx;
            const ny = by + dir.dy;
            if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
                const tile = this.game.grid[ny][nx];
                if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY || tile === TILE_TYPES.GRASS) {
                    this.game.grid[ny][nx] = (nx === 0 || nx === 8 || ny === 0 || ny === 8) ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR;
                }

                const enemy = this.game.enemies.find(e => e.x === nx && e.y === ny);
                if (enemy) {
                    enemy.takeDamage(999);
                    this.game.enemies = this.game.enemies.filter(e => e !== enemy);
                }

                // Check for player knockback (within 1 tile, not center) - launch flying backward until hitting obstruction
                if (nx === this.game.player.x && ny === this.game.player.y && !(dir.dx === 0 && dir.dy === 0)) {
                    // Launch player away from bomb - direction away is continuing in the dir.dx, dir.dy direction from player position
                    let launchX = nx;
                    let launchY = ny;
                    const maxSteps = 8; // Prevent infinite loop
                    let steps = 0;
                    let intermediatePositions = []; // To collect positions for smoke

                    while (steps < maxSteps) {
                        launchX += dir.dx;
                        launchY += dir.dy;
                        if (launchX >= 0 && launchX < 9 && launchY >= 0 && launchY < 9 &&
                            this.game.player.isWalkable(launchX, launchY, this.game.grid, this.game.player.x, this.game.player.y)) {
                            // Check if enemy at this position - if so, damage it and stop launch
                            const enemy = this.game.enemies.find(e => e.x === launchX && e.y === launchY);
                            if (enemy) {
                                // Damage the enemy like in collision
                                enemy.takeDamage(999); // Instant kill
                                this.game.combatManager.addPointAnimation(enemy.x, enemy.y, enemy.getPoints());
                                this.game.player.addPoints(enemy.getPoints());
                                this.game.enemies = this.game.enemies.filter(e => e !== enemy);
                                // Remove from zone data
                                const currentZone = this.game.player.getCurrentZone();
                                const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
                                if (this.game.zones.has(zoneKey)) {
                                    const zoneData = this.game.zones.get(zoneKey);
                                    zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
                                    this.game.zones.set(zoneKey, zoneData);
                                }
                                this.game.defeatedEnemies.add(`${currentZone.x},${currentZone.y}:${currentZone.dimension}:${enemy.id}`);
                                this.game.soundManager.playSound('attack');
                                this.game.uiManager.updatePlayerStats();
                                // Stop launching here (don't go further)
                                break;
                            }
                            steps++;
                            intermediatePositions.push({ x: launchX, y: launchY }); // Add to middle positions
                        } else {
                            // Back up to last valid position
                            launchX -= dir.dx;
                            launchY -= dir.dy;
                            break;
                        }
                    }
                    // Move to the launch position if it's different from current
                    if (launchX !== this.game.player.x || launchY !== this.game.player.y) {
                        // Add smoke at each intermediate position (not at original or final for trail effect)
                        intermediatePositions.forEach(pos => {
                            this.game.player.smokeAnimations.push({ x: pos.x, y: pos.y, frame: 18 });
                        });
                        this.game.player.setPosition(launchX, launchY);
                        this.game.player.startBump(dir.dx, dir.dy); // Bump in the launch direction
                    }
                }
            }
        }
    }
}
