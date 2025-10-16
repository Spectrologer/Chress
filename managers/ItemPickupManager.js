import { TILE_TYPES } from '../core/constants.js';

export class ItemPickupManager {
    constructor(game) {
        this.game = game;
    }

    checkItemPickup() {
        const p = this.game.player.getPosition();
        const tile = this.game.grid[p.y][p.x];
        const inv = this.game.player.inventory;
        const ui = this.game.uiManager;
        const pick = (item) => { inv.push(item); this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR; ui.updatePlayerStats(); };

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
                ui.updatePlayerStats();
            }
            else if (tile === TILE_TYPES.HAMMER) {
                this.game.player.abilities.add('hammer');
                this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR;
                ui.addMessageToLog('Gained hammer ability! Can now smash rocks.');
                ui.updatePlayerStats();
            }
            else if (tile?.type === TILE_TYPES.BISHOP_SPEAR) pick({ type: 'bishop_spear', uses: tile.uses });
            else if (tile?.type === TILE_TYPES.HORSE_ICON) pick({ type: 'horse_icon', uses: tile.uses });
            else if (tile === TILE_TYPES.BOMB) pick({ type: 'bomb' });
            else if (tile === TILE_TYPES.HEART) pick({ type: 'heart' });
            else if (tile?.type === TILE_TYPES.BOW) pick({ type: 'bow', uses: tile.uses });
        }
    }
}
