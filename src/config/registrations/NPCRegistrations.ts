/**
 * NPCRegistrations - Register all NPCs with ContentRegistry
 */

import { ContentRegistry } from '@core/ContentRegistry';
import { TILE_TYPES, SPAWN_PROBABILITIES } from '@core/constants/index';

interface NPCPlacement {
    zone?: string;
    x?: number | null;
    y?: number | null;
    dimension?: number;
    spawnWeight?: number;
}

interface NPCConfig {
    tileType: number;
    action: string;
    placement?: NPCPlacement;
}

/**
 * Register all NPCs with the ContentRegistry
 */
export function registerNPCs(): void {
    // ==================== MERCHANT NPCs (Barter) ====================

    ContentRegistry.registerNPC('penne', {
        tileType: TILE_TYPES.PENNE,
        action: 'barter',
        placement: {
            zone: 'home_interior',
            spawnWeight: SPAWN_PROBABILITIES.INTERIOR.HOME_PENNE_NPC
        }
    });

    ContentRegistry.registerNPC('squig', {
        tileType: TILE_TYPES.SQUIG,
        action: 'barter',
        placement: {
            zone: 'home_interior',
            spawnWeight: SPAWN_PROBABILITIES.INTERIOR.HOME_SQUIG_NPC
        }
    });

    ContentRegistry.registerNPC('rune', {
        tileType: TILE_TYPES.RUNE,
        action: 'barter'
    });

    ContentRegistry.registerNPC('nib', {
        tileType: TILE_TYPES.NIB,
        action: 'barter'
    });

    ContentRegistry.registerNPC('mark', {
        tileType: TILE_TYPES.MARK,
        action: 'barter'
    });

    ContentRegistry.registerNPC('axelotl', {
        tileType: TILE_TYPES.AXELOTL,
        action: 'barter',
        placement: {
            zone: 'home_underground',
            x: null, // Placed via special logic
            y: null,
            dimension: 2
        }
    });

    ContentRegistry.registerNPC('gouge', {
        tileType: TILE_TYPES.GOUGE,
        action: 'barter'
    });

    // ==================== DIALOGUE NPCs ====================

    ContentRegistry.registerNPC('crayn', {
        tileType: TILE_TYPES.CRAYN,
        action: 'dialogue',
        placement: {
            zone: 'home_interior',
            x: 4,
            y: 4
        }
    });

    ContentRegistry.registerNPC('felt', {
        tileType: TILE_TYPES.FELT,
        action: 'dialogue',
        placement: {
            zone: 'home_interior',
            x: 6,
            y: 3
        }
    });

    ContentRegistry.registerNPC('forge', {
        tileType: TILE_TYPES.FORGE,
        action: 'dialogue',
        placement: {
            zone: 'home_interior',
            x: 3,
            y: 3
        }
    });
}
