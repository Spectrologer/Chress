import { TILE_SIZE, GRID_SIZE } from '../core/constants.js';

// Scrolling tiled fog overlay using a preloaded texture (assets/fx/fog.png).
// The TextureLoader registers this under the key 'fx/fog' by default.
export class FogRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
        this.lastZoneKey = null;
        this.canvasWidth = TILE_SIZE * GRID_SIZE;
        this.canvasHeight = TILE_SIZE * GRID_SIZE;

        // Scrolling offsets (pixels) and speed (pixels per frame)
        this.offsetX = 0;
        this.offsetY = 0;
        this.speedX = 0.3; // slow horizontal scroll
        this.speedY = 0.08; // gentle vertical drift

        // Pattern instance cached per frame when available
        this._pattern = null;
    // Scaling factor for the fog tile ( >1 to make the fog tile larger)
    this.scale = 3.2;
        // Cached scaled canvas and a reference to the source image used to create it
        this._scaledCanvas = null;
        this._sourceImageRef = null;
    }

    updateAndDrawFog() {
        const currentZone = this.game.player.getCurrentZone();

    // Coerce dimension to number to tolerate loaded/serialized state that may
    // have the value as a string (e.g. "2"). We only treat exact numeric 2
    // as underground.
    const isUnderground = Number(currentZone.dimension) === 2;
    const depthSuffix = (isUnderground) ? `:z-${currentZone.depth || (this.game.player.undergroundDepth || 1)}` : '';
        const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}${depthSuffix}`;
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
        let fogImg = null;
        try {
            fogImg = this.textureManager && this.textureManager.getImage('fx/fog');
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
            // Apply ~3.5% overlay opacity (multiplies image alpha)
            this.ctx.globalAlpha = 0.035;

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
