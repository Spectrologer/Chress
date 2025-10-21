// (Merged ItemUsageManager logic: useMapNote for revealing distant zones)
// Inventory management system
// Inventory management system
import { InventoryRenderer } from './InventoryRenderer.js';
import * as InventoryActions from './InventoryActions.js';
import { getItemTooltipText } from './ItemUtils.js';

export class InventoryManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this._itemLastUsed = new WeakMap();
        this.renderer = new InventoryRenderer(this.game, this._itemLastUsed);

        // internal hook used by renderer to call into actions with dedupe
        this._onUseItem = (item, idx) => {
            try {
                // call action
                InventoryActions.useInventoryItem(this.game, item, idx);
            } catch (e) {
                console.error('Error using inventory item', e);
            }
        };
    }

    updateInventoryDisplay() {
        this.renderer.updateInventoryDisplay();
    }

    // Backwards-compatible delegate to InventoryActions
    useInventoryItem(item, idx) {
        return InventoryActions.useInventoryItem(this.game, item, idx);
    }

    useMapNote() {
        return InventoryActions.useMapNote(this.game);
    }

    toggleItemDisabled(item, idx) {
        if (typeof item.disabled === 'undefined') item.disabled = false;
        item.disabled = !item.disabled;
        this.updateInventoryDisplay();
    }

    // Backwards-compatible small helpers
    getItemTooltipText(item) { return getItemTooltipText(item); }
}
