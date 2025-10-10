import { TILE_SIZE } from './constants.js';

export class UIRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
    }

    drawBombPlacementIndicator() {
        const positions = this.game.bombPlacementPositions;
        if (!positions || positions.length === 0) {
            return;
        }

        const bombImage = this.game.textureManager.getImage('bomb');
        if (bombImage && bombImage.complete) {
            this.ctx.save();
            // Make the bomb icons flash
            const alpha = 0.6 + Math.sin(Date.now() * 0.01) * 0.2; // Flashes between 0.4 and 0.8
            this.ctx.globalAlpha = alpha;
            for (const pos of positions) {
                this.ctx.drawImage(
                    bombImage,
                    pos.x * TILE_SIZE,
                    pos.y * TILE_SIZE,
                    TILE_SIZE, TILE_SIZE
                );
            }
            this.ctx.restore();
        }
    }

    drawChargeConfirmationIndicator() {
        if (!this.game.pendingCharge) {
            return;
        }

        const { targetX, targetY } = this.game.pendingCharge;

        // Draw a flashing yellow indicator at the target position
        const alpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3; // Flashes between 0.2 and 0.8

        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#ffff00'; // Yellow
        this.ctx.fillRect(targetX * TILE_SIZE, targetY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        this.ctx.restore();
    }
}
