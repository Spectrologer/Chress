import { TILE_TYPES } from '../../core/constants.js';

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
    static STACKABLE_ITEMS = [
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
    static RADIAL_TYPES = [
        'bomb',
        'horse_icon',
        'bow',
        'bishop_spear',
        'book_of_time_travel'
    ];

    // Tile type to item type mapping for pickup
    static TILE_TYPE_MAP = {
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
    static getTooltipText(item) {
        if (!item) return '';

        const disabledText = item.disabled ? ' (DISABLED)' : '';

        switch (item.type) {
            case 'food': {
                const foodName = this._formatFoodName(item.foodType);
                const foodQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';

                if (item.foodType === 'food/aguamelin.png') {
                    return `${foodName}${foodQuantity} - Restores 5 hunger, 5 thirst`;
                }
                return `${foodName}${foodQuantity} - Restores 10 hunger`;
            }

            case 'water': {
                const waterQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
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
                const bombQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
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
    static getImageKey(item) {
        if (!item) return null;

        if (item.type === 'food' && item.foodType) {
            return item.foodType.replace('.png', '').replace('/', '_');
        }

        const keyMap = {
            'water': 'water',
            'axe': 'axe',
            'bomb': 'bomb',
            'note': 'note',
            'heart': 'heart',
            'bishop_spear': 'spear',
            'horse_icon': 'horse',
            'book_of_time_travel': 'book',
            'bow': 'bow',
            'shovel': 'shovel'
        };

        return keyMap[item.type] || null;
    }

    /**
     * Check if an item type is stackable
     */
    static isStackable(itemType) {
        return this.STACKABLE_ITEMS.includes(itemType);
    }

    /**
     * Check if an item type belongs in the radial inventory
     */
    static isRadialType(itemType) {
        return this.RADIAL_TYPES.includes(itemType);
    }

    /**
     * Check if an item/tile is stackable (handles both object tiles and primitives)
     */
    static isStackableItem(tile) {
        // Handle primitive tile constants
        if (tile === TILE_TYPES.NOTE) return true;
        if (tile === TILE_TYPES.WATER) return true;
        if (tile === TILE_TYPES.HEART) return true;
        if (tile === TILE_TYPES.BOMB) return true;

        // Handle object-based tiles
        if (tile && tile.type) {
            const itemType = this.TILE_TYPE_MAP[tile.type] ||
                           (tile.type === TILE_TYPES.FOOD ? 'food' : null);
            return itemType ? this.isStackable(itemType) : false;
        }

        return false;
    }

    /**
     * Get default quantity for stackable consumables
     */
    static getDefaultQuantity(itemType) {
        const consumables = ['food', 'water', 'bomb', 'note', 'heart'];
        return consumables.includes(itemType) ? 1 : undefined;
    }

    /**
     * Normalize item shape (e.g., books should use 'uses' not 'quantity')
     */
    static normalizeItem(item) {
        if (!item) return item;

        // Books should always use 'uses' not 'quantity'
        if (item.type === 'book_of_time_travel') {
            if (typeof item.uses === 'undefined') {
                item.uses = (typeof item.quantity !== 'undefined') ? item.quantity : 1;
            }
            try { delete item.quantity; } catch (e) {}
        }

        // Initialize quantity for stackable consumables
        const defaultQty = this.getDefaultQuantity(item.type);
        if (defaultQty !== undefined && typeof item.quantity === 'undefined') {
            item.quantity = defaultQty;
        }

        return item;
    }

    /**
     * Helper: Format food name from foodType path
     * @private
     */
    static _formatFoodName(foodType) {
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
}
