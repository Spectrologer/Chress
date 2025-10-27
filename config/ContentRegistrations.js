/**
 * ContentRegistrations - Register all game content with ContentRegistry
 *
 * This file serves as the single source of truth for all game content.
 * Instead of scattering definitions across 7-8 files, everything is here.
 *
 * To add new content:
 * 1. Import any required dependencies (effects, render strategies, etc.)
 * 2. Call the appropriate registration method
 * 3. Done! The content is now available throughout the game
 */

import { ContentRegistry } from '../core/ContentRegistry.js';
import { TILE_TYPES, SPAWN_PROBABILITIES } from '../core/constants/index.js';
import { boardLoader } from '../core/BoardLoader.js';

// Import item effects
import { FoodEffect, WaterEffect, HeartEffect } from '../managers/inventory/effects/ConsumableEffects.js';
import { AxeEffect, HammerEffect } from '../managers/inventory/effects/ToolEffects.js';
import { BombEffect, BowEffect, BishopSpearEffect, HorseIconEffect } from '../managers/inventory/effects/WeaponEffects.js';
import { ShovelEffect, NoteEffect, BookOfTimeTravelEffect } from '../managers/inventory/effects/SpecialEffects.js';

/**
 * Initialize all game content registrations
 * Call this once during game initialization
 */
export async function registerAllContent() {
    registerItems();
    registerNPCs();
    registerEnemies();
    registerBoards();
    // Zone handlers registered separately in ZoneGenerator

    // Pre-load custom boards
    await boardLoader.preloadAllBoards();

    ContentRegistry.markInitialized();
    const stats = ContentRegistry.getStats();

    if (stats.items === 0 || stats.npcs === 0 || stats.enemies === 0) {
        console.error('[ContentRegistry] WARNING: Some content categories are empty!', stats);
    }
}

// ==================== ITEM REGISTRATIONS ====================

function registerItems() {
    // CONSUMABLES

    ContentRegistry.registerItem('food', {
        tileType: TILE_TYPES.FOOD,
        stackable: true,
        radial: false,
        effect: new FoodEffect(),
        spawnWeight: 0, // Spawned via special food/water logic
        getTooltip: (item) => {
            const foodName = formatFoodName(item.foodType);
            const foodQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
            if (item.foodType === 'food/aguamelin.png') {
                return `${foodName}${foodQuantity} - Restores 5 hunger, 5 thirst`;
            }
            return `${foodName}${foodQuantity} - Restores 10 hunger`;
        },
        getImageKey: (item) => {
            if (item.foodType) {
                return item.foodType.replace('.png', '').replace('/', '_');
            }
            return 'food';
        }
    });

    ContentRegistry.registerItem('water', {
        tileType: TILE_TYPES.WATER,
        stackable: true,
        radial: false,
        effect: new WaterEffect(),
        spawnWeight: 0, // Spawned via special food/water logic
        getTooltip: (item) => {
            const waterQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
            return `Water${waterQuantity} - Restores 10 thirst`;
        },
        getImageKey: () => 'water'
    });

    ContentRegistry.registerItem('heart', {
        tileType: TILE_TYPES.HEART,
        stackable: true,
        radial: false,
        effect: new HeartEffect(),
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.HEART,
        spawnRules: {
            minLevel: 1,
            maxLevel: 4,
            dimension: 'any'
        },
        getTooltip: () => 'Heart - Restores 1 health',
        getImageKey: () => 'heart'
    });

    // TOOLS

    ContentRegistry.registerItem('axe', {
        tileType: TILE_TYPES.AXE,
        stackable: false,
        radial: false,
        effect: new AxeEffect(),
        spawnWeight: 0, // Spawned in home zone only
        getTooltip: () => 'Axe - Chops grass and shrubbery to create pathways',
        getImageKey: () => 'axe'
    });

    ContentRegistry.registerItem('hammer', {
        tileType: TILE_TYPES.HAMMER,
        stackable: false,
        radial: false,
        effect: new HammerEffect(),
        spawnWeight: 0, // Obtained via trading with Gouge
        getTooltip: () => 'Hammer - Breaks rocks to create pathways',
        getImageKey: () => 'hammer'
    });

    ContentRegistry.registerItem('shovel', {
        tileType: TILE_TYPES.SHOVEL,
        stackable: true,
        radial: true,
        effect: new ShovelEffect(),
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.SHOVEL,
        spawnRules: {
            minLevel: 1,
            maxLevel: 4,
            dimension: 'any',
            isActivated: true
        },
        getTooltip: (item) => `Shovel - Digs a hole in an adjacent empty tile. Has ${item.uses} uses.`,
        getImageKey: () => 'shovel',
        metadata: {
            defaultUses: 3
        }
    });

    // WEAPONS

    ContentRegistry.registerItem('bomb', {
        tileType: TILE_TYPES.BOMB,
        stackable: true,
        radial: true,
        effect: new BombEffect(),
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.BOMB,
        spawnRules: {
            minLevel: 1,
            maxLevel: 4,
            dimension: 'any',
            isActivated: true
        },
        getTooltip: (item) => {
            const bombQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
            return `Bomb${bombQuantity} - Blasts through walls to create exits`;
        },
        getImageKey: () => 'bomb'
    });

    ContentRegistry.registerItem('bow', {
        tileType: TILE_TYPES.BOW,
        stackable: true,
        radial: true,
        effect: new BowEffect(),
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.BOW,
        spawnRules: {
            minLevel: 1,
            maxLevel: 4,
            dimension: 'any',
            isActivated: true
        },
        getTooltip: (item) => {
            const disabledText = item.disabled ? ' (DISABLED)' : '';
            return `Bow${disabledText} - Fires an arrow in an orthogonal direction. Has ${item.uses} charges.`;
        },
        getImageKey: () => 'bow',
        metadata: {
            defaultUses: 3
        }
    });

    ContentRegistry.registerItem('bishop_spear', {
        tileType: TILE_TYPES.BISHOP_SPEAR,
        stackable: true,
        radial: true,
        effect: new BishopSpearEffect(),
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.BISHOP_SPEAR,
        spawnRules: {
            minLevel: 1,
            maxLevel: 4,
            dimension: 'any',
            isActivated: true
        },
        getTooltip: (item) => {
            const disabledText = item.disabled ? ' (DISABLED)' : '';
            return `Bishop Spear${disabledText} - Charge diagonally towards enemies, has ${item.uses} charges`;
        },
        getImageKey: () => 'spear',
        metadata: {
            defaultUses: 3
        }
    });

    ContentRegistry.registerItem('horse_icon', {
        tileType: TILE_TYPES.HORSE_ICON,
        stackable: true,
        radial: true,
        effect: new HorseIconEffect(),
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.HORSE_ICON,
        spawnRules: {
            minLevel: 1,
            maxLevel: 4,
            dimension: 'any',
            isActivated: true
        },
        getTooltip: (item) => {
            const disabledText = item.disabled ? ' (DISABLED)' : '';
            return `Horse Icon${disabledText} - Charge in L-shape (knight moves) towards enemies, has ${item.uses} charges`;
        },
        getImageKey: () => 'horse',
        metadata: {
            defaultUses: 3
        }
    });

    // SPECIAL ITEMS

    ContentRegistry.registerItem('note', {
        tileType: TILE_TYPES.NOTE,
        stackable: true,
        radial: false,
        effect: new NoteEffect(),
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.NOTE,
        spawnRules: {
            dimension: 'any',
            isActivated: true
        },
        getTooltip: () => 'Map Note - Marks an undiscovered location 15-20 zones away on the map',
        getImageKey: () => 'note'
    });

    ContentRegistry.registerItem('book_of_time_travel', {
        tileType: TILE_TYPES.BOOK_OF_TIME_TRAVEL,
        stackable: true,
        radial: true,
        effect: new BookOfTimeTravelEffect(),
        spawnWeight: 0, // Not naturally spawned
        getTooltip: (item) => `Book of Time Travel - Passes one turn, allowing enemies to move. Has ${item.uses} charges.`,
        getImageKey: () => 'book',
        metadata: {
            defaultUses: 1
        }
    });

    // NPCs (as items for spawning purposes)
    // These have spawnWeight but are handled specially in ItemGenerator

    ContentRegistry.registerItem('squig', {
        tileType: TILE_TYPES.SQUIG,
        stackable: false,
        radial: false,
        effect: null,
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.SQUIG,
        spawnRules: {
            dimension: 0 // Surface only
        },
        getTooltip: () => 'Squig - Merchant NPC',
        getImageKey: () => 'squig'
    });

    ContentRegistry.registerItem('penne', {
        tileType: TILE_TYPES.PENNE,
        stackable: false,
        radial: false,
        effect: null,
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.PENNE,
        spawnRules: {
            dimension: 0 // Surface only
        },
        getTooltip: () => 'Penne - Merchant NPC',
        getImageKey: () => 'penne'
    });

    ContentRegistry.registerItem('nib', {
        tileType: TILE_TYPES.NIB,
        stackable: false,
        radial: false,
        effect: null,
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.NIB,
        spawnRules: {
            dimension: 2 // Underground only
        },
        getTooltip: () => 'Nib - Merchant NPC',
        getImageKey: () => 'nib'
    });

    ContentRegistry.registerItem('mark', {
        tileType: TILE_TYPES.MARK,
        stackable: false,
        radial: false,
        effect: null,
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.MARK,
        spawnRules: {
            dimension: 0 // Surface only
        },
        getTooltip: () => 'Mark - Merchant NPC',
        getImageKey: () => 'mark'
    });

    ContentRegistry.registerItem('rune', {
        tileType: TILE_TYPES.RUNE,
        stackable: false,
        radial: false,
        effect: null,
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.RUNE,
        spawnRules: {
            dimension: 2 // Underground only
        },
        getTooltip: () => 'Rune - Merchant NPC',
        getImageKey: () => 'rune'
    });

    ContentRegistry.registerItem('axelotl', {
        tileType: TILE_TYPES.AXELOTL,
        stackable: false,
        radial: false,
        effect: null,
        spawnWeight: 0, // Special spawn in zone 0,0 underground depth 1
        getTooltip: () => 'Axe-O-Lotl - Special merchant',
        getImageKey: () => 'axelotl'
    });

    ContentRegistry.registerItem('gouge', {
        tileType: TILE_TYPES.GOUGE,
        stackable: false,
        radial: false,
        effect: null,
        spawnWeight: 0, // Special spawn conditions
        getTooltip: () => 'Gouge - Hammer merchant',
        getImageKey: () => 'gouge'
    });

    // ENVIRONMENT

    ContentRegistry.registerItem('pitfall', {
        tileType: TILE_TYPES.PITFALL,
        stackable: false,
        radial: false,
        effect: null,
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.PITFALL,
        spawnRules: {
            minLevel: 2,
            maxLevel: 4,
            dimension: 0 // Surface only
        },
        getTooltip: () => 'Pitfall - Falls to underground',
        getImageKey: () => 'pitfall'
    });
}

// ==================== NPC REGISTRATIONS ====================

function registerNPCs() {
    // MERCHANT NPCs (Barter)

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

    // DIALOGUE NPCs

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

// ==================== ENEMY REGISTRATIONS ====================

function registerEnemies() {
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

// ==================== BOARD REGISTRATIONS ====================

/**
 * Register custom board JSON files for specific zones
 * These boards override procedural generation for canon/custom zones
 */
function registerBoards() {
    // Museum - The home interior at zone (0,0) dimension 1
    boardLoader.registerBoard(0, 0, 1, 'museum', 'canon');

    // Well - The home underground at zone (0,0) dimension 2
    boardLoader.registerBoard(0, 0, 2, 'well', 'canon');

    // Add more custom boards here as they are created
    // Example for custom boards:
    // boardLoader.registerBoard(5, 5, 0, 'special_surface_zone', 'custom');
    // boardLoader.registerBoard(2, 3, 2, 'underground_cavern', 'custom');
}

// ==================== HELPER FUNCTIONS ====================

function formatFoodName(foodType) {
    if (!foodType) return '';
    try {
        const parts = foodType.split('/');
        if (parts.length >= 2) {
            return parts[1].replace('.png', '');
        }
        return parts.pop().replace('.png', '');
    } catch (e) {
        return foodType.split('/').pop().replace('.png', '');
    }
}
