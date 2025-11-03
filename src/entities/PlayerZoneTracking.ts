import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import type { Player, ZoneCoords } from './Player.js';

export class PlayerZoneTracking {
    private player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    getCurrentZone(): ZoneCoords {
        return { ...this.player.currentZone };
    }

    setCurrentZone(x: number, y: number, dimension: number = this.player.currentZone.dimension): void {
        this.player.currentZone.x = x;
        this.player.currentZone.y = y;
        this.player.currentZone.dimension = (typeof dimension === 'number') ? dimension : Number(dimension) || 0;

        if (Number(this.player.currentZone.dimension) === 2) {
            this.player.currentZone.depth = this.player.currentZone.depth || (this.player.undergroundDepth || 1);
        } else {
            this.player.currentZone.depth = 0;
        }

        this.markZoneVisited(x, y, this.player.currentZone.dimension);
    }

    markZoneVisited(x: number, y: number, dimension: number): void {
        const numericDim = Number(dimension);
        const depth = (numericDim === 2)
            ? (this.player.currentZone && this.player.currentZone.depth ? this.player.currentZone.depth : (this.player.undergroundDepth || 1))
            : undefined;
        const zoneKey = createZoneKey(x, y, numericDim, depth);
        this.player.visitedZones.add(zoneKey);
    }

    hasVisitedZone(x: number, y: number, dimension: number): boolean {
        const depth = (dimension === 2)
            ? (this.player.currentZone && this.player.currentZone.depth ? this.player.currentZone.depth : (this.player.undergroundDepth || 1))
            : undefined;
        const zoneKey = createZoneKey(x, y, dimension, depth);
        return this.player.visitedZones.has(zoneKey);
    }

    getVisitedZones(): Set<string> {
        return new Set(this.player.visitedZones);
    }

    onZoneTransition(): void {
        this.player.stats.decreaseThirst();
        this.player.stats.decreaseHunger();
    }

    clearVisitedZones(): void {
        this.player.visitedZones.clear();
    }
}
