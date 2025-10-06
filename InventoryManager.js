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
                return 'Bishop Spear - Charge diagonally towards enemies, has ' + item.uses + ' charges';
            case 'bomb':
                return 'Bomb - Blasts through walls to create exits';
            case 'note':
                return 'Map Note - Marks an undiscovered location 20 zones away on the map';
            default:
                return '';
        }
    }

    // Add visual elements to inventory slot
    addItemVisuals(slot, item) {
        if (item.type === 'food') {
            // Add the actual food sprite image to inventory slot
            const foodImg = document.createElement('img');
            foodImg.src = `Images/${item.foodType}`;
            foodImg.style.width = '100%';
            foodImg.style.height = '100%';
            foodImg.style.objectFit = 'contain';
            foodImg.style.imageRendering = 'pixelated';
            slot.appendChild(foodImg);
        } else if (item.type === 'water') {
            slot.classList.add('item-water');
        } else if (item.type === 'axe') {
            slot.classList.add('item-axe');
        } else if (item.type === 'hammer') {
            slot.classList.add('item-hammer');
        } else if (item.type === 'bishop_spear') {
            slot.classList.add('item-spear'); // Reuse the class since same image
        } else if (item.type === 'bomb') {
            slot.classList.add('item-bomb');
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
        slot.addEventListener('mouseover', () => {
            if (!longPress) {
                showTooltip(slot, tooltipText);
            }
        });
        slot.addEventListener('mouseout', () => {
            if (!longPress) {
                hideTooltip();
            }
        });

        // Mobile touch events for long press
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

        // Desktop click - use item
        slot.addEventListener('click', () => {
            if (this.game.player.isDead()) return; // No restrictions like longPress here
            useItem();
        });
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
            case 'bomb':
                // Drop bomb at player's current position on whatever tile it rests on
                this.game.grid[this.game.player.y][this.game.player.x] = TILE_TYPES.BOMB;
                this.game.player.inventory.splice(idx, 1);
                break;
            case 'note':
                this.useMapNote();
                this.game.hideOverlayMessage(); // Clear any existing overlay message

                const noteMessageText = 'Coordinates revealed! Added to message log.';

                // Use the sign message system to show a temporary, persistent message
                // This prevents the game loop (e.g., checkLionInteraction) from hiding it immediately.
                this.game.displayingMessageForSign = { message: noteMessageText }; // Set flag
                this.game.showSignMessage(noteMessageText, 'Images/note.png'); // Show message

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
                    if (distance >= 20) {
                        candidates.push({ x: zoneX, y: zoneY, distance });
                    }
                }
            }
        }

        if (candidates.length === 0) {
            console.log('No valid undiscovered zones found 20+ zones away');
            return;
        }

        // Pick a random candidate
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        const zoneKey = `${selected.x},${selected.y}`;
        console.log(`Map note used: marking zone (${selected.x}, ${selected.y}) as special treasure zone from ${Math.max(Math.abs(selected.x - currentZone.x), Math.abs(selected.y - currentZone.y))} zones away`);

        // Mark the zone as a special zone (with treasures)
        this.game.specialZones.set(zoneKey, [
            'Treasure Found: Bombs Added',
            'Treasure Found: Spears Added',
            'Treasure Found: Food Added'
        ]);

        // Mark the zone as visited (this adds it to the map)
        this.game.player.markZoneVisited(selected.x, selected.y);

        // Add to message log
        this.game.uiManager.addMessageToLog(`A distant location has been revealed on your map: (${selected.x}, ${selected.y})`);
        this.game.updatePlayerStats(); // Refresh map display
        this.game.uiManager.renderZoneMap(); // Immediately render the change
    }
}
