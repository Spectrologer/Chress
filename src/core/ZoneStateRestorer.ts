import { logger } from './logger';

interface ZoneStateData {
    zoneCounter?: number;
    enemyCounter?: number;
    axeSpawned?: boolean;
    hammerSpawned?: boolean;
    noteSpawned?: boolean;
    spearSpawned?: boolean;
    horseIconSpawned?: boolean;
    penneSpawned?: boolean;
    squigSpawned?: boolean;
    wellSpawned?: boolean;
    deadTreeSpawned?: boolean;
    axeWarningSignPlaced?: boolean;
    hammerWarningSignPlaced?: boolean;
    firstFrontierSignPlaced?: boolean;
    axeSpawnZone?: { x: number; y: number } | null;
    hammerSpawnZone?: { x: number; y: number } | null;
    noteSpawnZone?: { x: number; y: number } | null;
    spearSpawnZone?: { x: number; y: number } | null;
    horseIconSpawnZone?: { x: number; y: number } | null;
    [key: string]: unknown;
}

interface GameWithZoneGenState {
    zoneGenState?: {
        deserialize(state: unknown): void;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

/**
 * Helper class for migrating old ZoneStateManager save data to new ZoneGenerationState.
 * Used for backward compatibility when loading saves from before the migration.
 *
 * @deprecated This is only used for loading old saves. New saves use game.zoneGenState.serialize()/deserialize()
 */
export class ZoneStateRestorer {
    /**
     * Migrates old ZoneStateManager save data to the new instance-based ZoneGenerationState.
     *
     * @param {Object} game - The game instance with zoneGenState
     * @param {Object} zoneStateData - The saved zone state manager data (old format)
     */
    static restoreZoneState(game: GameWithZoneGenState, zoneStateData: ZoneStateData): void {
        if (!zoneStateData) {
            logger.warn('No zone state data to restore');
            return;
        }

        if (!game || !game.zoneGenState) {
            logger.warn('Cannot restore zone state: game or zoneGenState not available');
            return;
        }

        try {
            // Migrate old format to new ZoneGenerationState
            const migratedState = {
                zoneCounter: zoneStateData.zoneCounter || 0,
                enemyCounter: zoneStateData.enemyCounter || 0,
                spawnFlags: {
                    axe: zoneStateData.axeSpawned || false,
                    hammer: zoneStateData.hammerSpawned || false,
                    note: zoneStateData.noteSpawned || false,
                    spear: zoneStateData.spearSpawned || false,
                    horseIcon: zoneStateData.horseIconSpawned || false,
                    penne: zoneStateData.penneSpawned || false,
                    squig: zoneStateData.squigSpawned || false,
                    well: zoneStateData.wellSpawned || false,
                    deadTree: zoneStateData.deadTreeSpawned || false,
                    axeWarningSign: zoneStateData.axeWarningSignPlaced || false,
                    hammerWarningSign: zoneStateData.hammerWarningSignPlaced || false,
                    firstFrontierSign: zoneStateData.firstFrontierSignPlaced || false
                },
                spawnLocations: {
                    axe: zoneStateData.axeSpawnZone || null,
                    hammer: zoneStateData.hammerSpawnZone || null,
                    note: zoneStateData.noteSpawnZone || null,
                    spear: zoneStateData.spearSpawnZone || null,
                    horseIcon: zoneStateData.horseIconSpawnZone || null
                }
            };

            // Deserialize into the game's zoneGenState
            game.zoneGenState.deserialize(migratedState);
            logger.log('Successfully migrated old zone state to new format');
        } catch (e) {
            logger.warn('Failed to migrate zone state:', e);
        }
    }
}
