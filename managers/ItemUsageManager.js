export class ItemUsageManager {
    constructor(game) {
        this.game = game;
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
}
