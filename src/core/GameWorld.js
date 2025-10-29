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
        this.grid = null; // Current zone grid
        this.zones = new Map(); // Stores generated zones by coordinate key
        this.specialZones = new Map(); // Special zones (e.g., interiors, dungeons)
        this.currentRegion = null; // Tracks current region name to avoid repeated notifications

        // Entities
        this.player = null; // Set by ServiceContainer
        this.enemies = []; // Current zone enemies
        this.defeatedEnemies = new Set(); // Tracks defeated enemy positions: "zoneX,zoneY,enemyX,enemyY"
    }

    /**
     * Reset all world state (for new game)
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
