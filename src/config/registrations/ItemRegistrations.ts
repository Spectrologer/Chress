/**
 * ItemRegistrations - Register all game items with ContentRegistry
 */

import { ContentRegistry } from '../../core/ContentRegistry';
import { TILE_TYPES, SPAWN_PROBABILITIES } from '../../core/constants/index';

// Import item effects
import { FoodEffect, WaterEffect, HeartEffect } from '../../managers/inventory/effects/ConsumableEffects';
import { AxeEffect, HammerEffect } from '../../managers/inventory/effects/ToolEffects';
import { BombEffect, BowEffect, BishopSpearEffect, HorseIconEffect } from '../../managers/inventory/effects/WeaponEffects';
import { ShovelEffect, NoteEffect, BookOfTimeTravelEffect } from '../../managers/inventory/effects/SpecialEffects';

/**
 * Register all items with the ContentRegistry
 */
export function registerItems(): void {
    // ==================== CONSUMABLES ====================

    ContentRegistry.registerItem('food', {
        tileType: TILE_TYPES.FOOD,
        stackable: true,
        radial: false,
        effect: new FoodEffect(),
        spawnWeight: 0, // Spawned via special food/water logic
        getTooltip: (item: any) => {
            const foodName = formatFoodName(item.foodType);
            const foodQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
            if (item.foodType === 'items/consumables/aguamelin.png') {
                return `${foodName}${foodQuantity} - Restores 5 hunger, 5 thirst`;
            }
            return `${foodName}${foodQuantity} - Restores 10 hunger`;
        },
        getImageKey: (item: any) => {
            if (item.foodType) {
                // Extract just the filename to match TextureLoader's food asset registration
                // e.g., 'items/consumables/aguamelin.png' -> 'aguamelin'
                return item.foodType.split('/').pop().replace('.png', '');
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
        getTooltip: (item: any) => {
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

    // ==================== TOOLS ====================

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
        radial: false,
        effect: new ShovelEffect(),
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.SHOVEL,
        spawnRules: {
            minLevel: 1,
            maxLevel: 4,
            dimension: 'any',
            isActivated: true
        },
        getTooltip: (item: any) => `Shovel - Digs a hole in an adjacent empty tile. Has ${item.uses} uses.`,
        getImageKey: () => 'shovel',
        metadata: {
            defaultUses: 3
        }
    });

    // ==================== WEAPONS ====================

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
        getTooltip: (item: any) => {
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
        getTooltip: (item: any) => {
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
        getTooltip: (item: any) => {
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
        getTooltip: (item: any) => {
            const disabledText = item.disabled ? ' (DISABLED)' : '';
            return `Horse Icon${disabledText} - Charge in L-shape (knight moves) towards enemies, has ${item.uses} charges`;
        },
        getImageKey: () => 'horse',
        metadata: {
            defaultUses: 3
        }
    });

    // ==================== SPECIAL ITEMS ====================

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
        getTooltip: (item: any) => `Book of Time Travel - Passes one turn, allowing enemies to move. Has ${item.uses} charges.`,
        getImageKey: () => 'book',
        metadata: {
            defaultUses: 1
        }
    });

    // ==================== NPCs (as items for spawning) ====================

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

    // ==================== ENVIRONMENT ====================

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

// ==================== HELPER FUNCTIONS ====================

function formatFoodName(foodType: string): string {
    if (!foodType) return '';
    try {
        // Extract just the filename (e.g., 'items/consumables/beaf.png' -> 'beaf')
        return foodType.split('/').pop()!.replace('.png', '');
    } catch (e) {
        return foodType.replace('.png', '');
    }
}
