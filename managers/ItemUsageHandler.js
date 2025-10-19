import { TILE_TYPES } from '../core/constants.js';
import { Sign } from '../ui/Sign.js';

export class ItemUsageHandler {
    constructor(game) {
        this.game = game;
    }

    applyItemUse(item, idx) {
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
                if (this.game.itemService) this.game.itemService.dropItem('bishop_spear', { type: TILE_TYPES.BISHOP_SPEAR, uses: item.uses });
                break;
            case 'horse_icon':
                if (this.game.itemService) this.game.itemService.dropItem('horse_icon', { type: TILE_TYPES.HORSE_ICON, uses: item.uses });
                break;
            case 'bow':
                if (this.game.itemService) this.game.itemService.dropItem('bow', { type: TILE_TYPES.BOW, uses: item.uses });
                break;
            case 'shovel':
                this.game.shovelMode = true;
                this.game.activeShovel = item;
                this.game.uiManager.showOverlayMessage('Click an adjacent tile to dig a hole.');
                break;
            case 'bomb':
                // Using a bomb from inventory (e.g. double-click drop) should decrement quantity
                item.quantity = (item.quantity || 1) - 1;
                if (item.quantity <= 0) this.game.player.inventory.splice(idx, 1);
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
                    console.log('[ITEM.HANDLER] book use - BEFORE decrement', { idx, uses: item.uses });
                    try { throw new Error('ITEM.HANDLER book decrement stack'); } catch (e) { console.log(e.stack); }
                }
                item.uses--;
                if (window.inventoryDebugMode) console.log('[ITEM.HANDLER] book use - AFTER decrement', { idx, uses: item.uses });
                if (item.uses <= 0) this.game.player.inventory.splice(idx, 1);
                this.game.startEnemyTurns();
                this.game.updatePlayerStats();
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
