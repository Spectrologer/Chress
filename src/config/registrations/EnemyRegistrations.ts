/**
 * EnemyRegistrations - Register all enemies with ContentRegistry
 */

import { ContentRegistry } from '@core/ContentRegistry';
import { SPAWN_PROBABILITIES } from '@core/constants/index';

interface EnemySpawnRules {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
}

interface EnemyStats {
    health: number;
    damage: number;
}

interface EnemyConfig {
    weight: number;
    spawnRules: EnemySpawnRules;
    behaviorType: string;
    stats: EnemyStats;
}

/**
 * Register all enemies with the ContentRegistry
 */
export function registerEnemies(): void {
    ContentRegistry.registerEnemy('lizardy', {
        weight: 1,
        spawnRules: {
            level1: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_1_HOME.LIZARDY,
            level2: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_2_WOODS.LIZARDY,
            level3: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_3_WILDS.LIZARDY,
            level4: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_4_FRONTIER.LIZARDY
        },
        behaviorType: 'basic',
        stats: {
            health: 1,
            damage: 1
        }
    });

    ContentRegistry.registerEnemy('lizardo', {
        weight: 2,
        spawnRules: {
            level1: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_1_HOME.LIZARDO,
            level2: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_2_WOODS.LIZARDO,
            level3: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_3_WILDS.LIZARDO,
            level4: 0
        },
        behaviorType: 'basic',
        stats: {
            health: 2,
            damage: 1
        }
    });

    ContentRegistry.registerEnemy('lizardeaux', {
        weight: 3,
        spawnRules: {
            level1: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_1_HOME.LIZARDEAUX,
            level2: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_2_WOODS.LIZARDEAUX,
            level3: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_3_WILDS.LIZARDEAUX,
            level4: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_4_FRONTIER.LIZARDEAUX
        },
        behaviorType: 'advanced',
        stats: {
            health: 3,
            damage: 1
        }
    });

    ContentRegistry.registerEnemy('lizord', {
        weight: 3,
        spawnRules: {
            level1: 0,
            level2: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_2_WOODS.LIZORD,
            level3: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_3_WILDS.LIZORD,
            level4: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_4_FRONTIER.LIZORD
        },
        behaviorType: 'tactical',
        stats: {
            health: 3,
            damage: 2
        }
    });

    ContentRegistry.registerEnemy('lazerd', {
        weight: 5,
        spawnRules: {
            level1: 0,
            level2: 0,
            level3: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_3_WILDS.LAZERD,
            level4: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_4_FRONTIER.LAZERD
        },
        behaviorType: 'elite',
        stats: {
            health: 5,
            damage: 2
        }
    });

    ContentRegistry.registerEnemy('zard', {
        weight: 3,
        spawnRules: {
            level1: 0,
            level2: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_2_WOODS.ZARD,
            level3: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_3_WILDS.ZARD,
            level4: SPAWN_PROBABILITIES.ENEMY_TYPES.LEVEL_4_FRONTIER.ZARD
        },
        behaviorType: 'charger',
        stats: {
            health: 3,
            damage: 2
        }
    });
}
