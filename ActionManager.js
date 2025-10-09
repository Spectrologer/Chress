import { GRID_SIZE, TILE_TYPES } from './constants.js';

export class ActionManager {
    constructor(game) {
        this.game = game;
    }

    incrementBombActions() {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = this.game.grid[y][x];
                if (tile && typeof tile === 'object' && tile.type === 'BOMB' && tile.actionTimer < 2) {
                    tile.actionTimer++;
                    if (tile.actionTimer >= 2) {
                        this.explodeBomb(x, y);
                    }
                }
            }
        }
    }

    performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy) {
        const playerPos = this.game.player.getPosition();
        const steps = Math.abs(dx);
        const traveledTiles = [];
        for (let i = 1; i < steps; i++) {
            const px = playerPos.x + (dx > 0 ? i : -i);
            const py = playerPos.y + (dy > 0 ? i : -i);
            if (!this.game.player.isWalkable(px, py, this.game.grid, px, py)) return;
            traveledTiles.push({x: px, y: py});
        }
        this.game.player.smokeAnimations = traveledTiles.map(t => ({x: t.x, y: t.y, frame: 18})); // Smoke at every tile traveled
        item.uses--;
        if (item.uses <= 0) this.game.player.inventory = this.game.player.inventory.filter(invItem => invItem !== item);
        this.game.player.setPosition(targetX, targetY);
        if (enemy) {
            this.game.player.startBump(dx < 0 ? -1 : 1, dy < 0 ? -1 : 1);
            enemy.startBump(this.game.player.x - enemy.x, this.game.player.y - enemy.y);
            enemy.takeDamage(999);
            this.game.soundManager.playSound('attack');
            const currentZone = this.game.player.getCurrentZone();
            this.game.defeatedEnemies.add(`${currentZone.x},${currentZone.y},${enemy.x},${enemy.y}`);
            this.game.enemies = this.game.enemies.filter(e => e !== enemy);
            const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
            if (this.game.zones.has(zoneKey)) {
                const zoneData = this.game.zones.get(zoneKey);
                zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
                this.game.zones.set(zoneKey, zoneData);
            }
        }
        this.game.uiManager.updatePlayerStats();
        this.game.handleEnemyMovements();
        this.game.gameStateManager.saveGameState();
    }

    performHorseIconCharge(item, targetX, targetY, enemy, dx, dy) {
        const startPos = this.game.player.getPosition();

        // Determine the corner of the "L" shape for the animation
        let midPos;
        if (Math.abs(dx) === 2) { // Moved 2 horizontally, 1 vertically
            midPos = { x: startPos.x + dx, y: startPos.y };
        } else { // Moved 1 horizontally, 2 vertically
            midPos = { x: startPos.x, y: startPos.y + dy };
        }

        // Add a new animation object for the zip line effect
        this.game.horseChargeAnimations.push({
            startPos: startPos,
            midPos: midPos,
            endPos: { x: targetX, y: targetY },
            frame: 20 // Animation duration in frames
        });

        // Play a whoosh sound for the charge
        this.game.soundManager.playSound('whoosh');

        // Keep the smoke effect at the origin as well
        this.game.player.smokeAnimations.push({x: this.game.player.x, y: this.game.player.y, frame: 18});

        // Use the item
        item.uses--;
        if (item.uses <= 0) this.game.player.inventory = this.game.player.inventory.filter(invItem => invItem !== item);
        this.game.player.setPosition(targetX, targetY);
        if (enemy) {
            this.game.player.startBump(dx < 0 ? -1 : 1, dy < 0 ? -1 : 1);
            enemy.startBump(this.game.player.x - enemy.x, this.game.player.y - enemy.y);
            enemy.takeDamage(999);
            this.game.soundManager.playSound('attack');
            const currentZone = this.game.player.getCurrentZone();
            this.game.defeatedEnemies.add(`${currentZone.x},${currentZone.y},${enemy.x},${enemy.y}`);
            this.game.enemies = this.game.enemies.filter(e => e !== enemy);
            const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
            if (this.game.zones.has(zoneKey)) {
                const zoneData = this.game.zones.get(zoneKey);
                zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
                this.game.zones.set(zoneKey, zoneData);
            }
        }
        this.game.uiManager.updatePlayerStats();
        this.game.handleEnemyMovements();
    }

    explodeBomb(bx, by) {
        // Blast walls 1 tile around the bomb (excluding center) to create exits
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // Skip the bomb location itself
                const nx = bx + dx, ny = by + dy;
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && this.game.grid[ny][nx] === TILE_TYPES.WALL) {
                    const isBorder = nx === 0 || nx === GRID_SIZE - 1 || ny === 0 || ny === GRID_SIZE - 1;
                    this.game.grid[ny][nx] = isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR;
                }
            }
        }

        // Remove bomb
        this.game.grid[by][bx] = TILE_TYPES.FLOOR;

        // Start animation twice (loop twice)
        this.game.player.startSplodeAnimation(bx, by);
        this.game.player.startSplodeAnimation(bx, by);

        // Launch player and enemies away from bomb if in radius
        const px = this.game.player.x, py = this.game.player.y;
        const distXPlayer = Math.abs(px - bx);
        const distYPlayer = Math.abs(py - by);
        let traveledTilesPlayer = [];
        let curXPlayer = px, curYPlayer = py;
        let playerLaunched = false;
        if (distXPlayer <= 1 && distYPlayer <= 1) {
            const vX = (bx > px) ? -1 : (bx < px) ? 1 : 0;
            const vY = (by > py) ? -1 : (by < py) ? 1 : 0;
            if (vX === 0 && vY === 0) {} else {
                while (true) {
                    const nextX = curXPlayer + vX, nextY = curYPlayer + vY;
                    if (!this.game.player.isWalkable(nextX, nextY, this.game.grid, curXPlayer, curYPlayer)) {
                        break;
                    }
                    // Check if there's an enemy at the next position
                    const enemyAtPos = this.game.enemies.find(e => e.x === nextX && e.y === nextY);
                    if (enemyAtPos) {
                        // Damage the enemy
                        enemyAtPos.takeDamage(1); // Assume 1 damage, can adjust
                        enemyAtPos.startBump(curXPlayer - nextX, curYPlayer - nextY);
                        this.game.player.startBump(nextX - curXPlayer, nextY - curYPlayer);
                        const currentZone = this.game.player.getCurrentZone();
                        if (enemyAtPos.isDead()) {
                            enemyAtPos.startDeathAnimation();
                            this.game.defeatedEnemies.add(`${currentZone.x},${currentZone.y},${enemyAtPos.x},${enemyAtPos.y}`);
                            this.game.enemies = this.game.enemies.filter(e => e !== enemyAtPos);
                            const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
                            if (this.game.zones.has(zoneKey)) {
                                const zoneData = this.game.zones.get(zoneKey);
                                zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemyAtPos.id);
                                this.game.zones.set(zoneKey, zoneData);
                            }
                        }
                        this.game.soundManager.playSound('attack');
                        // Stop at this position
                        traveledTilesPlayer.push({x: nextX, y: nextY});
                        curXPlayer = nextX;
                        curYPlayer = nextY;
                        break;
                    }

                    curXPlayer = nextX;
                    curYPlayer = nextY;
                    // Collect all tiles traveled (exclude starting position)
                    traveledTilesPlayer.push({x: curXPlayer, y: curYPlayer});
                }
                this.game.player.smokeAnimations = traveledTilesPlayer.map(t => ({x: t.x, y: t.y, frame: 18})); // Smoke at every tile traveled
                this.game.player.setPosition(curXPlayer, curYPlayer);
                this.game.player.ensureValidPosition(this.game.grid);
                playerLaunched = true;
            }
        }

        // Launch enemies away from bomb
        this.game.enemies.forEach(enemy => {
            const distX = Math.abs(enemy.x - bx);
            const distY = Math.abs(enemy.y - by);
            if (distX <= 1 && distY <= 1 && distX + distY > 0) { // In radius but not at bomb center (which is now floor)
                const vX = (bx > enemy.x) ? -1 : (bx < enemy.x) ? 1 : 0;
                const vY = (by > enemy.y) ? -1 : (by < enemy.y) ? 1 : 0;
                if (vX !== 0 || vY !== 0) {
                    const traveledTiles = [];
                    let curX = enemy.x, curY = enemy.y;
                    while (true) {
                        const nextX = curX + vX, nextY = curY + vY;
                        if (!this.game.player.isWalkable(nextX, nextY, this.game.grid, curX, curY)) {
                            break;
                        }
                        curX = nextX;
                        curY = nextY;
                        traveledTiles.push({x: curX, y: curY});
                    }
                    enemy.smokeAnimations = traveledTiles.map(t => ({x: t.x, y: t.y, frame: 18}));
                    enemy.setPosition(curX, curY);
                }
            }
        });

        // Update enemy movements if player was launched (to prevent immediate attack)
        if (playerLaunched) {
            this.game.handleEnemyMovements();
        }

        // Save state after bomb explosion changes the world
        this.game.gameStateManager.saveGameState();
    }

    // Console command to add bomb to inventory
    addBomb() {
        if (this.game.player.inventory.length < 6) {
            this.game.player.inventory.push({ type: 'bomb' });
            this.game.uiManager.updatePlayerStats();
        }
    }
}
