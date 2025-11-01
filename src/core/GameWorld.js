// @ts-check

/**
 * GameWorld
 *
 * Encapsulates all world-related state including:
 * - Grid (current zone's tile layout)
 * - Zones (generated zones storage)
 * - Entities (player, enemies)
 * - Zone metadata (current region, special zones, defeated enemies)
 * - Pitfall zone state
 */
export class GameWorld {
    constructor() {
        // Grid and zone state
        /** @type {any[][] | null} Current zone grid */
        this.grid = null;

        /** @type {Map<string, any>} Stores generated zones by coordinate key */
        this.zones = new Map();

        /** @type {Map<string, any>} Special zones (e.g., interiors, dungeons) */
        this.specialZones = new Map();

        /** @type {string | null} Tracks current region name to avoid repeated notifications */
        this.currentRegion = null;

        // Entities
        /** @type {any} Set by ServiceContainer */
        this.player = null;

        /** @type {any[]} Current zone enemies */
        this.enemies = [];

        /** @type {Set<string>} Tracks defeated enemy positions: "zoneX,zoneY,enemyX,enemyY" */
        this.defeatedEnemies = new Set();
    }

    /**
     * Reset all world state (for new game)
     * @returns {void}
     */
    reset() {
        this.grid = null;
        this.zones.clear();
        this.specialZones.clear();
        this.currentRegion = null;
        // IMPORTANT: Clear array in place to preserve EnemyCollection reference
        this.enemies.length = 0;
        this.defeatedEnemies.clear();
    }

    /**
     * Get serializable state for saving
     * @returns {Object}
     */
    getState() {
        return {
            grid: this.grid,
            zones: Array.from(this.zones.entries()),
            specialZones: Array.from(this.specialZones.entries()),
            currentRegion: this.currentRegion,
            enemies: this.enemies.map(e => e.serialize ? e.serialize() : e),
            defeatedEnemies: Array.from(this.defeatedEnemies)
            // Note: Transient state (pitfall, portTransition, etc.) is NOT persisted - managed by TransientGameState
        };
    }

    /**
     * Restore state from saved data
     * @param {any} state
     * @param {any} EnemyClass
     * @returns {void}
     */
    setState(state, EnemyClass) {
        this.grid = state.grid || null;
        this.zones = new Map(state.zones || []);
        this.specialZones = new Map(state.specialZones || []);
        this.currentRegion = state.currentRegion || null;
        // IMPORTANT: Clear and repopulate array in place to preserve EnemyCollection reference
        this.enemies.length = 0;
        const newEnemies = (state.enemies || []).map(e => new EnemyClass(e));
        this.enemies.push(...newEnemies);
        this.defeatedEnemies = new Set(state.defeatedEnemies || []);
        // Note: Transient state is reset on load by TransientGameState, not persisted
    }
}
