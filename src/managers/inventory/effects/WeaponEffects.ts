import { BaseItemEffect, type ItemEffectContext, type ItemEffectResult, type Game } from './BaseItemEffect';
import { TILE_TYPES, GRID_SIZE } from '../../../core/constants/index';
import { isWithinGrid } from '../../../utils/GridUtils';
import type { InventoryItem, BombItem, BowItem, BishopSpearItem, HorseIconItem } from '../ItemMetadata';

/**
 * Weapon effects - Bomb, Bow, Bishop Spear, Horse Icon
 * Refactored to use configuration-based approach to eliminate code duplication
 */

// Bomb effect: Adjacent tile placement with validation
export class BombEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
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
                    if (isWithinGrid(nx, ny) &&
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

// Weapon charge effects: All follow the same pattern with different parameters
export class BowEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        const bowItem = item as BowItem;
        return this._applyRadialPattern(game, item, context, {
            onRadial: (game, item) => {
                game.transientGameState.setPendingCharge({ selectionType: 'bow', item });
            },
            message: 'Tap an enemy tile to confirm Bow Shot',
            dropTileType: { type: TILE_TYPES.BOW, uses: bowItem.uses }
        });
    }
}

export class BishopSpearEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        const spearItem = item as BishopSpearItem;
        return this._applyRadialPattern(game, item, context, {
            onRadial: (game, item) => {
                game.transientGameState.setPendingCharge({ selectionType: 'bishop_spear', item });
            },
            message: 'Tap a tile to confirm Bishop Charge',
            dropTileType: { type: TILE_TYPES.BISHOP_SPEAR, uses: spearItem.uses }
        });
    }
}

export class HorseIconEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        const horseItem = item as HorseIconItem;
        return this._applyRadialPattern(game, item, context, {
            onRadial: (game, item) => {
                game.transientGameState.setPendingCharge({ selectionType: 'horse_icon', item });
            },
            message: 'Tap a tile to confirm Knight Charge',
            dropTileType: { type: TILE_TYPES.HORSE_ICON, uses: horseItem.uses }
        });
    }
}
