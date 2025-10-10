import { GRID_SIZE, TILE_SIZE, TILE_TYPES } from './constants.js';

export class PlayerRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
    }

    drawPlayer() {
        this.drawPlayerSprite();

        // Draw smoke animation if active (for player only)
        this.drawPlayerSmokeAnimation();

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

        if (tileUnderPlayer === TILE_TYPES.EXIT || tileUnderPlayer === TILE_TYPES.PORT) {
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

                if (tileUnderPlayer === TILE_TYPES.PORT) {
                    // Specific directions for PORT tiles
                    if (this.game.player.currentZone.dimension === 0) { // Exterior house door
                        rotationAngle = 0; // North
                    } else { // Interior house door
                        rotationAngle = Math.PI; // South
                    }
                } else { // It's an EXIT tile
                    if (playerGridY === 0) { // Top edge exit
                        rotationAngle = 0; // North
                    } else if (playerGridY === GRID_SIZE - 1) { // Bottom edge exit
                        rotationAngle = Math.PI; // South (180 degrees)
                    } else if (playerGridX === 0) { // Left edge exit
                        rotationAngle = -Math.PI / 2; // West (270 degrees clockwise / 90 degrees counter-clockwise)
                    } else if (playerGridX === GRID_SIZE - 1) { // Right edge exit
                        rotationAngle = Math.PI / 2; // East (90 degrees clockwise)
                    }
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

    drawPlayerSmokeAnimation() {
        this.game.player.smokeAnimations.forEach(anim => {
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
