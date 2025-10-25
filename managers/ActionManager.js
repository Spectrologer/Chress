import { TILE_TYPES, TILE_SIZE, GRID_SIZE } from '../core/constants.js';
import audioManager from '../utils/AudioManager.js';

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
                if (tile && typeof tile === 'object' && tile.type === TILE_TYPES.BOMB) {
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
            const pi = this.game.player.inventory.findIndex(i => i === item);
            if (pi !== -1) { this.game.player.inventory.splice(pi, 1); }
            else {
                const ri = this.game.player.radialInventory ? this.game.player.radialInventory.findIndex(i => i === item) : -1;
                if (ri !== -1) { this.game.player.radialInventory.splice(ri, 1); try { import('../managers/RadialPersistence.js').then(m=>m.saveRadialInventory(this.game)).catch(()=>{}); } catch(e){} }
            }
        }

        // Add smoke animations along the diagonal charge path
        for (let i = 1; i < Math.abs(dx); i++) {
            const px = startX + i * Math.sign(dx);
            const py = startY + i * Math.sign(dy);
            this.game.player.animations.smokeAnimations.push({ x: px, y: py, frame: 18 });
        }

        if (enemy) {
            try { this.game.player.setAction('attack'); } catch (e) {}
            const res = this.game.combatManager.defeatEnemy(enemy, 'player');
            if (res && res.defeated) {
                if (res.consecutiveKills >= 2) this.game.player.startBackflip(); else this.game.player.startBump(enemy.x - startX, enemy.y - startY);
            }
        }

        this.game.player.setPosition(targetX, targetY);
        this.game.player.startSmokeAnimation();
        audioManager.playSound('whoosh', { game: this.game });
        this.game.startEnemyTurns();
        this.game.updatePlayerStats();
    }

    performHorseIconCharge(item, targetX, targetY, enemy, dx, dy) {
        item.uses--;
        if (item.uses <= 0) {
            const pi = this.game.player.inventory.findIndex(i => i === item);
            if (pi !== -1) { this.game.player.inventory.splice(pi, 1); }
            else {
                const ri = this.game.player.radialInventory ? this.game.player.radialInventory.findIndex(i => i === item) : -1;
                if (ri !== -1) { this.game.player.radialInventory.splice(ri, 1); try { import('../managers/RadialPersistence.js').then(m=>m.saveRadialInventory(this.game)).catch(()=>{}); } catch(e){} }
            }
        }

        // Get current player position
        const playerPos = this.game.player.getPosition();
        const startX = playerPos.x;
        const startY = playerPos.y;
        const endX = targetX;
        const endY = targetY;

        // Calculate the L-shape path: determine mid point (corner of the L)
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        let midX, midY;
        if (absDx > absDy) {
            // Horizontal dominant: corner is at end of horizontal leg
            midX = startX + dx;
            midY = startY;
        } else {
            // Vertical dominant: corner is at end of vertical leg
            midX = startX;
            midY = startY + dy;
        }

        // Add the L-shape charge animation using centralized manager (start/mid/end)
        try {
            this.game.animationManager.addHorseChargeAnimation({ startPos: { x: startX, y: startY }, midPos: { x: midX, y: midY }, endPos: { x: endX, y: endY } });
        } catch (e) { /* non-fatal */ }

        // Build ordered positions along the L path (start -> mid -> end)
        const smokePositions = [];
        const leg1dx = midX - startX;
        const leg1dy = midY - startY;
        const step1x = Math.sign(leg1dx) || 0;
        const step1y = Math.sign(leg1dy) || 0;
        const len1 = Math.max(Math.abs(leg1dx), Math.abs(leg1dy));
        for (let i = 1; i <= len1; i++) {
            smokePositions.push({ x: startX + i * step1x, y: startY + i * step1y });
        }

        const leg2dx = endX - midX;
        const leg2dy = endY - midY;
        const step2x = Math.sign(leg2dx) || 0;
        const step2y = Math.sign(leg2dy) || 0;
        const len2 = Math.max(Math.abs(leg2dx), Math.abs(leg2dy));
        // Exclude final target to match other charge smoke behavior
        for (let i = 1; i < len2; i++) {
            smokePositions.push({ x: midX + i * step2x, y: midY + i * step2y });
        }

        // Use animationScheduler to add smoke sequentially for a snappier trail
        try {
            const seq = this.game.animationScheduler.createSequence();
            const smokeFrameLifetime = 12; // shorter lifetime for snappier trail
            const stepDelay = 40; // ms between smoke spawns
            smokePositions.forEach((pos, idx) => {
                seq.then(() => {
                    this.game.player.animations.smokeAnimations.push({ x: pos.x, y: pos.y, frame: smokeFrameLifetime });
                }).wait(stepDelay);
            });
            // start sequence but don't block the rest of the logic
            try { seq.start(); } catch (e) {}
        } catch (e) {
            // Fallback: if animationScheduler isn't available, add all at once
            smokePositions.forEach(pos => this.game.player.animations.smokeAnimations.push({ x: pos.x, y: pos.y, frame: 12 }));
        }

        if (enemy) {
            try { this.game.player.setAction('attack'); } catch (e) {}
            const res = this.game.combatManager.defeatEnemy(enemy, 'player');
            if (res && res.defeated) {
                if (res.consecutiveKills >= 2) this.game.player.startBackflip(); else this.game.player.startBump(enemy.x - startX, enemy.y - startY);
            }
        }

        this.game.player.setPosition(targetX, targetY);
        this.game.player.startSmokeAnimation();
        audioManager.playSound('whoosh', { game: this.game });
        this.game.startEnemyTurns();
        this.game.updatePlayerStats();
    }

    performBowShot(item, targetX, targetY, enemy = null) {
        item.uses--;
        if (item.uses <= 0) {
            const pi = this.game.player.inventory.findIndex(i => i === item);
            if (pi !== -1) { this.game.player.inventory.splice(pi, 1); }
            else {
                const ri = this.game.player.radialInventory ? this.game.player.radialInventory.findIndex(i => i === item) : -1;
                if (ri !== -1) { this.game.player.radialInventory.splice(ri, 1); try { import('../managers/RadialPersistence.js').then(m=>m.saveRadialInventory(this.game)).catch(()=>{}); } catch(e){} }
            }
        }

        const playerPos = this.game.player.getPosition();
        // Use provided enemy reference when available; do not rely on pendingCharge here
        const targetEnemy = enemy || null;

        // Create animation sequence for bow shot
        this.game.animationScheduler.createSequence()
            .then(() => {
                // Add arrow animation using centralized manager
                this.game.animationManager.addArrowAnimation(
                    playerPos.x, playerPos.y, targetX, targetY
                );

                // Player has acted. Prevent enemies from moving until the action resolves.
                this.game.playerJustAttacked = true;

                // Give player a pronounced bow-shot animation state for rendering
                try {
                    this.game.player.animations.bowShot = { frames: 20, totalFrames: 20, power: 1.4 };
                } catch (e) {}

                // Play a distinct bow sound
                audioManager.playSound('bow_shot', { game: this.game });
            })
            .wait(300) // 300ms delay for arrow to travel
            .then(() => {
                    if (targetEnemy && this.game.enemies.includes(targetEnemy)) { // Check if enemy still exists
                    try { this.game.player.setAction('attack'); } catch (e) {}
                    const res = this.game.combatManager.defeatEnemy(targetEnemy, 'player');
                    if (res && res.defeated) {
                        if (res.consecutiveKills >= 2) this.game.player.startBackflip(); else this.game.player.startBump(targetEnemy.x - playerPos.x, targetEnemy.y - playerPos.y);
                    }
                }
                // Now that the arrow has hit, enemies can take their turn.
                this.game.playerJustAttacked = false;
                this.game.startEnemyTurns();
            })
            .start();
    }

    explodeBomb(bx, by) {
        this.game.grid[by][bx] = TILE_TYPES.FLOOR;
        audioManager.playSound('splode', { game: this.game });
        this.game.player.startSplodeAnimation(bx, by);

        const directions = [
            { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
        ];

        const directionSet = new Set(directions.map(dir => `${dir.dx},${dir.dy}`));
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
