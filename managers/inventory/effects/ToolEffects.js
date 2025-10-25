import { BaseItemEffect } from './BaseItemEffect.js';
import { TILE_TYPES } from '../../../core/constants.js';

/**
 * Tool effects - Axe, Hammer
 */

export class AxeEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        // Drop axe on current tile
        this._dropItem(game, 'axe', TILE_TYPES.AXE);
        return { consumed: true, success: true };
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

export class HammerEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        // Drop hammer on current tile
        const px = game.player.x;
        const py = game.player.y;
        const currentTile = game.grid[py][px];

        if (currentTile === TILE_TYPES.FLOOR ||
            (typeof currentTile === 'object' && currentTile.type === TILE_TYPES.FLOOR)) {
            game.grid[py][px] = TILE_TYPES.HAMMER;
            return { consumed: true, success: true };
        }
        return { consumed: false, success: false };
    }
}
