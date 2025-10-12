import { TILE_SIZE } from '../core/constants.js';

export class AnimationRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
    }

    drawSplodeAnimation() {
        this.game.player.animations.splodeAnimations.forEach(anim => {
            if (anim.frame > 0) {
                const frameNumber = Math.floor((16 - anim.frame) / 2) + 1; // Map 16 frames to 8 splode frames
                const splodeImage = this.game.textureManager.getImage(`fx/splode/splode_${frameNumber}`);
                if (splodeImage && splodeImage.complete) {
                    // Draw explosion slightly larger than 3x3 tiles (200x200 instead of 192x192), centered on the bomb tile
                    const size = 200;
                    const offset = - (size - TILE_SIZE) / 2;
                    const pixelX = anim.x * TILE_SIZE + offset;
                    const pixelY = anim.y * TILE_SIZE + offset;
                    this.ctx.drawImage(
                        splodeImage,
                        pixelX,
                        pixelY,
                        size,
                        size
                    );
                }
            }
        });
    }

    drawHorseChargeAnimation() {
        const anims = this.game.animationManager.getActiveAnimations().horseChargeAnimations;
        if (anims.length === 0) {
            return;
        }

        this.ctx.save();
        this.ctx.lineWidth = 6; // A thick, impactful line

        anims.forEach(anim => {
            const progress = (20 - anim.frame) / 20; // Based on 20-frame duration, reverse for fade out
            const alpha = progress; // Fade out as the animation progresses

            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`; // White, slightly transparent
            this.ctx.shadowColor = `rgba(75, 0, 130, ${alpha})`; // Indigo glow
            this.ctx.shadowBlur = 15;

            // Get pixel coordinates for the center of each tile
            const startX = anim.startPos.x * TILE_SIZE + TILE_SIZE / 2;
            const startY = anim.startPos.y * TILE_SIZE + TILE_SIZE / 2;
            const endX = anim.endPos.x * TILE_SIZE + TILE_SIZE / 2;
            const endY = anim.endPos.y * TILE_SIZE + TILE_SIZE / 2;

            // Calculate L-shape path for linear interpolation
            const totalDistance = Math.abs(endX - startX) + Math.abs(endY - startY);
            const currentDistance = progress * totalDistance;

            let midX, midY;
            if (Math.abs(endX - startX) >= Math.abs(endY - startY)) {
                // Horizontal dominant
                midX = startX + (endX > startX ? currentDistance : -currentDistance);
                midY = startY;
            } else {
                // Vertical dominant
                midX = startX;
                midY = startY + (endY > startY ? currentDistance : -currentDistance);
            }

            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(midX, midY);
            this.ctx.stroke();
        });

        this.ctx.restore();
    }

    drawArrowAnimations() {
        const anims = this.game.animationManager.getActiveAnimations().arrowAnimations;
        if (anims.length === 0) {
            return;
        }

        const arrowImage = this.game.textureManager.getImage('arrow');
        if (!arrowImage || !arrowImage.complete) {
            return;
        }

        this.ctx.save();

        anims.forEach(anim => {
            const progress = 1 - (anim.frame / 20); // 0 to 1
            const currentX = anim.startX + (anim.endX - anim.startX) * progress;
            const currentY = anim.startY + (anim.endY - anim.startY) * progress;

            const pixelX = currentX * TILE_SIZE + TILE_SIZE / 2;
            const pixelY = currentY * TILE_SIZE + TILE_SIZE / 2;

            const dx = anim.endX - anim.startX;
            const dy = anim.endY - anim.startY;

            let rotation = 0; // Right (default)
            if (dx < 0) rotation = Math.PI; // Left
            else if (dy > 0) rotation = Math.PI / 2; // Down
            else if (dy < 0) rotation = -Math.PI / 2; // Up

            this.ctx.save();
            this.ctx.translate(pixelX, pixelY);
            this.ctx.rotate(rotation);

            // Scale arrow to fit while maintaining aspect ratio, 75% size
            const aspectRatio = arrowImage.width / arrowImage.height;
            let scaledWidth, scaledHeight;
            if (aspectRatio > 1) {
                // Image is wider than tall
                scaledWidth = TILE_SIZE * 0.75;
                scaledHeight = (TILE_SIZE * 0.75) / aspectRatio;
            } else {
                // Image is taller than wide (or square)
                scaledHeight = TILE_SIZE * 0.75;
                scaledWidth = (TILE_SIZE * 0.75) * aspectRatio;
            }

            // Center the image
            const offsetX = -scaledWidth / 2;
            const offsetY = -scaledHeight / 2;

            this.ctx.drawImage(arrowImage, offsetX, offsetY, scaledWidth, scaledHeight);

            this.ctx.restore();
        });

        this.ctx.restore();
    }

    drawPointAnimations() {
        const anims = this.game.animationManager.getActiveAnimations().pointAnimations;
        if (anims.length === 0) {
            return;
        }

        const pointImage = this.game.textureManager.getImage('points');
        if (!pointImage || !pointImage.complete) {
            return;
        }

        this.ctx.save();
        this.ctx.font = 'bold 20px "Courier New", monospace';
        this.ctx.fillStyle = '#FFD700'; // Gold color for text
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 4;

        for (const anim of anims) {
            const progress = 1 - (anim.frame / 30); // 0 to 1
            const alpha = 1 - progress; // Fade out
            const floatOffset = -progress * TILE_SIZE; // Float up by one tile height

            this.ctx.globalAlpha = alpha;

            const startPixelX = anim.x * TILE_SIZE;
            const startPixelY = anim.y * TILE_SIZE; // Use y instead of startY
            const pixelY = startPixelY + floatOffset;
            const iconSize = TILE_SIZE / 2;
            const totalWidth = anim.amount * iconSize;
            let currentX = startPixelX + (TILE_SIZE - totalWidth) / 2; // Center the group of icons

            for (let i = 0; i < anim.amount; i++) {
                this.ctx.drawImage(pointImage, currentX, pixelY, iconSize, iconSize);
                currentX += iconSize;
            }
        }

        this.ctx.restore();
    }
}
