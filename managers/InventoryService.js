import { TILE_TYPES } from '../core/constants.js';

export class InventoryService {
    constructor(game, itemUsageHandler) {
        this.game = game;
        this.itemUsageHandler = itemUsageHandler;
    }

    getItemTooltipText(item) {
        let disabledText = item.disabled ? ' (DISABLED)' : '';
        switch (item.type) {
            case 'food':
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

    toggleItemDisabled(item) {
        if (typeof item.disabled === 'undefined') item.disabled = false;
        item.disabled = !item.disabled;
    }

    dropItem(itemType, tileType) {
        const currentTile = this.game.grid[this.game.player.y][this.game.player.x];
        if (currentTile === TILE_TYPES.FLOOR || (typeof currentTile === 'object' && currentTile.type === TILE_TYPES.FLOOR)) {
            this.game.grid[this.game.player.y][this.game.player.x] = tileType;
            this.game.player.inventory.splice(
                this.game.player.inventory.findIndex(item => item.type === itemType), 1
            );
        }
    }

    useInventoryItem(item, idx) {
        // Delegate actual effects to the ItemUsageHandler for separation of concerns
        if (this.itemUsageHandler && typeof this.itemUsageHandler.applyItemUse === 'function') {
            this.itemUsageHandler.applyItemUse(item, idx);
        } else {
            // Fallback: basic handling
            switch (item.type) {
                case 'food':
                    item.quantity = (item.quantity || 1) - 1;
                    this.game.player.restoreHunger(10);
                    if (item.quantity <= 0) this.game.player.inventory.splice(idx, 1);
                    break;
                case 'water':
                    item.quantity = (item.quantity || 1) - 1;
                    this.game.player.restoreThirst(10);
                    if (item.quantity <= 0) this.game.player.inventory.splice(idx, 1);
                    break;
                default:
                    break;
            }
        }
        // Ensure UI refresh
        if (this.game && typeof this.game.updatePlayerStats === 'function') this.game.updatePlayerStats();
    }

    useMapNote() {
        // Keep the same behavior as previous InventoryManager.useMapNote
        const currentZone = this.game.player.getCurrentZone();
        const visited = this.game.player.getVisitedZones();

        const candidates = [];
        for (let zoneX = currentZone.x - 50; zoneX <= currentZone.x + 50; zoneX++) {
            for (let zoneY = currentZone.y - 50; zoneY <= currentZone.y + 50; zoneY++) {
                const zoneKey = `${zoneX},${zoneY}`;
                if (!visited.has(zoneKey) && !this.game.specialZones.has(zoneKey)) {
                    const distance = Math.max(Math.abs(zoneX - currentZone.x), Math.abs(zoneY - currentZone.y));
                    if (distance >= 5 && distance <= 15) {
                        candidates.push({ x: zoneX, y: zoneY, distance });
                    }
                }
            }
        }

        if (candidates.length === 0) return;
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        const zoneKey = `${selected.x},${selected.y}`;

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
        this.game.player.markZoneVisited(selected.x, selected.y);
        this.game.uiManager.addMessageToLog(`A distant location has been revealed on your map: (${selected.x}, ${selected.y})`);
        if (this.game.updatePlayerStats) this.game.updatePlayerStats();
        if (this.game.uiManager && typeof this.game.uiManager.renderZoneMap === 'function') this.game.uiManager.renderZoneMap();
    }
}
