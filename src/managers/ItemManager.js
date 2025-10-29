import { TILE_TYPES, INVENTORY_CONSTANTS, GAMEPLAY_CONSTANTS } from '../core/constants/index.js';
import { InventoryService } from './inventory/InventoryService.js';
import { ItemMetadata } from './inventory/ItemMetadata.js';
import { isTileType } from '../utils/TileUtils.js';

/**
 * ItemManager - Public API facade for item/inventory operations
 *
 * This is the consolidated manager that replaces the old inventory system.
 * - Provides backward-compatible API
 *
 * Responsibilities:
 * - Simple public interface for other systems
 * - Delegates to InventoryService for all operations
 * - Maintains backward compatibility
 *
 * This class is VERY THIN - it's just a facade.
 */
export class ItemManager {
    constructor(game) {
        this.game = game;
        this.service = new InventoryService(game);
    }

    /**
     * Add an item to player inventory with automatic stacking
     * Backward-compatible with old ItemManager.addItemToInventory()
     *
     * @param {Object} player - Player object
     * @param {Object} item - Item to add
     * @param {string} sound - Sound effect to play
     * @returns {boolean} - True if successfully added
     */
    addItemToInventory(player, item, sound = 'pickup') {
        return this.service.pickupItem(item, sound);
    }

    /**
     * Handle item pickup from grid tile
     * Backward-compatible with old ItemManager.handleItemPickup()
     *
     * @param {Object} player - Player object
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {Object} gridManager - GridManager instance
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
     * Private: Check if player can pickup or stack a tile
     * @private
     */
    _canPickupOrStackTile(player, tile) {
        const hasSpace = player.inventory.length < INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE;
        const isStackable = ItemMetadata.isStackableItem(tile);

        // Check for existing stack based on tile type
        let hasExistingStack = false;
        if (isTileType(tile, TILE_TYPES.WATER)) {
            hasExistingStack = player.inventory.some(i => i.type === 'water');
        } else if (isTileType(tile, TILE_TYPES.HEART)) {
            hasExistingStack = player.inventory.some(i => i.type === 'heart');
        } else if (isTileType(tile, TILE_TYPES.NOTE)) {
            hasExistingStack = player.inventory.some(i => i.type === 'note');
        } else if (isTileType(tile, TILE_TYPES.FOOD)) {
            hasExistingStack = player.inventory.some(i =>
                i.type === 'food' && i.foodType === tile.foodType
            );
        }

        return hasSpace || (isStackable && hasExistingStack);
    }
}
