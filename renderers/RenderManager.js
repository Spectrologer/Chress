import { GRID_SIZE, TILE_SIZE, TILE_TYPES, CANVAS_SIZE } from '../core/constants.js';
import { TextureManager } from './TextureManager.js';
import { PlayerRenderer } from './PlayerRenderer.js';
import { EnemyRenderer } from './EnemyRenderer.js';
import { AnimationRenderer } from './AnimationRenderer.js';
import { UIRenderer } from './UIRenderer.js';
import { FogRenderer } from './FogRenderer.js';

export class RenderManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;

    // Tap feedback state: { x, y, startTime, duration, hold }
    // If hold === true the feedback persists until cleared by clearFeedback()
    this.tapFeedback = null;

        // Initialize sub-renderers
        this.playerRenderer = new PlayerRenderer(game);
        this.enemyRenderer = new EnemyRenderer(game);
        this.animationRenderer = new AnimationRenderer(game);
        this.uiRenderer = new UIRenderer(game);
        this.fogRenderer = new FogRenderer(game);

        // Disable image smoothing for crisp pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false; // For Chrome, Safari
        this.ctx.mozImageSmoothingEnabled = false;    // For Firefox
        this.ctx.msImageSmoothingEnabled = false;     // For IE
    }

    // Show a transient tap feedback at grid coordinates (tileX, tileY).
    // durationMs controls how long the effect lasts (default 200ms).
    showTapFeedback(tileX, tileY, durationMs = 200) {
        this.tapFeedback = {
            x: tileX,
            y: tileY,
            startTime: Date.now(),
            duration: durationMs
        };
    }

    // Start a persistent hold feedback that stays until clearFeedback() is called
    startHoldFeedback(tileX, tileY) {
        this.tapFeedback = {
            x: tileX,
            y: tileY,
            startTime: Date.now(),
            duration: Infinity,
            hold: true
        };
    }

    // Clear any active feedback immediately
    clearFeedback() {
        this.tapFeedback = null;
    }

    _drawTapFeedback() {
        if (!this.tapFeedback) return;
        const tf = this.tapFeedback;
        const elapsed = Date.now() - tf.startTime;

        // If not a hold and elapsed exceeds duration, clear
        if (!tf.hold && elapsed > tf.duration) {
            this.tapFeedback = null;
            return;
        }

        // Compute alpha and inset. For hold, use a steady subtle value; for transient, fade out
        const maxAlpha = 0.45;
        let alpha = maxAlpha;
        let inset = Math.round((TILE_SIZE || 64) * 0.06);

        if (!tf.hold) {
            const progress = Math.max(0, Math.min(1, elapsed / tf.duration)); // 0 -> 1
            alpha = maxAlpha * (1 - progress);
            inset = Math.round((TILE_SIZE || 64) * 0.06 * (1 - progress));
        }

    const px = tf.x * TILE_SIZE + inset;
    const py = tf.y * TILE_SIZE + inset;
    const size = TILE_SIZE - inset * 2;

    // Subtle inner fill to indicate selection (very low alpha)
    this.ctx.save();
    this.ctx.fillStyle = `rgba(255,255,255,${Math.min(0.06, alpha * 0.15)})`;
    this.ctx.fillRect(px, py, size, size);

    // Marching ants outline: draw a black dashed stroke and then a thinner white dashed stroke
    const dashLen = Math.max(4, Math.round(TILE_SIZE * 0.09));
    const animMs = 800; // period for one cycle
    const anim = (Date.now() % animMs) / animMs; // 0..1
    const offset = anim * (dashLen * 2);

    // Outer dark stroke
    this.ctx.lineWidth = Math.max(2, Math.round(TILE_SIZE * 0.04));
    this.ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    this.ctx.setLineDash([dashLen, dashLen]);
    this.ctx.lineDashOffset = -offset;
    this.ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

    // Inner light stroke (offset so dashes alternate)
    this.ctx.lineWidth = Math.max(1, Math.round(TILE_SIZE * 0.02));
    this.ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    this.ctx.lineDashOffset = -offset - dashLen;
    this.ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

    // Reset dash
    this.ctx.setLineDash([]);
    this.ctx.restore();
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw transient tap feedback if active
        this._drawTapFeedback();

        // Draw enemies (sprites and animations)
        this.enemyRenderer.drawEnemies();

        // Draw enemy smoke animations
        this.enemyRenderer.drawEnemySmokeAnimation();

        // Draw player (sprite, smoke, exit indicators)
        this.playerRenderer.drawPlayer();

        // Draw bomb placement indicator if active
        this.uiRenderer.drawBombPlacementIndicator();

        // Draw splode animation
        this.animationRenderer.drawSplodeAnimation();

        // Draw horse charge animation
        this.animationRenderer.drawHorseChargeAnimation();

        // Draw arrow animations
        this.animationRenderer.drawArrowAnimations();

        // Draw point animations
        this.animationRenderer.drawPointAnimations();

        // Draw charge confirmation indicator if active
        this.uiRenderer.drawChargeConfirmationIndicator();

        // --- Apply overlays and atmospheric effects last ---
        const currentZone = this.game.player.getCurrentZone();
        if (currentZone.dimension === 2) {
            // 1. Draw the dark overlay on top of everything drawn so far
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'; // 65% black overlay
            this.ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
            this.ctx.restore();

            // 2. Draw the fog on top of the dark overlay
            this.fogRenderer.updateAndDrawFog();
        }
    }

    drawGrid() {
        if (!this.game.grid) {
            return;
        }

        // Calculate zone level for texture rendering
        const zone = this.game.player.getCurrentZone();
        let zoneLevel;
        if (zone.dimension === 2) {
            zoneLevel = 6; // Underground zones
        } else if (zone.dimension === 1) {
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
                    // Handle bomb tiles specially
                    if (tile === TILE_TYPES.BOMB) {
                        // Primitive bomb (randomly generated) - render normally
                        this.textureManager.renderTile(this.ctx, x, y, tile, this.game.grid, zoneLevel);
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


}
