import { getItemTooltipText } from './ItemUtils.js';
import { attachSlotEvents } from './InventoryEvents.js';

export class InventoryRenderer {
    constructor(game, itemLastUsedWeakMap) {
        this.game = game;
        this.tooltip = null;
        this._itemLastUsed = itemLastUsedWeakMap;
        this._attached = [];
    }

    updateInventoryDisplay() {
        this.tooltip = document.getElementById('inventory-tooltip');
        if (this.tooltip) this.tooltip.classList.remove('show');

        const inventoryGrid = document.querySelector('.inventory-list');
        if (!inventoryGrid) return;
        // Detach previous listeners
        this._attached.forEach(d => d.detach && d.detach());
        this._attached = [];

        inventoryGrid.innerHTML = '';
        this.game.player.inventory.forEach((item, idx) => {
            const slot = this.createInventorySlot(item, idx);
            inventoryGrid.appendChild(slot);
        });
        for (let i = this.game.player.inventory.length; i < 6; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            inventoryGrid.appendChild(slot);
        }
    }

    createInventorySlot(item, idx) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.style.cursor = this.game.player.isDead() ? 'not-allowed' : 'pointer';

        const tooltipText = getItemTooltipText(item);
        this.addItemVisuals(slot, item);

        const detachObj = attachSlotEvents(slot, item, idx, {
            useItem: (it, i) => this.game.inventoryManager._onUseItem?.(it, i),
            toggleDisabled: (it, i) => this.game.inventoryManager.toggleItemDisabled(it, i),
            showTooltip: (s) => this.showTooltip(s, tooltipText),
            hideTooltip: () => this.hideTooltip(),
        }, this._itemLastUsed, this.game);

        this._attached.push(detachObj);
        return slot;
    }

    _addUsesIndicator(container, item) {
        container.style.position = 'relative';
        const usesText = document.createElement('div');
        usesText.style.position = 'absolute';
        usesText.style.bottom = '4px';
        usesText.style.right = '5px';
        usesText.style.fontSize = '1.8em';
        usesText.style.fontWeight = 'bold';
        usesText.style.color = item.disabled ? '#666666' : '#000000';
        usesText.style.textShadow = '0 0 3px white, 0 0 3px white, 0 0 3px white';
        usesText.textContent = `x${item.uses || item.quantity}`;
        container.appendChild(usesText);
    }

    _createItemImageContainer(slot, item, imageSrc, styles = {}) {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        slot.appendChild(container);

        const img = document.createElement('img');
        img.src = imageSrc;
        Object.assign(img.style, { width: '70%', height: '70%', objectFit: 'contain', imageRendering: 'pixelated', opacity: item.disabled ? '0.5' : '1', ...styles });
        container.appendChild(img);

        this._addUsesIndicator(container, item);
    }

    addItemVisuals(slot, item) {
        if (item.disabled) slot.classList.add('item-disabled');

        if (item.type === 'food') {
            const foodImg = document.createElement('img');
            foodImg.src = `assets/${item.foodType}`;
            foodImg.style.width = '70%';
            foodImg.style.height = '70%';
            foodImg.style.objectFit = 'contain';
            foodImg.style.imageRendering = 'pixelated';
            foodImg.style.opacity = item.disabled ? '0.5' : '1';
            slot.appendChild(foodImg);
            if (item.quantity > 1) this._addUsesIndicator(slot, item);
        } else if (item.type === 'water') {
            slot.classList.add('item-water');
            if (item.quantity > 1) this._addUsesIndicator(slot, item);
        } else if (item.type === 'axe') {
            slot.classList.add('item-axe');
        } else if (item.type === 'hammer') {
            slot.classList.add('item-hammer');
        } else if (item.type === 'bishop_spear') {
            slot.classList.add('item-spear');
            this._addUsesIndicator(slot, item);
        } else if (item.type === 'horse_icon') {
            this._createItemImageContainer(slot, item, 'assets/items/horse.png');
        } else if (item.type === 'bomb') {
            this._createItemImageContainer(slot, item, 'assets/items/bomb.png');
        } else if (item.type === 'heart') {
            slot.classList.add('item-heart');
            if (item.quantity > 1) this._addUsesIndicator(slot, item);
        } else if (item.type === 'note') {
            slot.classList.add('item-note');
            if (item.quantity > 1) this._addUsesIndicator(slot, item);
        } else if (item.type === 'book_of_time_travel') {
            slot.classList.add('item-book');
            this._addUsesIndicator(slot, item);
        } else if (item.type === 'bow') {
            this._createItemImageContainer(slot, item, 'assets/items/bow.png', { transform: 'rotate(-90deg)' });
        } else if (item.type === 'shovel') {
            this._createItemImageContainer(slot, item, 'assets/items/shovel.png');
        }
    }

    showTooltip(slot, text) {
        if (!this.tooltip) return;
        this.tooltip.textContent = text;
        const rect = slot.getBoundingClientRect();
        const inventoryRect = slot.closest('.player-inventory').getBoundingClientRect();
        const tooltipWidth = 200;
        this.tooltip.style.left = `${rect.left - inventoryRect.left + (rect.width / 2) - (tooltipWidth / 2)}px`;
        this.tooltip.style.top = `${rect.top - inventoryRect.top - 40}px`;
        this.tooltip.classList.add('show');
    }

    hideTooltip() {
        if (this.tooltip) this.tooltip.classList.remove('show');
    }
}
