import { TILE_SIZE, GRID_SIZE } from '../core/constants.js';

export class FogRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.fogParticles = [];
        this.lastZoneKey = null;
        this.canvasWidth = TILE_SIZE * GRID_SIZE;
        this.canvasHeight = TILE_SIZE * GRID_SIZE;
    }

    initializeFog() {
        this.fogParticles = [];
        const numParticles = 30; // More particles for a denser fog
        for (let i = 0; i < numParticles; i++) {
            this.fogParticles.push(this.createParticle());
        }
    }

    createParticle(x = null) {
        const newX = x !== null ? x : Math.random() * this.canvasWidth;
        return {
            x: newX,
            y: Math.random() * this.canvasHeight,
            radius: Math.random() * 50 + 40, // Fog patches of various sizes
            opacity: Math.random() * 0.1 + 0.05, // Subtle opacity
            vx: (Math.random() - 0.5) * 0.15, // Slow horizontal drift
        };
    }

    updateAndDrawFog() {
        const currentZone = this.game.player.getCurrentZone(); // This is now safe as RenderManager ensures dimension is 2

    const depthSuffix = (currentZone.dimension === 2) ? `:z-${currentZone.depth || (this.game.player.undergroundDepth || 1)}` : '';
    const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}${depthSuffix}`;
        if (this.lastZoneKey !== zoneKey) {
            this.initializeFog();
            this.lastZoneKey = zoneKey;
        }

        this.ctx.save();
        this.fogParticles.forEach((p, index) => {
            // Update position
            p.x += p.vx;

            // If particle goes off-screen, wrap it around
            if (p.vx > 0 && p.x > this.canvasWidth + p.radius) {
                // Moved off the right edge, reappear on the left
                this.fogParticles[index] = this.createParticle(-p.radius);
            } else if (p.vx < 0 && p.x < -p.radius) {
                // Moved off the left edge, reappear on the right
                this.fogParticles[index] = this.createParticle(this.canvasWidth + p.radius);
            }

            // Draw the fog particle as a radial gradient
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`); // Denser center
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Fading out

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }
}
