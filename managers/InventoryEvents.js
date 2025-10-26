import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';

// Attach event listeners for an inventory slot and map them to callbacks
// Callbacks expected: { useItem, toggleDisabled, startBombPlacement, showTooltip, hideTooltip }
export function attachSlotEvents(slot, item, idx, callbacks, itemLastUsedWeakMap, game) {
    const isDisablable = ['bishop_spear', 'horse_icon', 'bow'].includes(item.type);
    let isLongPress = false;
    let pressTimeout = null;
    let _lastPointerTime = 0;
    let _lastPointerWasTouch = false;
    let _lastPointerTriggeredUseTime = 0;

    // Store the item reference at the start of the interaction to prevent
    // clicking on repositioned items after the original item is consumed
    let clickedItem = null;

    const useItem = (itemToUse) => {
        // Only use the item that was clicked, not whatever might be in this slot now
        if (!itemToUse) return;

        // Verify the item is still in the inventory
        const stillInInventory = game.player.inventory.includes(itemToUse) ||
                                 (game.player.radialInventory && game.player.radialInventory.includes(itemToUse));
        if (!stillInInventory) {
            return;
        }

        try {
            const last = itemLastUsedWeakMap.get(itemToUse) || 0;
            const now = Date.now();
            if (now - last < 600) return;
            itemLastUsedWeakMap.set(itemToUse, now);
        } catch (e) {}
        return callbacks.useItem?.(itemToUse, idx);
    };
    const toggleDisabled = () => {
        callbacks.toggleDisabled?.(item, idx);
    };

    const onContextMenu = (e) => {
        e.preventDefault();
        try {
            if (item._suppressContextMenuUntil && Date.now() < item._suppressContextMenuUntil) {
                item._suppressContextMenuUntil = 0;
                if (item._pendingToggle) {
                    delete item._pendingToggle;
                    slot.classList.remove('item-disabled-temp');
                }
                return;
            }
        } catch (err) {}
        try {
            if (item._pendingToggle) {
                delete item._pendingToggle;
                slot.classList.remove('item-disabled-temp');
                toggleDisabled();
                return;
            }
        } catch (err) {}
        toggleDisabled();
    };

    const onClick = (ev) => {
        const now = Date.now();
        if (_lastPointerTriggeredUseTime && (now - _lastPointerTriggeredUseTime) < 500) return;
        if (_lastPointerWasTouch && (now - _lastPointerTime) < 500) return;
        if (game.player.isDead()) return;
        if (item.type === 'bomb') return; // bomb handled separately
        if (!isDisablable || !item.disabled) {
            useItem(item);
            _lastPointerTriggeredUseTime = Date.now();
        }
    };

    // Pointer handling
    let pressPointerId = null;
    const onPointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        try { e.preventDefault(); } catch (err) {}
        _lastPointerTime = Date.now();
        _lastPointerWasTouch = e.pointerType !== 'mouse';
        isLongPress = false;
        pressPointerId = e.pointerId;
        // Capture the item at the start of the interaction
        clickedItem = item;
        const startX = e.clientX || 0;
        const startY = e.clientY || 0;
        pressTimeout = setTimeout(() => {
            isLongPress = true;
            if (isDisablable) {
                try { item._pendingToggle = true; } catch (e) {}
                slot.classList.add('item-disabled-temp');
                try { item._suppressContextMenuUntil = Date.now() + 1000; } catch (e) {}
            }
        }, 500);
        try { e.target.setPointerCapture?.(e.pointerId); } catch (err) {}
        slot._pressStartX = startX;
        slot._pressStartY = startY;
    };

    const onPointerMove = (e) => {
        if (pressPointerId !== e.pointerId) return;
        const sx = slot._pressStartX || 0;
        const sy = slot._pressStartY || 0;
        const dx = (e.clientX || 0) - sx;
        const dy = (e.clientY || 0) - sy;
        const distSq = dx * dx + dy * dy;
        const threshold = 12 * 12;
        if (distSq > threshold) {
            if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
            try { delete item._pendingToggle; } catch (err) {}
            slot.classList.remove('item-disabled-temp');
        }
    };

    const onPointerCancel = (e) => {
        if (pressPointerId !== e.pointerId) return;
        if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
        try { delete item._pendingToggle; } catch (err) {}
        slot.classList.remove('item-disabled-temp');
        pressPointerId = null;
        clickedItem = null;
    };

    const onPointerUp = (e) => {
        if (pressPointerId !== e.pointerId) return;
        if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
        if (!isLongPress) {
            if (game.player.isDead()) return;
            if (clickedItem && clickedItem.type === 'bomb') return;
            if (clickedItem && (!isDisablable || !clickedItem.disabled)) {
                useItem(clickedItem);
                _lastPointerTriggeredUseTime = Date.now();
            }
        }
        try { e.target.releasePointerCapture?.(e.pointerId); } catch (err) {}
        try {
            if (item._pendingToggle) {
                delete item._pendingToggle;
                slot.classList.remove('item-disabled-temp');
                toggleDisabled();
            }
        } catch (err) {}
        pressPointerId = null;
        clickedItem = null;
    };

    if (isDisablable) slot.addEventListener('contextmenu', onContextMenu);
    slot.addEventListener('click', onClick);
    slot.addEventListener('pointerdown', onPointerDown, { passive: false });
    slot.addEventListener('pointermove', onPointerMove);
    slot.addEventListener('pointercancel', onPointerCancel);
    slot.addEventListener('pointerup', onPointerUp);

    // Bomb special handling (separate click/tap flows)
    // Delegate to unified InventoryInteractionHandler
    if (item.type === 'bomb') {
        let lastBombClickTime = 0;
        let _lastBombActionTime = 0;
        const bombClick = () => {
            const now = Date.now();
            if (now - _lastBombActionTime < 250) return;
            _lastBombActionTime = now;

            const isDouble = (now - lastBombClickTime) < 300;
            lastBombClickTime = now;

            const bombItem = game.player.inventory.find(it => it.type === 'bomb');
            if (bombItem) {
                const last = itemLastUsedWeakMap.get(bombItem) || 0;
                const now2 = Date.now();
                if (now2 - last >= 600) {
                    itemLastUsedWeakMap.set(bombItem, now2);
                    // Delegate to unified interaction handler
                    game.inventoryInteractionHandler.handleBombInteraction(bombItem, {
                        fromRadial: false,
                        isDoubleClick: isDouble
                    });
                    eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
                }
            }
        };

        slot.addEventListener('click', bombClick);
        slot.addEventListener('pointerup', (e) => {
            if (!isLongPress && e.pointerType !== 'mouse') bombClick();
        });
    }

    return {
        detach() {
            if (isDisablable) slot.removeEventListener('contextmenu', onContextMenu);
            slot.removeEventListener('click', onClick);
            slot.removeEventListener('pointerdown', onPointerDown);
            slot.removeEventListener('pointermove', onPointerMove);
            slot.removeEventListener('pointercancel', onPointerCancel);
            slot.removeEventListener('pointerup', onPointerUp);
        }
    };
}
