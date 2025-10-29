import { TILE_SIZE, ANIMATION_CONSTANTS, SCALE_CONSTANTS, STROKE_CONSTANTS } from '../core/constants/index.js';
import { RENDERING_CONSTANTS } from '../core/constants/animation.js';
import { COLOR_CONSTANTS, UI_RENDERING_CONSTANTS } from '../core/constants/rendering.js';
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
                // Calculate a frame index from 1..8. If totalFrames is missing, fall back.
                let frameNumber = 1;
                if (anim.totalFrames && anim.totalFrames > 0) {
                    const elapsed = anim.totalFrames - anim.frame;
                    const per = Math.max(1, Math.floor(anim.totalFrames / ANIMATION_CONSTANTS.SPLODE_FRAME_DIVISOR));
                    frameNumber = Math.min(8, Math.floor(elapsed / per) + 1);
                }
                const splodeImage = this.textureManager.getImage(`splode_${frameNumber}`);
                if (splodeImage && splodeImage.complete) {
                    // Draw the splode visual as a 3x3 tile block centered on the bomb location
                    const size = TILE_SIZE * 3;
                    const drawX = anim.x * TILE_SIZE - TILE_SIZE; // shift left by 1 tile
                    const drawY = anim.y * TILE_SIZE - TILE_SIZE; // shift up by 1 tile
                    this.ctx.drawImage(
                        splodeImage,
                        drawX,
                        drawY,
                        size,
                        size
                    );
                }
            }
        });
    }

    drawHorseChargeAnimation() {
        const animations = this.game.animationManager.horseChargeAnimations;
        animations.forEach(anim => {
            const progress = 1.0 - (anim.frame / ANIMATION_CONSTANTS.HORSE_CHARGE_FRAMES);
            const alpha = 1.0 - progress; // Fade out as it completes
    
            const startPixelX = anim.startPos.x * TILE_SIZE + TILE_SIZE / 2;
            const startPixelY = anim.startPos.y * TILE_SIZE + TILE_SIZE / 2;
            const midPixelX = anim.midPos.x * TILE_SIZE + TILE_SIZE / 2;
            const midPixelY = anim.midPos.y * TILE_SIZE + TILE_SIZE / 2;
            const endPixelX = anim.endPos.x * TILE_SIZE + TILE_SIZE / 2;
            const endPixelY = anim.endPos.y * TILE_SIZE + TILE_SIZE / 2;
    
            this.ctx.save();
            this.ctx.strokeStyle = `rgba(255, 255, 100, ${alpha})`; // Bright yellow, fading out
            this.ctx.lineWidth = STROKE_CONSTANTS.POINT_ANIMATION_STROKE;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
    
            const turnPoint = RENDERING_CONSTANTS.HORSE_CHARGE_TURN_POINT; // The point in the animation where it turns the corner
    
            if (progress < turnPoint) {
                // Draw the first leg of the L
                const legProgress = progress / turnPoint;
                const currentX = startPixelX + (midPixelX - startPixelX) * legProgress;
                const currentY = startPixelY + (midPixelY - startPixelY) * legProgress;
                this.ctx.moveTo(startPixelX, startPixelY);
                this.ctx.lineTo(currentX, currentY);
            } else {
                // Draw the full first leg
                this.ctx.moveTo(startPixelX, startPixelY);
                this.ctx.lineTo(midPixelX, midPixelY);
    
                // Draw the second leg of the L
                const legProgress = (progress - turnPoint) / (1 - turnPoint);
                const currentX = midPixelX + (endPixelX - midPixelX) * legProgress;
                const currentY = midPixelY + (endPixelY - midPixelY) * legProgress;
                this.ctx.moveTo(midPixelX, midPixelY);
                this.ctx.lineTo(currentX, currentY);
            }
    
            this.ctx.stroke();
            this.ctx.restore();
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
            const progress = 1 - (anim.frame / ANIMATION_CONSTANTS.POINT_ANIMATION_FRAMES);
            const yOffset = -progress * ANIMATION_CONSTANTS.POINT_RISE_DISTANCE; // Move up
            const alpha = 1 - progress; // Fade out
            const x = anim.x * TILE_SIZE + TILE_SIZE / 2;
            // Show the point slightly above the tile center (over the enemy's head)
            const headOffset = ANIMATION_CONSTANTS.POINT_HEAD_OFFSET; // pixels above center
            const y = anim.y * TILE_SIZE + TILE_SIZE / 2 + yOffset + headOffset;

            // Try to use the 'points' image asset if loaded. Fallback to text if missing.
            const img = this.textureManager.getImage('points');
            if (img && img.complete) {
                this.ctx.save();
                this.ctx.globalAlpha = alpha;

                // Scale icon slightly based on amount (more points = slightly larger)
                const baseSize = TILE_SIZE * SCALE_CONSTANTS.ANIMATION_BASE_SIZE_SCALE;
                const scale = RENDERING_CONSTANTS.DAMAGE_SCALE_BASE + Math.min(RENDERING_CONSTANTS.DAMAGE_SCALE_MAX, (anim.amount - 1) * RENDERING_CONSTANTS.DAMAGE_SCALE_COEFFICIENT);
                const drawW = baseSize * scale;
                const drawH = baseSize * scale;

                this.ctx.drawImage(img, x - drawW / 2, y - drawH / 2, drawW, drawH);
                this.ctx.restore();
            } else {
                // Fallback to text rendering if image not available
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = COLOR_CONSTANTS.GOLD_COLOR; // Gold color for points
                this.ctx.font = `${UI_RENDERING_CONSTANTS.POINT_FONT_WEIGHT} ${UI_RENDERING_CONSTANTS.POINT_FONT_SIZE}px ${UI_RENDERING_CONSTANTS.POINT_FONT_FAMILY}`;
                this.ctx.textAlign = 'center';
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = STROKE_CONSTANTS.POINT_ANIMATION_STROKE;

                const text = `+${anim.amount}`;
                this.ctx.strokeText(text, x, y);
                this.ctx.fillText(text, x, y);
                this.ctx.restore();
            }
        });
    }

    drawMultiplierAnimations() {
        const animations = this.game.animationManager.multiplierAnimations;
        animations.forEach(anim => {
            const progress = 1 - (anim.frame / ANIMATION_CONSTANTS.MULTIPLIER_ANIMATION_FRAMES);
            const yOffset = -progress * ANIMATION_CONSTANTS.MULTIPLIER_RISE_DISTANCE; // float up
            const alpha = 1 - progress;

            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 28px "Press Start 2P", cursive';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = STROKE_CONSTANTS.POINT_ANIMATION_STROKE;

            const text = `x${anim.multiplier}!`;
            const x = anim.x * TILE_SIZE + TILE_SIZE / 2;
            const y = anim.y * TILE_SIZE + TILE_SIZE / 2 + yOffset;

            this.ctx.strokeText(text, x, y);
            this.ctx.fillText(text, x, y);
            this.ctx.restore();
        });
    }
}