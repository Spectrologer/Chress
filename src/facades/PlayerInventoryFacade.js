// @ts-check
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { logger } from '../core/logger.js';

/**
 * @typedef {Object} InventoryItem
 * @property {string} [id] - Item ID
 * @property {string} [name] - Item name
 * @property {string} [type] - Item type
 * @property {number} [quantity] - Item quantity
 * @property {*} [data] - Additional item data
 */

/**
 * @callback InventoryPredicate
 * @param {InventoryItem} item - Inventory item
 * @returns {boolean} True if item matches criteria
 */

/**
 * PlayerInventoryFacade - Inventory and abilities management for player
 *
 * Handles:
 * - Inventory operations (add, remove, find, clear)
 * - Radial inventory management
 * - Ability tracking (has, add, remove)
 *
 * @example
 * const inventoryFacade = new PlayerInventoryFacade(player);
 * inventoryFacade.addToInventory(item);
 * inventoryFacade.addAbility('swim');
 */
export class PlayerInventoryFacade {
    /**
     * @param {any} player - The player entity
     */
    constructor(player) {
        if (!player) {
            throw new Error('PlayerInventoryFacade requires a valid player instance');
        }
        this.player = player;
    }

    // ========================================
    // INVENTORY OPERATIONS
    // ========================================

    /**
     * Get inventory (returns a copy to prevent direct mutations)
     * @returns {InventoryItem[]} Copy of inventory array
     */
    getInventory() {
        return [...(this.player.inventory || [])];
    }

    /**
     * Get inventory reference (use sparingly - prefer getInventory())
     * @returns {Array<Object>}
     * @deprecated Use getInventory() instead for safer access
     */
    getInventoryRef() {
        logger.warn('PlayerInventoryFacade.getInventoryRef: Direct inventory reference requested. Consider using getInventory() instead.');
        return this.player.inventory;
    }

    /**
     * Add item to inventory with event emission
     * @param {InventoryItem} item - Item to add
     * @returns {boolean} True if added successfully
     */
    addToInventory(item) {
        if (!item) {
            logger.warn('PlayerInventoryFacade: Cannot add null/undefined item to inventory');
            return false;
        }

        if (!this.player.inventory) {
            this.player.inventory = [];
        }

        this.player.inventory.push(item);

        // Emit inventory changed event
        eventBus.emit(EventTypes.INVENTORY_CHANGED, {
            action: 'add',
            item,
            inventory: this.getInventory()
        });

        return true;
    }

    /**
     * Remove item from inventory by index
     * @param {number} index - Index to remove
     * @returns {InventoryItem|null} Removed item or null
     */
    removeFromInventory(index) {
        if (!this.player.inventory || index < 0 || index >= this.player.inventory.length) {
            logger.warn(`PlayerInventoryFacade: Invalid inventory index ${index}`);
            return null;
        }

        const removed = this.player.inventory.splice(index, 1)[0];

        // Emit inventory changed event
        eventBus.emit(EventTypes.INVENTORY_CHANGED, {
            action: 'remove',
            item: removed,
            index,
            inventory: this.getInventory()
        });

        return removed;
    }

    /**
     * Find item in inventory by predicate
     * @param {InventoryPredicate} predicate - Function(item) => boolean
     * @returns {InventoryItem|undefined} Found item
     */
    findInInventory(predicate) {
        return this.player.inventory?.find(predicate);
    }

    /**
     * Get inventory count
     * @returns {number}
     */
    getInventoryCount() {
        return this.player.inventory?.length ?? 0;
    }

    /**
     * Clear inventory
     */
    clearInventory() {
        const oldInventory = this.getInventory();
        this.player.inventory = [];

        eventBus.emit(EventTypes.INVENTORY_CHANGED, {
            action: 'clear',
            oldInventory,
            inventory: []
        });
    }

    /**
     * Get radial inventory
     * @returns {InventoryItem[]}
     */
    getRadialInventory() {
        return [...(this.player.radialInventory || [])];
    }

    /**
     * Set radial inventory
     * @param {InventoryItem[]} items - Items for radial inventory
     */
    setRadialInventory(items) {
        this.player.radialInventory = items;

        eventBus.emit(EventTypes.RADIAL_INVENTORY_CHANGED, {
            inventory: this.getRadialInventory()
        });
    }

    // ========================================
    // ABILITIES OPERATIONS
    // ========================================

    /**
     * Check if player has an ability
     * @param {string} ability - Ability name
     * @returns {boolean}
     */
    hasAbility(ability) {
        return this.player.abilities?.has(ability) ?? false;
    }

    /**
     * Add ability with event emission
     * @param {string} ability - Ability name
     */
    addAbility(ability) {
        if (!this.player.abilities) {
            this.player.abilities = new Set();
        }

        if (this.player.abilities.has(ability)) {
            logger.debug(`PlayerInventoryFacade: Player already has ability '${ability}'`);
            return;
        }

        this.player.abilities.add(ability);

        eventBus.emit(EventTypes.ABILITY_GAINED, {
            ability,
            abilities: Array.from(this.player.abilities)
        });

        logger.debug(`PlayerInventoryFacade: Added ability '${ability}'`);
    }

    /**
     * Remove ability
     * @param {string} ability - Ability name
     */
    removeAbility(ability) {
        if (!this.player.abilities?.has(ability)) {
            return;
        }

        this.player.abilities.delete(ability);

        eventBus.emit(EventTypes.ABILITY_LOST, {
            ability,
            abilities: Array.from(this.player.abilities)
        });
    }

    /**
     * Get all abilities
     * @returns {Array<string>}
     */
    getAbilities() {
        return Array.from(this.player.abilities || []);
    }
}

export default PlayerInventoryFacade;
