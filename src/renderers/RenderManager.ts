import { GRID_SIZE, TILE_SIZE, TILE_TYPES, CANVAS_SIZE, getZoneLevelFromDistance } from '@core/constants/index';
import { COLOR_CONSTANTS, STROKE_CONSTANTS } from '@core/constants/rendering';
import type { TextureManager } from './TextureManager';
import { PlayerRenderer } from './PlayerRenderer';
import { EnemyRenderer } from './EnemyRenderer';
import { AnimationRenderer } from './AnimationRenderer';
import { UIRenderer } from './UIRenderer';
import { FogRenderer } from './FogRenderer';
import GridIterator from '@utils/GridIterator';
import { isTileType } from '@utils/TileUtils';
import { logger } from '@core/logger';
import type { TapFeedback } from './types';
import type { IGame } from '@core/context';
import type { Grid, Tile } from '@core/SharedTypes';
import { MultiTileHandler } from './MultiTileHandler';

interface Zone {
    x: number;
    y: number;
    dimension: number;
}

interface Player {
    x: number;
    y: number;
    getCurrentZone(): Zone;
}

interface Enemy {
    x: number;
    y: number;
    health: number;
    enemyType: string;
    movementDirection?: number;
    isWalkable(x: number, y: number, grid: Grid): boolean;
}

interface EnemyCollection {
    findAt(x: number, y: number, includeCoords: boolean): Enemy | null;
    getAll(): Enemy[];
}

interface GridManager {
    getTile(x: number, y: number): Tile;
    getSize(): number;
}

interface ZoneGenerator {
    terrainTextures?: Record<string, string>;
    overlayTextures?: Record<string, string>;
    rotations?: Record<string, number>;
    overlayRotations?: Record<string, number>;
}

interface NPCRenderer {
    drawNPCs(): void;
}

export class RenderManager {
    private game: IGame;
    /** @internal Canvas rendering context (public for testing) */
    public ctx: CanvasRenderingContext2D;
    private textureManager: TextureManager;
    private tapFeedback: TapFeedback | null = null;
    private playerRenderer: PlayerRenderer;
    private enemyRenderer: EnemyRenderer;
    private animationRenderer: AnimationRenderer;
    private uiRenderer: UIRenderer;
    private fogRenderer: FogRenderer;
    private _missingTextureLogged?: boolean;

    constructor(game: IGame) {
        this.game = game;
        this.ctx = game.ctx!;
        this.textureManager = game.textureManager!;

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
        // Browser-specific properties for older browsers
        const ctx = this.ctx as CanvasRenderingContext2D & {
            webkitImageSmoothingEnabled?: boolean;
            mozImageSmoothingEnabled?: boolean;
            msImageSmoothingEnabled?: boolean;
        };
        ctx.webkitImageSmoothingEnabled = false; // For Chrome, Safari
        ctx.mozImageSmoothingEnabled = false;    // For Firefox
        ctx.msImageSmoothingEnabled = false;     // For IE
    }

    // Show a transient tap feedback at grid coordinates (tileX, tileY).
    // durationMs controls how long the effect lasts (default 200ms).
    showTapFeedback(tileX: number, tileY: number, durationMs = 200): void {
        this.tapFeedback = {
            x: tileX,
            y: tileY,
            startTime: Date.now(),
            duration: durationMs
        };
    }

    // Start a persistent hold feedback that stays until clearFeedback() is called
    startHoldFeedback(tileX: number, tileY: number): void {
        this.tapFeedback = {
            x: tileX,
            y: tileY,
            startTime: Date.now(),
            duration: Infinity,
            hold: true
        };
    }

    // Clear any active feedback immediately
    clearFeedback(): void {
        this.tapFeedback = null;
    }

    private _drawTapFeedback(): void {
        if (!this.tapFeedback) return;
        const tf = this.tapFeedback;
        const elapsed = Date.now() - tf.startTime;

        // If not a hold and elapsed exceeds duration, clear
        if (!tf.hold && elapsed > tf.duration) {
            this.tapFeedback = null;
            return;
        }

        // Compute alpha and inset. For hold, use a steady subtle value; for transient, fade out
        const maxAlpha = COLOR_CONSTANTS.TAP_FEEDBACK_MAX_ALPHA;
        let alpha = maxAlpha;
        let inset = Math.round((TILE_SIZE || 64) * COLOR_CONSTANTS.TAP_FEEDBACK_INSET_RATIO);

        if (!tf.hold) {
            const progress = Math.max(0, Math.min(1, elapsed / tf.duration)); // 0 -> 1
            alpha = maxAlpha * (1 - progress);
            inset = Math.round((TILE_SIZE || 64) * COLOR_CONSTANTS.TAP_FEEDBACK_INSET_RATIO * (1 - progress));
        }

        const px = tf.x * TILE_SIZE + inset;
        const py = tf.y * TILE_SIZE + inset;
        const size = TILE_SIZE - inset * 2;

        // Subtle inner fill to indicate selection (very low alpha)
        this.ctx.save();
        this.ctx.fillStyle = `rgba(255,255,255,${Math.min(COLOR_CONSTANTS.TAP_FEEDBACK_FILL_ALPHA_MAX, alpha * COLOR_CONSTANTS.TAP_FEEDBACK_FILL_ALPHA_MULTIPLIER)})`;
        this.ctx.fillRect(px, py, size, size);

        // Marching ants outline: draw a black dashed stroke and then a thinner white dashed stroke
        const dashLen = Math.max(4, Math.round(TILE_SIZE * STROKE_CONSTANTS.DASH_LENGTH_RATIO));
        const animMs = STROKE_CONSTANTS.DASH_ANIMATION_DURATION; // period for one cycle
        const anim = (Date.now() % animMs) / animMs; // 0..1
        const offset = anim * (dashLen * 2);

        // Outer dark stroke
        this.ctx.lineWidth = Math.max(2, Math.round(TILE_SIZE * STROKE_CONSTANTS.ZONE_BORDER_STROKE_RATIO));
        this.ctx.strokeStyle = `rgba(0,0,0,${COLOR_CONSTANTS.OUTER_STROKE_ALPHA})`;
        this.ctx.setLineDash([dashLen, dashLen]);
        this.ctx.lineDashOffset = -offset;
        this.ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

        // Inner light stroke (offset so dashes alternate)
        this.ctx.lineWidth = Math.max(1, Math.round(TILE_SIZE * STROKE_CONSTANTS.ZONE_EXIT_STROKE_RATIO));
        this.ctx.strokeStyle = `rgba(255,255,255,${COLOR_CONSTANTS.INNER_STROKE_ALPHA})`;
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

    /**
     * Draw valid move indicators for the selected unit in chess mode
     */
    private _drawValidMoves(): void {
        if (!this.game.selectedUnit || !this.game.grid) return;

        const unit = this.game.selectedUnit;
        const moves = this._getValidMovesForSelectedUnit();

        this.ctx.save();
        for (const move of moves) {
            const px = move.x * TILE_SIZE;
            const py = move.y * TILE_SIZE;

            // Semi-transparent green overlay for valid moves
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            // Border
            this.ctx.strokeStyle = 'rgba(0, 200, 0, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
        this.ctx.restore();
    }

    /**
     * Get valid moves for the selected unit (calls InputCoordinator's method)
     */
    private _getValidMovesForSelectedUnit(): Array<{ x: number; y: number }> {
        if (!this.game.selectedUnit || !this.game.inputManager) return [];

        // Delegate to InputCoordinator which has the full movement logic
        const coordinator = (this.game.inputManager as any).controller?.coordinator;
        if (coordinator && coordinator._getValidMovesForUnit) {
            return coordinator._getValidMovesForUnit(this.game.selectedUnit);
        }

        // Fallback: just show adjacent tiles
        const unit = this.game.selectedUnit;
        const moves: Array<{ x: number; y: number }> = [];
        const { x, y } = unit;

        moves.push({ x: x + 1, y });
        moves.push({ x: x - 1, y });
        moves.push({ x, y: y + 1 });
        moves.push({ x, y: y - 1 });
        moves.push({ x: x + 1, y: y + 1 });
        moves.push({ x: x + 1, y: y - 1 });
        moves.push({ x: x - 1, y: y + 1 });
        moves.push({ x: x - 1, y: y - 1 });

        return moves.filter(move => {
            if (!this.game.grid || move.y < 0 || move.y >= this.game.grid.length) return false;
            if (move.x < 0 || move.x >= this.game.grid[0].length) return false;

            const tile = this.game.grid[move.y][move.x];
            const tileType = typeof tile === 'object' && tile !== null && 'type' in tile
                ? (tile as any).type
                : tile;

            if (tileType === TILE_TYPES.WALL) return false;

            const occupyingEnemy = this.game.enemyCollection?.findAt(move.x, move.y, true);
            if (occupyingEnemy && occupyingEnemy.team === unit.team) return false;

            return true;
        });
    }

    // Draw an enemy's attack range as semi-transparent fills on tiles the enemy could
    // attempt to attack/charge to. This uses simplified rules mirroring the movement
    // calculators so it's cheap and deterministic for UI display only.
    drawEnemyAttackRange(enemy: Enemy): void {
        if (!enemy || !this.game || !this.game.grid) return;
        const grid = this.game.grid;
        const enemies = this.game.enemyCollection?.getAll() || [];
        // Reuse a single array to avoid Set allocation and string concatenation
        const tiles: number[] = [];
        const push = (x: number, y: number) => {
            if (x >= 0 && y >= 0 && y < grid.length && x < grid[0]!.length) {
                tiles.push(x, y); // Store x,y pairs sequentially
            }
        };

        const stopRay = (x: number, y: number, dx: number, dy: number, orthogonalOnly = false) => {
            let cx = x + dx;
            let cy = y + dy;
            while (cx >= 0 && cy >= 0 && cy < grid.length && cx < grid[0]!.length) {
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

        if (tiles.length === 0) return;

        // Draw the tiles overlay
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(200,40,40,0.18)';
        this.ctx.strokeStyle = 'rgba(200,40,40,0.85)';
        this.ctx.lineWidth = Math.max(1, Math.round(TILE_SIZE * 0.03));
        for (let i = 0; i < tiles.length; i += 2) {
            const tx = tiles[i];
            const ty = tiles[i + 1];
            // Don't draw the enemy's own tile (focus on targets)
            if (tx === ex && ty === ey) continue;
            this.ctx.fillRect(tx * TILE_SIZE + 1, ty * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            this.ctx.strokeRect(tx * TILE_SIZE + 1.5, ty * TILE_SIZE + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
        }
        this.ctx.restore();
    }

    render(): void {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.game.canvas!.width, this.game.canvas!.height);

        // Draw grid
        this.drawGrid();

        // Draw chess mode valid moves
        if (this.game.chessMode && this.game.selectedUnit) {
            this._drawValidMoves();
        }

        // Draw transient tap feedback if active
        this._drawTapFeedback();

        // Draw enemies (sprites and animations)
        this.enemyRenderer.drawEnemies();

        // Draw enemy smoke animations
        this.enemyRenderer.drawEnemySmokeAnimation();

        // Draw NPCs (sprites with animations)
        const gameWithNPC = this.game as IGame & { npcRenderer?: NPCRenderer };
        if (gameWithNPC.npcRenderer) {
            gameWithNPC.npcRenderer.drawNPCs();
        }

        // Draw foreground floor tiles (before player so player appears on top of floors)
        this.drawForegroundFloors();

        // Draw player (sprite, smoke, exit indicators) - hide in chess mode
        if (!this.game.chessMode) {
            this.playerRenderer.drawPlayer();
        }

        // Draw foreground parts of multi-tile structures (after player for depth effect)
        this.drawForegroundFeatures();

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
        const currentZone = this.game.playerFacade!.getCurrentZone();
        // Coerce to number so comparisons work even if a dimension value was
        // deserialized as a string in saved state. Treat only numeric 2 as
        // underground.
        if (Number(currentZone.dimension) === 2) {
            // 1. Draw the dark overlay on top of everything drawn so far
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.50)'; // 50% black overlay (balanced brightness)
            this.ctx.fillRect(0, 0, this.game.canvas!.width, this.game.canvas!.height);
            this.ctx.restore();

            // 2. Draw the fog on top of the dark overlay
            this.fogRenderer.updateAndDrawFog();
        }

        // Draw darkened exterior border overlay (after all other rendering)
        // TEMPORARILY DISABLED
        // this.drawExteriorBorderOverlay();
    }

    drawGrid(): void {
        if (!this.game.grid) {
            logger.warn('[RenderManager] drawGrid called but grid is null');
            return;
        }

        // Clear foreground structures, features, and floors from previous frame
        this._foregroundStructures = [];
        this._foregroundFeatures = [];
        this._foregroundFloors = [];

        // Calculate zone level for texture rendering
        const zone = this.game.playerFacade!.getCurrentZone();
        let zoneLevel: number;
        if (zone.dimension === 2) {
            zoneLevel = 6; // Underground zones
        } else if (zone.dimension === 1) {
            zoneLevel = 5; // Interior zones
        } else {
            const dist = Math.max(Math.abs(zone.x), Math.abs(zone.y));
            zoneLevel = getZoneLevelFromDistance(dist);
        }

        // Get terrain textures, overlay textures, rotations, and overlay rotations from zone generator
        const terrainTextures = this.game.zoneGenerator?.terrainTextures || {};
        const overlayTextures = this.game.zoneGenerator?.overlayTextures || {};
        const rotations = this.game.zoneGenerator?.rotations || {};
        const overlayRotations = this.game.zoneGenerator?.overlayRotations || {};

        // Set current zone on renderer for checkerboard overlay logic
        if (this.textureManager.renderer) {
            this.textureManager.renderer.currentZone = zone;
        }

        // Three-pass rendering to ensure proper layering:
        // Pass 1: Render terrain only (floors and walls)
        GridIterator.forEach(this.game.grid, (tile: Tile, x: number, y: number) => {
            try {
                const coord = `${x},${y}`;
                const hasTerrainTexture = terrainTextures[coord] !== undefined;

                // Render terrain in this pass if:
                // 1. The tile is a floor or wall type, OR
                // 2. There's a custom terrain texture defined for this position (even if it has a feature)
                if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.WALL || hasTerrainTexture) {
                    // If there's a terrain texture, render floor type so the texture gets applied
                    const tileToRender = hasTerrainTexture ? TILE_TYPES.FLOOR : tile;
                    this.textureManager.renderTile(this.ctx, x, y, tileToRender, this.game.gridManager, zoneLevel, terrainTextures, rotations);
                }
            } catch (error) {
                // Fallback rendering
                this.ctx.fillStyle = '#ffe478';
                this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        });

        // Pass 2: Render overlay textures (trim, etc.) on top of terrain but below features
        // Track which overlay coords are multi-tile structures to skip in simple overlay pass
        const renderedOverlayCoords = new Set<string>();
        const multiTileOverlays = ['big_tree', 'deadtree', 'well', 'museum', 'shack'];

        // Mark multi-tile structure coords to skip them in the simple overlay pass
        for (const [coord, overlayTexture] of Object.entries(overlayTextures)) {
            if (multiTileOverlays.includes(overlayTexture)) {
                renderedOverlayCoords.add(coord);
            }
        }

        // Render simple overlay textures (trim, etc.) - skip multi-tile structures
        for (const [coord, overlayTexture] of Object.entries(overlayTextures)) {
            // Skip if this is a multi-tile structure (render those in Pass 4)
            if (renderedOverlayCoords.has(coord)) continue;

            const [x, y] = coord.split(',').map(Number);

            // For overlays, use the full path with environment/ prefix
            // e.g., "trim/bordertrim" becomes "environment/trim/bordertrim"
            const textureName = overlayTexture.includes('/')
                ? `environment/${overlayTexture}`
                : overlayTexture;
            const rotation = overlayRotations[coord] || 0;

            if (this.textureManager.renderer?.images && this.textureManager.renderer.images[textureName]) {
                const pixelX = x * TILE_SIZE;
                const pixelY = y * TILE_SIZE;

                this.ctx.save();
                if (rotation !== 0) {
                    const centerX = pixelX + TILE_SIZE / 2;
                    const centerY = pixelY + TILE_SIZE / 2;
                    this.ctx.translate(centerX, centerY);
                    this.ctx.rotate((rotation * Math.PI) / 180);
                    this.ctx.drawImage(this.textureManager.renderer!.images[textureName], -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
                } else {
                    this.ctx.drawImage(this.textureManager.renderer!.images[textureName], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                }
                this.ctx.restore();
            } else if (!this._missingTextureLogged) {
                logger.warn('[RenderManager] Missing overlay texture:', textureName, 'at', coord);
                logger.warn('[RenderManager] Available textures containing "border" or "trim":',
                    Object.keys(this.textureManager.renderer?.images || {}).filter(k => k.includes('border') || k.includes('trim')));
                this._missingTextureLogged = true;
            }
        }

        // Pass 3: Render features (statues, items, NPCs, etc.) on top of overlays
        GridIterator.forEach(this.game.grid, (tile: Tile, x: number, y: number) => {
            try {
                // Only render features in this pass (not terrain)
                if (tile && tile !== TILE_TYPES.FLOOR && tile !== TILE_TYPES.WALL) {
                    // Check if this is a MUSEUM tile that needs foreground rendering
                    if (isTileType(tile, TILE_TYPES.MUSEUM)) {
                        // Find the museum structure position
                        const museumPos = MultiTileHandler.findHousePosition(x, y, this.game.gridManager);
                        if (museumPos) {
                            const relativeY = y - museumPos.startY;
                            // Top row (y=0) needs foreground rendering (roof)
                            if (relativeY === 0) {
                                // Store for foreground rendering after player
                                this._foregroundFeatures.push({ x, y, tile });
                                return; // Skip rendering now, will render in foreground pass
                            }
                        }
                        // Bottom rows or no structure found - render normally
                        this.textureManager.renderTile(this.ctx, x, y, tile, this.game.gridManager, zoneLevel, terrainTextures, rotations);
                    } else if (isTileType(tile, TILE_TYPES.BOMB)) {
                        this.textureManager.renderTile(this.ctx, x, y, tile, this.game.gridManager, zoneLevel, terrainTextures, rotations);
                    } else if (typeof tile === 'object' && tile !== null && 'type' in tile && (tile as any).type === TILE_TYPES.FOOD) {
                        this.textureManager.renderTile(this.ctx, x, y, (tile as any).type, this.game.gridManager, zoneLevel, terrainTextures, rotations);
                    } else {
                        this.textureManager.renderTile(this.ctx, x, y, tile, this.game.gridManager, zoneLevel, terrainTextures, rotations);
                    }
                }
            } catch (error) {
                // Fallback rendering (skip for features to avoid double rendering)
            }
        });

        // Pass 4: Render multi-tile overlay structures on top of features
        // This allows structures like big_tree to overlay on top of other features
        const renderedStructureCoords = new Set<string>();

        // Structures that may have foreground rendering (rendered after player for depth effect)
        const foregroundStructureTypes = ['big_tree', 'museum'];

        for (const [coord, overlayTexture] of Object.entries(overlayTextures)) {
            // Only process multi-tile structures
            if (!multiTileOverlays.includes(overlayTexture)) continue;

            const [x, y] = coord.split(',').map(Number);

            // Skip if already rendered
            if (renderedStructureCoords.has(coord)) continue;

            // Convert overlay texture name to tile type
            const tileTypeMap: Record<string, number> = {
                'big_tree': TILE_TYPES.BIG_TREE,
                'deadtree': TILE_TYPES.DEADTREE,
                'well': TILE_TYPES.WELL,
                'museum': TILE_TYPES.HOUSE,
                'shack': TILE_TYPES.SHACK
            };

            const tileType = tileTypeMap[overlayTexture];
            if (!tileType) continue;

            // Create a temporary grid containing only this overlay structure's tiles
            const tempGrid: Tile[][] = [];
            for (let gy = 0; gy < GRID_SIZE; gy++) {
                tempGrid[gy] = [];
                for (let gx = 0; gx < GRID_SIZE; gx++) {
                    const coordKey = `${gx},${gy}`;
                    if (overlayTextures[coordKey] === overlayTexture) {
                        tempGrid[gy][gx] = tileType;
                    } else {
                        tempGrid[gy][gx] = TILE_TYPES.FLOOR;
                    }
                }
            }

            // Create a temporary grid manager
            const tempGridManager = {
                getTile: (gx: number, gy: number) => {
                    if (gy >= 0 && gy < tempGrid.length && gx >= 0 && gx < tempGrid[gy].length) {
                        return tempGrid[gy][gx];
                    }
                    return TILE_TYPES.FLOOR;
                },
                getSize: () => GRID_SIZE
            };

            // Find structure dimensions
            const structureSizes: Record<string, [number, number]> = {
                'big_tree': [2, 3],
                'deadtree': [2, 2],
                'well': [2, 2],
                'museum': [4, 3],
                'shack': [3, 3]
            };

            const [width, height] = structureSizes[overlayTexture] || [1, 1];

            // Find structure origin
            let originX = x, originY = y;
            let foundOrigin = false;
            for (let sy = Math.max(0, y - height + 1); sy <= y && !foundOrigin; sy++) {
                for (let sx = Math.max(0, x - width + 1); sx <= x && !foundOrigin; sx++) {
                    let isComplete = true;
                    for (let dy = 0; dy < height && isComplete; dy++) {
                        for (let dx = 0; dx < width && isComplete; dx++) {
                            const checkCoord = `${sx + dx},${sy + dy}`;
                            if (overlayTextures[checkCoord] !== overlayTexture) {
                                isComplete = false;
                            }
                        }
                    }
                    if (isComplete) {
                        originX = sx;
                        originY = sy;
                        foundOrigin = true;
                    }
                }
            }

            // Render the structure
            if (foundOrigin) {
                // Check if this structure type needs foreground rendering
                const needsForeground = foregroundStructureTypes.includes(overlayTexture);

                // If it needs foreground rendering, track it for later
                if (needsForeground) {
                    this._foregroundStructures.push({ coord, overlayTexture, originX, originY });
                }

                for (let dy = 0; dy < height; dy++) {
                    for (let dx = 0; dx < width; dx++) {
                        const tileX = originX + dx;
                        const tileY = originY + dy;

                        // If this structure needs foreground rendering, check if this specific tile should be skipped now
                        if (needsForeground && this.shouldRenderTileInForeground(overlayTexture, tileX, tileY, originX, originY)) {
                            // Skip rendering this tile now - it will be rendered in drawMultiTileForegrounds()
                            renderedStructureCoords.add(`${tileX},${tileY}`);
                            continue;
                        }

                        this.textureManager.renderTile(this.ctx, tileX, tileY, tileType, tempGridManager, zoneLevel, terrainTextures, rotations);
                        renderedStructureCoords.add(`${tileX},${tileY}`);
                    }
                }
            }
        }
    }

    // Draw a darkened border overlay on the exterior edge of the 8x8 playable area
    // (excluding the wall tiles at the edges of the 10x10 grid)
    drawExteriorBorderOverlay(): void {
        // Don't draw border overlay in underground zones
        const currentZone = this.game.playerFacade!.getCurrentZone();
        if (Number(currentZone.dimension) === 2) {
            return;
        }

        this.ctx.save();

        // The playable 8x8 area is from (1,1) to (8,8) in grid coordinates
        // We'll draw a gradient shadow inward from the edges of this area
        const borderWidth = TILE_SIZE * 0.4; // Width of the darkened border in pixels
        const playableStartX = TILE_SIZE; // x pixel coordinate where playable area starts
        const playableStartY = TILE_SIZE; // y pixel coordinate where playable area starts
        const playableWidth = TILE_SIZE * 8; // Width of playable area in pixels
        const playableHeight = TILE_SIZE * 8; // Height of playable area in pixels

        // Create gradients for each edge of the playable area

        // Top edge gradient (dark at top, transparent at bottom)
        let gradient = this.ctx.createLinearGradient(
            playableStartX, playableStartY,
            playableStartX, playableStartY + borderWidth
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(playableStartX, playableStartY, playableWidth, borderWidth);

        // Bottom edge gradient (transparent at top, dark at bottom)
        gradient = this.ctx.createLinearGradient(
            playableStartX, playableStartY + playableHeight - borderWidth,
            playableStartX, playableStartY + playableHeight
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(playableStartX, playableStartY + playableHeight - borderWidth, playableWidth, borderWidth);

        // Left edge gradient (dark at left, transparent at right)
        gradient = this.ctx.createLinearGradient(
            playableStartX, playableStartY,
            playableStartX + borderWidth, playableStartY
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(playableStartX, playableStartY, borderWidth, playableHeight);

        // Right edge gradient (transparent at left, dark at right)
        gradient = this.ctx.createLinearGradient(
            playableStartX + playableWidth - borderWidth, playableStartY,
            playableStartX + playableWidth, playableStartY
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(playableStartX + playableWidth - borderWidth, playableStartY, borderWidth, playableHeight);

        this.ctx.restore();
    }

    /**
     * Storage for multi-tile structures that need foreground rendering
     * Format: { coord: string, overlayTexture: string, originX: number, originY: number }[]
     */
    private _foregroundStructures: Array<{ coord: string; overlayTexture: string; originX: number; originY: number }> = [];

    /**
     * Storage for feature tiles that need foreground rendering based on zLayers
     * Format: { x: number, y: number, tile: Tile }[]
     */
    private _foregroundFeatures: Array<{ x: number; y: number; tile: Tile }> = [];

    /**
     * Storage for floor tiles that need foreground rendering (e.g., under museum roof)
     * Format: { x: number, y: number }[]
     */
    private _foregroundFloors: Array<{ x: number; y: number }> = [];

    /**
     * Determine if a tile within a multi-tile structure should be rendered in the foreground (after player).
     * This creates a depth effect where the player can walk "behind" certain parts of structures.
     */
    private shouldRenderTileInForeground(overlayTexture: string, tileX: number, tileY: number, originX: number, originY: number): boolean {
        const playerPos = this.game.playerFacade?.getPosition();
        const playerY = playerPos?.y ?? -1;

        // If player is off-screen, don't render anything in foreground to avoid artifacts
        if (!playerPos || playerPos.x < 0 || playerPos.x >= GRID_SIZE || playerY < 0 || playerY >= GRID_SIZE) {
            return false;
        }

        // Check zLayers from board data first
        const zoneGenerator = this.game.zoneGenerator;
        if (zoneGenerator?.zLayers) {
            const coord = `${tileX},${tileY}`;
            const zLayer = zoneGenerator.zLayers[coord];
            if (zLayer === 'above') {
                return true;
            } else if (zLayer === 'below') {
                return false;
            }
            // If no zLayer is specified for this tile, fall through to hardcoded logic
        }

        // BIG_TREE (2x3): Upper 4 tiles (2 rows) are the canopy, bottom 2 tiles (1 row) are the trunk.
        // Top 2 rows (y=0,1) render in FOREGROUND (canopy obscures player - player walks behind leaves).
        // Bottom row (y=2) renders behind player (player walks in front of trunk).
        if (overlayTexture === 'big_tree') {
            const relativeY = tileY - originY;
            // Top 2 rows (y=0,1) render in foreground (canopy over player)
            if (relativeY <= 1) {
                return true;
            }
            // Bottom row (y=2) never renders in foreground - player appears in front of trunk
            return false;
        }

        // MUSEUM/HOUSE (4x3): Top row is the roof - player walks behind it.
        // Bottom 2 rows are the building body - player walks in front of them.
        if (overlayTexture === 'museum' || overlayTexture === 'house') {
            const relativeY = tileY - originY;
            // Top row (y=0) renders in foreground (roof obscures player)
            if (relativeY === 0) {
                return true;
            }
            // Bottom 2 rows (y=1,2) never render in foreground - player appears in front
            return false;
        }

        // Default: no foreground rendering
        return false;
    }

    /**
     * Draw foreground floor tiles (parts that should render before the player).
     * This ensures the player appears on top of floor tiles.
     */
    drawForegroundFloors(): void {
        if (this._foregroundFloors.length === 0) return;

        // Calculate zone level for texture rendering
        const zone = this.game.playerFacade!.getCurrentZone();
        let zoneLevel: number;
        if (zone.dimension === 2) {
            zoneLevel = 6; // Underground zones
        } else if (zone.dimension === 1) {
            zoneLevel = 5; // Interior zones
        } else {
            const dist = Math.max(Math.abs(zone.x), Math.abs(zone.y));
            zoneLevel = getZoneLevelFromDistance(dist);
        }

        const terrainTextures = this.game.zoneGenerator?.terrainTextures || {};
        const rotations = this.game.zoneGenerator?.rotations || {};

        // Render foreground floor tiles
        for (const floor of this._foregroundFloors) {
            const { x, y } = floor;
            try {
                this.textureManager.renderTile(this.ctx, x, y, TILE_TYPES.FLOOR, this.game.gridManager, zoneLevel, terrainTextures, rotations);
            } catch (error) {
                // Fallback: render a simple floor tile
                this.ctx.fillStyle = '#ffe478';
                this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    /**
     * Draw the foreground parts of multi-tile structures and feature tiles (parts that should render after the player).
     * This is called after the player is drawn to create depth effects.
     */
    drawForegroundFeatures(): void {
        if (this._foregroundStructures.length === 0 && this._foregroundFeatures.length === 0) return;

        // Check if player is off-screen (during entrance animations)
        const playerPos = this.game.playerFacade?.getPosition();
        const playerOffScreen = !playerPos || playerPos.x < 0 || playerPos.x >= GRID_SIZE || playerPos.y < 0 || playerPos.y >= GRID_SIZE;

        // Calculate zone level for texture rendering
        const zone = this.game.playerFacade!.getCurrentZone();
        let zoneLevel: number;
        if (zone.dimension === 2) {
            zoneLevel = 6; // Underground zones
        } else if (zone.dimension === 1) {
            zoneLevel = 5; // Interior zones
        } else {
            const dist = Math.max(Math.abs(zone.x), Math.abs(zone.y));
            zoneLevel = getZoneLevelFromDistance(dist);
        }

        const terrainTextures = this.game.zoneGenerator?.terrainTextures || {};
        const rotations = this.game.zoneGenerator?.rotations || {};
        const overlayTextures = this.game.zoneGenerator?.overlayTextures || {};

        // Structure definitions
        const structureSizes: Record<string, [number, number]> = {
            'big_tree': [2, 3],
            'museum': [4, 3],
            'house': [4, 3]
        };

        const tileTypeMap: Record<string, number> = {
            'big_tree': TILE_TYPES.BIG_TREE,
            'museum': TILE_TYPES.HOUSE,
            'house': TILE_TYPES.HOUSE
        };

        // Process each foreground structure (skip overlay structures when player is off-screen to prevent artifacts)
        if (!playerOffScreen) {
            for (const structure of this._foregroundStructures) {
                const { overlayTexture, originX, originY } = structure;
                const [width, height] = structureSizes[overlayTexture] || [1, 1];
                const tileType = tileTypeMap[overlayTexture];
                if (!tileType) continue;

            // Create a temporary grid for this structure
            const tempGrid: Tile[][] = [];
            for (let gy = 0; gy < GRID_SIZE; gy++) {
                tempGrid[gy] = [];
                for (let gx = 0; gx < GRID_SIZE; gx++) {
                    const coordKey = `${gx},${gy}`;
                    if (overlayTextures[coordKey] === overlayTexture) {
                        tempGrid[gy][gx] = tileType;
                    } else {
                        tempGrid[gy][gx] = TILE_TYPES.FLOOR;
                    }
                }
            }

            // Create temporary grid manager
            const tempGridManager = {
                getTile: (gx: number, gy: number) => {
                    if (gy >= 0 && gy < tempGrid.length && gx >= 0 && gx < tempGrid[gy].length) {
                        return tempGrid[gy][gx];
                    }
                    return TILE_TYPES.FLOOR;
                },
                getSize: () => GRID_SIZE
            };

            // Render only the foreground tiles
            for (let dy = 0; dy < height; dy++) {
                for (let dx = 0; dx < width; dx++) {
                    const tileX = originX + dx;
                    const tileY = originY + dy;

                    // Only render this tile if it should be in the foreground
                    if (this.shouldRenderTileInForeground(overlayTexture, tileX, tileY, originX, originY)) {
                        this.textureManager.renderTile(this.ctx, tileX, tileY, tileType, tempGridManager, zoneLevel, terrainTextures, rotations);
                    }
                }
            }
        }
        }

        // Render foreground feature tiles (from zLayers) on top of floor tiles and player
        for (const feature of this._foregroundFeatures) {
            const { x, y, tile } = feature;
            try {
                if (isTileType(tile, TILE_TYPES.BOMB)) {
                    this.textureManager.renderTile(this.ctx, x, y, tile, this.game.gridManager, zoneLevel, terrainTextures, rotations);
                } else if (typeof tile === 'object' && tile !== null && 'type' in tile && (tile as any).type === TILE_TYPES.FOOD) {
                    this.textureManager.renderTile(this.ctx, x, y, (tile as any).type, this.game.gridManager, zoneLevel, terrainTextures, rotations);
                } else {
                    this.textureManager.renderTile(this.ctx, x, y, tile, this.game.gridManager, zoneLevel, terrainTextures, rotations);
                }
            } catch (error) {
                // Fallback: skip rendering
            }
        }
    }
}
