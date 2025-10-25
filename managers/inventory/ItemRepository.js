import { ItemMetadata } from './ItemMetadata.js';
import { saveRadialInventory } from '../RadialPersistence.js';

/**
 * ItemRepository - Pure data access layer for inventory management
 *
 * Consolidates inventory array manipulation from:
 * - ItemManager (stacking logic, add/remove)
 * - ItemService (_removeItemFromEither, _pruneZeroUseItems)
 *
 * Responsibilities:
 * - Add/remove items from inventories (main and radial)
 * - Stack/merge items
 * - Prune empty items
 * - Inventory space management
 *
 * This is a pure data layer with NO business logic or side effects
 * (except radial inventory persistence).
 */
export class ItemRepository {
    constructor(game) {
        this.game = game;
    }

    /**
     * Add an item to player inventory with automatic stacking
     * @param {Object} player - Player object
     * @param {Object} item - Item to add
     * @param {string} preferredInventory - 'main' or 'radial'
     * @returns {boolean} - True if successfully added, false if inventory full
     */
    addToInventory(player, item, preferredInventory = 'auto') {
        if (!player || !item) return false;

        // Normalize item shape (e.g., books use 'uses' not 'quantity')
        ItemMetadata.normalizeItem(item);

        // Determine which inventory to use
        const shouldUseRadial = preferredInventory === 'radial' ||
                               (preferredInventory === 'auto' && ItemMetadata.isRadialType(item.type));

        // Try radial inventory first for radial items
        if (shouldUseRadial) {
            const radialSuccess = this._addToRadialInventory(player, item);
            if (radialSuccess) return true;
            // Fall back to main inventory if radial is full
        }

        // Try main inventory
        return this._addToMainInventory(player, item);
    }

    /**
     * Remove an item from either inventory
     * Consolidates ItemService._removeItemFromEither()
     */
    removeItem(player, item) {
        if (!player || !item) return false;

        // Try main inventory
        const mainIdx = player.inventory.indexOf(item);
        if (mainIdx >= 0) {
            player.inventory.splice(mainIdx, 1);
            return true;
        }

        // Try radial inventory
        const radialIdx = player.radialInventory ? player.radialInventory.indexOf(item) : -1;
        if (radialIdx >= 0) {
            player.radialInventory.splice(radialIdx, 1);
            this._saveRadialInventory();
            return true;
        }

        return false;
    }

    /**
     * Decrement quantity or uses for an item and remove if depleted
     */
    decrementAndCleanup(player, item, amount = 1) {
        if (!player || !item) return false;

        // Decrement uses or quantity
        if (typeof item.uses !== 'undefined') {
            item.uses = Math.max(0, item.uses - amount);
        } else if (typeof item.quantity !== 'undefined') {
            item.quantity = Math.max(0, item.quantity - amount);
        } else {
            // Item has neither uses nor quantity, remove it entirely
            return this.removeItem(player, item);
        }

        // Remove if depleted
        if ((typeof item.uses !== 'undefined' && item.uses <= 0) ||
            (typeof item.quantity !== 'undefined' && item.quantity <= 0)) {
            return this.removeItem(player, item);
        }

        return true;
    }

    /**
     * Find an existing stack for an item in the specified inventory
     */
    findStackableItem(player, item, inventoryType = 'main') {
        if (!player || !item || !ItemMetadata.isStackable(item.type)) {
            return null;
        }

        const inventory = inventoryType === 'radial' ? player.radialInventory : player.inventory;
        if (!Array.isArray(inventory)) return null;

        return inventory.find(existing =>
            existing.type === item.type &&
            (typeof item.foodType === 'undefined' || existing.foodType === item.foodType)
        );
    }

    /**
     * Stack/merge an item into an existing stack
     */
    stackItems(existingItem, newItem) {
        if (!existingItem || !newItem) return false;

        if (typeof newItem.uses !== 'undefined') {
            existingItem.uses = (existingItem.uses || 0) + newItem.uses;
        } else {
            existingItem.quantity = (existingItem.quantity || 1) + (newItem.quantity || 1);
        }

        return true;
    }

    /**
     * Check if there's space in the specified inventory
     */
    hasSpace(player, inventoryType = 'main') {
        if (!player) return false;

        const inventory = inventoryType === 'radial' ? player.radialInventory : player.inventory;
        const maxSize = inventoryType === 'radial' ? 8 : 6;

        return Array.isArray(inventory) && inventory.length < maxSize;
    }

    /**
     * Get inventory space info
     */
    getInventorySpace(player) {
        if (!player) return { main: 0, radial: 0 };

        return {
            main: 6 - (player.inventory ? player.inventory.length : 0),
            radial: 8 - (player.radialInventory ? player.radialInventory.length : 0)
        };
    }

    /**
     * Prune items with zero uses/quantity from both inventories
     * Consolidates ItemService._pruneZeroUseItems()
     */
    pruneEmptyItems(player) {
        if (!player) return;

        // Prune from main inventory
        if (Array.isArray(player.inventory)) {
            for (let i = player.inventory.length - 1; i >= 0; i--) {
                const item = player.inventory[i];
                if (!item) continue;

                if ((typeof item.uses !== 'undefined' && item.uses <= 0) ||
                    (typeof item.quantity !== 'undefined' && item.quantity <= 0)) {
                    player.inventory.splice(i, 1);
                }
            }
        }

        // Prune from radial inventory
        if (Array.isArray(player.radialInventory)) {
            let changed = false;
            for (let i = player.radialInventory.length - 1; i >= 0; i--) {
                const item = player.radialInventory[i];
                if (!item) continue;

                if ((typeof item.uses !== 'undefined' && item.uses <= 0) ||
                    (typeof item.quantity !== 'undefined' && item.quantity <= 0)) {
                    player.radialInventory.splice(i, 1);
                    changed = true;
                }
            }

            if (changed) {
                this._saveRadialInventory();
            }
        }
    }

    /**
     * Check if player has an existing stack of an item
     */
    hasExistingStack(player, item, inventoryType = 'main') {
        return this.findStackableItem(player, item, inventoryType) !== null;
    }

    /**
     * Private: Add to main inventory
     * @private
     */
    _addToMainInventory(player, item) {
        // Try to stack with existing item
        if (ItemMetadata.isStackable(item.type)) {
            const existingStack = this.findStackableItem(player, item, 'main');
            if (existingStack) {
                this.stackItems(existingStack, item);
                return true;
            }
        }

        // Add as new item if space available
        if (this.hasSpace(player, 'main')) {
            player.inventory.push(item);
            return true;
        }

        return false;
    }

    /**
     * Private: Add to radial inventory
     * @private
     */
    _addToRadialInventory(player, item) {
        if (!player.radialInventory) {
            player.radialInventory = [];
        }

        // Try to stack with existing item
        const existingStack = this.findStackableItem(player, item, 'radial');
        if (existingStack) {
            this.stackItems(existingStack, item);
            this._saveRadialInventory();
            return true;
        }

        // Add as new item if space available
        if (this.hasSpace(player, 'radial')) {
            // Ensure certain items have quantity/uses when added to radial
            if (item.type === 'bomb' || item.type === 'book_of_time_travel' || item.type === 'bow') {
                if (typeof item.quantity === 'undefined' && typeof item.uses === 'undefined') {
                    item.quantity = 1;
                }
            }

            player.radialInventory.push(item);
            this._saveRadialInventory();
            return true;
        }

        return false;
    }

    /**
     * Private: Save radial inventory (side effect)
     * @private
     */
    _saveRadialInventory() {
        try {
            saveRadialInventory(this.game);
        } catch (e) {
            // Silently fail - radial persistence is not critical
        }
    }
}
