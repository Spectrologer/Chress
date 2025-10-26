import { Enemy } from '../../../entities/Enemy.js';
import { BaseSpawnCommand } from './BaseSpawnCommand.js';
import logger from '../../logger.js';

/**
 * Base class for enemy spawn commands
 */
export class BaseEnemySpawnCommand extends BaseSpawnCommand {
    /**
     * Get the enemy type to spawn
     * @abstract
     * @returns {string} Enemy type
     */
    getEnemyType() {
        throw new Error('getEnemyType must be implemented');
    }

    execute(game, enemyType) {
        // Allow override via parameter (for generic enemy spawn)
        const type = enemyType || this.getEnemyType();
        const pos = this.getSpawnPosition(game);

        if (pos) {
            game.enemies.push(new Enemy({
                x: pos.x,
                y: pos.y,
                enemyType: type,
                id: Date.now()
            }));
            logger.log('Spawned enemy', type, 'at', pos);
        } else {
            logger.log('No valid spawn position found');
        }
    }
}

/**
 * Specific enemy spawn commands
 */

export class SpawnEnemyCommand extends BaseEnemySpawnCommand {
    getEnemyType() { return 'lizardy'; }
}

export class SpawnLizardyCommand extends BaseEnemySpawnCommand {
    getEnemyType() { return 'lizardy'; }
}

export class SpawnLizardoCommand extends BaseEnemySpawnCommand {
    getEnemyType() { return 'lizardo'; }
}

export class SpawnLizardeauxCommand extends BaseEnemySpawnCommand {
    getEnemyType() { return 'lizardeaux'; }
}

export class SpawnLizordCommand extends BaseEnemySpawnCommand {
    getEnemyType() { return 'lizord'; }
}

export class SpawnLazerdCommand extends BaseEnemySpawnCommand {
    getEnemyType() { return 'lazerd'; }
}

export class SpawnZardCommand extends BaseEnemySpawnCommand {
    getEnemyType() { return 'zard'; }
}
