import { BaseCommand } from '../BaseCommand.js';
import { SpawnPositionHelper } from '../SpawnPositionHelper.js';
import { logger } from '../../logger.js';

/**
 * BaseSpawnCommand - Base class for all spawn commands
 *
 * Provides common functionality for spawning items/entities.
 */
export class BaseSpawnCommand extends BaseCommand {
    /**
     * Get the tile type or object to spawn
     * @abstract
     * @returns {any} Tile type or tile object
     */
    getTileToSpawn() {
        throw new Error('getTileToSpawn must be implemented');
    }

    /**
     * Get the spawn position
     * @param {Object} game - Game instance
     * @returns {{x: number, y: number}|undefined} Position or undefined
     */
    getSpawnPosition(game) {
        return SpawnPositionHelper.findSpawnPosition(game);
    }

    /**
     * Get the name of what's being spawned (for logging)
     * @returns {string} Item name
     */
    getItemName() {
        return 'item';
    }

    /**
     * Execute the spawn command
     * @param {Object} game - Game instance
     */
    execute(game) {
        const pos = this.getSpawnPosition(game);
        if (pos) {
            game.grid[pos.y][pos.x] = this.getTileToSpawn();
            logger.log(`Spawned ${this.getItemName()} at`, pos);
        } else {
            logger.log('No valid spawn position found');
        }
    }
}
