import { TILE_TYPES } from '../../core/constants/index.js';
import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { isNote, isFood, isWater, isAxe, isHammer, isBishopSpear, isHorseIcon, isBomb, isHeart, isBow, isShovel } from '../../utils/TypeChecks.js';

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

        if (isNote(tile)) {
            pick({ type: 'note' });
            ui.addMessageToLog('Found an ancient map note.');
            return;
        }

        if (isFood(tile)) {
            pick({ type: 'food', foodType: tile.foodType });
            ui.addMessageToLog('Found some food.');
        }
        else if (isWater(tile)) {
            pick({ type: 'water' });
        }
        else if (isAxe(tile)) {
            this.game.player.abilities.add('axe');
            this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR;
            ui.addMessageToLog('Gained axe ability! Can now chop grass and shrubbery.');
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
        else if (isHammer(tile)) {
            this.game.player.abilities.add('hammer');
            this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR;
            ui.addMessageToLog('Gained hammer ability! Can now smash rocks.');
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
        else if (isBishopSpear(tile)) {
            pick({ type: 'bishop_spear', uses: tile.uses });
        }
        else if (isHorseIcon(tile)) {
            pick({ type: 'horse_icon', uses: tile.uses });
        }
        else if (isBomb(tile)) {
            pick({ type: 'bomb' });
        }
        else if (isHeart(tile)) {
            console.log('[ItemPickupManager] Heart detected! Attempting pickup...');
            const result = pick({ type: 'heart' });
            console.log('[ItemPickupManager] Heart pickup result:', result);
            console.log('[ItemPickupManager] Inventory after pickup:', this.game.player.inventory);
        }
        else if (isBow(tile)) {
            pick({ type: 'bow', uses: tile.uses });
        }
    }
}
