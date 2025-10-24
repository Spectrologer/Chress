import { TILE_TYPES } from '../core/constants.js';

// Consolidated service for item-related business logic (tooltips, using, dropping, special uses)
export class ItemService {
    constructor(game, itemUsageHandler = null) {
        this.game = game;
        this.itemUsageHandler = itemUsageHandler;
    }

    getItemTooltipText(item) {
        let disabledText = item.disabled ? ' (DISABLED)' : '';
        switch (item.type) {
            case 'food': {
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
            }
            case 'water': {
                const waterQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
                return `Water${waterQuantity} - Restores 10 thirst`;
            }
            case 'axe':
                return 'Axe - Chops grass and shrubbery to create pathways';
            case 'hammer':
                return 'Hammer - Breaks rocks to create pathways';
            case 'bishop_spear':
                return `Bishop Spear${disabledText} - Charge diagonally towards enemies, has ${item.uses} charges`;
            case 'horse_icon':
                return `Horse Icon${disabledText} - Charge in L-shape (knight moves) towards enemies, has ${item.uses} charges`;
            case 'bomb': {
                const bombQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
                return `Bomb${bombQuantity} - Blasts through walls to create exits`;
            }
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

    // Remove an item object from either normal inventory or radial inventory
    _removeItemFromEither(item) {
        const pi = this.game.player.inventory.indexOf(item);
        if (pi >= 0) { this.game.player.inventory.splice(pi, 1); return true; }
        const ri = this.game.player.radialInventory ? this.game.player.radialInventory.indexOf(item) : -1;
        if (ri >= 0) { this.game.player.radialInventory.splice(ri, 1); try { import('./RadialPersistence.js').then(m=>m.saveRadialInventory(this.game)).catch(()=>{}); } catch(e){} return true; }
        return false;
    }

    // Drop a tile at player's position and remove the corresponding item from either inventory
    _dropFromEither(itemType, tileType) {
        const currentTile = this.game.grid[this.game.player.y][this.game.player.x];
        if (currentTile === TILE_TYPES.FLOOR || (typeof currentTile === 'object' && currentTile.type === TILE_TYPES.FLOOR)) {
            this.game.grid[this.game.player.y][this.game.player.x] = tileType;
            // remove one item of itemType from inventories
            const pi = this.game.player.inventory.findIndex(i => i.type === itemType);
            if (pi >= 0) { this.game.player.inventory.splice(pi, 1); return true; }
            const ri = this.game.player.radialInventory ? this.game.player.radialInventory.findIndex(i => i.type === itemType) : -1;
            if (ri >= 0) { this.game.player.radialInventory.splice(ri, 1); try { import('./RadialPersistence.js').then(m=>m.saveRadialInventory(this.game)).catch(()=>{}); } catch(e){} return true; }
        }
        return false;
    }

    useInventoryItem(item, idx, fromRadial = false) {
        // Prefer the dedicated ItemUsageHandler if provided - forward the fromRadial flag
        if (this.itemUsageHandler && typeof this.itemUsageHandler.applyItemUse === 'function') {
            this.itemUsageHandler.applyItemUse(item, idx, fromRadial);
            return;
        }

        // Fallback basic handling (keeps compatibility)
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
            case 'heart':
                // Support stacked hearts
                this.game.player.setHealth(this.game.player.getHealth() + 1);
                item.quantity = (item.quantity || 1) - 1;
                if (item.quantity <= 0) this.game.player.inventory.splice(idx, 1);
                break;
            case 'bomb':
                // If used from radial inventory (or explicitly flagged), enter bomb placement mode (choose adjacent tile)
                if (fromRadial || (this.game.player.radialInventory && this.game.player.radialInventory.indexOf(item) >= 0)) {
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
                    // Instructional overlay - no typewriter
                    if (this.game.uiManager) this.game.uiManager.showOverlayMessage('Tap a tile to place a bomb', null, true, true, false);
                } else {
                    // Place bomb at player tile immediately when used from main inventory (legacy behavior)
                    item.quantity = (item.quantity || 1) - 1;
                    const px = this.game.player.x, py = this.game.player.y;
                    this.game.grid[py][px] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true };
                    if (item.quantity <= 0) { this._removeItemFromEither(item); try { import('./RadialPersistence.js').then(m=>m.saveRadialInventory(this.game)).catch(()=>{}); } catch(e){} }
                }
                break;
            case 'bishop_spear':
                // If the item comes from the radial, start a pending charge selection to choose the target tile
                if (fromRadial || (this.game.player.radialInventory && this.game.player.radialInventory.indexOf(item) >= 0)) {
                    // Enter selection mode: player will tap a tile to choose the charge target
                    this.game.pendingCharge = { selectionType: 'bishop_spear', item };
                    // Instructional overlay - no typewriter
                    if (this.game.uiManager) this.game.uiManager.showOverlayMessage('Tap a tile to confirm Bishop Charge', null, true, true, false);
                } else {
                    this._dropFromEither('bishop_spear', { type: TILE_TYPES.BISHOP_SPEAR, uses: item.uses });
                }
                break;
            case 'horse_icon':
                if (fromRadial || (this.game.player.radialInventory && this.game.player.radialInventory.indexOf(item) >= 0)) {
                    this.game.pendingCharge = { selectionType: 'horse_icon', item };
                    // Instructional overlay - no typewriter
                    if (this.game.uiManager) this.game.uiManager.showOverlayMessage('Tap a tile to confirm Knight Charge', null, true, true, false);
                } else {
                    this._dropFromEither('horse_icon', { type: TILE_TYPES.HORSE_ICON, uses: item.uses });
                }
                break;
            case 'bow':
                if (fromRadial || (this.game.player.radialInventory && this.game.player.radialInventory.indexOf(item) >= 0)) {
                    this.game.pendingCharge = { selectionType: 'bow', item };
                    // Instructional overlay - no typewriter
                    if (this.game.uiManager) this.game.uiManager.showOverlayMessage('Tap an enemy tile to confirm Bow Shot', null, true, true, false);
                } else {
                    this._dropFromEither('bow', { type: TILE_TYPES.BOW, uses: item.uses });
                }
                break;
            case 'book_of_time_travel':
                // Consume one use and pass a turn (allow enemies to move)
                item.uses = (item.uses || 1) - 1;
                if (item.uses <= 0) this._removeItemFromEither(item);
                // Ensure any zero-use items (in either inventory) are pruned so the radial
                // doesn't later re-migrate a zero-use copy from the main inventory.
                try { this._pruneZeroUseItems(); } catch (e) {}
                if (typeof this.game.startEnemyTurns === 'function') this.game.startEnemyTurns();
                break;
            case 'shovel':
                // activate shovel mode
                this.game.shovelMode = true;
                break;
            default:
                break;
        }

        if (this.game && typeof this.game.updatePlayerStats === 'function') this.game.updatePlayerStats();
    }

    // Shovel/digging and other positional item uses were previously in ItemUsageManager
    // Keep a small utility here for adjacency checks and useIfAdjacent
    useItemAtPosition(item, targetX, targetY) {
        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(targetX - playerPos.x);
        const dy = Math.abs(targetY - playerPos.y);
        const isAdjacent = dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);

        if (!isAdjacent) {
            // Immediate feedback - skip typewriter
            if (this.game.uiManager) this.game.uiManager.showOverlayMessage("You must dig in an adjacent tile!", null, false, false, false);
            return false;
        }

        if (this.game.grid[targetY][targetX] !== TILE_TYPES.FLOOR) {
            // Immediate feedback - skip typewriter
            if (this.game.uiManager) this.game.uiManager.showOverlayMessage("You can only dig on an empty floor tile.", null, false, false, false);
            return false;
        }

        const enemiesAtPos = this.game.enemies ? this.game.enemies.filter(enemy => enemy.x === targetX && enemy.y === targetY) : [];
        if (enemiesAtPos.length > 0) {
            // Immediate feedback - skip typewriter
            if (this.game.uiManager) this.game.uiManager.showOverlayMessage("Cannot dig under an enemy!", null, false, false, false);
            return false;
        }

        this.game.grid[targetY][targetX] = TILE_TYPES.PORT;

        item.uses--;
        if (item.uses <= 0) {
            this.game.player.inventory.splice(this.game.player.inventory.indexOf(item), 1);
        }

        if (typeof this.game.startEnemyTurns === 'function') this.game.startEnemyTurns();
        return true;
    }

    isItemUsable(itemType) {
        return itemType === 'shovel';
    }

    useMapNote() {
        // Behaves like previous implementation
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
        if (this.game.uiManager && typeof this.game.uiManager.addMessageToLog === 'function') this.game.uiManager.addMessageToLog(`A distant location has been revealed on your map: (${selected.x}, ${selected.y})`);
        if (typeof this.game.updatePlayerStats === 'function') this.game.updatePlayerStats();
        if (this.game.uiManager && typeof this.game.uiManager.renderZoneMap === 'function') this.game.uiManager.renderZoneMap();
    }

    // Remove any items that have zero uses/quantity from both main and radial inventories
    _pruneZeroUseItems() {
        try {
            const p = this.game.player;
            if (!p) return;
            // Remove zero-use from main inventory
            if (Array.isArray(p.inventory)) {
                for (let i = p.inventory.length - 1; i >= 0; i--) {
                    const it = p.inventory[i];
                    if (!it) continue;
                    if ((typeof it.uses !== 'undefined' && it.uses <= 0) || (typeof it.quantity !== 'undefined' && it.quantity <= 0)) {
                        p.inventory.splice(i, 1);
                    }
                }
            }
            // Remove zero-use from radial inventory and persist if changed
            if (Array.isArray(p.radialInventory)) {
                let changed = false;
                for (let i = p.radialInventory.length - 1; i >= 0; i--) {
                    const it = p.radialInventory[i];
                    if (!it) continue;
                    if ((typeof it.uses !== 'undefined' && it.uses <= 0) || (typeof it.quantity !== 'undefined' && it.quantity <= 0)) {
                        p.radialInventory.splice(i, 1);
                        changed = true;
                    }
                }
                if (changed) {
                    try { import('./RadialPersistence.js').then(m=>m.saveRadialInventory(this.game)).catch(()=>{}); } catch(e){}
                }
            }
        } catch (e) {}
    }
}
