/**
 * Centralized state for zone generation session data.
 *
 * Replaces the static properties in ZoneStateManager with instance-based state
 * that can be properly saved, loaded, and tested.
 *
 * @module ZoneGenerationState
 */

export class ZoneGenerationState {
    constructor() {
        this.reset();
    }

    /**
     * Reset all session data to initial state
     */
    reset() {
        // Counters
        this.zoneCounter = 0;
        this.enemyCounter = 0;

        // Spawn flags for unique items/NPCs
        this.spawnFlags = {
            axe: false,
            hammer: false,
            spear: false,
            horseIcon: false,
            note: false,
            penne: false,
            squig: false,
            shack: false,
            wildsShack: false,
            cisternLevel1: false,
            well: false,
            deadTree: false,
            axeWarningSign: false,
            hammerWarningSign: false,
            firstFrontierSign: false
        };

        // Special zones marked as "first" for region-specific logic
        this.firstWildsZonePlaced = false;

        // Pre-determined spawn locations for special items
        this.spawnLocations = {
            axe: null,      // Level 1 (Home): dist 1-2
            hammer: null,   // Level 2 (Woods): dist 3-8
            spear: null,    // Level 3 (Wilds): dist 9-16
            horseIcon: null, // Level 4 (Frontier): dist 17-24
            note: null,
            wildsShack: null
        };
    }

    /**
     * Initialize spawn locations for special items if not already set
     */
    initializeItemLocations() {
        if (this.spawnLocations.axe &&
            this.spawnLocations.hammer &&
            this.spawnLocations.spear &&
            this.spawnLocations.horseIcon) {
            return; // Already initialized
        }

        // Level 1 (Home): dist 1-2
        this.spawnLocations.axe = this._getRandomZoneForLevel(1, 2);

        // Level 2 (Woods): dist 3-8
        this.spawnLocations.hammer = this._getRandomZoneForLevel(3, 8);

        // Level 3 (Wilds): dist 9-16
        this.spawnLocations.spear = this._getRandomZoneForLevel(9, 16);

        // Level 4 (Frontier): dist 17-24
        this.spawnLocations.horseIcon = this._getRandomZoneForLevel(17, 24);
    }

    /**
     * Generate a random zone coordinate within a distance range
     *
     * @private
     * @param {number} minDist - Minimum Chebyshev distance from origin
     * @param {number} maxDist - Maximum Chebyshev distance from origin
     * @returns {{x: number, y: number}} Random zone coordinates
     */
    _getRandomZoneForLevel(minDist, maxDist) {
        let x, y;
        do {
            const range = maxDist * 2 + 1;
            x = Math.floor(Math.random() * range) - maxDist;
            y = Math.floor(Math.random() * range) - maxDist;
        } while (Math.max(Math.abs(x), Math.abs(y)) < minDist ||
                 Math.max(Math.abs(x), Math.abs(y)) > maxDist);
        return { x, y };
    }

    /**
     * Check if a specific item/feature has been spawned
     *
     * @param {string} flag - The spawn flag name (e.g., 'axe', 'hammer')
     * @returns {boolean} Whether the item has been spawned
     */
    hasSpawned(flag) {
        return this.spawnFlags[flag] === true;
    }

    /**
     * Mark an item/feature as spawned
     *
     * @param {string} flag - The spawn flag name
     * @param {boolean} value - Whether it's spawned (default: true)
     */
    setSpawnFlag(flag, value = true) {
        if (flag in this.spawnFlags) {
            this.spawnFlags[flag] = value;
        }
    }

    /**
     * Get the spawn location for a special item
     *
     * @param {string} item - Item name (e.g., 'axe', 'hammer')
     * @returns {{x: number, y: number}|null} Spawn location or null
     */
    getSpawnLocation(item) {
        return this.spawnLocations[item] || null;
    }

    /**
     * Set the spawn location for a special item
     *
     * @param {string} item - Item name
     * @param {{x: number, y: number}} location - Zone coordinates
     */
    setSpawnLocation(item, location) {
        if (item in this.spawnLocations) {
            this.spawnLocations[item] = location;
        }
    }

    /**
     * Increment and return the zone counter
     *
     * @returns {number} New zone counter value
     */
    incrementZoneCounter() {
        return ++this.zoneCounter;
    }

    /**
     * Increment and return the enemy counter
     *
     * @returns {number} New enemy counter value
     */
    incrementEnemyCounter() {
        return ++this.enemyCounter;
    }

    /**
     * Get current zone counter value
     *
     * @returns {number} Zone counter
     */
    getZoneCounter() {
        return this.zoneCounter;
    }

    /**
     * Get current enemy counter value
     *
     * @returns {number} Enemy counter
     */
    getEnemyCounter() {
        return this.enemyCounter;
    }

    /**
     * Serialize state for saving
     *
     * @returns {Object} Serialized state object
     */
    serialize() {
        return {
            zoneCounter: this.zoneCounter,
            enemyCounter: this.enemyCounter,
            spawnFlags: { ...this.spawnFlags },
            firstWildsZonePlaced: this.firstWildsZonePlaced,
            spawnLocations: { ...this.spawnLocations }
        };
    }

    /**
     * Deserialize state from saved data
     *
     * @param {Object} data - Serialized state object
     */
    deserialize(data) {
        if (!data) return;

        this.zoneCounter = data.zoneCounter || 0;
        this.enemyCounter = data.enemyCounter || 0;
        this.spawnFlags = { ...this.spawnFlags, ...data.spawnFlags };
        this.firstWildsZonePlaced = data.firstWildsZonePlaced || false;
        this.spawnLocations = { ...this.spawnLocations, ...data.spawnLocations };
    }
}
