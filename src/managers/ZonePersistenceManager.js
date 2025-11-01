// @ts-check
/**
 * ZonePersistenceManager - Handles zone state persistence
 *
 * Extracted from ZoneManager to reduce file size.
 * Manages saving current zone state to the zone repository.
 */

import { logger } from '../core/logger.ts';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';

export class ZonePersistenceManager {
    /**
     * @param {any} game - The main game instance
     */
    constructor(game) {
        this.game = game;
    }

    /**
     * Saves the current zone's state to the zone repository.
     * Preserves grid changes and enemy positions for future visits.
     *
     * @returns {void}
     */
    saveCurrentZoneState() {
        const currentZone = this.game.player.getCurrentZone();
        const depth = currentZone.depth || (this.game.player.undergroundDepth || 1);
        const zoneKey = createZoneKey(currentZone.x, currentZone.y, currentZone.dimension, depth);

        // Save current zone state to preserve any changes made during gameplay
        const enemyCollection = this.game.enemyCollection;
        this.game.zoneRepository.setByKey(zoneKey, {
            grid: JSON.parse(JSON.stringify(this.game.grid)),
            enemies: enemyCollection.map(enemy => ({
                x: enemy.x,
                y: enemy.y,
                enemyType: enemy.enemyType,
                health: enemy.health,
                id: enemy.id
            })),
            playerSpawn: null
        });

        logger.debug(`Saved current zone state for ${zoneKey}`);
    }
}
