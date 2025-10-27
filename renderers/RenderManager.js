import { GRID_SIZE, TILE_SIZE, TILE_TYPES, CANVAS_SIZE, getZoneLevelFromDistance } from '../core/constants/index.js';
import { TextureManager } from './TextureManager.js';
import { PlayerRenderer } from './PlayerRenderer.js';
import { EnemyRenderer } from './EnemyRenderer.js';
import { AnimationRenderer } from './AnimationRenderer.js';
import { UIRenderer } from './UIRenderer.js';
import { FogRenderer } from './FogRenderer.js';
import GridIterator from '../utils/GridIterator.js';
import { isTileType } from '../utils/TileUtils.js';

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
    // If this is a hold feedback on an enemy, draw that enemy's attack range overlay
    if (tf.hold && this.game) {
        try {
            const enemy = this.game.enemyCollection?.findAt(tf.x, tf.y, true);
            if (enemy) {
                this.drawEnemyAttackRange(enemy);
            }
        } catch (e) {
            // ignore render-time errors for safety
        }
    }
    }

    // Draw an enemy's attack range as semi-transparent fills on tiles the enemy could
    // attempt to attack/charge to. This uses simplified rules mirroring the movement
    // calculators so it's cheap and deterministic for UI display only.
    drawEnemyAttackRange(enemy) {
        if (!enemy || !this.game || !this.game.grid) return;
        const grid = this.game.grid;
        const enemies = this.game.enemyCollection?.getAll() || [];
        const tiles = new Set();
        const push = (x, y) => { if (x >= 0 && y >= 0 && y < grid.length && x < grid[0].length) tiles.add(`${x},${y}`); };

        const stopRay = (x, y, dx, dy, orthogonalOnly = false) => {
            let cx = x + dx;
            let cy = y + dy;
            while (cx >= 0 && cy >= 0 && cy < grid.length && cx < grid[0].length) {
                // stop if tile is not walkable for charging/en-route
                if (!enemy.isWalkable(cx, cy, grid)) break;
                // stop if another enemy occupies the tile
                if (enemies.find(e => e.x === cx && e.y === cy && e.health > 0)) break;
                push(cx, cy);
                if (orthogonalOnly) {
                    cx += dx; cy += dy;
                    continue;
                }
                cx += dx; cy += dy;
            }
        };

        const ex = enemy.x, ey = enemy.y;
        switch (enemy.enemyType) {
            case 'lizardy': {
                // pawn-like: diagonal forward attacks based on movementDirection
                const dir = enemy.movementDirection === -1 ? -1 : 1;
                push(ex - 1, ey + dir);
                push(ex + 1, ey + dir);
                break;
            }
            case 'lizardeaux': {
                // orthogonal charge: rays N,S,E,W until blocked
                stopRay(ex, ey, 0, -1, true);
                stopRay(ex, ey, 0, 1, true);
                stopRay(ex, ey, -1, 0, true);
                stopRay(ex, ey, 1, 0, true);
                break;
            }
            case 'zard': {
                // diagonal bishop-like
                stopRay(ex, ey, -1, -1);
                stopRay(ex, ey, 1, -1);
                stopRay(ex, ey, -1, 1);
                stopRay(ex, ey, 1, 1);
                // include adjacent diagonals
                push(ex - 1, ey - 1); push(ex + 1, ey - 1); push(ex - 1, ey + 1); push(ex + 1, ey + 1);
                break;
            }
            case 'lazerd': {
                // queen-like: all 8 directions
                stopRay(ex, ey, 0, -1);
                stopRay(ex, ey, 0, 1);
                stopRay(ex, ey, -1, 0);
                stopRay(ex, ey, 1, 0);
                stopRay(ex, ey, -1, -1);
                stopRay(ex, ey, 1, -1);
                stopRay(ex, ey, -1, 1);
                stopRay(ex, ey, 1, 1);
                break;
            }
            case 'lizord': {
                // knight-like L moves: endpoints 2/1 offsets
                const ks = [ [2,1],[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2],[1,-2],[2,-1] ];
                ks.forEach(k => push(ex + k[0], ey + k[1]));
                break;
            }
            case 'lizardo':
            default: {
                // default: adjacent chebyshev (8 surrounding tiles)
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        push(ex + dx, ey + dy);
                    }
                }
                break;
            }
        }

        if (tiles.size === 0) return;

        // Draw the tiles overlay
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(200,40,40,0.18)';
        this.ctx.strokeStyle = 'rgba(200,40,40,0.85)';
        this.ctx.lineWidth = Math.max(1, Math.round(TILE_SIZE * 0.03));
        for (const t of tiles) {
            const [tx, ty] = t.split(',').map(n => parseInt(n, 10));
            // Don't draw the enemy's own tile (focus on targets)
            if (tx === ex && ty === ey) continue;
            this.ctx.fillRect(tx * TILE_SIZE + 1, ty * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            this.ctx.strokeRect(tx * TILE_SIZE + 1.5, ty * TILE_SIZE + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
        }
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

    // Draw multiplier animations (combo x2/x3/etc.)
    this.animationRenderer.drawMultiplierAnimations();

        // Draw charge confirmation indicator if active
        this.uiRenderer.drawChargeConfirmationIndicator();

        // --- Apply overlays and atmospheric effects last ---
    const currentZone = this.game.player.getCurrentZone();
    // Coerce to number so comparisons work even if a dimension value was
    // deserialized as a string in saved state. Treat only numeric 2 as
    // underground.
    if (Number(currentZone.dimension) === 2) {
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
            zoneLevel = getZoneLevelFromDistance(dist);
        }

        GridIterator.forEach(this.game.grid, (tile, x, y) => {
            try {
                // Handle bomb tiles specially
                if (isTileType(tile, TILE_TYPES.BOMB)) {
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
        });
    }


}
