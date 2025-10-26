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

    const showTooltip = () => {
        try {
            if (item._suppressTooltipUntil && Date.now() < item._suppressTooltipUntil) return;
        } catch (e) {}
        callbacks.showTooltip?.(slot);
    };
    const hideTooltip = () => callbacks.hideTooltip?.();

    const useItem = () => {
        try {
            const last = itemLastUsedWeakMap.get(item) || 0;
            const now = Date.now();
            if (now - last < 600) return;
            itemLastUsedWeakMap.set(item, now);
        } catch (e) {}
        return callbacks.useItem?.(item, idx);
    };
    const toggleDisabled = () => {
        callbacks.toggleDisabled?.(item, idx);
        try { item._suppressTooltipUntil = Date.now() + 300; } catch (e) {}
        hideTooltip();
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
            useItem();
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
        const startX = e.clientX || 0;
        const startY = e.clientY || 0;
        pressTimeout = setTimeout(() => {
            isLongPress = true;
            if (isDisablable) {
                try { item._pendingToggle = true; } catch (e) {}
                slot.classList.add('item-disabled-temp');
                try { item._suppressContextMenuUntil = Date.now() + 1000; } catch (e) {}
            } else {
                showTooltip();
                game.animationScheduler.createSequence().wait(2000).then(hideTooltip).start();
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
        hideTooltip();
    };

    const onPointerUp = (e) => {
        if (pressPointerId !== e.pointerId) return;
        if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
        if (!isLongPress) {
            if (game.player.isDead()) return;
            if (item.type === 'bomb') return;
            if (!isDisablable || !item.disabled) {
                useItem();
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
        hideTooltip();
    };

    slot.addEventListener('mouseover', showTooltip);
    slot.addEventListener('mouseout', hideTooltip);
    if (isDisablable) slot.addEventListener('contextmenu', onContextMenu);
    slot.addEventListener('click', onClick);
    slot.addEventListener('pointerdown', onPointerDown, { passive: false });
    slot.addEventListener('pointermove', onPointerMove);
    slot.addEventListener('pointercancel', onPointerCancel);
    slot.addEventListener('pointerup', onPointerUp);

    // Bomb special handling (separate click/tap flows)
    if (item.type === 'bomb') {
        let lastBombClickTime = 0;
        let _lastBombActionTime = 0;
        const bombClick = () => {
            const now = Date.now();
            if (now - _lastBombActionTime < 250) return;
            _lastBombActionTime = now;

            const isDouble = (now - lastBombClickTime) < 300;
            lastBombClickTime = now;
            if (isDouble) {
                // drop bomb where player stands
                const px = game.player.x, py = game.player.y;
                game.grid[py][px] = { type: game.coreConstants?.BOMB || 'BOMB', actionsSincePlaced: 0, justPlaced: true };
                const bombItem = game.player.inventory.find(it => it.type === 'bomb');
                if (bombItem) {
                    const last = itemLastUsedWeakMap.get(bombItem) || 0;
                    const now2 = Date.now();
                    if (now2 - last >= 600) {
                        itemLastUsedWeakMap.set(bombItem, now2);
                        callbacks.useItem?.(bombItem, game.player.inventory.indexOf(bombItem));
                    }
                }
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            } else {
                // single click: enter bomb placement mode
                const px = game.player.x, py = game.player.y;
                game.bombPlacementPositions = [];
                const directions = [ {dx:1,dy:0}, {dx:-1,dy:0}, {dx:0,dy:1}, {dx:0,dy:-1} ];
                for (const dir of directions) {
                    const nx = px + dir.dx, ny = py + dir.dy;
                    if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9 && (game.grid[ny][nx] === game.coreConstants?.FLOOR || game.grid[ny][nx] === game.coreConstants?.EXIT)) {
                        game.bombPlacementPositions.push({x: nx, y: ny});
                    }
                }
                game.bombPlacementMode = true;
            }
        };

        slot.addEventListener('click', bombClick);
        slot.addEventListener('pointerup', (e) => {
            if (!isLongPress && e.pointerType !== 'mouse') bombClick();
        });
    }

    return {
        detach() {
            slot.removeEventListener('mouseover', showTooltip);
            slot.removeEventListener('mouseout', hideTooltip);
            if (isDisablable) slot.removeEventListener('contextmenu', onContextMenu);
            slot.removeEventListener('click', onClick);
            slot.removeEventListener('pointerdown', onPointerDown);
            slot.removeEventListener('pointermove', onPointerMove);
            slot.removeEventListener('pointercancel', onPointerCancel);
            slot.removeEventListener('pointerup', onPointerUp);
        }
    };
}
