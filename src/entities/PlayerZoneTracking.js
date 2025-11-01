// @ts-check

/**
 * @typedef {import('./Player.js').ZoneCoords} ZoneCoords
 */

import { createZoneKey } from '../utils/ZoneKeyUtils.js';

/**
 * Handles player zone tracking and navigation
 */
export class PlayerZoneTracking {
    /**
     * @param {import('./Player.js').Player} player - Player instance
     */
    constructor(player) {
        this.player = player;
    }

    /**
     * Gets the current zone coordinates
     * @returns {ZoneCoords}
     */
    getCurrentZone() {
        return { ...this.player.currentZone };
    }

    /**
     * Sets the current zone coordinates
     * @param {number} x - Zone X coordinate
     * @param {number} y - Zone Y coordinate
     * @param {number} [dimension] - Zone dimension
     * @returns {void}
     */
    setCurrentZone(x, y, dimension = this.player.currentZone.dimension) {
        this.player.currentZone.x = x;
        this.player.currentZone.y = y;
        // Coerce dimension to a number to avoid cases where saved/loaded
        // state supplies a string ("2"). Default to 0 if coercion fails.
        this.player.currentZone.dimension = (typeof dimension === 'number') ? dimension : Number(dimension) || 0;
        // Attach depth for underground zones (use coerced numeric value)
        if (Number(this.player.currentZone.dimension) === 2) {
            // If an explicit depth exists on the zone object, use it; otherwise fallback to player's current depth
            this.player.currentZone.depth = this.player.currentZone.depth || (this.player.undergroundDepth || 1);
        } else {
            this.player.currentZone.depth = 0;
        }
        // Persist visited using numeric dimension
        this.markZoneVisited(x, y, this.player.currentZone.dimension);
    }

    /**
     * Marks a zone as visited
     * @param {number} x - Zone X coordinate
     * @param {number} y - Zone Y coordinate
     * @param {number} dimension - Zone dimension
     * @returns {void}
     */
    markZoneVisited(x, y, dimension) {
        // For underground zones, include depth in the saved key so different depths are tracked separately
        const numericDim = Number(dimension);
        const depth = (numericDim === 2)
            ? (this.player.currentZone && this.player.currentZone.depth ? this.player.currentZone.depth : (this.player.undergroundDepth || 1))
            : undefined;
        const zoneKey = createZoneKey(x, y, numericDim, depth);
        this.player.visitedZones.add(zoneKey);
    }

    /**
     * Checks if a zone has been visited
     * @param {number} x - Zone X coordinate
     * @param {number} y - Zone Y coordinate
     * @param {number} dimension - Zone dimension
     * @returns {boolean}
     */
    hasVisitedZone(x, y, dimension) {
        const depth = (dimension === 2)
            ? (this.player.currentZone && this.player.currentZone.depth ? this.player.currentZone.depth : (this.player.undergroundDepth || 1))
            : undefined;
        const zoneKey = createZoneKey(x, y, dimension, depth);
        return this.player.visitedZones.has(zoneKey);
    }

    /**
     * Gets a copy of all visited zones
     * @returns {Set<string>}
     */
    getVisitedZones() {
        return new Set(this.player.visitedZones);
    }

    /**
     * Called when player moves to a new zone
     * @returns {void}
     */
    onZoneTransition() {
        // Called when player moves to a new zone
        this.player.stats.decreaseThirst();
        this.player.stats.decreaseHunger();
    }

    /**
     * Clears all visited zones
     * @returns {void}
     */
    clearVisitedZones() {
        this.player.visitedZones.clear();
    }
}
