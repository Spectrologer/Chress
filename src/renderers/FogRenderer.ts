import { TILE_SIZE, GRID_SIZE } from '@core/constants/index';
import { MOTION_CONSTANTS } from '@core/constants/rendering';
import { createZoneKey } from '@utils/ZoneKeyUtils';
import type { TextureManager } from './TextureManager';
import type { IGame } from '@core/context';

interface Zone {
    x: number;
    y: number;
    dimension: number | string;
    depth?: number;
}

interface Player {
    getCurrentZone(): Zone;
    undergroundDepth?: number;
}

// Scrolling tiled fog overlay using a preloaded texture (assets/environment/effects/fog.png).
// The TextureLoader registers this under the key 'fog' by default.
export class FogRenderer {
    private game: IGame;
    private ctx: CanvasRenderingContext2D;
    private textureManager: TextureManager;
    private lastZoneKey: string | null = null;
    private canvasWidth: number = TILE_SIZE * GRID_SIZE;
    private canvasHeight: number = TILE_SIZE * GRID_SIZE;

    // Scrolling offsets (pixels) and speed (pixels per frame)
    private offsetX = 0;
    private offsetY = 0;
    private speedX: number = MOTION_CONSTANTS.FOG_SPEED_X; // slow horizontal scroll
    private speedY: number = MOTION_CONSTANTS.FOG_SPEED_Y; // gentle vertical drift

    // Pattern instance cached per frame when available
    /** @internal Pattern instance (public for testing) */
    public _pattern: CanvasPattern | null = null;
    // Scaling factor for the fog tile ( >1 to make the fog tile larger)
    private scale = 3.2;
    // Cached scaled canvas and a reference to the source image used to create it
    /** @internal Scaled canvas (public for testing) */
    public _scaledCanvas: HTMLCanvasElement | null = null;
    private _sourceImageRef: HTMLImageElement | null = null;

    constructor(game: IGame) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
    }

    updateAndDrawFog(): void {
        const currentZone = this.game.playerFacade.getCurrentZone();

        // Coerce dimension to number to tolerate loaded/serialized state that may
        // have the value as a string (e.g. "2"). We only treat exact numeric 2
        // as underground.
        const isUnderground = Number(currentZone.dimension) === 2;
        const depth = currentZone.depth || (this.game.playerFacade.getUndergroundDepth() || 1);
        const zoneKey = createZoneKey(currentZone.x, currentZone.y, currentZone.dimension, isUnderground ? depth : undefined);
        if (this.lastZoneKey !== zoneKey) {
            // Reset scroll when changing zone to avoid visible jumps
            this.offsetX = 0;
            this.offsetY = 0;
            // Don't unconditionally drop a prepared scaled canvas — the pattern
            // can be recreated from it using the current rendering context.
            // Clear only the per-zone key and attempt to recreate the pattern
            // from an existing scaled canvas to avoid a frame where fog is
            // missing after transitions.
            this.lastZoneKey = zoneKey;
            if (this._scaledCanvas && !this._pattern) {
                try {
                    this._pattern = this.ctx.createPattern(this._scaledCanvas, 'repeat');
                } catch (e) {
                    this._pattern = null;
                }
            }
        }

        // Try to get the fog image from the texture manager
        let fogImg: HTMLImageElement | undefined = undefined;
        try {
            fogImg = this.textureManager && this.textureManager.getImage('fog');
        } catch (e) {
            // ignore
        }

        // Advance offsets (wrap by scaled tile size) — compute sizes after fogImg is known
        const baseW = (fogImg && fogImg.width) ? fogImg.width : 320;
        const baseH = (fogImg && fogImg.height) ? fogImg.height : 180;
        const tileW = Math.max(1, Math.round(baseW * this.scale));
        const tileH = Math.max(1, Math.round(baseH * this.scale));
        this.offsetX = (this.offsetX + this.speedX) % tileW;
        this.offsetY = (this.offsetY + this.speedY) % tileH;

        this.ctx.save();
        // Draw fallback translucent fill if image isn't available yet
        if (!fogImg) {
            this.ctx.fillStyle = 'rgba(220,220,220,0.06)';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.ctx.restore();
            return;
        }

        // Ensure we have a scaled canvas to create a pattern from (only recreate when source image changes)
        if (this._sourceImageRef !== fogImg || !this._scaledCanvas) {
            try {
                const sw = Math.max(1, Math.round(baseW * this.scale));
                const sh = Math.max(1, Math.round(baseH * this.scale));
                const c = document.createElement('canvas');
                c.width = sw;
                c.height = sh;
                const cx = c.getContext('2d');
                if (cx) {
                    // Draw the source image stretched to the scaled size
                    cx.drawImage(fogImg, 0, 0, sw, sh);
                    this._scaledCanvas = c;
                    this._sourceImageRef = fogImg;
                    // recreate pattern
                    try {
                        this._pattern = this.ctx.createPattern(this._scaledCanvas, 'repeat');
                    } catch (e) {
                        this._pattern = null;
                    }
                }
            } catch (e) {
                this._scaledCanvas = null;
                this._pattern = null;
            }
        }

        // If for some reason a pattern wasn't created above but we still have
        // a valid scaled canvas (e.g., pattern creation failed earlier or the
        // scaled canvas was preserved across a zone switch), try again with
        // the current canvas rendering context so the fog doesn't disappear
        // after transitions.
        if (!this._pattern && this._scaledCanvas) {
            try {
                this._pattern = this.ctx.createPattern(this._scaledCanvas, 'repeat');
            } catch (e) {
                this._pattern = null;
            }
        }

        if (this._pattern) {
            // Apply ~8% overlay opacity for more visible fog effect
            this.ctx.globalAlpha = 0.08;

            // Translate by -offset to create scrolling effect, then fill using the pattern
            this.ctx.translate(-this.offsetX, -this.offsetY);
            this.ctx.fillStyle = this._pattern;
            // Fill an area slightly larger than canvas to ensure full coverage while scrolling
            this.ctx.fillRect(this.offsetX, this.offsetY, this.canvasWidth + tileW, this.canvasHeight + tileH);

            // Reset transform and alpha
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.globalAlpha = 1.0;
        } else {
            // Fallback if pattern creation failed
            this.ctx.fillStyle = 'rgba(220,220,220,0.06)';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }

        this.ctx.restore();
    }
}
