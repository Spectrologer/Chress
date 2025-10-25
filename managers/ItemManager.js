import { TILE_TYPES } from '../core/constants.js';
import { InventoryService } from './inventory/InventoryService.js';
import { ItemMetadata } from './inventory/ItemMetadata.js';

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
     * @param {Array} grid - Game grid
     */
    handleItemPickup(player, x, y, grid) {
        const tile = grid[y][x];
        if (!tile) return;

        const pickup = (item, sound = 'pickup') => {
            const success = this.service.pickupItem(item, sound);
            if (success) {
                grid[y][x] = TILE_TYPES.FLOOR;
            }
        };

        const canPickupOrStack = this._canPickupOrStackTile(player, tile);

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
                    // If inventory full, consume directly
                    player.setHealth((player.getHealth ? player.getHealth() : 0) + 1);
                }
                grid[y][x] = TILE_TYPES.FLOOR;
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
                                player.restoreHunger(10);
                            }
                            grid[y][x] = TILE_TYPES.FLOOR;
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
        const hasSpace = player.inventory.length < 6;
        const isStackable = ItemMetadata.isStackableItem(tile);

        // Check for existing stack based on tile type
        let hasExistingStack = false;
        if (tile === TILE_TYPES.WATER) {
            hasExistingStack = player.inventory.some(i => i.type === 'water');
        } else if (tile === TILE_TYPES.HEART) {
            hasExistingStack = player.inventory.some(i => i.type === 'heart');
        } else if (tile === TILE_TYPES.NOTE) {
            hasExistingStack = player.inventory.some(i => i.type === 'note');
        } else if (tile.type === TILE_TYPES.FOOD) {
            hasExistingStack = player.inventory.some(i =>
                i.type === 'food' && i.foodType === tile.foodType
            );
        }

        return hasSpace || (isStackable && hasExistingStack);
    }
}
