import { TILE_TYPES, INVENTORY_CONSTANTS, TIMING_CONSTANTS, UI_CONSTANTS, GRID_SIZE } from '../core/constants.js';
import { logger } from '../core/logger.js';
import { ItemMetadata } from '../managers/inventory/ItemMetadata.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';

export class InventoryUI {
    constructor(game, inventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;
        this.tooltip = null;
        // WeakMap to track last-used timestamps per item object (survives DOM re-renders)
        this._itemLastUsed = new WeakMap();
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
            for (let i = this.game.player.inventory.length; i < INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE; i++) {
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
        const tooltipText = ItemMetadata.getTooltipText(item);

        // Visuals
        this.addItemVisuals(slot, item);

        // Events
        this.addInventorySlotEvents(slot, item, idx, tooltipText);

        return slot;
    }

    addItemVisuals(slot, item) {
        // Add disabled styling
        if (item.disabled) slot.classList.add('item-disabled');
        // Ensure slot is positioned for absolute children
        slot.style.position = slot.style.position || '';

        // Visual rules for known item types (mirrors InventoryManager)
        switch (item.type) {
            case 'food':
                this._createItemImage(slot, `assets/${item.foodType}`, item);
                if (item.quantity > 1) this._addUsesIndicator(slot, item);
                break;
            case 'water':
                slot.classList.add('item-water');
                if (item.quantity > 1) this._addUsesIndicator(slot, item);
                break;
            case 'axe':
                slot.classList.add('item-axe');
                break;
            case 'hammer':
                slot.classList.add('item-hammer');
                break;
            case 'bishop_spear':
                slot.classList.add('item-spear');
                this._addUsesIndicator(slot, item);
                break;
            case 'horse_icon':
                this._createItemImage(slot, 'assets/items/horse.png', item);
                if ((item.uses && item.uses > 1) || (item.quantity && item.quantity > 1)) this._addUsesIndicator(slot, item);
                break;
            case 'bomb':
                this._createItemImage(slot, 'assets/items/bomb.png', item);
                if (item.quantity > 1) this._addUsesIndicator(slot, item);
                break;
            case 'heart':
                slot.classList.add('item-heart');
                if (item.quantity > 1) {
                    this._addUsesIndicator(slot, item);
                }
                break;
            case 'note':
                slot.classList.add('item-note');
                if (item.quantity > 1) this._addUsesIndicator(slot, item);
                break;
            case 'book_of_time_travel':
                slot.classList.add('item-book');
                this._addUsesIndicator(slot, item);
                break;
            case 'bow':
                this._createItemImage(slot, 'assets/items/bow.png', item, { transform: 'rotate(-90deg)' });
                this._addUsesIndicator(slot, item);
                break;
            case 'shovel':
                this._createItemImage(slot, 'assets/items/shovel.png', item);
                this._addUsesIndicator(slot, item);
                break;
            default:
                // Unknown item types: try to show an image if path provided
                if (item.image) {
                    this._createItemImage(slot, item.image, item);
                }
                break;
        }
    }

    // Private helper: create an img element and append to parent
    _createItemImage(parent, src, item, extraStyles = {}) {
        const img = document.createElement('img');
        img.src = src;
        img.classList.add('item-img');
        // Apply opacity for disabled items
        if (item && item.disabled) img.style.opacity = '0.5';
        if (extraStyles && extraStyles.transform) img.style.transform = extraStyles.transform;
        parent.appendChild(img);
    }

    // Private helper: add a uses indicator element to parent
    _addUsesIndicator(parent, item) {
        parent.style.position = parent.style.position || 'relative';
        const usesText = document.createElement('div');
        usesText.classList.add('uses-indicator');
        usesText.textContent = `x${item.uses || item.quantity}`;
        if (item && item.disabled) usesText.classList.add('disabled'); else usesText.classList.add('enabled');
        parent.appendChild(usesText);
    }

    addInventorySlotEvents(slot, item, idx, tooltipText) {
        const isDisablable = ['bishop_spear', 'horse_icon', 'bow'].includes(item.type);
        let isLongPress = false;
        let pressTimeout = null;
    // Track recent pointer interactions so we can ignore the synthetic click
    // event that follows a pointer sequence on some platforms.
    let _lastPointerTime = 0;
    let _lastPointerWasTouch = false;
    // Track when a pointer handler actually triggered a use so click() can be suppressed
    let _lastPointerTriggeredUseTime = 0;
    // Use a per-item timestamp to suppress contextmenu that may fire after a long-press
    // This survives DOM re-renders because the item object is preserved.

        const showTooltip = () => {
            if (item._suppressTooltipUntil && Date.now() < item._suppressTooltipUntil) return;
            this.showTooltip(slot, tooltipText);
        };
        const hideTooltip = () => this.hideTooltip();
        const useItem = () => {
            // Per-item guard to prevent duplicate uses within a short window
            const last = this._itemLastUsed.get(item) || 0;
            const now = Date.now();
            if (now - last < TIMING_CONSTANTS.ITEM_USE_DEBOUNCE) {
                if (window.inventoryDebugMode) logger.debug('[INV.UI] suppressed duplicate use', { idx, itemType: item.type, delta: now - last });
                return;
            }
            this._itemLastUsed.set(item, now);

            if (window.inventoryDebugMode) {
                logger.debug('[INV.UI] useItem called', { idx, itemType: item.type, time: Date.now() });
                try { throw new Error('INV.UI useItem stack'); } catch (e) { logger.debug(e.stack); }
            }
            return this.inventoryService.useItem(item, { fromRadial: false });
        };
        const toggleDisabled = () => {
            this.inventoryService.toggleItemDisabled(item);
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            item._suppressTooltipUntil = Date.now() + TIMING_CONSTANTS.ITEM_TOOLTIP_SUPPRESS;
            hideTooltip();
        };

        slot.addEventListener('mouseover', showTooltip);
        slot.addEventListener('mouseout', hideTooltip);

        if (isDisablable) {
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (item._suppressContextMenuUntil && Date.now() < item._suppressContextMenuUntil) {
                    item._suppressContextMenuUntil = 0;
                    // If a pending toggle exists, clear it and remove temp class
                    if (item._pendingToggle) {
                        delete item._pendingToggle;
                        slot.classList.remove('item-disabled-temp');
                    }
                    return;
                }
                // If a pending toggle exists (unlikely here), commit it first
                if (item._pendingToggle) {
                    delete item._pendingToggle;
                    slot.classList.remove('item-disabled-temp');
                    toggleDisabled();
                    return;
                }
                toggleDisabled();
            });
        }

        slot.addEventListener('click', (ev) => {
            // Ignore click if it immediately follows a pointer handler that already triggered use
            const now = Date.now();
            if (_lastPointerTriggeredUseTime && (now - _lastPointerTriggeredUseTime) < TIMING_CONSTANTS.POINTER_ACTION_DEBOUNCE) return;
            // Also ignore click if it follows a touch pointer (legacy behavior)
            if (_lastPointerWasTouch && (now - _lastPointerTime) < TIMING_CONSTANTS.TOUCH_DEBOUNCE) return;
            if (this.game.player.isDead()) return;
            if (item.type === 'bomb') return; // bomb handled differently
            if (!isDisablable || !item.disabled) {
                useItem();
                _lastPointerTriggeredUseTime = Date.now();
            }
        });

        // Pointer-based long-press/tap handling for inventory slots
        let pressPointerId = null;
        const onPointerDown = (e) => {
            // only consider primary button for mouse
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e?.preventDefault?.();
            isLongPress = false;
            // record pointer info to suppress the following click
            _lastPointerTime = Date.now();
            _lastPointerWasTouch = e.pointerType !== 'mouse';
            pressPointerId = e.pointerId;
            // store start position so small movements don't cancel long-press
            const startX = e.clientX || 0;
            const startY = e.clientY || 0;
            pressTimeout = setTimeout(() => {
                isLongPress = true;
                if (isDisablable) {
                    // mark intent to toggle and show temporary disabled visual while holding
                    item._pendingToggle = true;
                    slot.classList.add('item-disabled-temp');
                    item._suppressContextMenuUntil = Date.now() + TIMING_CONSTANTS.ITEM_CONTEXT_MENU_SUPPRESS;
                } else {
                    showTooltip();
                    this.game.animationScheduler.createSequence().wait(TIMING_CONSTANTS.MESSAGE_AUTO_HIDE_TIMEOUT).then(hideTooltip).start();
                }
            }, TIMING_CONSTANTS.LONG_PRESS_TIMEOUT);
            e.target?.setPointerCapture?.(e.pointerId);
            // store start coords on the slot element so move handler can access them
            slot._pressStartX = startX;
            slot._pressStartY = startY;
        };

        const onPointerMove = (e) => {
            if (pressPointerId !== e.pointerId) return;
            // cancel long-press only if pointer moved significantly
            const sx = slot._pressStartX || 0;
            const sy = slot._pressStartY || 0;
            const dx = (e.clientX || 0) - sx;
            const dy = (e.clientY || 0) - sy;
            const distSq = dx * dx + dy * dy;
            if (distSq > TIMING_CONSTANTS.POINTER_MOVE_THRESHOLD_SQUARED) {
                if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
                delete item._pendingToggle;
                slot.classList.remove('item-disabled-temp');
            }
        };

        const onPointerCancel = (e) => {
            if (pressPointerId !== e.pointerId) return;
            if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
            delete item._pendingToggle;
            slot.classList.remove('item-disabled-temp');
            pressPointerId = null;
            hideTooltip();
        };

        const onPointerUp = (e) => {
            if (pressPointerId !== e.pointerId) return;
            if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
            if (!isLongPress) {
                if (this.game.player.isDead()) return;
                if (item.type === 'bomb') return;
                if (!isDisablable || !item.disabled) {
                    useItem();
                    _lastPointerTriggeredUseTime = Date.now();
                }
            }
            e.target?.releasePointerCapture?.(e.pointerId);
            // If a long-press created a pending toggle, commit it now (stable place to change data)
            if (item._pendingToggle) {
                delete item._pendingToggle;
                slot.classList.remove('item-disabled-temp');
                toggleDisabled();
            }
            pressPointerId = null;
            // Ensure tooltip is hidden when pointer is released to avoid stuck tooltips
            hideTooltip();
        };

        slot.addEventListener('pointerdown', onPointerDown, { passive: false });
    slot.addEventListener('pointermove', onPointerMove);
    slot.addEventListener('pointercancel', onPointerCancel);
    slot.addEventListener('pointerup', onPointerUp);

    // Bomb handling via unified InventoryInteractionHandler
        if (item.type === 'bomb') {
            let lastBombClickTime = 0;
            // Prevent back-to-back duplicate invocations (e.g., pointerup + synthetic click)
            let _lastBombActionTime = 0;
            const bombClick = () => {
                const now = Date.now();
                // debounce duplicate immediate calls
                if (now - _lastBombActionTime < TIMING_CONSTANTS.BOMB_ACTION_DEBOUNCE) return;
                _lastBombActionTime = now;

                const isDouble = (now - lastBombClickTime) < TIMING_CONSTANTS.DOUBLE_CLICK_DETECTION;
                lastBombClickTime = now;

                // Delegate to unified interaction handler
                const bombItem = this.game.player.inventory.find(i => i.type === 'bomb');
                if (bombItem) {
                    const last = this._itemLastUsed.get(bombItem) || 0;
                    const now = Date.now();
                    if (now - last >= TIMING_CONSTANTS.ITEM_USE_DEBOUNCE) {
                        this._itemLastUsed.set(bombItem, now);
                        this.game.inventoryInteractionHandler.handleBombInteraction(bombItem, {
                            fromRadial: false,
                            isDoubleClick: isDouble
                        });
                        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
                    } else if (window.inventoryDebugMode) {
                        logger.debug('[INV.UI] suppressed duplicate bomb use', { idx });
                    }
                }
            };
            slot.addEventListener('click', bombClick);
            slot.addEventListener('pointerup', (e) => { if (!isLongPress && e.pointerType !== 'mouse') bombClick(); });
        }
    }

    showTooltip(slot, text) {
        if (!this.tooltip) return;

        // Check if slot is still in the DOM (might have been removed during re-render)
        const inventoryContainer = slot.closest('.player-inventory');
        if (!inventoryContainer) return;

        this.tooltip.textContent = text;
        const rect = slot.getBoundingClientRect();
        const inventoryRect = inventoryContainer.getBoundingClientRect();
        this.tooltip.style.left = `${rect.left - inventoryRect.left + (rect.width / 2) - (UI_CONSTANTS.TOOLTIP_WIDTH / 2)}px`;
        this.tooltip.style.top = `${rect.top - inventoryRect.top - UI_CONSTANTS.TOOLTIP_VERTICAL_OFFSET}px`;
        this.tooltip.classList.add('show');
    }

    hideTooltip() { if (this.tooltip) this.tooltip.classList.remove('show'); }
}
