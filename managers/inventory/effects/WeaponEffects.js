import { BaseItemEffect } from './BaseItemEffect.js';
import { TILE_TYPES } from '../../../core/constants.js';

/**
 * Weapon effects - Bomb, Bow, Bishop Spear, Horse Icon
 */

export class BombEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        const { fromRadial = false } = context;
        const isRadial = fromRadial || (game.player.radialInventory && game.player.radialInventory.indexOf(item) >= 0);

        if (isRadial) {
            // Enter placement mode - player chooses adjacent tile
            const px = game.player.x;
            const py = game.player.y;
            game.bombPlacementPositions = [];

            const directions = [{dx:1,dy:0}, {dx:-1,dy:0}, {dx:0,dy:1}, {dx:0,dy:-1}];
            for (const dir of directions) {
                const nx = px + dir.dx;
                const ny = py + dir.dy;
                if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9 &&
                    (game.grid[ny][nx] === TILE_TYPES.FLOOR || game.grid[ny][nx] === TILE_TYPES.EXIT)) {
                    game.bombPlacementPositions.push({x: nx, y: ny});
                }
            }

            game.bombPlacementMode = true;
            this._showMessage(game, 'Tap a tile to place a bomb', null, true, false);
            return { consumed: false, success: true }; // Don't consume until placed
        } else {
            // Legacy: Place bomb immediately at player position (from main inventory)
            const px = game.player.x;
            const py = game.player.y;
            game.grid[py][px] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true };
            return { consumed: true, quantity: 1, success: true };
        }
    }
}

export class BowEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        const { fromRadial = false } = context;
        const isRadial = fromRadial || (game.player.radialInventory && game.player.radialInventory.indexOf(item) >= 0);

        if (isRadial) {
            // Enter selection mode for bow shot
            game.pendingCharge = { selectionType: 'bow', item };
            this._showMessage(game, 'Tap an enemy tile to confirm Bow Shot', null, true, false);
            return { consumed: false, success: true }; // Don't consume until shot
        } else {
            // Drop bow on floor (from main inventory)
            this._dropItem(game, 'bow', { type: TILE_TYPES.BOW, uses: item.uses });
            return { consumed: true, success: true };
        }
    }

    _dropItem(game, itemType, tileType) {
        const px = game.player.x;
        const py = game.player.y;
        const currentTile = game.grid[py][px];

        if (currentTile === TILE_TYPES.FLOOR ||
            (typeof currentTile === 'object' && currentTile.type === TILE_TYPES.FLOOR)) {
            game.grid[py][px] = tileType;
            return true;
        }
        return false;
    }
}

export class BishopSpearEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        const { fromRadial = false } = context;
        const isRadial = fromRadial || (game.player.radialInventory && game.player.radialInventory.indexOf(item) >= 0);

        if (isRadial) {
            // Enter selection mode for bishop charge
            game.pendingCharge = { selectionType: 'bishop_spear', item };
            this._showMessage(game, 'Tap a tile to confirm Bishop Charge', null, true, false);
            return { consumed: false, success: true }; // Don't consume until charge
        } else {
            // Drop spear on floor (from main inventory)
            this._dropItem(game, 'bishop_spear', { type: TILE_TYPES.BISHOP_SPEAR, uses: item.uses });
            return { consumed: true, success: true };
        }
    }

    _dropItem(game, itemType, tileType) {
        const px = game.player.x;
        const py = game.player.y;
        const currentTile = game.grid[py][px];

        if (currentTile === TILE_TYPES.FLOOR ||
            (typeof currentTile === 'object' && currentTile.type === TILE_TYPES.FLOOR)) {
            game.grid[py][px] = tileType;
            return true;
        }
        return false;
    }
}

export class HorseIconEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        const { fromRadial = false } = context;
        const isRadial = fromRadial || (game.player.radialInventory && game.player.radialInventory.indexOf(item) >= 0);

        if (isRadial) {
            // Enter selection mode for knight charge
            game.pendingCharge = { selectionType: 'horse_icon', item };
            this._showMessage(game, 'Tap a tile to confirm Knight Charge', null, true, false);
            return { consumed: false, success: true }; // Don't consume until charge
        } else {
            // Drop horse icon on floor (from main inventory)
            this._dropItem(game, 'horse_icon', { type: TILE_TYPES.HORSE_ICON, uses: item.uses });
            return { consumed: true, success: true };
        }
    }

    _dropItem(game, itemType, tileType) {
        const px = game.player.x;
        const py = game.player.y;
        const currentTile = game.grid[py][px];

        if (currentTile === TILE_TYPES.FLOOR ||
            (typeof currentTile === 'object' && currentTile.type === TILE_TYPES.FLOOR)) {
            game.grid[py][px] = tileType;
            return true;
        }
        return false;
    }
}
