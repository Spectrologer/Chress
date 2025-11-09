import { BaseZoneHandler } from './BaseZoneHandler';
import { boardLoader } from '@core/BoardLoader';
import { logger } from '@core/logger';

class InteriorHandler extends BaseZoneHandler {
    constructor(zoneGen: any, zoneX: number, zoneY: number, foodAssets: string[]) {
        super(zoneGen, zoneX, zoneY, foodAssets, 1, 0);
    }

    async generate(): Promise<any> {
        if (this.isHomeZone) {
            return await this.generateHomeInterior();
        } else {
            return this.generateShackInterior();
        }
    }

    async generateHomeInterior(): Promise<any> {
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
            logger.warn('[InteriorHandler] Home interior should use board system (museum.json), not procedural generation');
            return this.buildHomeResult();
        }
    }

    generateShackInterior(): any {
        // Shack interior now uses custom board (boards/canon/gouges.json)
        // Board system handles all layout, NPCs, items, and ports
        logger.warn('[InteriorHandler] Shack interior should use board system (gouges.json), not procedural generation');
        return this.buildHomeResult();
    }

    buildHomeResult(): any {
        return {
            grid: JSON.parse(JSON.stringify(this.zoneGen.grid)),
            enemies: [],
            playerSpawn: this.zoneGen.playerSpawn
        };
    }
}

export async function handleInterior(zoneGen: any, zoneX: number, zoneY: number, foodAssets: string[]): Promise<any> {
    const handler = new InteriorHandler(zoneGen, zoneX, zoneY, foodAssets);
    return await handler.generate();
}
