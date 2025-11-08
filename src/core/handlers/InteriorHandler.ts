import { BaseZoneHandler } from './BaseZoneHandler';
import { boardLoader } from '@core/BoardLoader';

class InteriorHandler extends BaseZoneHandler {
    constructor(zoneGen, zoneX, zoneY, foodAssets) {
        super(zoneGen, zoneX, zoneY, foodAssets, 1, 0);
    }

    async generate() {
        if (this.isHomeZone) {
            return await this.generateHomeInterior();
        } else {
            return this.generateShackInterior();
        }
    }

    async generateHomeInterior() {
        // Home interior now uses custom board (boards/canon/museum.json)
        // Board system handles all layout, NPCs, statues, tables, and items
        const boardData = boardLoader.getBoardSync(0, 0, 1);
        if (boardData) {
            const result = boardLoader.convertBoardToGrid(boardData, this.foodAssets);
            // Return the full result including terrainTextures, overlayTextures, rotations, and overlayRotations
            return {
                grid: result.grid,
                enemies: [],
                playerSpawn: result.playerSpawn,
                terrainTextures: result.terrainTextures,
                overlayTextures: result.overlayTextures,
                rotations: result.rotations,
                overlayRotations: result.overlayRotations
            };
        } else {
            // Fallback to previous behavior if board is missing
            // console.error('[InteriorHandler] Home interior should use board system (museum.json), not procedural generation');
            return this.buildHomeResult();
        }
    }

    generateShackInterior() {
        // Shack interior now uses custom board (boards/canon/gouges.json)
        // Board system handles all layout, NPCs, items, and ports
    // console.error('[InteriorHandler] Shack interior should use board system (gouges.json), not procedural generation');
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

export async function handleInterior(zoneGen, zoneX, zoneY, foodAssets) {
    const handler = new InteriorHandler(zoneGen, zoneX, zoneY, foodAssets);
    return await handler.generate();
}
