import { ItemMetadata, type InventoryItem } from './ItemMetadata';
import { saveRadialInventory } from '../RadialPersistence';
import type { IGame } from '../../core/GameContext';

type InventoryType = 'main' | 'radial' | 'auto';

interface Player {
    inventory: InventoryItem[];
    radialInventory?: InventoryItem[];
    [key: string]: any;
}

interface InventorySpace {
    main: number;
    radial: number;
}

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
    private game: IGame;

    constructor(game: IGame) {
        this.game = game;
    }

    /**
     * Add an item to player inventory with automatic stacking
     * @param player - Player object
     * @param item - Item to add
     * @param preferredInventory - 'main', 'radial', or 'auto'
     * @returns True if successfully added, false if inventory full
     */
    addToInventory(player: Player, item: InventoryItem, preferredInventory: InventoryType = 'auto'): boolean {
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
    removeItem(player: Player, item: InventoryItem): boolean {
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
            player.radialInventory!.splice(radialIdx, 1);
            this._saveRadialInventory();
            return true;
        }

        return false;
    }

    /**
     * Decrement quantity or uses for an item and remove if depleted
     */
    decrementAndCleanup(player: Player, item: InventoryItem, amount: number = 1): boolean {
        if (!player || !item) return false;

        // Decrement uses or quantity
        if (typeof (item as any).uses !== 'undefined') {
            (item as any).uses = Math.max(0, (item as any).uses - amount);
        } else if (typeof (item as any).quantity !== 'undefined') {
            (item as any).quantity = Math.max(0, (item as any).quantity - amount);
        } else {
            // Item has neither uses nor quantity, remove it entirely
            return this.removeItem(player, item);
        }

        // Remove if depleted
        if ((typeof (item as any).uses !== 'undefined' && (item as any).uses <= 0) ||
            (typeof (item as any).quantity !== 'undefined' && (item as any).quantity <= 0)) {
            return this.removeItem(player, item);
        }

        return true;
    }

    /**
     * Find an existing stack for an item in the specified inventory
     */
    findStackableItem(player: Player, item: InventoryItem, inventoryType: 'main' | 'radial' = 'main'): InventoryItem | null {
        if (!player || !item || !ItemMetadata.isStackable(item.type)) {
            return null;
        }

        const inventory = inventoryType === 'radial' ? player.radialInventory : player.inventory;
        if (!Array.isArray(inventory)) return null;

        return inventory.find(existing =>
            existing.type === item.type &&
            (item.type !== 'food' || (item as any).foodType === undefined || (existing as any).foodType === (item as any).foodType)
        ) || null;
    }

    /**
     * Stack/merge an item into an existing stack
     */
    stackItems(existingItem: InventoryItem, newItem: InventoryItem): boolean {
        if (!existingItem || !newItem) return false;

        if (typeof (newItem as any).uses !== 'undefined') {
            (existingItem as any).uses = ((existingItem as any).uses || 0) + (newItem as any).uses;
        } else {
            (existingItem as any).quantity = ((existingItem as any).quantity || 1) + ((newItem as any).quantity || 1);
        }

        return true;
    }

    /**
     * Check if there's space in the specified inventory
     */
    hasSpace(player: Player, inventoryType: 'main' | 'radial' = 'main'): boolean {
        if (!player) return false;

        const inventory = inventoryType === 'radial' ? player.radialInventory : player.inventory;
        const maxSize = inventoryType === 'radial' ? 8 : 6;

        return Array.isArray(inventory) && inventory.length < maxSize;
    }

    /**
     * Get inventory space info
     */
    getInventorySpace(player: Player): InventorySpace {
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
    pruneEmptyItems(player: Player): void {
        if (!player) return;

        // Prune from main inventory
        if (Array.isArray(player.inventory)) {
            for (let i = player.inventory.length - 1; i >= 0; i--) {
                const item = player.inventory[i];
                if (!item) continue;

                if ((typeof (item as any).uses !== 'undefined' && (item as any).uses <= 0) ||
                    (typeof (item as any).quantity !== 'undefined' && (item as any).quantity <= 0)) {
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

                if ((typeof (item as any).uses !== 'undefined' && (item as any).uses <= 0) ||
                    (typeof (item as any).quantity !== 'undefined' && (item as any).quantity <= 0)) {
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
    hasExistingStack(player: Player, item: InventoryItem, inventoryType: 'main' | 'radial' = 'main'): boolean {
        return this.findStackableItem(player, item, inventoryType) !== null;
    }

    /**
     * Decrement item quantity/uses by type (prefers main inventory)
     * Consolidates duplicate removal logic from BombManager and ActionManager
     *
     * @param player - Player object
     * @param itemType - Type of item to decrement
     * @param amount - Amount to decrement (default 1)
     * @returns True if successfully decremented
     */
    decrementItemByType(player: Player, itemType: string, amount: number = 1): boolean {
        if (!player || !itemType) return false;

        // Try main inventory first
        const mainIdx = player.inventory.findIndex(item => item.type === itemType);
        if (mainIdx !== -1) {
            const item = player.inventory[mainIdx];
            if (typeof (item as any).quantity === 'number' && (item as any).quantity > amount) {
                (item as any).quantity -= amount;
                return true;
            } else {
                player.inventory.splice(mainIdx, 1);
                return true;
            }
        }

        // Fall back to radial inventory
        const radialIdx = player.radialInventory ? player.radialInventory.findIndex(item => item.type === itemType) : -1;
        if (radialIdx !== -1) {
            const item = player.radialInventory![radialIdx];
            if (typeof (item as any).quantity === 'number' && (item as any).quantity > amount) {
                (item as any).quantity -= amount;
            } else {
                player.radialInventory!.splice(radialIdx, 1);
            }
            this._saveRadialInventory();
            return true;
        }

        return false;
    }

    /**
     * Private: Add to main inventory
     * @private
     */
    private _addToMainInventory(player: Player, item: InventoryItem): boolean {
        // Initialize inventory if it doesn't exist
        if (!player.inventory) {
            player.inventory = [];
        }

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
    private _addToRadialInventory(player: Player, item: InventoryItem): boolean {
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
                if (typeof (item as any).quantity === 'undefined' && typeof (item as any).uses === 'undefined') {
                    (item as any).quantity = 1;
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
    private _saveRadialInventory(): void {
        try {
            saveRadialInventory(this.game);
        } catch (e) {
            // Silently fail - radial persistence is not critical
        }
    }
}
