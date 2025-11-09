import { TILE_TYPES } from '@core/constants/index';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { isNote, isFood, isWater, isAxe, isHammer, isBishopSpear, isHorseIcon, isBomb, isHeart, isBow, isShovel, isFischersCube, isBookOfTimeTravel } from '@utils/TypeChecks';
import { logger } from '@core/logger';
import type { IGame } from '@core/context';
import type { InventoryItem } from './ItemMetadata';
import { Position } from '@core/Position';

interface TileWithMeta {
    type?: number;
    foodType?: string;
    uses?: number;
    [key: string]: any;
}

export class ItemPickupManager {
    private game: IGame;

    constructor(game: IGame) {
        this.game = game;
    }

    checkItemPickup(): boolean {
        const playerPos = this.game.playerFacade?.getPosition();
        if (!playerPos) return false;

        const p = Position.from(playerPos);
        const tile: any = this.game.gridManager?.getTile(p.x, p.y);


        const inv = this.game.player?.inventory;
        if (!inv) return false;

        const ui = this.game.uiManager;
        const pick = (item: InventoryItem): boolean => {
            if (!this.game.inventoryService) {
                logger.error('[ItemPickupManager] inventoryService not found! Falling back to direct push');
                inv.push(item);
                this.game.gridManager?.setTile(p.x, p.y, TILE_TYPES.FLOOR);
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
                return true;
            }

            // Use the inventory service to properly handle stacking
            const success = this.game.inventoryService.pickupItem(item, 'pickup');
            if (success) {
                this.game.gridManager?.setTile(p.x, p.y, TILE_TYPES.FLOOR);
            }
            return success;
        };

        if (isNote(tile)) {
            const success = pick({ type: 'note' } as InventoryItem);
            if (success) ui?.addMessageToLog('Found an ancient map note.');
            return success;
        }

        if (isFood(tile)) {
            const foodTile = tile as TileWithMeta;
            const success = pick({ type: 'food', foodType: foodTile.foodType } as InventoryItem);
            if (success) ui?.addMessageToLog('Found some food.');
            return success;
        }
        else if (isWater(tile)) {
            return pick({ type: 'water' } as InventoryItem);
        }
        else if (isAxe(tile)) {
            this.game.playerFacade?.addAbility('axe');
            this.game.gridManager?.setTile(p.x, p.y, TILE_TYPES.FLOOR);
            ui?.addMessageToLog('Gained axe ability! Can now chop grass and shrubbery.');
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            return true;
        }
        else if (isHammer(tile)) {
            this.game.playerFacade?.addAbility('hammer');
            this.game.gridManager?.setTile(p.x, p.y, TILE_TYPES.FLOOR);
            ui?.addMessageToLog('Gained hammer ability! Can now smash rocks.');
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            return true;
        }
        else if (isBishopSpear(tile)) {
            const spearTile = tile as TileWithMeta;
            return pick({ type: 'bishop_spear', uses: spearTile.uses || 3 } as InventoryItem);
        }
        else if (isHorseIcon(tile)) {
            const horseTile = tile as TileWithMeta;
            return pick({ type: 'horse_icon', uses: horseTile.uses || 3 } as InventoryItem);
        }
        else if (isBomb(tile)) {
            return pick({ type: 'bomb' } as InventoryItem);
        }
        else if (isHeart(tile)) {
            return pick({ type: 'heart' } as InventoryItem);
        }
        else if (isBow(tile)) {
            const bowTile = tile as TileWithMeta;
            return pick({ type: 'bow', uses: bowTile.uses || 3 } as InventoryItem);
        }
        else if (isShovel(tile)) {
            const shovelTile = tile as TileWithMeta;
            return pick({ type: 'shovel', uses: shovelTile.uses || 3 } as InventoryItem);
        }
        else if (isFischersCube(tile)) {
            const cubeTile = tile as TileWithMeta;
            return pick({ type: 'fischers_cube', uses: cubeTile.uses || 1 } as InventoryItem);
        }
        else if (isBookOfTimeTravel(tile)) {
            const bookTile = tile as TileWithMeta;
            return pick({ type: 'book_of_time_travel', uses: bookTile.uses || 3 } as InventoryItem);
        }

        return false; // No item picked up
    }
}
