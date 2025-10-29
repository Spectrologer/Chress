import { ZoneStateManager } from '../generators/ZoneStateManager.js';
import { logger } from './logger.js';

/**
 * Helper class for restoring ZoneStateManager static data from saved state.
 * Extracted from GameStateManager to improve code organization.
 */
export class ZoneStateRestorer {
    /**
     * Restores ZoneStateManager static data from saved state.
     * @param {Object} zoneStateData - The saved zone state manager data
     */
    static restoreZoneState(zoneStateData) {
        if (!zoneStateData) {
            logger.warn('No zone state data to restore');
            return;
        }

        try {
            // Restore counters
            ZoneStateManager.zoneCounter = zoneStateData.zoneCounter || 0;
            ZoneStateManager.enemyCounter = zoneStateData.enemyCounter || 0;

            // Restore spawn flags
            ZoneStateManager.axeSpawned = zoneStateData.axeSpawned || false;
            ZoneStateManager.hammerSpawned = zoneStateData.hammerSpawned || false;
            ZoneStateManager.noteSpawned = zoneStateData.noteSpawned || false;
            ZoneStateManager.spearSpawned = zoneStateData.spearSpawned || false;
            ZoneStateManager.horseIconSpawned = zoneStateData.horseIconSpawned || false;
            ZoneStateManager.penneSpawned = zoneStateData.penneSpawned || false;
            ZoneStateManager.squigSpawned = zoneStateData.squigSpawned || false;
            ZoneStateManager.wellSpawned = zoneStateData.wellSpawned || false;
            ZoneStateManager.deadTreeSpawned = zoneStateData.deadTreeSpawned || false;

            // Restore sign placement flags
            ZoneStateManager.axeWarningSignPlaced = zoneStateData.axeWarningSignPlaced || false;
            ZoneStateManager.hammerWarningSignPlaced = zoneStateData.hammerWarningSignPlaced || false;
            ZoneStateManager.firstFrontierSignPlaced = zoneStateData.firstFrontierSignPlaced || false;

            // Restore spawn zones
            ZoneStateManager.axeSpawnZone = zoneStateData.axeSpawnZone || null;
            ZoneStateManager.hammerSpawnZone = zoneStateData.hammerSpawnZone || null;
            ZoneStateManager.noteSpawnZone = zoneStateData.noteSpawnZone || null;
            ZoneStateManager.spearSpawnZone = zoneStateData.spearSpawnZone || null;
            ZoneStateManager.horseIconSpawnZone = zoneStateData.horseIconSpawnZone || null;
        } catch (e) {
            logger.warn('Failed to restore zone state:', e);
        }
    }
}
