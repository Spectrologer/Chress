// Inventory management system
import { TILE_TYPES } from './constants.js';
import { Sign } from './Sign.js';

export class InventoryManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.tooltip = null;
        this.longPressTimeout = null;
        this.isLongPress = false;
    }

    // Main method to update inventory display
    updateInventoryDisplay() {
        this.tooltip = document.getElementById('inventory-tooltip');

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
                const foodName = item.foodType.split('/')[1] || item.foodType;
                return `${foodName} - Restores 10 hunger`;
            case 'water':
                return 'Water - Restores 10 thirst';
            case 'axe':
                return 'Axe - Chops grass and shrubbery to create pathways';
            case 'hammer':
                return 'Hammer - Breaks rocks to create pathways';
            case 'bishop_spear':
                return `Bishop Spear${disabledText} - Charge diagonally towards enemies, has ${item.uses} charges`;
            case 'horse_icon':
                return `Horse Icon${disabledText} - Charge in L-shape (knight moves) towards enemies, has ${item.uses} charges`;
            case 'bomb':
                return 'Bomb - Blasts through walls to create exits';
            case 'heart':
                return 'Heart - Restores 1 health';
            case 'note':
                return 'Map Note - Marks an undiscovered location 15-20 zones away on the map';
            default:
                return '';
        }
    }

    // Add visual elements to inventory slot
    addItemVisuals(slot, item) {
        if (item.disabled) {
            slot.classList.add('item-disabled');
        }

        if (item.type === 'food') {
            // Add the actual food sprite image to inventory slot
            const foodImg = document.createElement('img');
            foodImg.src = `Images/${item.foodType}`;
            foodImg.style.width = '100%';
            foodImg.style.height = '100%';
            foodImg.style.objectFit = 'contain';
            foodImg.style.imageRendering = 'pixelated';
            foodImg.style.opacity = item.disabled ? '0.5' : '1';
            slot.appendChild(foodImg);
        } else if (item.type === 'water') {
            slot.classList.add('item-water');
        } else if (item.type === 'axe') {
            slot.classList.add('item-axe');
        } else if (item.type === 'hammer') {
            slot.classList.add('item-hammer');
        } else if (item.type === 'bishop_spear') {
            slot.classList.add('item-spear'); // Reuse the class since same image
            // Add uses indicator
            slot.style.position = 'relative';
            const usesText = document.createElement('div');
            usesText.style.position = 'absolute';
            usesText.style.bottom = '4px';
            usesText.style.right = '5px';
            usesText.style.fontSize = '1.8em';
            usesText.style.fontWeight = 'bold';
            usesText.style.color = item.disabled ? '#666666' : '#000000';
            usesText.style.textShadow = '0 0 3px white, 0 0 3px white, 0 0 3px white';
            usesText.textContent = `x${item.uses}`;
            slot.appendChild(usesText);
        } else if (item.type === 'horse_icon') {
            // Create a container for the image and the uses text
            const container = document.createElement('div');
            container.style.position = 'relative';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';
            slot.appendChild(container);

            // Add the horse icon image to inventory slot
            const horseImg = document.createElement('img');
            horseImg.src = 'Images/items/horse.png';
            horseImg.style.width = '100%';
            horseImg.style.height = '100%';
            horseImg.style.objectFit = 'contain';
            horseImg.style.imageRendering = 'pixelated';
            horseImg.style.opacity = item.disabled ? '0.5' : '1';
            container.appendChild(horseImg);

            // Add uses indicator
            const usesText = document.createElement('div');
            usesText.style.position = 'absolute';
            usesText.style.bottom = '4px';
            usesText.style.right = '5px';
            usesText.style.fontSize = '1.8em';
            usesText.style.fontWeight = 'bold';
            usesText.style.color = item.disabled ? '#666666' : '#000000';
            usesText.style.textShadow = '0 0 3px white, 0 0 3px white, 0 0 3px white';
            usesText.textContent = `x${item.uses}`;
            container.appendChild(usesText);
        } else if (item.type === 'bomb') {
            slot.classList.add('item-bomb');
        } else if (item.type === 'heart') {
            slot.classList.add('item-heart');
        } else if (item.type === 'note') {
            slot.classList.add('item-note');
        }
    }

    // Add event listeners for inventory slot interactions
    addInventorySlotEvents(slot, item, idx, tooltipText) {
        let longPress = false;
        let longPressTimeout = null;

        // Helper functions for showing/hiding tooltips
        const showTooltip = () => {
            if (!this.tooltip) return;
            this.tooltip.textContent = tooltipText;
            const rect = slot.getBoundingClientRect();
            const inventoryRect = slot.closest('.player-inventory').getBoundingClientRect();
            const tooltipWidth = 200; // Approximate width

            // Position tooltip above the slot, centered, relative to player-inventory
            this.tooltip.style.left = `${rect.left - inventoryRect.left + (rect.width / 2) - (tooltipWidth / 2)}px`;
            this.tooltip.style.top = `${rect.top - inventoryRect.top - 40}px`; // 40px above
            this.tooltip.classList.add('show');
        };

        const hideTooltip = () => {
            if (this.tooltip) {
                this.tooltip.classList.remove('show');
            }
        };

        // Use item function to avoid duplication
        const useItem = () => {
            this.useInventoryItem(item, idx);
        };

        // Desktop hover events
        if (item.type === 'bishop_spear' || item.type === 'horse_icon') {
            // For special items, hover shows tooltip
            slot.addEventListener('mouseover', () => {
                if (!longPress) {
                    showTooltip();
                }
            });
            slot.addEventListener('mouseout', () => {
                if (!longPress) {
                    hideTooltip();
                }
            });
        } else {
            slot.addEventListener('mouseover', () => {
                if (!longPress) {
                    showTooltip();
                }
            });
            slot.addEventListener('mouseout', () => {
                if (!longPress) {
                    hideTooltip();
                }
            });
        }

        // Special handling for bishop_spear and horse_icon - long press to toggle disabled
        if (item.type === 'bishop_spear' || item.type === 'horse_icon') {
            // Desktop right-click or long press to toggle disabled
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.toggleItemDisabled(item, idx);
                this.game.uiManager.updatePlayerStats();
            });

            // Mobile touch events for long press to toggle disabled
            slot.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent click
                longPress = false;
                longPressTimeout = setTimeout(() => {
                    longPress = true;
                    this.toggleItemDisabled(item, idx);
                    this.game.uiManager.updatePlayerStats();
                    // Update tooltip if shown
                    hideTooltip();
                }, 500);
            });
            slot.addEventListener('touchmove', () => {
                if (longPressTimeout) {
                    clearTimeout(longPressTimeout);
                    longPressTimeout = null;
                }
            });
            slot.addEventListener('touchend', (e) => {
                if (longPressTimeout) {
                    clearTimeout(longPressTimeout);
                    // Short tap - use the item if not disabled
                    if (!longPress && !item.disabled) {
                        useItem();
                    }
                }
            });

            // Desktop click - use item if not disabled
            slot.addEventListener('click', () => {
                if (this.game.player.isDead() || item.disabled) return;
                useItem();
            });
        } else {
            // Mobile touch events for long press (general items)
            slot.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent click
                longPress = false;
                longPressTimeout = setTimeout(() => {
                    longPress = true;
                    showTooltip();
                    // Auto-hide after 2 seconds
                    setTimeout(hideTooltip, 2000);
                }, 500);
            });
            slot.addEventListener('touchmove', () => {
                if (longPressTimeout) {
                    clearTimeout(longPressTimeout);
                    longPressTimeout = null;
                }
            });
            slot.addEventListener('touchend', (e) => {
                if (longPressTimeout) {
                    clearTimeout(longPressTimeout);
                    // Short tap - use the item
                    if (!longPress) {
                        useItem();
                    }
                }
            });
        }

        // Special handling for bomb inventory item
        if (item.type === 'bomb') {
            let lastBombClickTime = 0;
            const bombClick = () => {
                const now = Date.now();
                const isDouble = (now - lastBombClickTime) < 300;
                lastBombClickTime = now;
                if (isDouble) {
                    // Double click: drop bomb where player is standing
                    const px = this.game.player.x, py = this.game.player.y;
                    this.game.grid[py][px] = { type: 'BOMB', actionTimer: 0 };
                    const bombIndex = this.game.player.inventory.findIndex(item => item.type === 'bomb');
                    if (bombIndex !== -1) this.game.player.inventory.splice(bombIndex, 1);
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
            slot.addEventListener('click', bombClick);
        } else {
            // Desktop click - use item
            slot.addEventListener('click', () => {
                if (this.game.player.isDead()) return;
                useItem();
            });
        }
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
                this.game.player.restoreHunger(10);
                this.game.player.inventory.splice(idx, 1);
                break;
            case 'water':
                this.game.player.restoreThirst(10);
                this.game.player.inventory.splice(idx, 1);
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

            case 'heart':
                this.game.player.setHealth(this.game.player.getHealth() + 1);
                this.game.player.inventory.splice(idx, 1);
                break;
            case 'note':
                this.useMapNote();
                this.game.hideOverlayMessage(); // Clear any existing overlay message

                const noteMessageText = 'Coordinates revealed! Added to message log.';

                // Use the sign message system to show a temporary, persistent message
                // This prevents the game loop (e.g., checkLionInteraction) from hiding it immediately.
                this.game.displayingMessageForSign = { message: noteMessageText }; // Set flag
                this.game.showSignMessage(noteMessageText, 'Images/items/note.png'); // Show message

                // Set a timeout to hide the message and clear the flag after 2 seconds
                setTimeout(() => {
                    // Only hide if the current message is still the one we set
                    if (this.game.displayingMessageForSign && this.game.displayingMessageForSign.message === noteMessageText) {
                        Sign.hideMessageForSign(this.game);
                    }
                }, 2000);

                this.game.player.inventory.splice(idx, 1); // Remove note from inventory
                break;
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
                    if (distance >= 15 && distance <= 20) {
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

        // Mark the zone as a special zone (with treasures)
        const availableFood = this.game.availableFoodAssets;
        const randomFood = availableFood[Math.floor(Math.random() * availableFood.length)];
        this.game.specialZones.set(zoneKey, [
            TILE_TYPES.BOMB,
            { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 },
            { type: TILE_TYPES.FOOD, foodType: randomFood }
        ]);

        // Mark the zone as visited (this adds it to the map)
        this.game.player.markZoneVisited(selected.x, selected.y);

        // Add to message log
        this.game.uiManager.addMessageToLog(`A distant location has been revealed on your map: (${selected.x}, ${selected.y})`);
        this.game.updatePlayerStats(); // Refresh map display
        this.game.uiManager.renderZoneMap(); // Immediately render the change
    }
}
