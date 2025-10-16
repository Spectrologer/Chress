import { GRID_SIZE, TILE_SIZE, CANVAS_SIZE } from '../core/constants.js';

export class EnemyRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
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
                enemyKey = 'protag/dead';
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
                let pixelXBase, pixelYBase;

                // If the enemy is moving (lift animation is active), interpolate its position for a slide effect.
                if (enemy.liftFrames > 0 && enemy.lastX !== undefined && enemy.lastY !== undefined) {
                    const progress = 1 - (enemy.liftFrames / 15); // Animation progress from 0 to 1
                    pixelXBase = (enemy.lastX + (enemy.x - enemy.lastX) * progress) * TILE_SIZE + enemy.bumpOffsetX;
                    pixelYBase = (enemy.lastY + (enemy.y - enemy.lastY) * progress) * TILE_SIZE + enemy.bumpOffsetY + enemy.liftOffsetY;
                } else {
                    pixelXBase = enemy.x * TILE_SIZE + enemy.bumpOffsetX;
                    pixelYBase = enemy.y * TILE_SIZE + enemy.bumpOffsetY + enemy.liftOffsetY;
                }

                // For lazerd, draw it directly without scaling to avoid blurriness,
                // unless it's doing a special animation (attack/move).
                if (enemy.enemyType === 'lazerd' && scale === 1 && !flash && enemy.liftFrames === 0) {
                    this.ctx.drawImage(
                        enemyImage,
                        pixelXBase,
                        pixelYBase,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                    continue; // Skip the rest of the logic for this enemy
                }

                this.ctx.save();

                // Clamp coordinates to prevent drawing outside the canvas during animations
                pixelXBase = Math.max(-TILE_SIZE / 2, Math.min(CANVAS_SIZE - TILE_SIZE / 2, pixelXBase));
                pixelYBase = Math.max(-TILE_SIZE / 2, Math.min(CANVAS_SIZE - TILE_SIZE / 2, pixelYBase));

                const cx = pixelXBase + TILE_SIZE / 2 + shakeX;
                const cy = pixelYBase + TILE_SIZE / 2 + shakeY;

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
            } else if (enemy.health > 0) {
                // Fallback to green tile only if enemy is alive
                let pixelXBase = enemy.x * TILE_SIZE + enemy.bumpOffsetX;
                let pixelYBase = enemy.y * TILE_SIZE + enemy.bumpOffsetY;
                pixelXBase = Math.max(-TILE_SIZE / 2, Math.min(CANVAS_SIZE - TILE_SIZE / 2, pixelXBase));
                pixelYBase = Math.max(-TILE_SIZE / 2, Math.min(CANVAS_SIZE - TILE_SIZE / 2, pixelYBase));
                this.ctx.fillStyle = '#32CD32';
                this.ctx.fillRect(
                    pixelXBase + 2,
                    pixelYBase + 2,
                    TILE_SIZE - 4,
                    TILE_SIZE - 4
                );
            }
        }
    }

    drawEnemySmokeAnimation() {
        // Draw enemy smoke
        for (const enemy of this.game.enemies) {
            enemy.smokeAnimations.forEach(anim => {
                if (anim.frame > 0) {
                    const frameNumber = Math.floor((18 - anim.frame) / 3) + 1; // Map 18 frames to 6 smoke frames
                    const smokeImage = this.game.textureManager.getImage(`smoke_frame_${frameNumber}`);
                    if (smokeImage && smokeImage.complete) {
                        this.ctx.drawImage(
                            smokeImage,
                            anim.x * TILE_SIZE,
                            anim.y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    }
                }
            });
        }
    }
}
