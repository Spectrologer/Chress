import { TILE_TYPES } from '../core/constants.js';
import { Sign } from '../ui/Sign.js';
import { logger } from '../core/logger.js';

export class ItemUsageHandler {
    constructor(game) {
        this.game = game;
    }

    applyItemUse(item, idx, fromRadial = false) {
        // If the item was invoked from the radial inventory, some items
        // should enter selection/placement mode instead of performing
        // the legacy drop behavior. Also prefer removing items via
        // ItemService helpers so we correctly remove from either
        // main or radial inventories.
        const fromRadialOrRadialPresent = fromRadial || (this.game.player.radialInventory && this.game.player.radialInventory.indexOf(item) >= 0);

        switch (item.type) {
            case 'food':
                item.quantity = (item.quantity || 1) - 1;
                this.game.player.restoreHunger(10);
                if (item.quantity <= 0) this.game.player.inventory.splice(idx, 1);
                break;
            case 'water':
                item.quantity = (item.quantity || 1) - 1;
                this.game.player.restoreThirst(10);
                if (item.quantity <= 0) this.game.player.inventory.splice(idx, 1);
                break;
            case 'axe':
                if (this.game.itemService) this.game.itemService.dropItem('axe', TILE_TYPES.AXE);
                break;
            case 'hammer':
                if (this.game.itemService) this.game.itemService.dropItem('hammer', TILE_TYPES.HAMMER);
                break;
            case 'bishop_spear':
                if (fromRadialOrRadialPresent) {
                    this.game.pendingCharge = { selectionType: 'bishop_spear', item };
                    if (this.game.uiManager) this.game.uiManager.showOverlayMessage('Tap a tile to confirm Bishop Charge', null, true, true);
                } else {
                    if (this.game.itemService) this.game.itemService.dropItem('bishop_spear', { type: TILE_TYPES.BISHOP_SPEAR, uses: item.uses });
                }
                break;
            case 'horse_icon':
                if (fromRadialOrRadialPresent) {
                    this.game.pendingCharge = { selectionType: 'horse_icon', item };
                    if (this.game.uiManager) this.game.uiManager.showOverlayMessage('Tap a tile to confirm Knight Charge', null, true, true);
                } else {
                    if (this.game.itemService) this.game.itemService.dropItem('horse_icon', { type: TILE_TYPES.HORSE_ICON, uses: item.uses });
                }
                break;
            case 'bow':
                if (fromRadialOrRadialPresent) {
                    this.game.pendingCharge = { selectionType: 'bow', item };
                    if (this.game.uiManager) this.game.uiManager.showOverlayMessage('Tap an enemy tile to confirm Bow Shot', null, true, true);
                } else {
                    if (this.game.itemService) this.game.itemService.dropItem('bow', { type: TILE_TYPES.BOW, uses: item.uses });
                }
                break;
            case 'shovel':
                this.game.shovelMode = true;
                this.game.activeShovel = item;
                this.game.uiManager.showOverlayMessage('Click an adjacent tile to dig a hole.');
                break;
            case 'bomb':
                // If used from radial, enter placement mode (choose adjacent tile).
                if (fromRadialOrRadialPresent) {
                    const px = this.game.player.x, py = this.game.player.y;
                    this.game.bombPlacementPositions = [];
                    const directions = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
                    for (const dir of directions) {
                        const nx = px + dir.dx, ny = py + dir.dy;
                        if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9 && (this.game.grid[ny][nx] === TILE_TYPES.FLOOR || this.game.grid[ny][nx] === TILE_TYPES.EXIT)) {
                            this.game.bombPlacementPositions.push({x: nx, y: ny});
                        }
                    }
                    this.game.bombPlacementMode = true;
                    if (this.game.uiManager) this.game.uiManager.showOverlayMessage('Tap a tile to place a bomb', null, true, true);
                } else {
                    // Using a bomb from main inventory (legacy behavior) places it immediately
                    item.quantity = (item.quantity || 1) - 1;
                    if (item.quantity <= 0) {
                        // Prefer removing via service helper to correctly remove from either inventory
                        try { if (this.game.itemService && typeof this.game.itemService._removeItemFromEither === 'function') this.game.itemService._removeItemFromEither(item); } catch (e) {}
                    }
                    const px = this.game.player.x, py = this.game.player.y;
                    this.game.grid[py][px] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true };
                }
                break;
            case 'heart':
                // Hearts are stackable now — decrement quantity and heal
                this.game.player.setHealth(this.game.player.getHealth() + 1);
                if (item.quantity && item.quantity > 1) {
                    item.quantity = item.quantity - 1;
                } else {
                    this.game.player.inventory.splice(idx, 1);
                }
                break;
            case 'note':
                item.quantity = (item.quantity || 1) - 1;
                this.useMapNote();
                this.game.hideOverlayMessage();
                const noteMessageText = 'Coordinates revealed! Added to message log.';
                if (this.game.uiManager && this.game.uiManager.messageManager && typeof this.game.uiManager.messageManager.addNoteToStack === 'function') {
                    this.game.uiManager.messageManager.addNoteToStack(noteMessageText, 'assets/items/note.png', 2000);
                } else {
                    this.game.displayingMessageForSign = { message: noteMessageText };
                    this.game.showSignMessage(noteMessageText, 'assets/items/note.png');
                    this.game.animationScheduler.createSequence().wait(2000).then(() => {
                        if (this.game.displayingMessageForSign && this.game.displayingMessageForSign.message === noteMessageText) {
                            Sign.hideMessageForSign(this.game);
                        }
                    }).start();
                }
                if (item.quantity <= 0) this.game.player.inventory.splice(idx, 1);
                break;
            case 'book_of_time_travel':
                if (window.inventoryDebugMode) {
                    logger.debug('[ITEM.HANDLER] book use - BEFORE decrement', { idx, uses: item.uses });
                    try { throw new Error('ITEM.HANDLER book decrement stack'); } catch (e) { logger.debug(e.stack); }
                }
                item.uses = (typeof item.uses === 'undefined') ? (item.quantity || 1) : item.uses;
                item.uses--;
                if (window.inventoryDebugMode) logger.debug('[ITEM.HANDLER] book use - AFTER decrement', { idx, uses: item.uses });
                if (item.uses <= 0) {
                    try { if (this.game.itemService && typeof this.game.itemService._removeItemFromEither === 'function') this.game.itemService._removeItemFromEither(item); else this.game.player.inventory.splice(idx, 1); } catch (e) {}
                    // Ensure any leftover zero-use items are pruned from radial/main inventories
                    try { if (this.game.itemService && typeof this.game.itemService._pruneZeroUseItems === 'function') this.game.itemService._pruneZeroUseItems(); } catch (e) {}
                }
                if (typeof this.game.startEnemyTurns === 'function') this.game.startEnemyTurns();
                if (this.game.updatePlayerStats) this.game.updatePlayerStats();
                return;
            default:
                break;
        }
        if (this.game.updatePlayerStats) this.game.updatePlayerStats();
    }

    useMapNote() {
        // Delegate to ItemService's implementation if present
        if (this.game.itemService && typeof this.game.itemService.useMapNote === 'function') {
            return this.game.itemService.useMapNote();
        }
        // Otherwise fallback - kept minimal for reuse
    }
}
