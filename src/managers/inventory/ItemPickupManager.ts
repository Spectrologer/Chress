import { TILE_TYPES } from '../../core/constants/index.js';
import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { isNote, isFood, isWater, isAxe, isHammer, isBishopSpear, isHorseIcon, isBomb, isHeart, isBow, isShovel } from '../../utils/TypeChecks.js';
import type { InventoryItem } from './ItemMetadata.js';

interface Game {
    player: any;
    gridManager: any;
    uiManager: any;
    inventoryService?: any;
    [key: string]: any;
}

interface Position {
    x: number;
    y: number;
}

interface TileWithMeta {
    type?: number;
    foodType?: string;
    uses?: number;
    [key: string]: any;
}

export class ItemPickupManager {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    checkItemPickup(): void {
        const p: Position = this.game.player.getPosition();
        const tile: any = this.game.gridManager.getTile(p.x, p.y);

        // Log every pickup check to see if we're stepping on hearts
        if (tile === 27 || tile === TILE_TYPES.HEART) {
            console.log('[ItemPickupManager] STEPPING ON HEART TILE!', {position: p, tile, HEART_CONST: TILE_TYPES.HEART});
        }

        const inv: InventoryItem[] = this.game.player.inventory;
        const ui = this.game.uiManager;
        const pick = (item: InventoryItem): boolean => {
            if (!this.game.inventoryService) {
                console.error('[ItemPickupManager] inventoryService not found! Falling back to direct push');
                inv.push(item);
                this.game.gridManager.setTile(p.x, p.y, TILE_TYPES.FLOOR);
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
                return true;
            }

            // Use the inventory service to properly handle stacking
            const success = this.game.inventoryService.pickupItem(item, 'pickup');
            if (success) {
                this.game.gridManager.setTile(p.x, p.y, TILE_TYPES.FLOOR);
            }
            return success;
        };

        if (isNote(tile)) {
            pick({ type: 'note' } as InventoryItem);
            ui.addMessageToLog('Found an ancient map note.');
            return;
        }

        if (isFood(tile)) {
            const foodTile = tile as TileWithMeta;
            pick({ type: 'food', foodType: foodTile.foodType } as InventoryItem);
            ui.addMessageToLog('Found some food.');
        }
        else if (isWater(tile)) {
            pick({ type: 'water' } as InventoryItem);
        }
        else if (isAxe(tile)) {
            this.game.player.abilities.add('axe');
            this.game.gridManager.setTile(p.x, p.y, TILE_TYPES.FLOOR);
            ui.addMessageToLog('Gained axe ability! Can now chop grass and shrubbery.');
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
        else if (isHammer(tile)) {
            this.game.player.abilities.add('hammer');
            this.game.gridManager.setTile(p.x, p.y, TILE_TYPES.FLOOR);
            ui.addMessageToLog('Gained hammer ability! Can now smash rocks.');
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
        else if (isBishopSpear(tile)) {
            const spearTile = tile as TileWithMeta;
            pick({ type: 'bishop_spear', uses: spearTile.uses || 3 } as InventoryItem);
        }
        else if (isHorseIcon(tile)) {
            const horseTile = tile as TileWithMeta;
            pick({ type: 'horse_icon', uses: horseTile.uses || 3 } as InventoryItem);
        }
        else if (isBomb(tile)) {
            pick({ type: 'bomb' } as InventoryItem);
        }
        else if (isHeart(tile)) {
            console.log('[ItemPickupManager] Heart detected! Attempting pickup...');
            const result = pick({ type: 'heart' } as InventoryItem);
            console.log('[ItemPickupManager] Heart pickup result:', result);
            console.log('[ItemPickupManager] Inventory after pickup:', this.game.player.inventory);
        }
        else if (isBow(tile)) {
            const bowTile = tile as TileWithMeta;
            pick({ type: 'bow', uses: bowTile.uses || 3 } as InventoryItem);
        }
    }
}
