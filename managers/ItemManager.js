import { TILE_TYPES } from '../core/constants.js';

const STACKABLE_ITEMS = ['food', 'water', 'bomb', 'note', 'heart', 'bishop_spear', 'horse_icon', 'book_of_time_travel', 'bow', 'shovel'];
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

    // Add an item to a player's inventory, merging with existing stacks when appropriate.
    // Returns true if the item was added or merged, false if inventory was full and couldn't be added.
    addItemToInventory(player, item, sound = 'pickup') {
        if (!player || !item) return false;

        const playSoundAndAnimate = (it) => {
            try {
                const key = this._getImageKeyForItem(it);
                player.animations.pickupHover = { imageKey: key, frames: 60, totalFrames: 60, type: it.type, foodType: it.foodType };
            } catch (e) {}
            if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                this.game.soundManager.playSound(sound);
            } else if (typeof window !== 'undefined' && window.soundManager?.playSound) {
                window.soundManager.playSound(sound);
            }
        };

        if (STACKABLE_ITEMS.includes(item.type)) {
            const existingStack = player.inventory.find(i => i.type === item.type && (typeof item.foodType === 'undefined' || i.foodType === item.foodType));
            if (existingStack) {
                if (item.uses) {
                    existingStack.uses = (existingStack.uses || 0) + item.uses;
                } else {
                    existingStack.quantity = (existingStack.quantity || 1) + (item.quantity || 1);
                }
                playSoundAndAnimate(item);
                return true;
            }
        }

        if (player.inventory.length < 6) {
            // Initialize quantity for stackable consumables so stacks behave consistently
            if (item.type === 'food' || item.type === 'water' || item.type === 'bomb' || item.type === 'note' || item.type === 'heart') {
                if (typeof item.quantity === 'undefined') item.quantity = 1;
            }
            player.inventory.push(item);
            playSoundAndAnimate(item);
            return true;
        }

        return false; // Inventory full and no existing stack
    }

    handleItemPickup(player, x, y, grid) {
        const tile = grid[y][x];
        if (!tile) return;

        const pickup = (item, sound = 'pickup') => {
            const success = this.addItemToInventory(player, item, sound);
            if (success) {
                grid[y][x] = TILE_TYPES.FLOOR;
            }
        };

        const getImageKeyForItem = (item) => {
            // Map item.type to texture keys used by TextureLoader
            if (!item) return null;
            if (item.type === 'food' && item.foodType) return item.foodType.replace('.png', '').replace('/', '_');
            if (item.type === 'water') return 'water';
            if (item.type === 'axe') return 'axe';
            if (item.type === 'bomb') return 'bomb';
            if (item.type === 'note') return 'note';
            if (item.type === 'heart') return 'heart';
            if (item.type === 'bishop_spear') return 'spear';
            if (item.type === 'horse_icon') return 'horse';
            if (item.type === 'book_of_time_travel') return 'book';
            if (item.type === 'bow') return 'bow';
            if (item.type === 'shovel') return 'shovel';
            return null;
        };

        // Expose image key helper for other methods (used by addItemToInventory)
        this._getImageKeyForItem = getImageKeyForItem;

        const isStackableItem = (tile) => {
            // Handle both object tiles (tile.type) and primitive tile constants
            if (tile === TILE_TYPES.NOTE) return true;
            if (tile === TILE_TYPES.WATER) return true;
            if (tile === TILE_TYPES.HEART) return true;
            if (tile === TILE_TYPES.BOMB) return true;
            if (tile && tile.type) {
                const itemType = typeMap[tile.type] || (tile.type === TILE_TYPES.FOOD ? 'food' : null);
                return STACKABLE_ITEMS.includes(itemType);
            }
            return false;
        };

        const canPickup = player.inventory.length < 6;
        const isStackable = isStackableItem(tile) || (tile.type && isStackableItem(tile));
        const hasExistingStack = player.inventory.some(i => 
            (i.type === 'water' && tile === TILE_TYPES.WATER) ||
            (i.type === 'heart' && tile === TILE_TYPES.HEART) ||
            (i.type === 'note' && tile === TILE_TYPES.NOTE) ||
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
            case TILE_TYPES.HEART:
                if (canPickupOrStack) {
                    pickup({ type: 'heart' });
                } else {
                    // If inventory is full and there's no stack, restore health directly
                    player.setHealth((player.getHealth ? player.getHealth() : 0) + 1);
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
