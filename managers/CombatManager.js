import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';

export class CombatManager {
    constructor(game, occupiedTiles) {
        this.game = game;
        this.occupiedTiles = occupiedTiles;
        this.game.pointAnimations = this.game.pointAnimations || [];
    }

    addPointAnimation(x, y, amount) {
        this.game.animationManager.addPointAnimation(x, y, amount);
        this.game.soundManager.playSound('ding'); // Play a sound for getting points
    }

    handleEnemyDefeated(enemy, currentZone) {
        this.addPointAnimation(enemy.x, enemy.y, enemy.getPoints());
        this.game.player.addPoints(enemy.getPoints());
        this.game.defeatedEnemies.add(`${enemy.id}`);
        this.game.soundManager.playSound('attack');

        // Remove from zone data to prevent respawn
        const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
        if (this.game.zones.has(zoneKey)) {
            const zoneData = this.game.zones.get(zoneKey);
            zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
            this.game.zones.set(zoneKey, zoneData);
        }
    }

    defeatEnemy(enemy) {
        // Prevent double defeat/points by checking if already defeated
        if (this.game.defeatedEnemies.has(`${enemy.id}`)) {
            return;
        }
        if (enemy.health > 0) {
            enemy.takeDamage(999);
        }
        const currentZone = this.game.player.getCurrentZone();
        // Ensure enemy has valid coordinates
        const enemyX = Number.isFinite(enemy.x) ? enemy.x : 0;
        const enemyY = Number.isFinite(enemy.y) ? enemy.y : 0;
        this.addPointAnimation(enemyX, enemyY, enemy.getPoints());
        this.game.player.addPoints(enemy.getPoints());
        this.game.defeatedEnemies.add(`${enemy.id}`);
        this.game.soundManager.playSound('attack');
        // Remove from zone data (enemy will be removed from game.enemies by checkCollisions)
        const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
        if (this.game.zones.has(zoneKey)) {
            const zoneData = this.game.zones.get(zoneKey);
            zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
            this.game.zones.set(zoneKey, zoneData);
        }
        this.game.uiManager.updatePlayerStats();
    }

    handleSingleEnemyMovement(enemy) {
        // Ensure we are not trying to move a dead or non-existent enemy
        if (!enemy || enemy.health <= 0 || !this.game.enemies.includes(enemy)) {
            return;
        }
        const playerPos = this.game.player.getPosition();

        const move = enemy.planMoveTowards(this.game.player, this.game.grid, this.game.enemies, playerPos, false, this.game);
        if (move) {
            const key = `${move.x},${move.y}`;
            if (this.occupiedTiles.has(key)) {
                return; // Tile is already claimed for this turn sequence
            }
            this.occupiedTiles.add(key);
            
            enemy.lastX = enemy.x;
            enemy.lastY = enemy.y;
            enemy.x = move.x;
            enemy.y = move.y;
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

    handleEnemyMovements() {
        // Handle enemy movements after player actions
         // This is a placeholder for now as the main enemy movement logic might be in game.js
    }

    checkCollisions() {
        // Check for bomb explosion timers
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = this.game.grid[y][x];
                if (tile && typeof tile === 'object' && tile.type === TILE_TYPES.BOMB) {
                    if (tile.actionsSincePlaced >= 2) {
                        this.game.explodeBomb(x, y);
                    }
                }
            }
        }

        const playerPos = this.game.player.getPosition();
        const remainingEnemies = [];

        for (const enemy of this.game.enemies) {
            let isDefeated = false;

            // Check for collision with player
            if (enemy.x === playerPos.x && enemy.y === playerPos.y && !enemy.justAttacked && enemy.enemyType !== 'lizardy') {
                this.game.player.takeDamage(enemy.attack);
                enemy.takeDamage(enemy.health); // Ensure enemy dies from collision
                isDefeated = true;
            }

            // Check if enemy was already dead (e.g., from player attack)
            if (enemy.health <= 0) {
                isDefeated = true;
            }

            if (isDefeated) {
                this.defeatEnemy(enemy);
            } else {
                remainingEnemies.push(enemy);
            }
        }

        this.game.enemies = remainingEnemies;

        // Update UI after collision checks
        this.game.uiManager.updatePlayerStats();
    }


}
