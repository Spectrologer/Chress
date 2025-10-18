import { TILE_TYPES } from '../core/constants.js';

export class InventoryUI {
    constructor(game, itemService) {
        this.game = game;
        this.itemService = itemService;
        this.tooltip = null;
    }

    updateInventoryDisplay() {
        this.tooltip = document.getElementById('inventory-tooltip');
        if (this.tooltip) this.tooltip.classList.remove('show');

        const inventoryGrid = document.querySelector('.inventory-list');
        if (inventoryGrid) {
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
    }

    createInventorySlot(item, idx) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.style.cursor = this.game.player.isDead() ? 'not-allowed' : 'pointer';

        // Tooltip text
    const tooltipText = this.itemService.getItemTooltipText(item);

        // Visuals
        this.addItemVisuals(slot, item);

        // Events
        this.addInventorySlotEvents(slot, item, idx, tooltipText);

        return slot;
    }

    addItemVisuals(slot, item) {
        // Add disabled styling
        if (item.disabled) slot.classList.add('item-disabled');

        // Add uses indicator helper
        const _addUsesIndicator = (parent, it) => {
            parent.style.position = 'relative';
            const usesText = document.createElement('div');
            usesText.style.position = 'absolute';
            usesText.style.bottom = '6px';
            usesText.style.right = '6px';
            usesText.style.fontSize = '1.6em';
            usesText.style.lineHeight = '1';
            usesText.style.padding = '2px 6px';
            usesText.style.borderRadius = '10px';
            usesText.style.background = it.disabled ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)';
            usesText.style.fontWeight = '900';
            usesText.style.color = it.disabled ? '#555555' : '#111111';
            usesText.style.textShadow = '0 1px 0 rgba(255,255,255,0.6)';
            usesText.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
            usesText.textContent = `x${it.uses || it.quantity}`;
            parent.appendChild(usesText);
        };

        const _createItemImage = (parent, src, styles = {}) => {
            const img = document.createElement('img');
            img.src = src;
            Object.assign(img.style, { width: '70%', height: '70%', objectFit: 'contain', imageRendering: 'pixelated', opacity: item.disabled ? '0.5' : '1', ...styles });
            parent.appendChild(img);
        };

        // Visual rules for known item types (mirrors InventoryManager)
        switch (item.type) {
            case 'food':
                _createItemImage(slot, `assets/${item.foodType}`);
                if (item.quantity > 1) _addUsesIndicator(slot, item);
                break;
            case 'water':
                slot.classList.add('item-water');
                if (item.quantity > 1) _addUsesIndicator(slot, item);
                break;
            case 'axe':
                slot.classList.add('item-axe');
                break;
            case 'hammer':
                slot.classList.add('item-hammer');
                break;
            case 'bishop_spear':
                slot.classList.add('item-spear');
                _addUsesIndicator(slot, item);
                break;
            case 'horse_icon':
                _createItemImage(slot, 'assets/items/horse.png');
                if ((item.uses && item.uses > 1) || (item.quantity && item.quantity > 1)) _addUsesIndicator(slot, item);
                break;
            case 'bomb':
                _createItemImage(slot, 'assets/items/bomb.png');
                if (item.quantity > 1) _addUsesIndicator(slot, item);
                break;
            case 'heart':
                slot.classList.add('item-heart');
                break;
            case 'note':
                slot.classList.add('item-note');
                if (item.quantity > 1) _addUsesIndicator(slot, item);
                break;
            case 'book_of_time_travel':
                slot.classList.add('item-book');
                _addUsesIndicator(slot, item);
                break;
            case 'bow':
                _createItemImage(slot, 'assets/items/bow.png', { transform: 'rotate(-90deg)' });
                _addUsesIndicator(slot, item);
                break;
            case 'shovel':
                _createItemImage(slot, 'assets/items/shovel.png');
                _addUsesIndicator(slot, item);
                break;
            default:
                // Unknown item types: try to show an image if path provided
                if (item.image) {
                    _createItemImage(slot, item.image);
                }
                break;
        }
    }

    addInventorySlotEvents(slot, item, idx, tooltipText) {
        const isDisablable = ['bishop_spear', 'horse_icon', 'bow'].includes(item.type);
        let isLongPress = false;
        let pressTimeout = null;

        const showTooltip = () => this.showTooltip(slot, tooltipText);
        const hideTooltip = () => this.hideTooltip();
        const useItem = () => this.itemService.useInventoryItem(item, idx);
        const toggleDisabled = () => {
            this.itemService.toggleItemDisabled(item);
            this.game.uiManager.updatePlayerStats();
            hideTooltip();
        };

        slot.addEventListener('mouseover', showTooltip);
        slot.addEventListener('mouseout', hideTooltip);

        if (isDisablable) {
            slot.addEventListener('contextmenu', (e) => { e.preventDefault(); toggleDisabled(); });
        }

        slot.addEventListener('click', () => {
            if (this.game.player.isDead()) return;
            if (item.type === 'bomb') return; // bomb handled differently
            if (!isDisablable || !item.disabled) useItem();
        });

        // Pointer-based long-press/tap handling for inventory slots
        let pressPointerId = null;
        const onPointerDown = (e) => {
            // only consider primary button for mouse
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            try { e.preventDefault(); } catch (err) {}
            isLongPress = false;
            pressPointerId = e.pointerId;
            pressTimeout = setTimeout(() => {
                isLongPress = true;
                if (isDisablable) toggleDisabled(); else { showTooltip(); this.game.animationScheduler.createSequence().wait(2000).then(hideTooltip).start(); }
            }, 500);
            try { e.target.setPointerCapture?.(e.pointerId); } catch (err) {}
        };

        const onPointerMove = (e) => {
            if (pressPointerId !== e.pointerId) return;
            if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
        };

        const onPointerUp = (e) => {
            if (pressPointerId !== e.pointerId) return;
            if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
            if (!isLongPress) {
                if (this.game.player.isDead()) return;
                if (item.type === 'bomb') return;
                if (!isDisablable || !item.disabled) useItem();
            }
            try { e.target.releasePointerCapture?.(e.pointerId); } catch (err) {}
            pressPointerId = null;
        };

        slot.addEventListener('pointerdown', onPointerDown, { passive: false });
        slot.addEventListener('pointermove', onPointerMove);
        slot.addEventListener('pointerup', onPointerUp);

    // Bomb handling delegated to ItemUsageHandler via ItemService
        if (item.type === 'bomb') {
            let lastBombClickTime = 0;
            const bombClick = () => {
                const now = Date.now();
                const isDouble = (now - lastBombClickTime) < 300;
                lastBombClickTime = now;
                if (isDouble) {
                    const px = this.game.player.x, py = this.game.player.y;
                    this.game.grid[py][px] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true };
                    const bombItem = this.game.player.inventory.find(i => i.type === 'bomb');
                    if (bombItem) this.itemService.useInventoryItem(bombItem, this.game.player.inventory.indexOf(bombItem));
                    this.game.uiManager.updatePlayerStats();
                } else {
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
                }
            };
            slot.addEventListener('click', bombClick);
            slot.addEventListener('pointerup', (e) => { if (!isLongPress && e.pointerType !== 'mouse') bombClick(); });
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

    hideTooltip() { if (this.tooltip) this.tooltip.classList.remove('show'); }
}
