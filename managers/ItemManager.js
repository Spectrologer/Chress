import { TILE_TYPES } from '../core/constants.js';

export class ItemManager {
    constructor(game) {
        this.game = game;
    }

    handleItemPickup(player, x, y, grid) {
        const tile = grid[y][x];
        if (!tile) return;

        const canPickup = player.inventory.length < 6;

        const pickup = (item, sound = 'pickup') => {
            if (canPickup) {
                player.inventory.push(item);
                grid[y][x] = TILE_TYPES.FLOOR;
                window.soundManager?.playSound(sound);
            }
        };

        switch (tile) {
            case TILE_TYPES.WATER:
                if (canPickup) {
                    pickup({ type: 'water' });
                } else {
                    player.restoreThirst(10);
                }
                grid[y][x] = TILE_TYPES.FLOOR;
                break;
            case TILE_TYPES.AXE:
                pickup({ type: 'axe' });
                break;
            case TILE_TYPES.HAMMER:
                pickup({ type: 'hammer' });
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
                            if (canPickup) {
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
                            pickup({ type: TILE_TYPES[tile.type].toLowerCase(), uses: tile.uses });
                            break;
                    }
                }
                break;
        }
    }
}