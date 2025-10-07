import { GRID_SIZE, TILE_TYPES } from './constants.js';

export class InteractionManager {
    constructor(game) {
        this.game = game;
    }

    checkLionInteraction() {
        const playerPos = this.game.player.getPosition();

        // Find all lion positions
        const lions = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.game.grid[y][x] === TILE_TYPES.LION) {
                    lions.push({ x, y });
                }
            }
        }

        // Check if player is adjacent to any lion
        const isAdjacentToLion = lions.some(lion => {
            const dx = Math.abs(lion.x - playerPos.x);
            const dy = Math.abs(lion.y - playerPos.y);
            return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        });

        // Check if player has meat
        const hasMeat = this.game.player.inventory.some(item => item.type === 'food' && item.foodType.includes('Food/meat'));

        if (isAdjacentToLion && !hasMeat) {
            this.game.uiManager.handleLionInteractionMessage();
        } else {
            this.game.uiManager.hideLionInteractionMessage();
        }
    }

    checkSquigInteraction() {
        const playerPos = this.game.player.getPosition();

        // Find all squig positions
        const squigs = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.game.grid[y][x] === TILE_TYPES.SQUIG) {
                    squigs.push({ x, y });
                }
            }
        }

        // Check if player is adjacent to any squig
        const isAdjacentToSquig = squigs.some(squig => {
            const dx = Math.abs(squig.x - playerPos.x);
            const dy = Math.abs(squig.y - playerPos.y);
            return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        });

        // Find all lion positions
        const lions = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.game.grid[y][x] === TILE_TYPES.LION) {
                    lions.push({ x, y });
                }
            }
        }

        // Check if player is adjacent to any lion
        const isAdjacentToLion = lions.some(lion => {
            const dx = Math.abs(lion.x - playerPos.x);
            const dy = Math.abs(lion.y - playerPos.y);
            return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        });

        // Check if player has nuts
        const hasNut = this.game.player.inventory.some(item => item.type === 'food' && item.foodType.includes('Food/nut'));

        // Check if player has meat
        const hasMeat = this.game.player.inventory.some(item => item.type === 'food' && item.foodType.includes('Food/meat'));

        // Do not show the squig message if a sign message is already displayed.
        if (this.game.displayingMessageForSign) {
            return;
        }

        if (isAdjacentToSquig && !hasNut) {
            // Only show squig message if not adjacent to lion, or if adjacent to lion but has meat (lion takes priority when both lack their trade items)
            if (!isAdjacentToLion || hasMeat) {
                // Show message even if overlay is already showing (allow multiple messages)
                this.game.uiManager.showOverlayMessage('<span class="character-name">Squig</span><br>I\'m nuts for nuts!', 'Images/fauna/squigface.png');
            }
        }
    }

    checkItemPickup() {
        const p = this.game.player.getPosition();
        const tile = this.game.grid[p.y][p.x];
        const inv = this.game.player.inventory;
        const ui = this.game.uiManager;
        const pick = (item) => { inv.push(item); this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR; ui.updatePlayerStats(); };

        if (tile === TILE_TYPES.NOTE) {
            pick({ type: 'note' });
            ui.addMessageToLog('Found an ancient map note.');
            return;
        }
        if (inv.length < 6) {
            if (tile?.type === TILE_TYPES.FOOD) pick({ type: 'food', foodType: tile.foodType });
            else if (tile === TILE_TYPES.WATER) pick({ type: 'water' });
            else if (tile === TILE_TYPES.AXE) pick({ type: 'axe' });
            else if (tile === TILE_TYPES.HAMMER) pick({ type: 'hammer' });
            else if (tile?.type === TILE_TYPES.BISHOP_SPEAR) pick({ type: 'bishop_spear', uses: tile.uses });
            else if (tile?.type === TILE_TYPES.HORSE_ICON) pick({ type: 'horse_icon', uses: tile.uses });
            else if (tile === TILE_TYPES.BOMB) pick({ type: 'bomb' });
            else if (tile === TILE_TYPES.HEART) pick({ type: 'heart' });
        }
    }

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
        this.game.uiManager.updatePlayerStats();
        this.game.uiManager.renderZoneMap();
    }

    interactWithNPC(foodType) {
        const index = this.game.player.inventory.findIndex(item => item.type === 'food' && item.foodType.includes(foodType));
        if (index >= 0) {
            this.game.player.inventory.splice(index, 1);
            this.game.player.inventory.push({ type: 'water' });
            this.game.uiManager.updatePlayerStats();
        }
    }
}
