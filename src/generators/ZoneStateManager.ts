import { logger } from '../core/logger';
import { TILE_TYPES, GRID_SIZE, getZoneLevelFromDistance } from '../core/constants/index';

/**
 * ZoneStateManager - Utility functions for zone generation
 *
 * NOTE: State has been migrated to ZoneGenerationState (game.zoneGenState).
 * This class now provides only utility functions (getZoneLevel, hashCode).
 *
 * Static properties are DEPRECATED - use game.zoneGenState instead:
 * - ZoneStateManager.zoneCounter → game.zoneGenState.incrementZoneCounter()
 * - ZoneStateManager.axeSpawned → game.zoneGenState.hasSpawned('axe')
 * - ZoneStateManager.axeSpawnZone → game.zoneGenState.getSpawnLocation('axe')
 */
export class ZoneStateManager {
    /**
     * Get the zone level (region) for given coordinates
     *
     * @param {number} zoneX - Zone X coordinate
     * @param {number} zoneY - Zone Y coordinate
     * @returns {number} Zone level (1-5)
     */
    static getZoneLevel(zoneX, zoneY) {
        const dist = Math.max(Math.abs(zoneX), Math.abs(zoneY));
        return getZoneLevelFromDistance(dist);
    }

    /**
     * Generate a deterministic hash code from a string
     *
     * Used for seeded random generation based on zone coordinates
     *
     * @param {string} str - String to hash (e.g., "0,0" for zone coords)
     * @returns {number} Hash code
     */
    static hashCode(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (const char of str) {
            const charCode = char.charCodeAt(0);
            hash = ((hash << 5) - hash) + charCode;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}
