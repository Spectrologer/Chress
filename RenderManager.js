import { GRID_SIZE, TILE_SIZE, TILE_TYPES, CANVAS_SIZE } from './constants.js';
import { TextureManager } from './TextureManager.js';

export class RenderManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;

        // Disable image smoothing for crisp pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false; // For Chrome, Safari
        this.ctx.mozImageSmoothingEnabled = false;    // For Firefox
        this.ctx.msImageSmoothingEnabled = false;     // For IE
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

        // Draw bomb placement indicator if active
        this.drawBombPlacementIndicator();

        // Draw splode animation
        this.drawSplodeAnimation();

        // Draw horse charge animation
        this.drawHorseChargeAnimation();

        // Draw point animations
        this.drawPointAnimations();

        // Draw charge confirmation indicator if active
        this.drawChargeConfirmationIndicator();
    }

    drawGrid() {
        if (!this.game.grid) {
            return;
        }

        // Calculate zone level for texture rendering
        const zone = this.game.player.getCurrentZone();
        let zoneLevel;
        if (zone.dimension === 1) {
            zoneLevel = 5; // Interior zones
        } else {
            const dist = Math.max(Math.abs(zone.x), Math.abs(zone.y));
            if (dist <= 2) zoneLevel = 1;
            else if (dist <= 8) zoneLevel = 2;
            else if (dist <= 16) zoneLevel = 3;
            else zoneLevel = 4;
        }

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = this.game.grid[y][x];
                try {
                    if (tile && typeof tile === 'object' && tile.type === 'BOMB') {
                        // Render pulsating bomb
                        // First draw the background (floor)
                        this.textureManager.renderTile(this.ctx, x, y, TILE_TYPES.FLOOR, this.game.grid, zoneLevel);
                        const bombImage = this.game.textureManager.getImage('bomb');
                        if (bombImage && bombImage.complete) {
                            this.ctx.save();
                            const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1; // Pulsate
                            const cx = x * TILE_SIZE + TILE_SIZE / 2;
                            const cy = y * TILE_SIZE + TILE_SIZE / 2;
                            this.ctx.translate(cx, cy);
                            this.ctx.scale(scale, scale);
                            this.ctx.translate(-TILE_SIZE / 2, -TILE_SIZE / 2);
                            this.ctx.drawImage(bombImage, 0, 0, TILE_SIZE, TILE_SIZE);
                            this.ctx.restore();
                        } else {
                            this.ctx.fillStyle = '#444444';
                            this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        }
                    } else if (tile && tile.type === 'food') {
                        this.textureManager.renderTile(this.ctx, x, y, tile.type, this.game.grid, zoneLevel);
                    } else {
                        this.textureManager.renderTile(this.ctx, x, y, tile, this.game.grid, zoneLevel);
                    }
                } catch (error) {
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

        // Draw smoke animation if active
        this.drawSmokeAnimation();

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

    drawSplodeAnimation() {
        this.game.player.splodeAnimations.forEach(anim => {
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
            } else {
                // Fallback
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

    // drawEnemyMovementArrows() {
    //     // Temporarily bypass toggle for debugging - always show arrows
    //     // if (!this.game.showEnemyAttackRanges) {
    //     //     return;
    //     // }

    //     const indicatorImage = this.game.textureManager.getImage('ui/indicator');
    //     if (!indicatorImage || !indicatorImage.complete) {
    //         return; // Skip drawing if image not loaded
    //     }

    //     this.ctx.save();
    //     this.ctx.globalAlpha = 0.8;

    //     const enemy = this.game.selectedEnemy;
    //     const directions = enemy.getMovementDirections();
    //     const enemyPixelX = enemy.x * TILE_SIZE;
    //     const enemyPixelY = enemy.y * TILE_SIZE;

    //     for (const dir of directions) {
    //         const targetX = enemy.x + dir.x;
    //         const targetY = enemy.y + dir.y;

    //         // Check if target position is walkable (basic check)
    //         if (targetX >= 0 && targetX < GRID_SIZE && targetY >= 0 && targetY < GRID_SIZE &&
    //             enemy.isWalkable(targetX, targetY, this.game.grid)) {

    //             // Calculate rotation based on direction (indicator.png points down by default)
    //             let rotation = 0;
    //             if (dir.x === 0 && dir.y === -1) rotation = Math.PI; // Up (180 deg)
    //             else if (dir.x === 0 && dir.y === 1) rotation = 0; // Down (0 deg)
    //             else if (dir.x === -1 && dir.y === 0) rotation = Math.PI / 2; // Left (90 deg)
    //             else if (dir.x === 1 && dir.y === 0) rotation = -Math.PI / 2; // Right (270 deg)
    //             else if (dir.x === -1 && dir.y === -1) rotation = 3 * Math.PI / 4; // Northwest (135 deg)
    //             else if (dir.x === 1 && dir.y === -1) rotation = 5 * Math.PI / 4; // Northeast (225 deg)
    //             else if (dir.x === -1 && dir.y === 1) rotation = Math.PI / 4; // Southwest (45 deg)
    //             else if (dir.x === 1 && dir.y === 1) rotation = -Math.PI / 4; // Southeast (315 deg)

    //             // Draw arrows more prominently for debugging - closer to enemy center and larger
    //             let drawX = enemyPixelX + TILE_SIZE / 2;
    //             let drawY = enemyPixelY + TILE_SIZE / 2;

    //             if (enemy.enemyType === 'zard') {
    //                 // Animate zard arrows moving distance along diagonals
    //                 const time = Date.now() * 0.003; // Animation time
    //                 const distance = Math.sin(time + enemy.id) * 8 + 12; // Oscillate distance
    //                 drawX += dir.x * distance;
    //                 drawY += dir.y * distance;
    //             } else {
    //                 // Static arrows for other enemies, right at the edge of the enemy tile
    //                 drawX += dir.x * 24;  // Increased from 16 to 24 for better visibility
    //                 drawY += dir.y * 24;  // Increased from 16 to 24 for better visibility
    //             }

    //             this.ctx.save();
    //             this.ctx.translate(drawX, drawY);
    //             this.ctx.rotate(rotation);

    //             // Draw the arrow larger for better visibility
    //             this.ctx.drawImage(
    //                 indicatorImage,
    //                 -10, -10, // Center the larger 20x20 image
    //                 20, 20
    //             );

    //             this.ctx.restore();
    //         }
    //     }

    //     this.ctx.restore();
    // }

    drawSmokeAnimation() {
        const drawSmokeForEntity = (smokeAnimations) => {
            smokeAnimations.forEach(anim => {
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
        };

        // Draw player smoke
        drawSmokeForEntity(this.game.player.smokeAnimations);

        // Draw enemy smoke
        for (const enemy of this.game.enemies) {
            drawSmokeForEntity(enemy.smokeAnimations);
        }
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

    drawHorseChargeAnimation() {
        if (this.game.horseChargeAnimations.length === 0) {
            return;
        }

        this.ctx.save();
        this.ctx.lineWidth = 6; // A thick, impactful line

        this.game.horseChargeAnimations.forEach(anim => {
            const progress = anim.frame / 20; // Based on 20-frame duration
            const alpha = progress; // Fade out as the animation progresses

            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`; // White, slightly transparent
            this.ctx.shadowColor = `rgba(75, 0, 130, ${alpha})`; // Indigo glow
            this.ctx.shadowBlur = 15;

            // Get pixel coordinates for the center of each tile
            const startX = anim.startPos.x * TILE_SIZE + TILE_SIZE / 2;
            const startY = anim.startPos.y * TILE_SIZE + TILE_SIZE / 2;
            const midX = anim.midPos.x * TILE_SIZE + TILE_SIZE / 2;
            const midY = anim.midPos.y * TILE_SIZE + TILE_SIZE / 2;
            const endX = anim.endPos.x * TILE_SIZE + TILE_SIZE / 2;
            const endY = anim.endPos.y * TILE_SIZE + TILE_SIZE / 2;

            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(midX, midY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        });

        this.ctx.restore();
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

    drawPointAnimations() {
        if (this.game.pointAnimations.length === 0) {
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

        for (const anim of this.game.pointAnimations) {
            const progress = 1 - (anim.frame / 30); // 0 to 1
            const alpha = 1 - progress; // Fade out
            const floatOffset = -progress * TILE_SIZE; // Float up by one tile height

            this.ctx.globalAlpha = alpha;

            const startPixelX = anim.x * TILE_SIZE;
            const pixelY = anim.startY + floatOffset;
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
