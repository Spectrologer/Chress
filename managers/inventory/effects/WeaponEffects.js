import { BaseItemEffect } from './BaseItemEffect.js';
import { TILE_TYPES, GRID_SIZE } from '../../../core/constants/index.js';

/**
 * Weapon effects - Bomb, Bow, Bishop Spear, Horse Icon
 */

export class BombEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        return this._applyRadialPattern(game, item, context, {
            onRadial: (game, item) => {
                // Enter placement mode - player chooses adjacent tile
                const px = game.player.x;
                const py = game.player.y;

                // Use transientGameState for bomb placement
                game.transientGameState.enterBombPlacementMode();

                const directions = [{dx:1,dy:0}, {dx:-1,dy:0}, {dx:0,dy:1}, {dx:0,dy:-1}];
                for (const dir of directions) {
                    const nx = px + dir.dx;
                    const ny = py + dir.dy;
                    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE &&
                        (game.grid[ny][nx] === TILE_TYPES.FLOOR || game.grid[ny][nx] === TILE_TYPES.EXIT)) {
                        game.transientGameState.addBombPlacementPosition({x: nx, y: ny});
                    }
                }
            },
            message: 'Tap a tile to place a bomb',
            dropTileType: { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true }
        });
    }
}

export class BowEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        return this._applyRadialPattern(game, item, context, {
            onRadial: (game, item) => {
                game.transientGameState.setPendingCharge({ selectionType: 'bow', item });
            },
            message: 'Tap an enemy tile to confirm Bow Shot',
            dropTileType: { type: TILE_TYPES.BOW, uses: item.uses }
        });
    }
}

export class BishopSpearEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        return this._applyRadialPattern(game, item, context, {
            onRadial: (game, item) => {
                game.transientGameState.setPendingCharge({ selectionType: 'bishop_spear', item });
            },
            message: 'Tap a tile to confirm Bishop Charge',
            dropTileType: { type: TILE_TYPES.BISHOP_SPEAR, uses: item.uses }
        });
    }
}

export class HorseIconEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        return this._applyRadialPattern(game, item, context, {
            onRadial: (game, item) => {
                game.transientGameState.setPendingCharge({ selectionType: 'horse_icon', item });
            },
            message: 'Tap a tile to confirm Knight Charge',
            dropTileType: { type: TILE_TYPES.HORSE_ICON, uses: item.uses }
        });
    }
}
