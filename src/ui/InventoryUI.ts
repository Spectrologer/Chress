import type { IGame } from '@core/context';
import { TILE_TYPES, INVENTORY_CONSTANTS, TIMING_CONSTANTS, UI_CONSTANTS, GRID_SIZE } from '@core/constants/index';
import { logger } from '@core/logger';
import { ItemMetadata, type InventoryItem } from '@managers/inventory/ItemMetadata';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { EventListenerManager } from '@utils/EventListenerManager';

interface UseItemOptions {
    fromRadial?: boolean;
    isDoubleClick?: boolean;
}

// UI-specific extension of InventoryItem with additional transient properties
type UIInventoryItem = InventoryItem & {
    image?: string;
    _suppressContextMenuUntil?: number;
    _pendingToggle?: boolean;
};

// Extended HTMLElement for inventory slots with pointer tracking
type InventorySlotElement = HTMLElement & {
    _pressStartX?: number;
    _pressStartY?: number;
};

interface Player {
    inventory: InventoryItem[];
    isDead(): boolean;
}

interface InventoryService {
    useItem(item: InventoryItem, options?: UseItemOptions): boolean;
    toggleItemDisabled(item: InventoryItem): void;
}

interface InventoryInteractionHandler {
    handleBombInteraction(bombItem: InventoryItem, options: UseItemOptions): void;
    handleItemUse(item: InventoryItem, options: UseItemOptions): void;
}

export class InventoryUI {
    private game: IGame;
    private inventoryService: InventoryService;
    // WeakMap to track last-used timestamps per item object (survives DOM re-renders)
    private _itemLastUsed: WeakMap<UIInventoryItem, number>;
    // Track active pointer interactions to prevent newly created slots from interfering
    private _activePointerIds: Set<number>;
    // Track when slots were created to ignore pointer events from previous interactions
    private _slotCreationTime: number;
    private eventManager: EventListenerManager;

    constructor(game: IGame, inventoryService: InventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;
        this._itemLastUsed = new WeakMap();
        this._activePointerIds = new Set();
        this._slotCreationTime = 0;
        this.eventManager = new EventListenerManager();
    }

    updateInventoryDisplay(): void {
        const inventoryGrid = document.querySelector<HTMLElement>('.inventory-list');
        if (inventoryGrid) {
            inventoryGrid.innerHTML = '';
            // Record the time when new slots are being created
            this._slotCreationTime = Date.now();

            // Render all slots up to MAX_INVENTORY_SIZE, creating empty slots for null items
            for (let idx = 0; idx < INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE; idx++) {
                const item = this.game.player.inventory[idx];
                let slot: HTMLDivElement;

                if (item && item !== null) {
                    // Render item slot
                    slot = this.createInventorySlot(item as UIInventoryItem, idx);
                } else {
                    // Render empty slot
                    slot = document.createElement('div');
                    slot.className = 'inventory-slot';
                }

                inventoryGrid.appendChild(slot);
            }
        }
    }

    private createInventorySlot(item: UIInventoryItem, idx: number): HTMLDivElement {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.style.cursor = this.game.player.isDead() ? 'not-allowed' : 'pointer';

        // Visuals
        this.addItemVisuals(slot, item);

        // Events
        this.addInventorySlotEvents(slot, item, idx);

        return slot;
    }

    private addItemVisuals(slot: HTMLDivElement, item: UIInventoryItem): void {
        // Add disabled styling
        if (item.disabled) slot.classList.add('item-disabled');
        // Ensure slot is positioned for absolute children
        slot.style.position = slot.style.position || '';

        // Visual rules for known item types (mirrors InventoryManager)
        switch (item.type) {
            case 'food':
                this._createItemImage(slot, `assets/${item.foodType}`, item);
                if ((item.quantity || 0) > 1) this._addUsesIndicator(slot, item);
                break;
            case 'water':
                slot.classList.add('item-water');
                if ((item.quantity || 0) > 1) this._addUsesIndicator(slot, item);
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
                this._createItemImage(slot, 'assets/items/misc/horse.png', item);
                if (('uses' in item && typeof item.uses === 'number' && item.uses > 1) || ('quantity' in item && typeof item.quantity === 'number' && item.quantity > 1)) this._addUsesIndicator(slot, item);
                break;
            case 'bomb':
                this._createItemImage(slot, 'assets/items/misc/bomb.png', item);
                if ((item.quantity || 0) > 1) this._addUsesIndicator(slot, item);
                break;
            case 'heart':
                slot.classList.add('item-heart');
                if ((item.quantity || 0) > 1) {
                    this._addUsesIndicator(slot, item);
                }
                break;
            case 'note':
                slot.classList.add('item-note');
                if ((item.quantity || 0) > 1) this._addUsesIndicator(slot, item);
                break;
            case 'book_of_time_travel':
                slot.classList.add('item-book');
                this._addUsesIndicator(slot, item);
                break;
            case 'bow':
                this._createItemImage(slot, 'assets/items/equipment/bow.png', item, { transform: 'rotate(-90deg)' });
                this._addUsesIndicator(slot, item);
                break;
            case 'shovel':
                this._createItemImage(slot, 'assets/items/equipment/shovel.png', item);
                this._addUsesIndicator(slot, item);
                break;
            default:
                // Unknown item types: try to show an image if path provided
                const extendedItem = item as UIInventoryItem;
                if ('image' in extendedItem && extendedItem.image) {
                    this._createItemImage(slot, extendedItem.image, item);
                }
                break;
        }
    }

    // Private helper: create an img element and append to parent
    private _createItemImage(parent: HTMLElement, src: string, item: UIInventoryItem, extraStyles: {transform?: string} = {}): void {
        const img = document.createElement('img');
        img.src = src;
        img.classList.add('item-img');
        // Apply opacity for disabled items
        if (item && item.disabled) img.style.opacity = '0.5';
        if (extraStyles && extraStyles.transform) img.style.transform = extraStyles.transform;
        parent.appendChild(img);
    }

    // Private helper: add a uses indicator element to parent
    private _addUsesIndicator(parent: HTMLElement, item: UIInventoryItem): void {
        parent.style.position = parent.style.position || 'relative';
        const usesText = document.createElement('div');
        usesText.classList.add('uses-indicator');
        usesText.textContent = `x${item.uses || item.quantity}`;
        if (item && item.disabled) usesText.classList.add('disabled'); else usesText.classList.add('enabled');
        parent.appendChild(usesText);
    }

    private addInventorySlotEvents(slot: HTMLDivElement, item: UIInventoryItem, idx: number): void {
        const isDisablable = ['bishop_spear', 'horse_icon', 'bow'].includes(item.type);
        let isLongPress = false;
        let pressTimeout: number | null = null;
    // Track recent pointer interactions so we can ignore the synthetic click
    // event that follows a pointer sequence on some platforms.
    let _lastPointerTime = 0;
    let _lastPointerWasTouch = false;
    // Track when a pointer handler actually triggered a use so click() can be suppressed
    let _lastPointerTriggeredUseTime = 0;
    // Use a per-item timestamp to suppress contextmenu that may fire after a long-press
    // This survives DOM re-renders because the item object is preserved.

    // Store the item reference at the start of the interaction to prevent
    // clicking on repositioned items after the original item is consumed
    let clickedItem: UIInventoryItem | null = null;

        const useItem = (itemToUse: UIInventoryItem | null): boolean => {
            // Only use the item that was clicked, not whatever might be in this slot now
            if (!itemToUse) return false;

            // Verify the item is still in the inventory
            const stillInInventory = this.game.player.inventory.includes(itemToUse);
            if (!stillInInventory) {
                if ((window as any).inventoryDebugMode) logger.debug('[INV.UI] item no longer in inventory', { itemType: itemToUse.type });
                return false;
            }

            // Per-item guard to prevent duplicate uses within a short window
            const last = this._itemLastUsed.get(itemToUse) || 0;
            const now = Date.now();
            if (now - last < TIMING_CONSTANTS.ITEM_USE_DEBOUNCE) {
                if ((window as any).inventoryDebugMode) logger.debug('[INV.UI] suppressed duplicate use', { idx, itemType: itemToUse.type, delta: now - last });
                return false;
            }
            this._itemLastUsed.set(itemToUse, now);

            if ((window as any).inventoryDebugMode) {
                logger.debug('[INV.UI] useItem called', { idx, itemType: itemToUse.type, time: Date.now() });
                try { throw new Error('INV.UI useItem stack'); } catch (e: any) { logger.debug(e.stack); }
            }
            return this.inventoryService.useItem(itemToUse, { fromRadial: false });
        };
        const toggleDisabled = (): void => {
            this.inventoryService.toggleItemDisabled(item);
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        };

        if (isDisablable) {
            this.eventManager.addContextMenu(slot, (e) => {
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
            }, { preventDefault: true });
        }

        this.eventManager.add(slot, 'click', (ev) => {
            // Ignore click if it immediately follows a pointer handler that already triggered use
            const now = Date.now();
            if (_lastPointerTriggeredUseTime && (now - _lastPointerTriggeredUseTime) < TIMING_CONSTANTS.POINTER_ACTION_DEBOUNCE) return;
            // Also ignore click if it follows a touch pointer (legacy behavior)
            if (_lastPointerWasTouch && (now - _lastPointerTime) < TIMING_CONSTANTS.TOUCH_DEBOUNCE) return;
            if (this.game.player.isDead()) return;
            if (item.type === 'bomb') return; // bomb handled differently
            if (!isDisablable || !item.disabled) {
                useItem(item);
                _lastPointerTriggeredUseTime = Date.now();
            }
        });

        // Pointer-based long-press/tap handling for inventory slots
        let pressPointerId: number | null = null;
        const onPointerDown = (e: PointerEvent): void => {
            // only consider primary button for mouse
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            // Ignore pointer events on slots created while another pointer interaction is active
            // This prevents the bug where consuming an item causes DOM regeneration and the
            // pointerup event fires on a newly created slot for a different item
            if (this._activePointerIds.size > 0) {
                // There's already an active pointer interaction, ignore this one
                return;
            }

            e?.preventDefault?.();
            isLongPress = false;
            // record pointer info to suppress the following click
            _lastPointerTime = Date.now();
            _lastPointerWasTouch = e.pointerType !== 'mouse';
            pressPointerId = e.pointerId;
            // Track this active pointer interaction globally
            this._activePointerIds.add(e.pointerId);
            // Capture the item at the start of the interaction
            clickedItem = item;
            // store start position so small movements don't cancel long-press
            const startX = e.clientX || 0;
            const startY = e.clientY || 0;
            pressTimeout = window.setTimeout(() => {
                isLongPress = true;
                if (isDisablable) {
                    // mark intent to toggle and show temporary disabled visual while holding
                    item._pendingToggle = true;
                    slot.classList.add('item-disabled-temp');
                    item._suppressContextMenuUntil = Date.now() + TIMING_CONSTANTS.ITEM_CONTEXT_MENU_SUPPRESS;
                }
            }, TIMING_CONSTANTS.LONG_PRESS_TIMEOUT);
            (e.target as Element)?.setPointerCapture?.(e.pointerId);
            // store start coords on the slot element so move handler can access them
            (slot as InventorySlotElement)._pressStartX = startX;
            (slot as InventorySlotElement)._pressStartY = startY;
        };

        const onPointerMove = (e: PointerEvent): void => {
            if (pressPointerId !== e.pointerId) return;
            // cancel long-press only if pointer moved significantly
            const sx = (slot as InventorySlotElement)._pressStartX || 0;
            const sy = (slot as InventorySlotElement)._pressStartY || 0;
            const dx = (e.clientX || 0) - sx;
            const dy = (e.clientY || 0) - sy;
            const distSq = dx * dx + dy * dy;
            if (distSq > TIMING_CONSTANTS.POINTER_MOVE_THRESHOLD_SQUARED) {
                if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
                delete item._pendingToggle;
                slot.classList.remove('item-disabled-temp');
            }
        };

        const onPointerCancel = (e: PointerEvent): void => {
            if (pressPointerId !== e.pointerId) return;
            if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
            delete item._pendingToggle;
            slot.classList.remove('item-disabled-temp');
            // Clean up active pointer tracking
            this._activePointerIds.delete(e.pointerId);
            pressPointerId = null;
            clickedItem = null;
        };

        const onPointerUp = (e: PointerEvent): void => {
            if (pressPointerId !== e.pointerId) return;
            if (pressTimeout) { clearTimeout(pressTimeout); pressTimeout = null; }
            if (!isLongPress) {
                if (this.game.player.isDead()) return;
                if (clickedItem && clickedItem.type === 'bomb') return;
                if (clickedItem && (!isDisablable || !clickedItem.disabled)) {
                    useItem(clickedItem);
                    _lastPointerTriggeredUseTime = Date.now();
                }
            }
            (e.target as Element)?.releasePointerCapture?.(e.pointerId);
            // If a long-press created a pending toggle, commit it now (stable place to change data)
            if (item._pendingToggle) {
                delete item._pendingToggle;
                slot.classList.remove('item-disabled-temp');
                toggleDisabled();
            }
            // Clean up active pointer tracking
            this._activePointerIds.delete(e.pointerId);
            pressPointerId = null;
            clickedItem = null;
        };

        this.eventManager.addPointerSequence(slot, {
            onDown: onPointerDown,
            onMove: onPointerMove,
            onCancel: onPointerCancel,
            onUp: onPointerUp
        }, { passive: false });

    // Bomb handling via unified InventoryInteractionHandler
        if (item.type === 'bomb') {
            let lastBombClickTime = 0;
            // Prevent back-to-back duplicate invocations (e.g., pointerup + synthetic click)
            let _lastBombActionTime = 0;
            const bombClick = (): void => {
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
                    } else if ((window as any).inventoryDebugMode) {
                        logger.debug('[INV.UI] suppressed duplicate bomb use', { idx });
                    }
                }
            };
            this.eventManager.add(slot, 'click', bombClick);
            this.eventManager.add(slot, 'pointerup', (e: PointerEvent) => {
                if (!isLongPress && e.pointerType !== 'mouse') bombClick();
            });
        }
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the InventoryUI instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }

}
