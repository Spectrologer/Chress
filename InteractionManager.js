import { GRID_SIZE, TILE_TYPES } from './constants.js';

export class InteractionManager {
    constructor(game) {
        this.game = game;
    }

    checkLionInteraction() {
        // NPC interactions now handled via clicking - no automatic messages
    }

    checkSquigInteraction() {
        // NPC interactions now handled via clicking - no automatic messages
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
            if (tile?.type === TILE_TYPES.FOOD) {
                // Ensure foodType is passed correctly
                pick({ type: 'food', foodType: tile.foodType });
                ui.addMessageToLog('Found some food.');
            }
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
