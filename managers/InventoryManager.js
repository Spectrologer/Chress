// Inventory management system - Updated to use new consolidated services
import { InventoryRenderer } from './InventoryRenderer.js';
import { ItemMetadata } from './inventory/ItemMetadata.js';

export class InventoryManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this._itemLastUsed = new WeakMap();
        this.renderer = new InventoryRenderer(this.game, this._itemLastUsed);

        // Internal hook used by renderer to call into new service
        this._onUseItem = (item, idx) => {
            try {
                // Delegate to new inventory service
                if (this.game.inventoryService) {
                    this.game.inventoryService.useItem(item, { fromRadial: false });
                }
            } catch (e) {
                console.error('Error using inventory item', e);
            }
        };
    }

    updateInventoryDisplay() {
        this.renderer.updateInventoryDisplay();
    }

    // Backwards-compatible delegate to new service
    useInventoryItem(item, idx) {
        if (this.game.inventoryService) {
            return this.game.inventoryService.useItem(item, { fromRadial: false });
        }
    }

    useMapNote() {
        if (this.game.inventoryService) {
            // Map note is now handled by NoteEffect strategy
            const noteItem = this.game.player.inventory.find(i => i.type === 'note');
            if (noteItem) {
                return this.game.inventoryService.useItem(noteItem, { fromRadial: false });
            }
        }
    }

    toggleItemDisabled(item, idx) {
        if (this.game.inventoryService) {
            return this.game.inventoryService.toggleItemDisabled(item);
        } else {
            // Fallback
            if (typeof item.disabled === 'undefined') item.disabled = false;
            item.disabled = !item.disabled;
            this.updateInventoryDisplay();
        }
    }

    // Backwards-compatible delegate to ItemMetadata
    getItemTooltipText(item) {
        return ItemMetadata.getTooltipText(item);
    }
}
