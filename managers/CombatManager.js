import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';
import { BombManager } from './BombManager.js';

export class CombatManager {
    constructor(game, occupiedTiles) {
        this.game = game;
        this.occupiedTiles = occupiedTiles;
        this.game.pointAnimations = this.game.pointAnimations || [];
        this.bombManager = new BombManager(game);
    }

    addPointAnimation(x, y, amount) {
        this.game.animationManager.addPointAnimation(x, y, amount);
        this.game.soundManager.playSound('point'); // Play a sound for getting points
    }

    handleEnemyDefeated(enemy, currentZone) {
        this.addPointAnimation(enemy.x, enemy.y, enemy.getPoints());
        this.game.player.addPoints(enemy.getPoints());
        this.game.defeatedEnemies.add(`${enemy.id}`);
        // Only play generic attack SFX if the event hasn't been suppressed by
        // the initiator (e.g., player played 'slash' when using an axe).
        try {
            if (!enemy._suppressAttackSound) this.game.soundManager.playSound('attack');
        } catch (e) {}

        // Remove from zone data to prevent respawn
        const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
        if (this.game.zones.has(zoneKey)) {
            const zoneData = this.game.zones.get(zoneKey);
            zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
            this.game.zones.set(zoneKey, zoneData);
        }
    }

    // initiator: optional string e.g. 'player', 'bomb', null
    // Returns an object { defeated: bool, consecutiveKills: number }
    defeatEnemy(enemy, initiator = null) {
        // Prevent double defeat/points by checking if already defeated
        if (this.game.defeatedEnemies.has(`${enemy.id}`)) {
            return { defeated: false, consecutiveKills: 0 };
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
        try {
            if (!enemy._suppressAttackSound) this.game.soundManager.playSound('attack');
        } catch (e) {}
        // Remove from zone data (enemy will be removed from game.enemies by checkCollisions)
        const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
        if (this.game.zones.has(zoneKey)) {
            const zoneData = this.game.zones.get(zoneKey);
            zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
            this.game.zones.set(zoneKey, zoneData);
        }
        // If the initiator was the player, increment their consecutive kill counter
        let consecutive = 0;
        try {
            if (initiator === 'player' && this.game.player) {
                // Only increment the consecutive kill counter when the previous
                // action was an attack that resulted in a kill (combo: attack:kill attack:kill)
                const player = this.game.player;
                if (player.lastActionType === 'attack' && player.lastActionResult === 'kill') {
                    player.consecutiveKills = (player.consecutiveKills || 0) + 1;
                } else {
                    // Start a new streak - this kill counts as 1
                    player.consecutiveKills = 1;
                }
                player.lastActionResult = 'kill';
                consecutive = player.consecutiveKills;
                // If combo of 2 or more, show multiplier animation and play ding
                try {
                    if (consecutive >= 2 && this.game.animationManager) {
                        this.game.animationManager.addMultiplierAnimation(enemyX, enemyY, consecutive);
                        if (this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                            this.game.soundManager.playSound('point'); // reuse point sound as ding if specific ding asset missing
                        }
                        // Award combo bonus points equal to the combo multiplier (e.g., x2 -> +2)
                        try {
                            const bonus = consecutive;
                            // Add a point animation for the bonus and increment player points
                            this.addPointAnimation(enemyX, enemyY, bonus);
                            if (this.game.player && typeof this.game.player.addPoints === 'function') {
                                this.game.player.addPoints(bonus);
                            }
                            // Persist highest combo (consecutive kills) to localStorage if it exceeds previous record
                            try {
                                const prevCombo = parseInt(localStorage.getItem('chress:record:combo') || '0', 10) || 0;
                                if (consecutive > prevCombo) {
                                    localStorage.setItem('chress:record:combo', String(consecutive));
                                }
                            } catch (e) {}
                        } catch (e) {}
                    }
                } catch (e) {}
            } else if (this.game.player) {
                // Non-player kills (bombs, environment) reset the streak
                this.game.player.consecutiveKills = 0;
                this.game.player.lastActionResult = null;
                consecutive = 0;
            }
        } catch (e) { /* non-fatal */ }

        try { this.game.uiManager.updatePlayerStats(); } catch (e) {}

        return { defeated: true, consecutiveKills: consecutive };
    }

    handleSingleEnemyMovement(enemy) {
        // Ensure we are not trying to move a dead or non-existent enemy
        if (!enemy || enemy.health <= 0 || !this.game.enemies.includes(enemy)) {
            return;
        }
        const playerPos = this.game.player.getPosition();

        const move = enemy.planMoveTowards(this.game.player, this.game.grid, this.game.enemies, playerPos, false, this.game);
        if (move) {
            // Check if enemy is moving onto a pitfall trap
            const targetTile = this.game.grid[move.y]?.[move.x];
            if (targetTile === TILE_TYPES.PITFALL) {
                // The enemy falls into the pit!
                this.game.grid[move.y][move.x] = TILE_TYPES.PORT; // The pitfall becomes a hole

                // Remove the enemy from the current zone's active enemy list
                // Before removing, clear any turn-manager bookkeeping for this enemy so
                // other enemies don't rely on stale occupancy data.
                try {
                    const startKey = `${enemy.x},${enemy.y}`;
                    if (this.game.turnManager && this.game.turnManager.initialEnemyTilesThisTurn) {
                        this.game.turnManager.initialEnemyTilesThisTurn.delete(startKey);
                    }
                    if (this.occupiedTiles) {
                        this.occupiedTiles.delete(startKey);
                    }
                } catch (e) {
                    // Defensive: continue even if turnManager isn't present or delete fails
                }

                this.game.enemies = this.game.enemies.filter(e => e.id !== enemy.id);

                // Add the enemy to the corresponding underground zone's data
                const currentZone = this.game.player.getCurrentZone();
                const undergroundZoneKey = `${currentZone.x},${currentZone.y}:2`;
                if (this.game.zones.has(undergroundZoneKey)) {
                    const undergroundZoneData = this.game.zones.get(undergroundZoneKey);
                    // Find a valid spawn point for the enemy in the pitfall zone
                    const spawnPos = this.game.player.getValidSpawnPosition(this.game);
                    enemy.x = spawnPos.x;
                    enemy.y = spawnPos.y;
                    undergroundZoneData.enemies.push(enemy.serialize());
                }
                return; // Enemy has fallen, its turn in this zone is over.
            }

            const key = `${move.x},${move.y}`;
            // Extra safeguard: don't move onto a tile currently occupied by another enemy
            // (exclude the moving enemy itself when comparing)
            const occupiedNow = this.game.enemies.some(e => e.id !== enemy.id && e.x === move.x && e.y === move.y);
            if (occupiedNow) {
                return; // Tile is currently occupied, block the move
            }
            // Disallow moving into tiles that were occupied at the start of the enemy turn
            // by other enemies. Allow moving into your own starting tile (enemy may choose to stay).
            const initialSet = this.game.initialEnemyTilesThisTurn || new Set();
            const ownStartKey = `${enemy.lastX || enemy.x},${enemy.lastY || enemy.y}`;
            if (initialSet.has(key) && key !== ownStartKey) {
                return; // Prevent moving into a tile that was occupied at turn start
            }
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
                let midX, midY; // The "corner" of the L-shaped move

                // A lizord (knight) moves 2 tiles in one cardinal direction and 1 in a perpendicular one.
                // The 'midPos' should be the corner of the 'L'.
                // We determine the long leg of the L-move and set the midpoint accordingly.
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Moved further horizontally (e.g., 2 tiles) than vertically (e.g., 1 tile).
                    // The corner of the L is at the end of the horizontal leg.
                    midX = enemy.x;
                    midY = enemy.lastY;
                } else {
                    // Moved further vertically than horizontally.
                    // The corner of the L is at the end of the vertical leg.
                    midX = enemy.lastX;
                    midY = enemy.y;
                }

                this.game.animationManager.addHorseChargeAnimation({
                    startPos: { x: enemy.lastX, y: enemy.lastY },
                    midPos: { x: midX, y: midY },
                    endPos: { x: enemy.x, y: enemy.y },
                });
            }
        }
    }

    handleEnemyMovements() {
        // Handle enemy movements after player actions
         // This is a placeholder for now as the main enemy movement logic might be in game.js
    }

    checkCollisions() {
        // Delegate bomb timing checks to BombManager
        if (this.bombManager && typeof this.bombManager.tickBombsAndExplode === 'function') {
            this.bombManager.tickBombsAndExplode();
        }

        const playerPos = this.game.player.getPosition();
        const remainingEnemies = [];

        for (const enemy of this.game.enemies) {
            const enemyIsDead = (typeof enemy.isDead === 'function') ? enemy.isDead() : (enemy.health <= 0);
            if (enemyIsDead) {
                this.defeatEnemy(enemy);
                continue;
            }

            let isDefeated = false;
            if (enemy.x === playerPos.x && enemy.y === playerPos.y && !enemy.justAttacked && enemy.enemyType !== 'lizardy') {
                this.game.player.takeDamage(enemy.attack);
                enemy.takeDamage(enemy.health);
                isDefeated = true;
            }

            if (enemy.health <= 0) isDefeated = true;

            if (isDefeated) this.defeatEnemy(enemy); else remainingEnemies.push(enemy);
        }

        this.game.enemies = remainingEnemies;
        if (this.game.uiManager && typeof this.game.uiManager.updatePlayerStats === 'function') this.game.uiManager.updatePlayerStats();
    }


}
