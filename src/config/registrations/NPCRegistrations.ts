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
            x: undefined, // Placed via special logic
            y: undefined,
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

    // ==================== GOSSIP NPCs (added 2025-11-11) ====================

    ContentRegistry.registerNPC('fude', {
        tileType: TILE_TYPES.FUDE,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('spitze', {
        tileType: TILE_TYPES.SPITZE,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('lupi', {
        tileType: TILE_TYPES.LUPI,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('dinkus', {
        tileType: TILE_TYPES.DINKUS,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('cartouche', {
        tileType: TILE_TYPES.CARTOUCHE,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('creta', {
        tileType: TILE_TYPES.CRETA,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('kaji', {
        tileType: TILE_TYPES.KAJI,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('dash', {
        tileType: TILE_TYPES.DASH,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('em', {
        tileType: TILE_TYPES.EM,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('fascia', {
        tileType: TILE_TYPES.FASCIA,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('bullet', {
        tileType: TILE_TYPES.BULLET,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('coursier', {
        tileType: TILE_TYPES.COURSIER,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('punto', {
        tileType: TILE_TYPES.PUNTO,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('y', {
        tileType: TILE_TYPES.Y,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('spectrum', {
        tileType: TILE_TYPES.SPECTRUM,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('palimpsest', {
        tileType: TILE_TYPES.PALIMPSEST,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('bladder', {
        tileType: TILE_TYPES.BLADDER,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('fascinus', {
        tileType: TILE_TYPES.FASCINUS,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('font', {
        tileType: TILE_TYPES.FONT,
        action: 'dialogue'
    });

    ContentRegistry.registerNPC('grawlix', {
        tileType: TILE_TYPES.GRAWLIX,
        action: 'dialogue'
    });
}
