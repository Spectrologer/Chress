import { GRID_SIZE, TILE_TYPES } from './constants.js';

export class CombatManager {
    constructor(game) {
        this.game = game;
    }

    handleEnemyMovements() {
        const plannedMoves = new Map(); // enemy -> intended position
        const playerPos = this.game.player.getPosition();

        // Phase 1: Plan moves
        for (let enemy of this.game.enemies) {
            const move = enemy.planMoveTowards(this.game.player, this.game.grid, this.game.enemies, playerPos, false, this.game);
            if (move) {
                const key = `${move.x},${move.y}`;
                // Only add if no other enemy is planning this tile
                if (!plannedMoves.has(key)) {
                    plannedMoves.set(key, enemy);
                }
                // If multiple enemies want the same tile, only the first one gets it
            }
        }

        // Phase 2: Apply valid moves
        for (let [key, enemy] of plannedMoves) {
            const move = key.split(',').map(Number);
            enemy.lastX = enemy.x;
            enemy.lastY = enemy.y;
            enemy.x = move[0];
            enemy.y = move[1];
            enemy.liftFrames = 15; // Start lift animation
            // Add horse charge animation for lizord when it moves
            if (enemy.enemyType === 'lizord' && (enemy.lastX !== enemy.x || enemy.lastY !== enemy.y)) {
                const dx = enemy.x - enemy.lastX;
                const dy = enemy.y - enemy.lastY;
                let midX, midY;
                if (dx === 0 || dy === 0) {
                    // Straight move, midpoint
                    midX = (enemy.lastX + enemy.x) / 2;
                    midY = (enemy.lastY + enemy.y) / 2;
                } else {
                    // Diagonal move, L shape
                    if (Math.abs(dx) > Math.abs(dy)) {
                        // Horizontal dominant: move horizontal first
                        midX = enemy.x;
                        midY = enemy.lastY;
                    } else if (Math.abs(dy) > Math.abs(dx)) {
                        // Vertical dominant: move vertical first
                        midX = enemy.lastX;
                        midY = enemy.y;
                    } else {
                        // Equal (45 degree), arbitrary choice
                        midX = enemy.x;
                        midY = enemy.lastY;
                    }
                }
                this.game.horseChargeAnimations.push({
                    startPos: { x: enemy.lastX, y: enemy.lastY },
                    midPos: { x: midX, y: midY },
                    endPos: { x: enemy.x, y: enemy.y },
                    frame: 20
                });
            }
        }
    }

    checkCollisions() {
        const playerPos = this.game.player.getPosition();
        this.game.enemies = this.game.enemies.filter(enemy => {
            // Check for collision if an enemy ends up on the player's tile.
            // Exclude 'lizardy' because its attack/bump logic is handled entirely in its planMoveTowards method.
            if (enemy.x === playerPos.x && enemy.y === playerPos.y && 
                !enemy.justAttacked && 
                enemy.enemyType !== 'lizardy') {

                this.game.player.takeDamage(enemy.attack);
                this.game.soundManager.playSound('attack');

                // Remove from zone data to prevent respawn
                const currentZone = this.game.player.getCurrentZone();
                const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
                if (this.game.zones.has(zoneKey)) {
                    const zoneData = this.game.zones.get(zoneKey);
                    zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
                    this.game.zones.set(zoneKey, zoneData);
                }
                return false;
            }
            return true;
        });

        // Check for adjacent bombs to explode (if actionTimer >=2)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const bx = this.game.player.x + dx;
                const by = this.game.player.y + dy;
                if (bx >= 0 && bx < GRID_SIZE && by >= 0 && by < GRID_SIZE) {
                    const tile = this.game.grid[by][bx];
                    if (tile && typeof tile === 'object' && tile.type === 'BOMB') {
                        if (tile.actionTimer >= 2) {
                            this.game.explodeBomb(bx, by);
                        }
                    }
                }
            }
        }
    }

    performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy) {
        const playerPos = this.game.player.getPosition();
        const steps = Math.abs(dx);
        for (let i = 1; i < steps; i++) {
            const px = playerPos.x + (dx > 0 ? i : -i);
            const py = playerPos.y + (dy > 0 ? i : -i);
            if (!this.game.player.isWalkable(px, py, this.game.grid, px, py)) return;
        }
        item.uses--;
        if (item.uses <= 0) this.game.player.inventory = this.game.player.inventory.filter(invItem => invItem !== item);
        this.game.player.setPosition(targetX, targetY);
        if (enemy) {
            this.game.player.startBump(dx < 0 ? -1 : 1, dy < 0 ? -1 : 1);
            enemy.startBump(this.game.player.x - enemy.x, this.game.player.y - enemy.y);
            enemy.takeDamage(999);
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
        this.handleEnemyMovements();
    }
}
