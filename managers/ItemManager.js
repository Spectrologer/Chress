import { TILE_TYPES } from '../core/constants.js';

const STACKABLE_ITEMS = ['food', 'water', 'bomb', 'bishop_spear', 'horse_icon', 'book_of_time_travel', 'bow', 'shovel'];
// Type mapping for special object-based tiles
const typeMap = {
    [TILE_TYPES.BOW]: 'bow',
    [TILE_TYPES.BISHOP_SPEAR]: 'bishop_spear',
    [TILE_TYPES.HORSE_ICON]: 'horse_icon',
    [TILE_TYPES.BOOK_OF_TIME_TRAVEL]: 'book_of_time_travel',
    [TILE_TYPES.SHOVEL]: 'shovel'
};

export class ItemManager {
    constructor(game) {
        this.game = game;
    }

    handleItemPickup(player, x, y, grid) {
        const tile = grid[y][x];
        if (!tile) return;

        const pickup = (item, sound = 'pickup') => {            
            if (STACKABLE_ITEMS.includes(item.type)) {
                const existingStack = player.inventory.find(i => i.type === item.type && i.foodType === item.foodType);
                if (existingStack) {
                    if (item.uses) {
                        existingStack.uses = (existingStack.uses || 0) + item.uses;
                    } else {
                        existingStack.quantity = (existingStack.quantity || 1) + 1;
                    }
                    grid[y][x] = TILE_TYPES.FLOOR;
                    window.soundManager?.playSound(sound);
                    return;
                }
            }

            // If no stack exists or it's not a stackable item, add to a new slot if space is available
            if (player.inventory.length < 6) {
                if (item.type === 'food' || item.type === 'water' || item.type === 'bomb') {
                    item.quantity = 1; // Start a new stack
                }
                // For items with uses, the 'uses' property is already on the item object.
                // We just need to ensure it's added to inventory.
                if (item.uses && !item.quantity) {
                    // It's a new item with uses, just push it.
                }
                player.inventory.push(item);
                grid[y][x] = TILE_TYPES.FLOOR;
                window.soundManager?.playSound(sound);
            }
        };

        const isStackableItem = (tile) => {
            const itemType = typeMap[tile.type] || (tile.type === TILE_TYPES.FOOD ? 'food' : (tile === TILE_TYPES.WATER ? 'water' : (tile === TILE_TYPES.BOMB ? 'bomb' : null)));
            return STACKABLE_ITEMS.includes(itemType);
        };

        const canPickup = player.inventory.length < 6;
        const isStackable = isStackableItem(tile) || (tile.type && isStackableItem(tile));
        const hasExistingStack = player.inventory.some(i => 
            (i.type === 'water' && tile === TILE_TYPES.WATER) ||
            (i.type === 'food' && tile.type === TILE_TYPES.FOOD && i.foodType === tile.foodType)
        );

        const canPickupOrStack = canPickup || (isStackable && hasExistingStack);

        switch (tile) {
            case TILE_TYPES.WATER:
                if (canPickupOrStack) {
                    pickup({ type: 'water' });
                } else {
                    player.restoreThirst(10);
                }
                grid[y][x] = TILE_TYPES.FLOOR;
                break;
            case TILE_TYPES.AXE:
                pickup({ type: 'axe' });
                break;
            case TILE_TYPES.HAMMER:
                // Hammer is now an ability, not an inventory item.
                // This case can be removed if hammer is never a pickup-able item.
                // For now, let's assume it might be for backward compatibility.
                break;
            case TILE_TYPES.BOMB:
                pickup({ type: 'bomb' });
                break;
            case TILE_TYPES.NOTE:
                pickup({ type: 'note' });
                break;
            default:
                // Handle object-based tiles
                if (tile.type) {
                    switch (tile.type) {
                        case TILE_TYPES.FOOD:
                            if (canPickupOrStack) {
                                pickup({ type: 'food', foodType: tile.foodType });
                            } else {
                                player.restoreHunger(10);
                            }
                            grid[y][x] = TILE_TYPES.FLOOR;
                            break;
                        case TILE_TYPES.BISHOP_SPEAR:
                        case TILE_TYPES.HORSE_ICON:
                        case TILE_TYPES.BOOK_OF_TIME_TRAVEL:
                        case TILE_TYPES.BOW:
                        case TILE_TYPES.SHOVEL:
                            pickup({ type: typeMap[tile.type] || 'unknown', uses: tile.uses });
                            break;
                    }
                }
                break;
        }
    }
}
