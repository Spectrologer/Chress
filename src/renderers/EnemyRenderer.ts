import { GRID_SIZE, TILE_SIZE, CANVAS_SIZE, ANIMATION_CONSTANTS, STROKE_CONSTANTS } from '@core/constants/index';
import { RENDERING_CONSTANTS } from '@core/constants/animation';
import { RendererUtils } from './RendererUtils';
import type { TextureManager } from './TextureManager';
import type { SmokeAnimation } from './types';
import type { IGame } from '@core/context';
import type { Enemy } from '@entities/Enemy';
import type { TurnManager } from '@core/TurnManager';
import type { EnemyCollection } from '@facades/EnemyCollection';

export class EnemyRenderer {
    private game: IGame;
    private ctx: CanvasRenderingContext2D;
    private textureManager: TextureManager;

    constructor(game: IGame) {
        this.game = game;
        this.ctx = game.ctx!;
        this.textureManager = game.textureManager!;
    }

    drawEnemies(): void {
        // Use enemyCollection instead of game.enemies to avoid array reference issues
        const enemies = this.game.enemyCollection ? this.game.enemyCollection.getAll() : this.game.enemies;

        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];

            // Strip 'black_' prefix to get base enemy type for sprite selection
            const baseEnemyType = enemy.enemyType.startsWith('black_')
                ? enemy.enemyType.substring(6)
                : enemy.enemyType;

            let enemyKey: string;
            if (baseEnemyType === 'lizardo') {
                enemyKey = 'lizardo';
            } else if (baseEnemyType === 'lizardeaux') {
                enemyKey = 'lizardeaux';
            } else if (baseEnemyType === 'zard') {
                enemyKey = 'zard';
            } else if (baseEnemyType === 'lizord') {
                enemyKey = 'lizord';
            } else if (baseEnemyType === 'lazerd') {
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

            // Attack animation (during/after hit)
            if (enemy.attackAnimation > 0) {
                // Scale up and flash red for first half, shake for second half
                if (enemy.attackAnimation > 7) {
                    scale = RENDERING_CONSTANTS.ATTACK_SCALE_LARGE; // Increased from 1.35 for more dramatic effect
                    flash = true;
                } else {
                    scale = RENDERING_CONSTANTS.ATTACK_SCALE_SMALL; // Increased from 1.15
                    shakeX = (Math.random() - 0.5) * RENDERING_CONSTANTS.ATTACK_SHAKE_INTENSITY; // Doubled shake intensity
                    shakeY = (Math.random() - 0.5) * RENDERING_CONSTANTS.ATTACK_SHAKE_INTENSITY;
                }
            }

            const enemyImage = this.game.textureManager!.getImage(enemyKey);
            if (enemyImage && enemyImage.complete) {
                let pixelXBase: number, pixelYBase: number;

                // If the enemy is moving (lift animation is active), interpolate its position for a slide effect.
                if (enemy.liftFrames > 0 && enemy.lastX !== undefined && enemy.lastY !== undefined) {
                    const remaining = enemy.liftFrames;
                    const totalFrames = ANIMATION_CONSTANTS.LIFT_FRAMES || 15;
                    const progress = 1 - (remaining / totalFrames);
                    pixelXBase = (enemy.lastX + (enemy.x - enemy.lastX) * progress) * TILE_SIZE + enemy.bumpOffsetX;
                    pixelYBase = (enemy.lastY + (enemy.y - enemy.lastY) * progress) * TILE_SIZE + enemy.bumpOffsetY + enemy.liftOffsetY;
                } else {
                    pixelXBase = enemy.x * TILE_SIZE + enemy.bumpOffsetX;
                    pixelYBase = enemy.y * TILE_SIZE + enemy.bumpOffsetY + enemy.liftOffsetY;
                }

                // For lazerd, draw it directly without scaling to avoid blurriness,
                // and lizord, draw them directly without scaling to avoid blurriness,
                // unless they are doing a special animation (attack/move) or frozen.
                const isPixelPerfectEnemy = baseEnemyType === 'lazerd' || baseEnemyType === 'lizord';
                const usePixelPerfect = isPixelPerfectEnemy && scale === 1 && !flash && enemy.liftFrames === 0 && !enemy.showFrozenVisual;
                if (usePixelPerfect) {
                    this.ctx.drawImage(
                        enemyImage,
                        pixelXBase,
                        pixelYBase,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }

                // Handle frozen pixel-perfect enemies separately
                if (isPixelPerfectEnemy && enemy.showFrozenVisual && scale === 1 && !flash && enemy.liftFrames === 0) {
                    this.ctx.save();
                    this.ctx.filter = `grayscale(1) brightness(${RENDERING_CONSTANTS.FROZEN_BRIGHTNESS})`;
                    this.ctx.globalAlpha = RENDERING_CONSTANTS.FROZEN_ALPHA;
                    this.ctx.drawImage(
                        enemyImage,
                        pixelXBase,
                        pixelYBase,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                    this.ctx.filter = 'none';
                    this.ctx.globalAlpha = 1.0;
                    this.ctx.restore();
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
                    // Much more dramatic red flash for attacking enemies
                    this.ctx.filter = `brightness(${RENDERING_CONSTANTS.ATTACK_FLASH_BRIGHTNESS}) saturate(${RENDERING_CONSTANTS.ATTACK_FLASH_SATURATE}) hue-rotate(${RENDERING_CONSTANTS.ATTACK_FLASH_HUE_ROTATE}deg) drop-shadow(0 0 ${RENDERING_CONSTANTS.ATTACK_FLASH_SHADOW_BLUR}px red) drop-shadow(0 0 ${RENDERING_CONSTANTS.ATTACK_FLASH_SHADOW_SPREAD}px red)`;
                } else if (enemy.showFrozenVisual) {
                    this.ctx.filter = `grayscale(1) brightness(${RENDERING_CONSTANTS.FROZEN_BRIGHTNESS})`;
                    this.ctx.globalAlpha = RENDERING_CONSTANTS.FROZEN_ALPHA;
                } else if (enemy.enemyType.startsWith('black_')) {
                    // Apply grayscale filter for black_ enemies
                    this.ctx.filter = 'grayscale(1)';
                }

                // For 'lizardy', handle horizontal flipping with animation centered in the tile.
                if (baseEnemyType === 'lizardy') {
                    let flipScale = enemy.movementDirection; // 1 for south, -1 for north

                    if (enemy.flipAnimation && enemy.flipAnimation > 0) {
                        const totalFrames = ANIMATION_CONSTANTS.LIZARDY_FLIP_FRAMES;
                        const progress = (totalFrames - enemy.flipAnimation) / totalFrames; // 0 -> 1

                        // Animate from previous direction to current direction
                        const startScale = -enemy.movementDirection; // The direction it was facing
                        const endScale = enemy.movementDirection;
                        flipScale = startScale + (endScale - startScale) * progress;

                        enemy.flipAnimation--;
                    }

                    // To flip in place, we translate to the center, scale, and translate back.
                    this.ctx.translate(TILE_SIZE / 2, 0);
                    this.ctx.scale(flipScale, 1);
                    this.ctx.translate(-TILE_SIZE / 2, 0);
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
                this.ctx.fillStyle = '#3CA370';
                this.ctx.fillRect(
                    pixelXBase + 2,
                    pixelYBase + 2,
                    TILE_SIZE - 4,
                    TILE_SIZE - 4
                );
            }

            // Draw selection highlight in chess mode
            if (this.game.chessMode && this.game.selectedUnit === enemy && enemy.health > 0) {
                let pixelX = enemy.x * TILE_SIZE + enemy.bumpOffsetX;
                let pixelY = enemy.y * TILE_SIZE + enemy.bumpOffsetY;

                this.ctx.save();
                this.ctx.strokeStyle = '#f2a65e'; // Gold color
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(
                    pixelX + 2,
                    pixelY + 2,
                    TILE_SIZE - 4,
                    TILE_SIZE - 4
                );
                this.ctx.restore();
            }

            // Draw turn order number if enemy is alive (hidden in chess mode)
            if (enemy.health > 0 && this.game.turnManager && !this.game.chessMode) {
                // During enemy turns, show position in turnQueue
                // During player turn, show position based on all enemies (upcoming order)
                let turnNumber: number | null = null;

                if (!this.game.isPlayerTurn && this.game.turnManager.turnQueue.length > 0) {
                    // Enemy turn phase - show actual queue position
                    const turnOrderIndex = this.game.turnManager.turnQueue.indexOf(enemy);
                    if (turnOrderIndex !== -1) {
                        turnNumber = turnOrderIndex + 1;
                    }
                } else if (this.game.isPlayerTurn) {
                    // Player turn phase - show predicted order (based on current enemy list)
                    const enemyIndex = enemies.indexOf(enemy);
                    if (enemyIndex !== -1) {
                        turnNumber = enemyIndex + 1;
                    }
                }

                if (turnNumber !== null) {

                    // Calculate position above enemy
                    let pixelX: number, pixelY: number;
                    if (enemy.liftFrames > 0 && enemy.lastX !== undefined && enemy.lastY !== undefined) {
                        const remaining = enemy.liftFrames;
                        const totalFrames = ANIMATION_CONSTANTS.LIFT_FRAMES || 15;
                        const progress = 1 - (remaining / totalFrames);
                        pixelX = (enemy.lastX + (enemy.x - enemy.lastX) * progress) * TILE_SIZE + enemy.bumpOffsetX;
                        pixelY = (enemy.lastY + (enemy.y - enemy.lastY) * progress) * TILE_SIZE + enemy.bumpOffsetY + enemy.liftOffsetY;
                    } else {
                        pixelX = enemy.x * TILE_SIZE + enemy.bumpOffsetX;
                        pixelY = enemy.y * TILE_SIZE + enemy.bumpOffsetY + enemy.liftOffsetY;
                    }

                    // Draw number above the enemy
                    this.ctx.save();
                    this.ctx.font = 'bold 20px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'bottom';

                    // Draw black outline
                    this.ctx.strokeStyle = '#272736';
                    this.ctx.lineWidth = STROKE_CONSTANTS.ENEMY_OUTLINE_STROKE;
                    this.ctx.strokeText(turnNumber.toString(), pixelX + TILE_SIZE / 2, pixelY - 4);

                    // Draw white fill
                    this.ctx.fillStyle = '#ffffeb';
                    this.ctx.fillText(turnNumber.toString(), pixelX + TILE_SIZE / 2, pixelY - 4);

                    this.ctx.restore();
                }
            }
        }
    }

    drawEnemySmokeAnimation(): void {
        // Draw enemy smoke
        for (const enemy of this.game.enemies) {
            enemy.smokeAnimations.forEach((anim: SmokeAnimation) => {
                if (anim.frame > 0) {
                    const frameNumber = Math.floor((18 - anim.frame) / 3) + 1; // Map 18 frames to 6 smoke frames
                    const smokeImage = this.game.textureManager!.getImage(`smoke_frame_${frameNumber}`);
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
