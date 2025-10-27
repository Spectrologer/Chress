import { TILE_TYPES } from '../../core/constants/index.js';
import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { isTileType } from '../../utils/TileUtils.js';

export class ItemPickupManager {
    constructor(game) {
        this.game = game;
    }

    checkItemPickup() {
        const p = this.game.player.getPosition();
        const tile = this.game.grid[p.y][p.x];

        // Log every pickup check to see if we're stepping on hearts
        if (tile === 27 || tile === TILE_TYPES.HEART) {
            console.log('[ItemPickupManager] STEPPING ON HEART TILE!', {position: p, tile, HEART_CONST: TILE_TYPES.HEART});
        }

        const inv = this.game.player.inventory;
        const ui = this.game.uiManager;
        const pick = (item) => {
            if (!this.game.inventoryService) {
                console.error('[ItemPickupManager] inventoryService not found! Falling back to direct push');
                inv.push(item);
                this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR;
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
                return true;
            }

            // Use the inventory service to properly handle stacking
            const success = this.game.inventoryService.pickupItem(item, 'pickup');
            if (success) {
                this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR;
            }
            return success;
        };

        if (isTileType(tile, TILE_TYPES.NOTE)) {
            pick({ type: 'note' });
            ui.addMessageToLog('Found an ancient map note.');
            return;
        }

        if (isTileType(tile, TILE_TYPES.FOOD)) {
            pick({ type: 'food', foodType: tile.foodType });
            ui.addMessageToLog('Found some food.');
        }
        else if (isTileType(tile, TILE_TYPES.WATER)) {
            pick({ type: 'water' });
        }
        else if (isTileType(tile, TILE_TYPES.AXE)) {
            this.game.player.abilities.add('axe');
            this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR;
            ui.addMessageToLog('Gained axe ability! Can now chop grass and shrubbery.');
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
        else if (isTileType(tile, TILE_TYPES.HAMMER)) {
            this.game.player.abilities.add('hammer');
            this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR;
            ui.addMessageToLog('Gained hammer ability! Can now smash rocks.');
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
        else if (isTileType(tile, TILE_TYPES.BISHOP_SPEAR)) {
            pick({ type: 'bishop_spear', uses: tile.uses });
        }
        else if (isTileType(tile, TILE_TYPES.HORSE_ICON)) {
            pick({ type: 'horse_icon', uses: tile.uses });
        }
        else if (isTileType(tile, TILE_TYPES.BOMB)) {
            pick({ type: 'bomb' });
        }
        else if (isTileType(tile, TILE_TYPES.HEART)) {
            console.log('[ItemPickupManager] Heart detected! Attempting pickup...');
            const result = pick({ type: 'heart' });
            console.log('[ItemPickupManager] Heart pickup result:', result);
            console.log('[ItemPickupManager] Inventory after pickup:', this.game.player.inventory);
        }
        else if (isTileType(tile, TILE_TYPES.BOW)) {
            pick({ type: 'bow', uses: tile.uses });
        }
    }
}
