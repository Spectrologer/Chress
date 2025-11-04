import type { Grid } from './SharedTypes';
import type { Enemy } from '@entities/Enemy';
import type { Player } from '@entities/Player';

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
    // Grid and zone state
    grid: Grid | null;
    zones: Map<string, any>;
    specialZones: Map<string, any>;
    currentRegion: string | null;

    // Entities
    player: Player | null;
    enemies: Enemy[];
    defeatedEnemies: Set<string>;

    constructor() {
        // Grid and zone state
        this.grid = null;
        this.zones = new Map();
        this.specialZones = new Map();
        this.currentRegion = null;

        // Entities
        this.player = null;
        this.enemies = [];
        this.defeatedEnemies = new Set();
    }

    /**
     * Reset all world state (for new game)
     */
    reset(): void {
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
    getState(): any {
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
    setState(state: any, EnemyClass: any): void {
        this.grid = state.grid || null;
        this.zones = new Map(state.zones || []);
        this.specialZones = new Map(state.specialZones || []);
        this.currentRegion = state.currentRegion || null;
        // IMPORTANT: Clear and repopulate array in place to preserve EnemyCollection reference
        this.enemies.length = 0;
        const newEnemies = (state.enemies || []).map((e: any) => new EnemyClass(e));
        this.enemies.push(...newEnemies);
        this.defeatedEnemies = new Set(state.defeatedEnemies || []);
        // Note: Transient state is reset on load by TransientGameState, not persisted
    }
}
