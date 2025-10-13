import { TILE_TYPES, TILE_SIZE, GRID_SIZE } from '../core/constants.js';

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
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
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
            this.game.player.animations.smokeAnimations.push({ x: px, y: py, frame: 18 });
        }

        if (enemy) {
            this.game.combatManager.defeatEnemy(enemy);
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

        // Add the L-shape charge animation using centralized manager
        this.game.animationManager.addHorseChargeAnimation(
            { x: startX, y: startY },
            { x: endX, y: endY }
        );

        // Add smoke animations along the path
        const distX = Math.abs(endX - startX);
        const distY = Math.abs(endY - startY);
        if (distX >= distY) {
            // Horizontal dominant
            const stepX = dx > 0 ? 1 : -1;
            for (let i = 1; i < distX; i++) {
                this.game.player.animations.smokeAnimations.push({ x: startX + i * stepX, y: startY + Math.round((i * dy) / distX), frame: 18 });
            }
        } else {
            // Vertical dominant
            const stepY = dy > 0 ? 1 : -1;
            for (let i = 1; i < distY; i++) {
                this.game.player.animations.smokeAnimations.push({ x: startX + Math.round((i * dx) / distY), y: startY + i * stepY, frame: 18 });
            }
        }

        if (enemy) {
            this.game.combatManager.defeatEnemy(enemy);
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

        // Create animation sequence for bow shot
        this.game.animationScheduler.createSequence()
            .then(() => {
                // Add arrow animation using centralized manager
                this.game.animationManager.addArrowAnimation(
                    playerPos.x, playerPos.y, targetX, targetY
                );

                // Player has acted. Prevent enemies from moving until the action resolves.
                this.game.playerJustAttacked = true;

                this.game.soundManager.playSound('whoosh');
            })
            .wait(300) // 300ms delay for arrow to travel
            .then(() => {
                if (enemy && this.game.enemies.includes(enemy)) { // Check if enemy still exists
                    this.game.combatManager.defeatEnemy(enemy);
                }
                // Now that the arrow has hit, enemies can take their turn.
                this.game.playerJustAttacked = false;
                this.game.startEnemyTurns();
            })
            .start();
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
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const tile = this.game.grid[ny][nx];
                if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY || tile === TILE_TYPES.GRASS) {
                    this.game.grid[ny][nx] = (nx === 0 || nx === GRID_SIZE - 1 || ny === 0 || ny === GRID_SIZE - 1) ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR;
                }

                const enemy = this.game.enemies.find(e => e.x === nx && e.y === ny);
                if (enemy) {
                    this.game.combatManager.defeatEnemy(enemy);
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
                        if (launchX >= 0 && launchX < GRID_SIZE && launchY >= 0 && launchY < GRID_SIZE &&
                            this.game.player.isWalkable(launchX, launchY, this.game.grid, this.game.player.x, this.game.player.y)) {
                            // Check if enemy at this position - if so, damage it and stop launch
                            const enemy = this.game.enemies.find(e => e.x === launchX && e.y === launchY);
                            if (enemy) {
                                this.game.combatManager.defeatEnemy(enemy);
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
                            this.game.player.animations.smokeAnimations.push({ x: pos.x, y: pos.y, frame: 18 });
                        });
                        this.game.player.setPosition(launchX, launchY);
                        this.game.player.startBump(dir.dx, dir.dy); // Bump in the launch direction
                    }
                }
            }
        }
    }
}
