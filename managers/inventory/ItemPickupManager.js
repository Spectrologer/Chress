import { TILE_TYPES } from '../../core/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';

export class ItemPickupManager {
    constructor(game) {
        this.game = game;
    }

    checkItemPickup() {
        const p = this.game.player.getPosition();
        const tile = this.game.grid[p.y][p.x];
        const inv = this.game.player.inventory;
        const ui = this.game.uiManager;
        const pick = (item) => {
            inv.push(item);
            this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR;
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            // Trigger pickup hover on player for visual feedback
            try {
                const key = getImageKeyForItem(item);
                this.game.player.animations.pickupHover = { imageKey: key, frames: 60, totalFrames: 60, type: item.type, foodType: item.foodType };
                // If it's a bow, ensure we also set a small bowShot-like pulse (optional)
                if (item.type === 'bow') {
                    this.game.player.animations.pickupHover.type = 'bow';
                }
            } catch (e) {}
        };

        const getImageKeyForItem = (item) => {
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

        if (tile === TILE_TYPES.NOTE && inv.length < 6) {
            pick({ type: 'note' });
            ui.addMessageToLog('Found an ancient map note.');
            return;
        }
        if (inv.length < 6) {
            if (tile?.type === TILE_TYPES.FOOD) {
                pick({ type: 'food', foodType: tile.foodType });
                ui.addMessageToLog('Found some food.');
            }
            else if (tile === TILE_TYPES.WATER) pick({ type: 'water' });
            else if (tile === TILE_TYPES.AXE) {
                this.game.player.abilities.add('axe');
                this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR;
                ui.addMessageToLog('Gained axe ability! Can now chop grass and shrubbery.');
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            }
            else if (tile === TILE_TYPES.HAMMER) {
                this.game.player.abilities.add('hammer');
                this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR;
                ui.addMessageToLog('Gained hammer ability! Can now smash rocks.');
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            }
            else if (tile?.type === TILE_TYPES.BISHOP_SPEAR) pick({ type: 'bishop_spear', uses: tile.uses });
            else if (tile?.type === TILE_TYPES.HORSE_ICON) pick({ type: 'horse_icon', uses: tile.uses });
            else if (tile === TILE_TYPES.BOMB) pick({ type: 'bomb' });
            else if (tile === TILE_TYPES.HEART) pick({ type: 'heart' });
            else if (tile?.type === TILE_TYPES.BOW) pick({ type: 'bow', uses: tile.uses });
        }
    }
}
