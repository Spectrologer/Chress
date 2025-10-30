import { TILE_TYPES, INVENTORY_CONSTANTS, GAMEPLAY_CONSTANTS } from '../core/constants/index.js';
import { InventoryService } from './inventory/InventoryService.js';
import { ItemMetadata } from './inventory/ItemMetadata.js';
import { isTileType } from '../utils/TileUtils.js';

/**
 * ItemManager - Public API facade for item/inventory operations.
 *
 * Design Pattern: Facade Pattern
 * - Provides simple interface to complex inventory subsystem
 * - Delegates all operations to InventoryService
 * - Maintains backward compatibility with legacy code
 *
 * Responsibilities:
 * 1. Item pickup from grid tiles
 * 2. Inventory addition with automatic stacking
 * 3. Consumable item handling (water, food, hearts)
 * 4. Special item pickup (weapons, tools, notes)
 *
 * Architecture:
 * ItemManager (facade) -> InventoryService (business logic) -> ItemRepository (data)
 *
 * Item Categories:
 * - Consumables: Water, food, hearts (restore stats)
 * - Tools: Axe, shovel (permanent inventory items)
 * - Weapons: Bishop spear, horse icon, bow (limited uses)
 * - Special: Notes, bombs (collectibles/utility)
 *
 * Stacking Rules:
 * - Stackable: Water, hearts, food (same type), notes
 * - Non-stackable: Tools, weapons (tracked via uses count)
 */
export class ItemManager {
    /**
     * Creates a new ItemManager instance.
     *
     * @param {Game} game - The main game instance
     */
    constructor(game) {
        this.game = game;
        this.service = new InventoryService(game);
    }

    /**
     * Adds an item to player inventory with automatic stacking.
     * Delegates to InventoryService for business logic.
     *
     * Stacking Behavior:
     * - Stackable items (water, hearts, food) increment count
     * - Non-stackable items add new inventory slot
     * - Fails if inventory full and item not stackable
     *
     * @param {Player} player - Player object (unused, kept for API compatibility)
     * @param {Object} item - Item to add
     * @param {string} item.type - Item type ('water', 'food', 'axe', etc.)
     * @param {string} [item.foodType] - Food subtype if type is 'food'
     * @param {number} [item.uses] - Use count for limited-use items
     * @param {string} [sound='pickup'] - Sound effect to play on success
     * @returns {boolean} True if successfully added, false if inventory full
     */
    addItemToInventory(player, item, sound = 'pickup') {
        return this.service.pickupItem(item, sound);
    }

    /**
     * Handles item pickup from a grid tile at player's position.
     * Processes tile, adds to inventory, and updates grid.
     *
     * Pickup Flow:
     * 1. Check tile type at (x, y)
     * 2. Determine if consumable or collectible
     * 3. If consumable + full inventory: consume immediately
     * 4. If collectible: add to inventory
     * 5. Replace tile with floor
     *
     * Consumable Priority:
     * - Water/food/hearts: Add to inventory if space, else consume
     * - Consuming restores hunger/thirst/health immediately
     *
     * Special Cases:
     * - Food: Must match foodType for stacking
     * - Weapons: Include uses count from tile
     * - Hammer: Legacy tile type (no longer used)
     *
     * @param {Player} player - Player object
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {GridManager} gridManager - GridManager instance for tile access
     */
    handleItemPickup(player, x, y, gridManager) {
        const tile = gridManager.getTile(x, y);
        if (!tile) return;

        const pickup = (item, sound = 'pickup') => {
            const success = this.service.pickupItem(item, sound);
            if (success) {
                gridManager.setTile(x, y, TILE_TYPES.FLOOR);
            }
        };

        const canPickupOrStack = this._canPickupOrStackTile(player, tile);

        switch (tile) {
            case TILE_TYPES.WATER:
                if (canPickupOrStack) {
                    pickup({ type: 'water' });
                } else {
                    player.restoreThirst(GAMEPLAY_CONSTANTS.WATER_RESTORATION_AMOUNT);
                }
                gridManager.setTile(x, y, TILE_TYPES.FLOOR);
                break;

            case TILE_TYPES.HEART:
                if (canPickupOrStack) {
                    pickup({ type: 'heart' });
                } else {
                    // If inventory full, consume directly
                    player.setHealth((player.getHealth ? player.getHealth() : 0) + GAMEPLAY_CONSTANTS.HEART_RESTORATION_AMOUNT);
                }
                gridManager.setTile(x, y, TILE_TYPES.FLOOR);
                break;

            case TILE_TYPES.AXE:
                pickup({ type: 'axe' });
                break;

            case TILE_TYPES.HAMMER:
                // Hammer is now an ability, not a pickup item (legacy case)
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
                                player.restoreHunger(GAMEPLAY_CONSTANTS.FOOD_RESTORATION_AMOUNT);
                            }
                            gridManager.setTile(x, y, TILE_TYPES.FLOOR);
                            break;

                        case TILE_TYPES.BISHOP_SPEAR:
                        case TILE_TYPES.HORSE_ICON:
                        case TILE_TYPES.BOOK_OF_TIME_TRAVEL:
                        case TILE_TYPES.BOW:
                        case TILE_TYPES.SHOVEL:
                            const itemType = ItemMetadata.TILE_TYPE_MAP[tile.type] || 'unknown';
                            pickup({ type: itemType, uses: tile.uses });
                            break;
                    }
                }
                break;
        }
    }

    /**
     * Checks if a tile can be picked up or stacked in player inventory.
     * Used to determine whether to add to inventory or consume immediately.
     *
     * Logic:
     * 1. If inventory has space: Can always pickup
     * 2. If inventory full but item stackable + existing stack: Can stack
     * 3. Otherwise: Cannot pickup (consume immediately if consumable)
     *
     * Stacking Requirements:
     * - Item must be stackable (water, hearts, notes, food)
     * - Existing stack must be present in inventory
     * - For food: foodType must match for same stack
     *
     * @private
     * @param {Player} player - Player object with inventory
     * @param {number|Object} tile - Tile value or tile object
     * @returns {boolean} True if item can be added to inventory
     */
    _canPickupOrStackTile(player, tile) {
        // Check inventory space
        const hasSpace = player.inventory.length < INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE;
        const isStackable = ItemMetadata.isStackableItem(tile);

        // Check for existing stacks based on item type
        let hasExistingStack = false;

        if (isTileType(tile, TILE_TYPES.WATER)) {
            hasExistingStack = player.inventory.some(i => i.type === 'water');
        } else if (isTileType(tile, TILE_TYPES.HEART)) {
            hasExistingStack = player.inventory.some(i => i.type === 'heart');
        } else if (isTileType(tile, TILE_TYPES.NOTE)) {
            hasExistingStack = player.inventory.some(i => i.type === 'note');
        } else if (isTileType(tile, TILE_TYPES.FOOD)) {
            // Food requires matching foodType for stacking
            hasExistingStack = player.inventory.some(i =>
                i.type === 'food' && i.foodType === tile.foodType
            );
        }

        // Can pickup if has space OR (stackable AND has existing stack)
        return hasSpace || (isStackable && hasExistingStack);
    }
}
