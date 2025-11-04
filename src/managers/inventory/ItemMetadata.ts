import { TILE_TYPES } from '@core/constants/index';
import { isTileType } from '@utils/TileUtils';

// Type definitions for items
export interface BaseItem {
    type: string;
    disabled?: boolean;
    [key: string]: unknown;
}

export interface FoodItem extends BaseItem {
    type: 'food';
    foodType: string;
    quantity?: number;
}

export interface WaterItem extends BaseItem {
    type: 'water';
    quantity?: number;
}

export interface AxeItem extends BaseItem {
    type: 'axe';
}

export interface HammerItem extends BaseItem {
    type: 'hammer';
}

export interface BishopSpearItem extends BaseItem {
    type: 'bishop_spear';
    uses: number;
}

export interface HorseIconItem extends BaseItem {
    type: 'horse_icon';
    uses: number;
}

export interface BombItem extends BaseItem {
    type: 'bomb';
    quantity?: number;
}

export interface HeartItem extends BaseItem {
    type: 'heart';
    quantity?: number;
}

export interface NoteItem extends BaseItem {
    type: 'note';
    quantity?: number;
}

export interface BookOfTimeTravelItem extends BaseItem {
    type: 'book_of_time_travel';
    uses: number;
}

export interface BowItem extends BaseItem {
    type: 'bow';
    uses: number;
}

export interface ShovelItem extends BaseItem {
    type: 'shovel';
    uses: number;
}

export type InventoryItem =
    | FoodItem
    | WaterItem
    | AxeItem
    | HammerItem
    | BishopSpearItem
    | HorseIconItem
    | BombItem
    | HeartItem
    | NoteItem
    | BookOfTimeTravelItem
    | BowItem
    | ShovelItem;

export type ItemType = InventoryItem['type'];

/**
 * ItemMetadata - Single source of truth for item static data
 *
 * Consolidates:
 * - Tooltip generation (from ItemUtils, ItemService, InventoryService)
 * - Item type constants (STACKABLE_ITEMS, RADIAL_TYPES)
 * - Image key mapping (from ItemManager)
 * - Item type checking helpers
 *
 * This eliminates duplication across 3+ files with identical tooltip logic.
 */
export class ItemMetadata {
    // Items that can stack in inventory (combine quantities)
    static readonly STACKABLE_ITEMS: readonly ItemType[] = [
        'food',
        'water',
        'bomb',
        'note',
        'heart',
        'bishop_spear',
        'horse_icon',
        'book_of_time_travel',
        'bow',
        'shovel'
    ];

    // Items that go into radial quick-action inventory instead of main inventory
    static readonly RADIAL_TYPES: readonly ItemType[] = [
        'bomb',
        'horse_icon',
        'bow',
        'bishop_spear',
        'book_of_time_travel'
    ];

    // Tile type to item type mapping for pickup
    static readonly TILE_TYPE_MAP: Record<number, ItemType> = {
        [TILE_TYPES.BOW]: 'bow',
        [TILE_TYPES.BISHOP_SPEAR]: 'bishop_spear',
        [TILE_TYPES.HORSE_ICON]: 'horse_icon',
        [TILE_TYPES.BOOK_OF_TIME_TRAVEL]: 'book_of_time_travel',
        [TILE_TYPES.SHOVEL]: 'shovel'
    };

    /**
     * Get user-friendly tooltip text for an item
     * Consolidates duplicate logic from:
     * - ItemUtils.getItemTooltipText()
     * - ItemService.getItemTooltipText()
     * - InventoryService.getItemTooltipText()
     */
    static getTooltipText(item: InventoryItem | null | undefined): string {
        if (!item) return '';

        const disabledText = item.disabled ? ' (DISABLED)' : '';

        switch (item.type) {
            case 'food': {
                const foodName = this._formatFoodName(item.foodType);
                const foodQuantity = (item.quantity && item.quantity > 1) ? ` (x${item.quantity})` : '';

                if (item.foodType === 'items/consumables/aguamelin.png') {
                    return `${foodName}${foodQuantity} - Restores 5 hunger, 5 thirst`;
                }
                return `${foodName}${foodQuantity} - Restores 10 hunger`;
            }

            case 'water': {
                const waterQuantity = (item.quantity && item.quantity > 1) ? ` (x${item.quantity})` : '';
                return `Water${waterQuantity} - Restores 10 thirst`;
            }

            case 'axe':
                return 'Axe - Chops grass and shrubbery to create pathways';

            case 'hammer':
                return 'Hammer - Breaks rocks to create pathways';

            case 'bishop_spear':
                return `Bishop Spear${disabledText} - Charge diagonally towards enemies, has ${item.uses} charges`;

            case 'horse_icon':
                return `Horse Icon${disabledText} - Charge in L-shape (knight moves) towards enemies, has ${item.uses} charges`;

            case 'bomb': {
                const bombQuantity = (item.quantity && item.quantity > 1) ? ` (x${item.quantity})` : '';
                return `Bomb${bombQuantity} - Blasts through walls to create exits`;
            }

            case 'heart':
                return 'Heart - Restores 1 health';

            case 'note':
                return 'Map Note - Marks an undiscovered location 15-20 zones away on the map';

            case 'book_of_time_travel':
                return `Book of Time Travel - Passes one turn, allowing enemies to move. Has ${item.uses} charges.`;

            case 'bow':
                return `Bow${disabledText} - Fires an arrow in an orthogonal direction. Has ${item.uses} charges.`;

            case 'shovel':
                return `Shovel - Digs a hole in an adjacent empty tile. Has ${item.uses} uses.`;

            default:
                return '';
        }
    }

    /**
     * Get the texture key for an item (used by TextureLoader)
     * Consolidates logic from ItemManager._getImageKeyForItem()
     */
    static getImageKey(item: InventoryItem | null | undefined): string | null {
        if (!item) return null;

        if (item.type === 'food' && item.foodType) {
            // Extract just the filename to match TextureLoader's food asset registration
            // e.g., 'items/consumables/aguamelin.png' -> 'aguamelin'
            return item.foodType.split('/').pop()?.replace('.png', '') || null;
        }

        const keyMap: Record<ItemType, string> = {
            'water': 'water',
            'axe': 'axe',
            'bomb': 'bomb',
            'note': 'note',
            'heart': 'heart',
            'bishop_spear': 'spear',
            'horse_icon': 'horse',
            'book_of_time_travel': 'book',
            'bow': 'bow',
            'shovel': 'shovel',
            'food': 'food', // Handled above
            'hammer': 'hammer'
        };

        return keyMap[item.type] || null;
    }

    /**
     * Check if an item type is stackable
     */
    static isStackable(itemType: string): boolean {
        return (this.STACKABLE_ITEMS as readonly string[]).includes(itemType);
    }

    /**
     * Check if an item type belongs in the radial inventory
     */
    static isRadialType(itemType: string): boolean {
        return (this.RADIAL_TYPES as readonly string[]).includes(itemType);
    }

    /**
     * Check if an item/tile is stackable (handles both object tiles and primitives)
     */
    static isStackableItem(tile: any): boolean {
        // Handle primitive tile constants
        if (isTileType(tile, TILE_TYPES.NOTE)) return true;
        if (isTileType(tile, TILE_TYPES.WATER)) return true;
        if (isTileType(tile, TILE_TYPES.HEART)) return true;
        if (isTileType(tile, TILE_TYPES.BOMB)) return true;

        // Handle object-based tiles
        if (tile && tile.type) {
            const itemType = this.TILE_TYPE_MAP[tile.type] ||
                           (isTileType(tile, TILE_TYPES.FOOD) ? 'food' : null);
            return itemType ? this.isStackable(itemType) : false;
        }

        return false;
    }

    /**
     * Get default quantity for stackable consumables
     */
    static getDefaultQuantity(itemType: string): number | undefined {
        const consumables = ['food', 'water', 'bomb', 'note', 'heart'];
        return consumables.includes(itemType) ? 1 : undefined;
    }

    /**
     * Normalize item shape (e.g., books should use 'uses' not 'quantity')
     */
    static normalizeItem<T extends Partial<InventoryItem>>(item: T): T {
        if (!item) return item;

        // Books should always use 'uses' not 'quantity'
        if (item.type === 'book_of_time_travel') {
            if (typeof (item as any).uses === 'undefined') {
                (item as any).uses = (typeof (item as any).quantity !== 'undefined') ? (item as any).quantity : 1;
            }
            delete (item as any).quantity;
        }

        // Initialize uses for items that need them (shovel, bow, bishop_spear, horse_icon)
        const itemsWithUses: Record<string, number> = {
            'shovel': 3,
            'bow': 3,
            'bishop_spear': 3,
            'horse_icon': 3
        };
        if (item.type && item.type in itemsWithUses && typeof (item as any).uses === 'undefined') {
            (item as any).uses = itemsWithUses[item.type];
        }

        // Initialize quantity for stackable consumables
        const defaultQty = this.getDefaultQuantity(item.type || '');
        if (defaultQty !== undefined && typeof (item as any).quantity === 'undefined') {
            (item as any).quantity = defaultQty;
        }

        return item;
    }

    /**
     * Helper: Format food name from foodType path
     * @private
     */
    private static _formatFoodName(foodType: string): string {
        if (!foodType) return '';

        try {
            // Extract just the filename (e.g., 'items/consumables/beaf.png' -> 'beaf')
            return foodType.split('/').pop()?.replace('.png', '') || '';
        } catch (e) {
            return foodType.replace('.png', '');
        }
    }
}
