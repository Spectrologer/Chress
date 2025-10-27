import { GRID_SIZE, TILE_SIZE, TILE_TYPES, ANIMATION_CONSTANTS, PHYSICS_CONSTANTS, SCALE_CONSTANTS, DAMAGE_FLASH_CONSTANTS } from '../core/constants/index.js';
import { MultiTileHandler } from './MultiTileHandler.js';
import { RendererUtils } from './RendererUtils.js';

export class PlayerRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
    }

    drawPlayer() {
    // If preview mode is enabled (start overlay preview) do not draw the player
    if (this.game.previewMode) return;

    // Draw player sprite first
    this.drawPlayerSprite();

    // Draw indicator arrow above player (higher z-level)
    this.drawExitIndicator();

    // Draw smoke animation if active (for player only)
    this.drawPlayerSmokeAnimation();
    }

    drawPlayerSprite() {
        const pos = this.game.player.getPosition();
        const player = this.game.player;
        const anim = player.animations;
        let spriteKey = 'default'; // Default idle sprite
        if (this.game.player.animations.attackAnimation > 0) {
            spriteKey = 'whack';
        } else if (this.game.player.animations.actionAnimation > 0) {
            spriteKey = 'whack';
        } else if (this.game.player.isDead()) {
            spriteKey = 'dead';
        }
        const playerImage = this.game.textureManager.getImage(spriteKey);
        // Compute pixel position. If a lift animation is active we interpolate from last position -> current position
        let pixelXBase, pixelYBase;
        if (anim.liftFrames > 0 && typeof player.lastX !== 'undefined' && typeof player.lastY !== 'undefined') {
            const remaining = anim.liftFrames; // remaining frames
            const totalFrames = ANIMATION_CONSTANTS.LIFT_FRAMES || 15;
            const progress = 1 - (remaining / totalFrames); // progress 0..1
            // Use lastX/lastY to interpolate smooth movement between tiles
            const startX = player.lastX;
            const startY = player.lastY;
            const endX = player.x;
            const endY = player.y;
            pixelXBase = (startX + (endX - startX) * progress) * TILE_SIZE + anim.bumpOffsetX;
            pixelYBase = (startY + (endY - startY) * progress) * TILE_SIZE + anim.bumpOffsetY + anim.liftOffsetY + (anim.backflipLiftOffsetY || 0);
        } else {
            pixelXBase = pos.x * TILE_SIZE + anim.bumpOffsetX;
            pixelYBase = pos.y * TILE_SIZE + anim.bumpOffsetY + anim.liftOffsetY + (anim.backflipLiftOffsetY || 0);
        }

        // If a backflip rotation is active, draw rotated around sprite center
        if (playerImage && playerImage.complete) {
            this.ctx.save();

            // Apply damage flash effect if taking damage
            if (anim.damageAnimation > 0) {
                // Flash red for first half, then fade
                if (anim.damageAnimation > DAMAGE_FLASH_CONSTANTS.DAMAGE_ANIMATION_THRESHOLD) {
                    // Strong red flash with glow (first half)
                    this.ctx.filter = `brightness(${DAMAGE_FLASH_CONSTANTS.DAMAGE_BRIGHTNESS_STRONG}) saturate(${DAMAGE_FLASH_CONSTANTS.DAMAGE_SATURATION_STRONG}) hue-rotate(${DAMAGE_FLASH_CONSTANTS.DAMAGE_HUE_ROTATION}) drop-shadow(0 0 ${DAMAGE_FLASH_CONSTANTS.DAMAGE_SHADOW_BLUR_LARGE} red) drop-shadow(0 0 ${DAMAGE_FLASH_CONSTANTS.DAMAGE_SHADOW_BLUR_MEDIUM} red)`;
                } else {
                    // Dimmer red glow as it fades (second half)
                    this.ctx.filter = `brightness(${DAMAGE_FLASH_CONSTANTS.DAMAGE_BRIGHTNESS_WEAK}) saturate(1.5) hue-rotate(${DAMAGE_FLASH_CONSTANTS.DAMAGE_HUE_ROTATION}) drop-shadow(0 0 ${DAMAGE_FLASH_CONSTANTS.DAMAGE_SHADOW_BLUR_SMALL} red)`;
                }
            }

            if (anim.backflipAngle && anim.backflipAngle !== 0) {
                const cx = pixelXBase + TILE_SIZE / 2;
                const cy = pixelYBase + TILE_SIZE / 2;
                this.ctx.translate(cx, cy);
                this.ctx.rotate(anim.backflipAngle);
                this.ctx.drawImage(playerImage, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
            } else {
                this.ctx.drawImage(playerImage, pixelXBase, pixelYBase, TILE_SIZE, TILE_SIZE);
            }

            this.ctx.filter = 'none';
            this.ctx.globalAlpha = 1.0;
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = '#ff4444';
            if (anim.backflipAngle && anim.backflipAngle !== 0) {
                this.ctx.save();
                const cx = pixelXBase + TILE_SIZE / 2;
                const cy = pixelYBase + TILE_SIZE / 2;
                this.ctx.translate(cx, cy);
                this.ctx.rotate(anim.backflipAngle);
                this.ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                this.ctx.restore();
            } else {
                this.ctx.fillRect(pixelXBase + 2, pixelYBase + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }
        }
        // Draw bow shot animation if present on player.animations
        const bowAnim = player.animations.bowShot;
        if (bowAnim && bowAnim.frames > 0) {
            const bowImage = this.textureManager.getImage('bow');
            const progress = 1 - (bowAnim.frames / bowAnim.totalFrames);
            // Stronger scale and a quick outward/back motion
            const power = bowAnim.power || 1.2;
            const scale = 0.6 * power; // base 60% of tile, multiplied by power
            const floatOffset = Math.sin(progress * Math.PI) * PHYSICS_CONSTANTS.BOW_SHOT_FLOAT_AMPLITUDE;
            const rotateAngle = -Math.PI / 2; // -90deg counter-clockwise

            this.ctx.save();
            // translate to center of player sprite, then apply float and extra upward offset
            const centerX = pixelXBase + TILE_SIZE / 2;
            const centerY = pixelYBase + TILE_SIZE / 2 + floatOffset - 6;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(rotateAngle);

            const bw = (bowImage?.width || TILE_SIZE) * scale;
            const bh = (bowImage?.height || TILE_SIZE) * scale;

            // Slight pulsing based on progress
            const pulse = 1 + Math.sin(progress * Math.PI * 2) * PHYSICS_CONSTANTS.BOW_PULSE_AMPLITUDE * (power - 1);

            if (bowImage && bowImage.complete) {
                this.ctx.drawImage(bowImage, -bw / 2 * pulse, -bh / 2 * pulse, bw * pulse, bh * pulse);
            } else {
                // Fallback: draw a rotated rectangle to represent the bow
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(-TILE_SIZE * SCALE_CONSTANTS.BOW_DRAW_WIDTH, -TILE_SIZE * SCALE_CONSTANTS.BOW_DRAW_HEIGHT_TOP, TILE_SIZE * SCALE_CONSTANTS.BOW_DRAW_WIDTH_BOTTOM, TILE_SIZE * SCALE_CONSTANTS.BOW_DRAW_HEIGHT_BOTTOM);
            }
            this.ctx.restore();

            // decrement frames here as a safeguard (animations update should normally handle this)
            // but only if update() isn't called elsewhere synchronously
            // player.animations.bowShot.frames = Math.max(0, player.animations.bowShot.frames - 0);
        }

        // Draw pickup hover (icon floating above player's head)
        const pickup = player.animations.pickupHover;
        if (pickup && pickup.imageKey) {
            const img = this.textureManager.getImage(pickup.imageKey);
            // Compute progress 0..1 where 0 is start, 1 is end
            const progress = 1 - (pickup.frames / pickup.totalFrames);
            // Vertical float: start near top of head and move up a bit.
            // Use a slower, gentler float so the player has time to read the icon.
            const floatY = PHYSICS_CONSTANTS.PICKUP_HOVER_BASE_HEIGHT - (Math.sin(progress * Math.PI * 0.6) * PHYSICS_CONSTANTS.PICKUP_HOVER_AMPLITUDE);
            // Slower fade so the pickup stays visible longer
            const alpha = Math.max(0, 1 - progress * 0.9);

            this.ctx.save();
            this.ctx.globalAlpha = alpha;

            // Use pixel-preserving scaling. For bow, match ItemTileRenderer's approach (scale by max dimension)
            // Make pickup icons larger so they are easier to read.
            const maxSize = TILE_SIZE * SCALE_CONSTANTS.PLAYER_ITEM_MAX_SIZE_SCALE;
            let drawW = Math.round(maxSize);
            let drawH = Math.round(maxSize);
            if (img && img.complete && typeof img.width === 'number' && typeof img.height === 'number') {
                if (pickup.imageKey === 'bow') {
                    // For bows, match ItemTileRenderer but make it slightly larger for the pickup hover
                    const maxDim = Math.max(img.width, img.height);
                    const scale = (TILE_SIZE * SCALE_CONSTANTS.PLAYER_BOW_SCALE) / maxDim;
                    drawW = Math.round(img.width * scale);
                    drawH = Math.round(img.height * scale);
                } else {
                    const dims = RendererUtils.calculateScaledDimensions(img, maxSize);
                    drawW = dims.width;
                    drawH = dims.height;
                }
            }

            const iconX = pixelXBase + (TILE_SIZE - drawW) / 2;
            const iconY = pixelYBase + floatY - drawH; // place above head

            if (img && img.complete) {
                if (pickup.imageKey === 'bow') {
                    // Rotate -90deg around the icon center and draw using scaled dimensions
                    this.ctx.save();
                    const cx = iconX + drawW / 2;
                    const cy = iconY + drawH / 2;
                    this.ctx.translate(cx, cy);
                    this.ctx.rotate(-Math.PI / 2);
                    this.ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                    this.ctx.restore();
                } else {
                    this.ctx.drawImage(img, iconX, iconY, drawW, drawH);
                }
            } else {
                // Fallback: draw a simple circle with letter
                this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
                this.ctx.beginPath();
                this.ctx.arc(iconX + drawW / 2, iconY + drawH / 2, Math.max(drawW, drawH) / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#000';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.font = `${Math.floor(Math.max(drawW, drawH) * 0.5)}px sans-serif`;
                const label = (pickup.type === 'food' ? '🍞' : (pickup.type ? pickup.type[0].toUpperCase() : '?'));
                this.ctx.fillText(label, iconX + drawW / 2, iconY + drawH / 2);
            }

            this.ctx.restore();
        }
    }

    drawExitIndicator() {
        // Draw visual indicator if player is on an exit tile
        const playerGridX = this.game.player.x;
        const playerGridY = this.game.player.y;
        const tileUnderPlayer = this.game.grid[playerGridY]?.[playerGridX];

        if (tileUnderPlayer === TILE_TYPES.EXIT || tileUnderPlayer === TILE_TYPES.PORT || (tileUnderPlayer && tileUnderPlayer.type === TILE_TYPES.PORT)) {
            const arrowImage = this.game.textureManager.getImage('ui/arrow');
            if (arrowImage && arrowImage.complete) {
                this.ctx.save();
                const pixelX = playerGridX * TILE_SIZE;
                const pixelY = playerGridY * TILE_SIZE;

                // Create subtle floating animation
                const time = Date.now() * PHYSICS_CONSTANTS.PORT_ANIMATION_TIME_SCALE;
                const floatOffset = Math.sin(time) * PHYSICS_CONSTANTS.PORT_ARROW_FLOAT_AMPLITUDE;

                // Translate to the center of the tile with floating offset
                this.ctx.translate(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2 + floatOffset);

                let rotationAngle = 0; // Default to North (arrow.png points up)

                // If the tile under the player is an object-style PORT with explicit portKind, respect it
                if (tileUnderPlayer && tileUnderPlayer.type === TILE_TYPES.PORT && tileUnderPlayer.portKind) {
                    if (tileUnderPlayer.portKind === 'stairdown') rotationAngle = Math.PI; // point down to indicate descend
                    else if (tileUnderPlayer.portKind === 'stairup') rotationAngle = 0; // point up to indicate ascend
                } else if (tileUnderPlayer === TILE_TYPES.PORT) {
                    const isCistern = MultiTileHandler.findCisternPosition(playerGridX, playerGridY, this.game.grid);
                    const isHole = !isCistern && !MultiTileHandler.findShackPosition(playerGridX, playerGridY, this.game.grid) && !MultiTileHandler.findHousePosition(playerGridX, playerGridY, this.game.grid);

                    if (isCistern || isHole) {
                        // For underground entrances (cisterns, holes), arrow points down to enter, and up to exit.
                        rotationAngle = this.game.player.currentZone.dimension === 0 ? Math.PI : 0;
                    } else {
                        // For interior structures (house, shack), arrow points up to enter, and down to exit.
                        rotationAngle = this.game.player.currentZone.dimension === 0 ? 0 : Math.PI;
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

                // Force interior indicator arrows to point down (interior dimension = 1)
                if (this.game.player.currentZone.dimension === 1) {
                    rotationAngle = Math.PI;
                }

                this.ctx.rotate(rotationAngle);

                // Set slight transparency
                this.ctx.globalAlpha = 0.8;

                // Draw the image, offset by half its size to center it after rotation, and slightly above the player (higher z-level)
                const arrowSize = TILE_SIZE * SCALE_CONSTANTS.ARROW_INDICATOR_SIZE_SCALE;
                this.ctx.drawImage(arrowImage, -arrowSize / 2, -arrowSize / 2 - TILE_SIZE / 2, arrowSize, arrowSize);

                this.ctx.restore();
            }
        }
    }

    drawPlayerSmokeAnimation() {
        this.game.player.animations.smokeAnimations.forEach(anim => {
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
