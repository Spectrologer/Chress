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

        // Draw enemy attack ranges if toggled
        this.drawEnemyAttackRanges();

        // Draw bomb placement indicator if active
        this.drawBombPlacementIndicator();
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

        // Draw player
        this.drawPlayerSprite();

        // Draw visual indicator if player is on an exit tile (drawn after player sprite)
        this.drawExitIndicator();
    }

    drawPlayerSprite() {
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

    drawExitIndicator() {
        // Draw visual indicator if player is on an exit tile
        const playerGridX = this.game.player.x;
        const playerGridY = this.game.player.y;
        const tileUnderPlayer = this.game.grid[playerGridY]?.[playerGridX];

        if (tileUnderPlayer === TILE_TYPES.EXIT) {
            const arrowImage = this.game.textureManager.getImage('ui/arrow');
            if (arrowImage && arrowImage.complete) {
                this.ctx.save();
                const pixelX = playerGridX * TILE_SIZE;
                const pixelY = playerGridY * TILE_SIZE;

                // Create subtle floating animation
                const time = Date.now() * 0.003; // Slow time scale
                const floatOffset = Math.sin(time) * 4; // 4 pixel float range

                // Translate to the center of the tile with floating offset
                this.ctx.translate(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2 + floatOffset);

                let rotationAngle = 0; // Default to North (arrow.png points up)

                if (playerGridY === 0) { // Top edge exit
                    rotationAngle = 0; // North
                } else if (playerGridY === GRID_SIZE - 1) { // Bottom edge exit
                    rotationAngle = Math.PI; // South (180 degrees)
                } else if (playerGridX === 0) { // Left edge exit
                    rotationAngle = -Math.PI / 2; // West (270 degrees clockwise / 90 degrees counter-clockwise)
                } else if (playerGridX === GRID_SIZE - 1) { // Right edge exit
                    rotationAngle = Math.PI / 2; // East (90 degrees clockwise)
                }

                this.ctx.rotate(rotationAngle);

                // Set slight transparency
                this.ctx.globalAlpha = 0.8;

                // Draw the image, offset by half its size to center it after rotation, and slightly above the player
                const arrowSize = TILE_SIZE * 0.75; // Make arrow slightly smaller than tile
                this.ctx.drawImage(arrowImage, -arrowSize / 2, -arrowSize / 2 - TILE_SIZE / 4, arrowSize, arrowSize);

                this.ctx.restore();
            }
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

    drawEnemyAttackRanges() {
        if (!this.game.showEnemyAttackRanges) {
            return;
        }

        const allAttackableTiles = new Set();

        for (const enemy of this.game.enemies) {
            const attackable = enemy.getAttackableTiles(this.game.player, this.game.grid, this.game.enemies);
            attackable.forEach(tile => allAttackableTiles.add(`${tile.x},${tile.y}`));
        }

        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        allAttackableTiles.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        });
    }

    drawBombPlacementIndicator() {
        const confirmation = this.game.inputManager.bombPlacementConfirmation;
        if (!confirmation) {
            return;
        }

        const bombImage = this.game.textureManager.getImage('bomb');
        if (bombImage && bombImage.complete) {
            this.ctx.save();
            // Make the bomb icon flash
            const alpha = 0.6 + Math.sin(Date.now() * 0.01) * 0.2; // Flashes between 0.4 and 0.8
            this.ctx.globalAlpha = alpha;
            this.ctx.drawImage(
                bombImage,
                confirmation.x * TILE_SIZE,
                confirmation.y * TILE_SIZE,
                TILE_SIZE, TILE_SIZE
            );
            this.ctx.restore();
        }
    }
}
