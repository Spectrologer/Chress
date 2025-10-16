import { TILE_SIZE, ANIMATION_CONSTANTS } from '../core/constants.js';
import { RendererUtils } from './RendererUtils.js'; // Correctly import using ES Modules

export class AnimationRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
    }

    drawSplodeAnimation() {
        this.game.player.animations.splodeAnimations.forEach(anim => {
            if (anim.frame > 0) {
                const frameNumber = Math.floor((anim.totalFrames - anim.frame) / (anim.totalFrames / 8)) + 1;
                const splodeImage = this.textureManager.getImage(`fx/splode/splode_${frameNumber}`);
                if (splodeImage && splodeImage.complete) {
                    this.ctx.drawImage(
                        splodeImage,
                        anim.x * TILE_SIZE,
                        anim.y * TILE_SIZE,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
            }
        });
    }

    drawHorseChargeAnimation() {
        const animations = this.game.animationManager.horseChargeAnimations;
        animations.forEach(anim => {
            const progress = 1 - (anim.frame / ANIMATION_CONSTANTS.HORSE_CHARGE_FRAMES);
            const horseImage = this.textureManager.getImage('horse');

            if (horseImage && horseImage.complete) {
                const startPixelX = anim.startPos.x * TILE_SIZE;
                const startPixelY = anim.startPos.y * TILE_SIZE;
                const endPixelX = anim.endPos.x * TILE_SIZE;
                const endPixelY = anim.endPos.y * TILE_SIZE;

                // L-shape path interpolation
                const dx = endPixelX - startPixelX;
                const dy = endPixelY - startPixelY;

                let currentX, currentY;
                const turnPoint = Math.abs(dx) > Math.abs(dy) ? 0.5 : 0.5;

                if (progress < turnPoint) {
                    // Move along the first leg of the "L"
                    const legProgress = progress / turnPoint;
                    if (Math.abs(dx) > Math.abs(dy)) { // Horizontal first
                        currentX = startPixelX + dx * legProgress;
                        currentY = startPixelY;
                    } else { // Vertical first
                        currentX = startPixelX;
                        currentY = startPixelY + dy * legProgress;
                    }
                } else {
                    // Move along the second leg
                    const legProgress = (progress - turnPoint) / (1 - turnPoint);
                    if (Math.abs(dx) > Math.abs(dy)) { // Vertical second
                        currentX = endPixelX;
                        currentY = startPixelY + dy * legProgress;
                    } else { // Horizontal second
                        currentX = startPixelX + dx * legProgress;
                        currentY = endPixelY;
                    }
                }

                this.ctx.drawImage(horseImage, currentX, currentY, TILE_SIZE, TILE_SIZE);
            }
        });
    }

    drawArrowAnimations() {
        const animations = this.game.animationManager.arrowAnimations;
        animations.forEach(anim => {
            const progress = 1 - (anim.frame / ANIMATION_CONSTANTS.ARROW_ANIMATION_FRAMES);
            const arrowImage = this.textureManager.getImage('arrow');

            if (arrowImage && arrowImage.complete) {
                const startPixelX = anim.startX * TILE_SIZE + TILE_SIZE / 2;
                const startPixelY = anim.startY * TILE_SIZE + TILE_SIZE / 2;
                const endPixelX = anim.endX * TILE_SIZE + TILE_SIZE / 2;
                const endPixelY = anim.endY * TILE_SIZE + TILE_SIZE / 2;

                const currentX = startPixelX + (endPixelX - startPixelX) * progress;
                const currentY = startPixelY + (endPixelY - startPixelY) * progress;

                // The angle of the arrow's trajectory.
                // Math.atan2 gives the angle from the positive X-axis, which is what we need if the arrow asset points right.
                const angle = Math.atan2(endPixelY - startPixelY, endPixelX - startPixelX);

                // Calculate scaled dimensions to maintain aspect ratio
                const { width: scaledWidth, height: scaledHeight } = RendererUtils.calculateScaledDimensions(arrowImage, TILE_SIZE);

                // Use the new drawRotatedImage with separate width/height
                RendererUtils.drawRotatedImage(this.ctx, arrowImage, currentX - scaledWidth / 2, currentY - scaledHeight / 2, angle, scaledWidth, scaledHeight);
            }
        });
    }

    drawPointAnimations() {
        const animations = this.game.animationManager.pointAnimations;
        animations.forEach(anim => {
            const progress = 1 - (anim.frame / 15);
            const yOffset = -progress * 30; // Move up
            const alpha = 1 - progress; // Fade out

            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#ffd700'; // Gold color for points
            this.ctx.font = 'bold 24px "Press Start 2P", cursive';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 4;

            const text = `+${anim.amount}`;
            const x = anim.x * TILE_SIZE + TILE_SIZE / 2;
            const y = anim.y * TILE_SIZE + TILE_SIZE / 2 + yOffset;

            this.ctx.strokeText(text, x, y);
            this.ctx.fillText(text, x, y);
            this.ctx.restore();
        });
    }
}