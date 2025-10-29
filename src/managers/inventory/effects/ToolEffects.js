import { BaseItemEffect } from './BaseItemEffect.js';
import { TILE_TYPES } from '../../../core/constants/index.js';

/**
 * Tool effects - Axe, Hammer
 */

export class AxeEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        // Drop axe on current tile
        const success = this._dropItem(game, 'axe', TILE_TYPES.AXE);
        return { consumed: success, quantity: 1, success };
    }
}

export class HammerEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        // Drop hammer on current tile
        const success = this._dropItem(game, 'hammer', TILE_TYPES.HAMMER);
        return { consumed: success, quantity: 1, success };
    }
}
