import { BaseZoneHandler } from './BaseZoneHandler.js';

class InteriorHandler extends BaseZoneHandler {
    constructor(zoneGen, zoneX, zoneY, foodAssets) {
        super(zoneGen, zoneX, zoneY, foodAssets, 1, 0);
    }

    generate() {
        if (this.isHomeZone) {
            return this.generateHomeInterior();
        } else {
            return this.generateShackInterior();
        }
    }

    generateHomeInterior() {
        // Home interior now uses custom board (boards/canon/museum.json)
        // Board system handles all layout, NPCs, statues, tables, and items
        console.error('[InteriorHandler] Home interior should use board system (museum.json), not procedural generation');
        return this.buildHomeResult();
    }

    generateShackInterior() {
        // Shack interior now uses custom board (boards/canon/gouges.json)
        // Board system handles all layout, NPCs, items, and ports
        console.error('[InteriorHandler] Shack interior should use board system (gouges.json), not procedural generation');
        return this.buildHomeResult();
    }

    buildHomeResult() {
        return {
            grid: JSON.parse(JSON.stringify(this.zoneGen.grid)),
            enemies: [],
            playerSpawn: this.zoneGen.playerSpawn
        };
    }
}

export function handleInterior(zoneGen, zoneX, zoneY, foodAssets) {
    const handler = new InteriorHandler(zoneGen, zoneX, zoneY, foodAssets);
    return handler.generate();
}
