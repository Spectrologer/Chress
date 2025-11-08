import type { Grid } from './SharedTypes';
import type { Enemy, EnemyData } from '@entities/Enemy';
import type { Player } from '@entities/Player';

/**
 * Zone coordinates with dimension
 */
export interface ZoneCoordinates {
    x: number;
    y: number;
    dimension: number;
}

/**
 * Partner cube data for spawning return cubes
 */
export interface PartnerCubeData {
    x: number;
    y: number;
    dimension: number;
    originZone: ZoneCoordinates;
}

/**
 * Represents the state that can be saved/loaded
 */
export interface WorldState {
    grid: Grid | null;
    zones: Array<[string, unknown]>;
    specialZones: Array<[string, unknown]>;
    currentRegion: string | null;
    enemies: Array<EnemyData | ReturnType<Enemy['serialize']>>;
    defeatedEnemies: string[];
    partnerCubes?: Array<[string, PartnerCubeData]>;
    cubeLinkages?: Array<[string, ZoneCoordinates]>;
}

/**
 * GameWorld
 *
 * Encapsulates all world-related state including:
 * - Grid (current zone's tile layout)
 * - Zones (generated zones storage)
 * - Entities (player, enemies)
 * - Zone metadata (current region, special zones, defeated enemies)
 * - Cube teleportation state
 */
export class GameWorld {
    // Grid and zone state
    grid: Grid | null;
    zones: Map<string, unknown>;
    specialZones: Map<string, unknown>;
    currentRegion: string | null;

    // Cube teleportation state
    partnerCubes: Map<string, PartnerCubeData>;
    cubeLinkages: Map<string, ZoneCoordinates>;

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

        // Cube teleportation state
        this.partnerCubes = new Map();
        this.cubeLinkages = new Map();

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
        this.partnerCubes.clear();
        this.cubeLinkages.clear();
        // IMPORTANT: Clear array in place to preserve EnemyCollection reference
        this.enemies.length = 0;
        this.defeatedEnemies.clear();
    }

    /**
     * Get serializable state for saving
     */
    getState(): WorldState {
        return {
            grid: this.grid,
            zones: Array.from(this.zones.entries()),
            specialZones: Array.from(this.specialZones.entries()),
            currentRegion: this.currentRegion,
            enemies: this.enemies.map(e => e.serialize ? e.serialize() : e),
            defeatedEnemies: Array.from(this.defeatedEnemies),
            partnerCubes: Array.from(this.partnerCubes.entries()),
            cubeLinkages: Array.from(this.cubeLinkages.entries())
            // Note: Transient state (pitfall, portTransition, etc.) is NOT persisted - managed by TransientGameState
        };
    }

    /**
     * Restore state from saved data
     */
    setState(state: WorldState, EnemyClass: new (data: EnemyData) => Enemy): void {
        this.grid = state.grid || null;
        this.zones = new Map(state.zones || []);
        this.specialZones = new Map(state.specialZones || []);
        this.currentRegion = state.currentRegion || null;
        this.partnerCubes = new Map(state.partnerCubes || []);
        this.cubeLinkages = new Map(state.cubeLinkages || []);
        // IMPORTANT: Clear and repopulate array in place to preserve EnemyCollection reference
        this.enemies.length = 0;
        const newEnemies = (state.enemies || []).map((e) => new EnemyClass(e as EnemyData));
        this.enemies.push(...newEnemies);
        this.defeatedEnemies = new Set(state.defeatedEnemies || []);
        // Note: Transient state is reset on load by TransientGameState, not persisted
    }
}
