import { GRID_SIZE, TILE_SIZE, TILE_TYPES } from './constants.js';
import { TextureManager } from './TextureManager.js';

export class RenderManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw enemies
        this.drawEnemies();

        // Draw player
        this.drawPlayer();
    }

    drawGrid() {
        if (!this.game.grid) {
            console.error('Grid is null, cannot render');
            return;
        }

        // Calculate zone level for texture rendering
        const zone = this.game.player.getCurrentZone();
        const dist = Math.max(Math.abs(zone.x), Math.abs(zone.y));
        let zoneLevel = 1;
        if (dist <= 2) zoneLevel = 1;
        else if (dist <= 8) zoneLevel = 2;
        else if (dist <= 16) zoneLevel = 3;
        else zoneLevel = 4;

        const dangerousTiles = this.calculateDangerousTiles();

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = this.game.grid[y][x];
                try {
                    if (tile && tile.type === 'food') {
                        this.textureManager.renderTile(this.ctx, x, y, tile.type, this.game.grid, zoneLevel);
                    } else {
                        this.textureManager.renderTile(this.ctx, x, y, tile, this.game.grid, zoneLevel);
                    }
                } catch (error) {
                    console.error(`Error rendering tile at ${x},${y}:`, error);
                    // Fallback rendering
                    this.ctx.fillStyle = '#ffcb8d';
                    this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }

                // Draw danger indicator if the tile is dangerous
                if (dangerousTiles.has(`${x},${y}`)) {
                    this.drawDangerIndicator(x, y);
                }
            }
        }
    }

    drawPlayer() {
        const pos = this.game.player.getPosition();
        let spriteKey = 'default'; // Default idle sprite
        if (this.game.player.attackAnimation > 0) {
            spriteKey = 'whack';
        } else if (this.game.player.actionAnimation > 0) {
            spriteKey = 'whack';
        } else if (this.game.player.isDead()) {
            spriteKey = 'dead';
        }
        const playerImage = this.game.textureManager.getImage(spriteKey);
        if (playerImage && playerImage.complete) {
            this.ctx.drawImage(
                playerImage,
                pos.x * TILE_SIZE + this.game.player.bumpOffsetX,
                pos.y * TILE_SIZE + this.game.player.bumpOffsetY + this.game.player.liftOffsetY,
                TILE_SIZE,
                TILE_SIZE
            );
        } else {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillRect(
                pos.x * TILE_SIZE + this.game.player.bumpOffsetX + 2,
                pos.y * TILE_SIZE + this.game.player.bumpOffsetY + 2,
                TILE_SIZE - 4,
                TILE_SIZE - 4
            );
        }
    }

    drawEnemies() {
        for (let enemy of this.game.enemies) {
            let enemyKey;
            if (enemy.enemyType === 'lizardo') {
                enemyKey = 'lizardo';
            } else if (enemy.enemyType === 'lizardeaux') {
                enemyKey = 'lizardeaux';
            } else if (enemy.enemyType === 'zard') {
                enemyKey = 'zard';
            } else if (enemy.enemyType === 'lizord') {
                enemyKey = 'lizord';
            } else if (enemy.enemyType === 'lazerd') {
                enemyKey = 'lazerd';
            } else {
                enemyKey = 'lizardy';
            }

            // Determine sprite based on animation state
            if (enemy.deathAnimation > 0) {
                enemyKey = 'dead';
            }

            // Dramatic attack animation: scale, flash, shake
            let scale = 1;
            let flash = false;
            let shakeX = 0, shakeY = 0;
            if (enemy.attackAnimation > 0) {
                // Scale up and flash red for first half, shake for second half
                if (enemy.attackAnimation > 7) {
                    scale = 1.35;
                    flash = true;
                } else {
                    scale = 1.15;
                    shakeX = (Math.random() - 0.5) * 8;
                    shakeY = (Math.random() - 0.5) * 8;
                }
            }

            const enemyImage = this.game.textureManager.getImage(enemyKey);
            if (enemyImage && enemyImage.complete) {
                this.ctx.save();
                // Center scaling on enemy
                const cx = enemy.x * TILE_SIZE + enemy.bumpOffsetX + TILE_SIZE / 2 + shakeX;
                const cy = enemy.y * TILE_SIZE + enemy.bumpOffsetY + enemy.liftOffsetY + TILE_SIZE / 2 + shakeY;
                this.ctx.translate(cx, cy);
                this.ctx.scale(scale, scale);
                this.ctx.translate(-TILE_SIZE / 2, -TILE_SIZE / 2);
                if (flash) {
                    this.ctx.globalAlpha = 0.7;
                    this.ctx.filter = 'brightness(1.5) drop-shadow(0 0 8px red)';
                }
                this.ctx.drawImage(
                    enemyImage,
                    0,
                    0,
                    TILE_SIZE,
                    TILE_SIZE
                );
                this.ctx.filter = 'none';
                this.ctx.globalAlpha = 1.0;
                this.ctx.restore();
            } else {
                // Fallback
                this.ctx.fillStyle = '#32CD32';
                this.ctx.fillRect(
                    enemy.x * TILE_SIZE + enemy.bumpOffsetX + 2,
                    enemy.y * TILE_SIZE + enemy.bumpOffsetY + 2,
                    TILE_SIZE - 4,
                    TILE_SIZE - 4
                );
            }
        }
    }

    calculateDangerousTiles() {
        const dangerousTiles = new Set();
        if (!this.game.player || this.game.player.isDead() || !this.game.grid) {
            return dangerousTiles;
        }

        const playerPos = this.game.player.getPosition();
        const directions = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, // Orthogonal
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }  // Diagonal
        ];

        for (const dir of directions) {
            const x = playerPos.x + dir.dx;
            const y = playerPos.y + dir.dy;

            // We only care about adjacent tiles the player can actually move to.
            if (this.game.player.isWalkable(x, y, this.game.grid)) {
                // Check if any enemy can attack this position.
                for (const enemy of this.game.enemies) {
                    if (enemy.canAttackPosition(this.game.player, x, y, this.game.grid, this.game.enemies)) {
                        dangerousTiles.add(`${x},${y}`);
                        break; // One enemy is enough to mark it as dangerous.
                    }
                }
            }
        }

        return dangerousTiles;
    }

    drawDangerIndicator(x, y) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.25)'; // Semi-transparent red
        this.ctx.globalCompositeOperation = 'source-atop';
        this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        this.ctx.restore();
    }
}
