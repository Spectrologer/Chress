// (Merged ItemUsageManager logic: useMapNote for revealing distant zones)
// Inventory management system
// Inventory management system
import { TILE_TYPES } from '../core/constants.js';
import { Sign } from '../ui/Sign.js';

export class InventoryManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.tooltip = null;
        this.longPressTimeout = null;
        this.isLongPress = false;
        // WeakMap to track last-used timestamps per item object (survives DOM re-renders)
        this._itemLastUsed = new WeakMap();
    }

    // Main method to update inventory display
    updateInventoryDisplay() {
        this.tooltip = document.getElementById('inventory-tooltip');
        // Hide tooltip when inventory updates to prevent stuck tooltips
        if (this.tooltip) {
            this.tooltip.classList.remove('show');
        }

        // Render inventory items
        const inventoryGrid = document.querySelector('.inventory-list');
        if (inventoryGrid) {
            inventoryGrid.innerHTML = '';
            this.game.player.inventory.forEach((item, idx) => {
                const slot = this.createInventorySlot(item, idx);
                inventoryGrid.appendChild(slot);
            });
            // Add empty slots to fill up to 6
            for (let i = this.game.player.inventory.length; i < 6; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                inventoryGrid.appendChild(slot);
            }
        }
    }

    // Create an inventory slot element for a specific item
    createInventorySlot(item, idx) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.style.cursor = this.game.player.isDead() ? 'not-allowed' : 'pointer';

        // Determine tooltip text
        const tooltipText = this.getItemTooltipText(item);

        // Add visual representation
        this.addItemVisuals(slot, item);

        // Add interaction events
        this.addInventorySlotEvents(slot, item, idx, tooltipText);

        return slot;
    }

    // Get tooltip text for an item
    getItemTooltipText(item) {
        let disabledText = item.disabled ? ' (DISABLED)' : '';
        switch (item.type) {
            case 'food':
                // Expected format: 'food/<category>/<name.png>' -> show category (e.g. 'meat')
                // Tests expect 'meat' for 'food/meat/beaf.png'. Use the second segment when present.
                let foodName = item.foodType || '';
                try {
                    const parts = foodName.split('/');
                    if (parts.length >= 2) {
                        foodName = parts[1];
                    } else {
                        foodName = parts.pop().replace('.png', '');
                    }
                } catch (e) {
                    foodName = (item.foodType || '').split('/').pop().replace('.png', '');
                }
                const foodQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
                return `${foodName}${foodQuantity} - Restores 10 hunger`;
            case 'water':
                const waterQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
                return `Water${waterQuantity} - Restores 10 thirst`;
            case 'axe':
                return 'Axe - Chops grass and shrubbery to create pathways';
            case 'hammer':
                return 'Hammer - Breaks rocks to create pathways';
            case 'bishop_spear':
                return `Bishop Spear${disabledText} - Charge diagonally towards enemies, has ${item.uses} charges`;
            case 'horse_icon':
                return `Horse Icon${disabledText} - Charge in L-shape (knight moves) towards enemies, has ${item.uses} charges`;
            case 'bomb':
                const bombQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
                return `Bomb${bombQuantity} - Blasts through walls to create exits`;
            case 'heart':
                return 'Heart - Restores 1 health';
            case 'note':
                return 'Map Note - Marks an undiscovered location 15-20 zones away on the map';
            case 'book_of_time_travel':
                return `Book of Time Travel - Passes one turn, allowing enemies to move. Has ${item.uses} charges.`;
            case 'bow':
                return `Bow${disabledText} - Fires an arrow in an orthogonal direction. Has ${item.uses} charges.`;
            case 'shovel':
                return `Shovel - Digs a hole in an adjacent empty tile. Has ${item.uses} uses.`;
            default:
                return '';
        }
    }

    // Helper to add uses indicator to an item slot
    _addUsesIndicator(slot, item) {
        slot.style.position = 'relative';
        const usesText = document.createElement('div');
        usesText.style.position = 'absolute';
        usesText.style.bottom = '4px';
        usesText.style.right = '5px';
        usesText.style.fontSize = '1.8em';
        usesText.style.fontWeight = 'bold';
        usesText.style.color = item.disabled ? '#666666' : '#000000';
        usesText.style.textShadow = '0 0 3px white, 0 0 3px white, 0 0 3px white';
        usesText.textContent = `x${item.uses || item.quantity}`;
        slot.appendChild(usesText);
    }

    // Helper to create a container for an item image and its uses indicator
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

    // Add visual elements to inventory slot
    addItemVisuals(slot, item) {
        if (item.disabled) {
            slot.classList.add('item-disabled');
        }

        if (item.type === 'food') {
            // Add the actual food sprite image to inventory slot
            const foodImg = document.createElement('img');
            foodImg.src = `assets/${item.foodType}`;
            foodImg.style.width = '70%'; // Scale down to match on-ground appearance
            foodImg.style.height = '70%';
            foodImg.style.objectFit = 'contain'; // Keep aspect ratio
            foodImg.style.imageRendering = 'pixelated';
            foodImg.style.opacity = item.disabled ? '0.5' : '1';
            slot.appendChild(foodImg);
            if (item.quantity > 1) {
                this._addUsesIndicator(slot, item);
            }
        } else if (item.type === 'water') {
            slot.classList.add('item-water');
            if (item.quantity > 1) {
                this._addUsesIndicator(slot, item);
            }
        } else if (item.type === 'axe') {
            slot.classList.add('item-axe');
        } else if (item.type === 'hammer') {
            slot.classList.add('item-hammer');
        } else if (item.type === 'bishop_spear') {
            slot.classList.add('item-spear'); // Reuse the class since same image
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
            if (item.quantity > 1) {
                this._addUsesIndicator(slot, item);
            }
        } else if (item.type === 'book_of_time_travel') {
            slot.classList.add('item-book');
            this._addUsesIndicator(slot, item);
        } else if (item.type === 'bow') {
            this._createItemImageContainer(slot, item, 'assets/items/bow.png', { transform: 'rotate(-90deg)' });
        } else if (item.type === 'shovel') {
            this._createItemImageContainer(slot, item, 'assets/items/shovel.png');
        }
    }

    // Add event listeners for inventory slot interactions
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
    // Use per-item timestamp to suppress contextmenu after long-press (survives re-render)

        const showTooltip = () => {
            try {
                if (item._suppressTooltipUntil && Date.now() < item._suppressTooltipUntil) return;
            } catch (e) {}
            this.showTooltip(slot, tooltipText);
        };
        const hideTooltip = () => this.hideTooltip();
        const useItem = () => {
            // Per-item guard to prevent duplicate uses within a short window
            try {
                const last = this._itemLastUsed.get(item) || 0;
                const now = Date.now();
                if (now - last < 600) {
                    if (window.inventoryDebugMode) console.log('[INV.MGR] suppressed duplicate use', { idx, itemType: item.type, delta: now - last });
                    return;
                }
                this._itemLastUsed.set(item, now);
            } catch (e) {}
            if (window.inventoryDebugMode) {
                console.log('[INV.MGR] useItem called', { idx, itemType: item.type, time: Date.now() });
                try { throw new Error('INV.MGR useItem stack'); } catch (e) { console.log(e.stack); }
            }
            return this.useInventoryItem(item, idx);
        };
        const toggleDisabled = () => {
            this.toggleItemDisabled(item, idx);
            this.game.uiManager.updatePlayerStats();
            try { item._suppressTooltipUntil = Date.now() + 300; } catch (e) {}
            hideTooltip();
        };

        // --- Event Listeners ---

        // Hover for Tooltip (Desktop)
        slot.addEventListener('mouseover', showTooltip);
        slot.addEventListener('mouseout', hideTooltip);

        // Right-click to toggle disabled (Desktop)
        if (isDisablable) {
            slot.addEventListener('contextmenu', (e) => {
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
            });
        }

        // Click to use (Desktop)
        slot.addEventListener('click', (ev) => {
            const now = Date.now();
            if (_lastPointerTriggeredUseTime && (now - _lastPointerTriggeredUseTime) < 500) return;
            if (_lastPointerWasTouch && (now - _lastPointerTime) < 500) return;
            if (this.game.player.isDead()) return;
            if (item.type === 'bomb') {
                // Special bomb logic is handled separately
                return;
            }
            if (!isDisablable || !item.disabled) {
                useItem();
                _lastPointerTriggeredUseTime = Date.now();
            }
        });

        // Pointer-based long-press/tap handling for inventory slots
        let pressPointerId = null;
        const onPointerDown = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            try { e.preventDefault(); } catch (err) {}
            // record pointer info to suppress the following click
            _lastPointerTime = Date.now();
            _lastPointerWasTouch = e.pointerType !== 'mouse';
            isLongPress = false;
            pressPointerId = e.pointerId;
            const startX = e.clientX || 0;
            const startY = e.clientY || 0;
            pressTimeout = setTimeout(() => {
                isLongPress = true;
                if (isDisablable) {
                    // Mark pending toggle and show temporary disabled visual during hold
                    try { item._pendingToggle = true; } catch (e) {}
                    slot.classList.add('item-disabled-temp');
                    try { item._suppressContextMenuUntil = Date.now() + 1000; } catch (e) {}
                } else {
                    showTooltip();
                    // Auto-hide tooltip after 2s
                    this.game.animationScheduler.createSequence().wait(2000).then(hideTooltip).start();
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
            const threshold = 12 * 12; // 12px threshold squared
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
            if (pressTimeout) {
                clearTimeout(pressTimeout);
                pressTimeout = null;
            }
            if (!isLongPress) {
                // This was a tap
                if (this.game.player.isDead()) return;
                if (item.type === 'bomb') {
                    // Special bomb logic is handled separately
                    return;
                }
                if (!isDisablable || !item.disabled) {
                    useItem();
                    _lastPointerTriggeredUseTime = Date.now();
                }
            }
            try { e.target.releasePointerCapture?.(e.pointerId); } catch (err) {}
            // Commit pending toggle if present (do the actual data change after release)
            try {
                if (item._pendingToggle) {
                    delete item._pendingToggle;
                    slot.classList.remove('item-disabled-temp');
                    toggleDisabled();
                }
            } catch (err) {}
            pressPointerId = null;
            // Ensure tooltip is hidden when pointer is released to avoid stuck tooltips
            hideTooltip();
        };

    slot.addEventListener('pointerdown', onPointerDown, { passive: false });
    slot.addEventListener('pointermove', onPointerMove);
    slot.addEventListener('pointercancel', onPointerCancel);
    slot.addEventListener('pointerup', onPointerUp);

        // Special handling for bomb inventory item
        if (item.type === 'bomb') {
            let lastBombClickTime = 0;
            let _lastBombActionTime = 0; // debounce guard for immediate duplicate calls
            const bombClick = () => {
                const now = Date.now();
                if (now - _lastBombActionTime < 250) return;
                _lastBombActionTime = now;

                const isDouble = (now - lastBombClickTime) < 300;
                lastBombClickTime = now;
                if (isDouble) {
                    // Double click: drop bomb where player is standing
                    const px = this.game.player.x, py = this.game.player.y;
                    this.game.grid[py][px] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true };
                    const bombItem = this.game.player.inventory.find(item => item.type === 'bomb');
                    if (bombItem) {
                        // respect per-item guard to avoid double consumption
                        const last = this._itemLastUsed.get(bombItem) || 0;
                        const now = Date.now();
                        if (now - last >= 600) {
                            this._itemLastUsed.set(bombItem, now);
                            this.useInventoryItem(bombItem, this.game.player.inventory.indexOf(bombItem));
                        } else if (window.inventoryDebugMode) console.log('[INV.MGR] suppressed duplicate bomb use', {idx});
                    }
                    this.game.uiManager.updatePlayerStats();
                } else {
                    // Single click: start bomb placement mode
                    const px = this.game.player.x, py = this.game.player.y;
                    this.game.bombPlacementPositions = [];
                    const directions = [
                        {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}
                    ];
                    for (const dir of directions) {
                        const nx = px + dir.dx, ny = py + dir.dy;
                        if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9 && (this.game.grid[ny][nx] === TILE_TYPES.FLOOR || this.game.grid[ny][nx] === TILE_TYPES.EXIT)) {
                            this.game.bombPlacementPositions.push({x: nx, y: ny});
                        }
                    }
                    this.game.bombPlacementMode = true;
                }
            };
            // We need to handle both click and tap for bombs
            slot.addEventListener('click', bombClick);
                // Re-add pointerup listener specifically for bomb's tap action
                slot.addEventListener('pointerup', (e) => {
                      if (!isLongPress && e.pointerType !== 'mouse') {
                          bombClick();
                      }
                });
        }
    }

    showTooltip(slot, text) {
        if (!this.tooltip) return;
        this.tooltip.textContent = text;
        const rect = slot.getBoundingClientRect();
        const inventoryRect = slot.closest('.player-inventory').getBoundingClientRect();
        const tooltipWidth = 200; // Approximate width

        // Position tooltip above the slot, centered, relative to player-inventory
        this.tooltip.style.left = `${rect.left - inventoryRect.left + (rect.width / 2) - (tooltipWidth / 2)}px`;
        this.tooltip.style.top = `${rect.top - inventoryRect.top - 40}px`; // 40px above
        this.tooltip.classList.add('show');
    }

    hideTooltip() {
        if (this.tooltip) this.tooltip.classList.remove('show');
    }

    // Toggle the disabled state of an item
    toggleItemDisabled(item, idx) {
        // Initialize disabled if not present
        if (typeof item.disabled === 'undefined') {
            item.disabled = false;
        }
        // Toggle the state
        item.disabled = !item.disabled;
        // Update the inventory display to reflect the change
        this.updateInventoryDisplay();
    }

    // Handle using an inventory item
    useInventoryItem(item, idx) {
        switch (item.type) {
            case 'food':
                item.quantity = (item.quantity || 1) - 1;
                this.game.player.restoreHunger(10);
                if (item.quantity <= 0) {
                    this.game.player.inventory.splice(idx, 1);
                }
                break;
            case 'water':
                item.quantity = (item.quantity || 1) - 1;
                this.game.player.restoreThirst(10);
                if (item.quantity <= 0) {
                    this.game.player.inventory.splice(idx, 1);
                }
                break;
            case 'bomb':
                item.quantity = (item.quantity || 1) - 1;
                if (item.quantity <= 0) {
                    this.game.player.inventory.splice(idx, 1);
                }
                break;
            case 'axe':
                this.dropItem('axe', TILE_TYPES.AXE);
                break;
            case 'hammer':
                this.dropItem('hammer', TILE_TYPES.HAMMER);
                break;
            case 'bishop_spear':
                this.dropItem('bishop_spear', { type: TILE_TYPES.BISHOP_SPEAR, uses: item.uses });
                break;
            case 'horse_icon':
                this.dropItem('horse_icon', { type: TILE_TYPES.HORSE_ICON, uses: item.uses });
                break;
            case 'bow':
                this.dropItem('bow', { type: TILE_TYPES.BOW, uses: item.uses });
                break;
            case 'shovel':
                this.game.shovelMode = true;
                this.game.activeShovel = item;
                this.game.uiManager.showOverlayMessage('Click an adjacent tile to dig a hole.');
                // Don't end turn, wait for player to click a tile
                break;

            case 'heart':
                this.game.player.setHealth(this.game.player.getHealth() + 1);
                this.game.player.inventory.splice(idx, 1);
                break;
            case 'note':
                // Consume a single note from the stack
                item.quantity = (item.quantity || 1) - 1;
                this.useMapNote();
                this.game.hideOverlayMessage(); // Clear any existing overlay message

                const noteMessageText = 'Coordinates revealed! Added to message log.';

                // Add a stacked note card instead of using the single sign overlay
                if (this.game.uiManager && this.game.uiManager.messageManager && typeof this.game.uiManager.messageManager.addNoteToStack === 'function') {
                    this.game.uiManager.messageManager.addNoteToStack(noteMessageText, 'assets/items/note.png', 2000);
                } else {
                    // Fallback to older sign message system for compatibility
                    this.game.displayingMessageForSign = { message: noteMessageText }; // Set flag
                    this.game.showSignMessage(noteMessageText, 'assets/items/note.png'); // Show message
                    // Hide after 2s using AnimationScheduler
                    this.game.animationScheduler.createSequence()
                        .wait(2000)
                        .then(() => {
                            if (this.game.displayingMessageForSign && this.game.displayingMessageForSign.message === noteMessageText) {
                                Sign.hideMessageForSign(this.game);
                            }
                        })
                        .start();
                }

                // Remove the inventory entry only when quantity reaches zero
                if (item.quantity <= 0) {
                    this.game.player.inventory.splice(idx, 1);
                }
                break;
            case 'book_of_time_travel':
                item.uses--;
                if (item.uses <= 0) {
                    this.game.player.inventory.splice(idx, 1);
                }
                this.game.startEnemyTurns();
                this.game.updatePlayerStats(); // Update inventory display
                // No need to update stats here, as startEnemyTurns will handle the flow
                return; // Return early to avoid double-updating stats
        }

        this.game.updatePlayerStats(); // Refresh display after changes
    }

    // Helper method to drop items at player's position
    dropItem(itemType, tileType) {
        // Only drop if on floor or replaceable tile
        const currentTile = this.game.grid[this.game.player.y][this.game.player.x];
        if (currentTile === TILE_TYPES.FLOOR ||
            (typeof currentTile === 'object' && currentTile.type === TILE_TYPES.FLOOR)) {
            this.game.grid[this.game.player.y][this.game.player.x] = tileType;
            this.game.player.inventory.splice(
                this.game.player.inventory.findIndex(item => item.type === itemType), 1
            );
        }
    }

    // Use map note (extracted from game.js)
    useMapNote() {
        const currentZone = this.game.player.getCurrentZone();
        const visited = this.game.player.getVisitedZones();

        // Find all undiscovered zones within a reasonable range
        const candidates = [];
        for (let zoneX = currentZone.x - 50; zoneX <= currentZone.x + 50; zoneX++) {
            for (let zoneY = currentZone.y - 50; zoneY <= currentZone.y + 50; zoneY++) {
                const zoneKey = `${zoneX},${zoneY}`;
                if (!visited.has(zoneKey) && !this.game.specialZones.has(zoneKey)) {
                    // Calculate Manhattan distance (zones)
                    const distance = Math.max(Math.abs(zoneX - currentZone.x), Math.abs(zoneY - currentZone.y));
                    if (distance >= 5 && distance <= 15) {
                        candidates.push({ x: zoneX, y: zoneY, distance });
                    }
                }
            }
        }

        if (candidates.length === 0) {
            return;
        }

        // Pick a random candidate
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        const zoneKey = `${selected.x},${selected.y}`;

        // Mark the zone as a special zone with a new set of treasures
        const treasurePool = [
            () => ({ type: TILE_TYPES.FOOD, foodType: this.game.availableFoodAssets[Math.floor(Math.random() * this.game.availableFoodAssets.length)] }),
            () => TILE_TYPES.WATER,
            () => TILE_TYPES.BOMB,
            () => ({ type: TILE_TYPES.BOW, uses: 3 }),
            () => ({ type: TILE_TYPES.HORSE_ICON, uses: 3 }),
            () => ({ type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 }),
            () => ({ type: TILE_TYPES.BISHOP_SPEAR, uses: 3 })
        ];

        const treasures = [];
        for (let i = 0; i < 4; i++) {
            const getRandomTreasure = treasurePool[Math.floor(Math.random() * treasurePool.length)];
            treasures.push(getRandomTreasure());
        }
        this.game.specialZones.set(zoneKey, treasures);

        // Mark the zone as visited (this adds it to the map)
        this.game.player.markZoneVisited(selected.x, selected.y);

        // Add to message log
        this.game.uiManager.addMessageToLog(`A distant location has been revealed on your map: (${selected.x}, ${selected.y})`);
        this.game.updatePlayerStats(); // Refresh map display
        this.game.uiManager.renderZoneMap(); // Immediately render the change
    }
}
