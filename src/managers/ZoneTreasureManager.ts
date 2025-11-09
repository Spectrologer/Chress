import { GRID_SIZE, TILE_TYPES } from '@core/constants/index';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { isFloor, isTileType } from '@utils/TypeChecks';
import type { Game } from '@core/game';

/**
 * ZoneTreasureManager handles special zone treasure spawning
 */
export class ZoneTreasureManager {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Handle special zone treasures if player reached a marked zone
     */
    public handleSpecialZoneTreasures(zoneKey: string): void {
        if (this.game.specialZones.has(zoneKey)) {
            const treasures = this.game.specialZones.get(zoneKey)!;
            this.spawnTreasuresOnGrid(treasures);
            this.game.specialZones.delete(zoneKey);
        }

        // Check if a partner cube should spawn in this zone
        this.handlePartnerCubeSpawn(zoneKey);
    }

    /**
     * Handle partner cube spawning for teleportation cubes
     */
    private handlePartnerCubeSpawn(zoneKey: string): void {
        if (this.game.partnerCubes.has(zoneKey)) {
            const cubeData = this.game.partnerCubes.get(zoneKey)!;

            // Create a return teleport branch with origin zone data
            const returnCube = {
                type: TILE_TYPES.TELEPORT_BRANCH,
                originZone: cubeData.originZone
            };

            // Spawn the return teleport branch on the grid
            this.spawnTreasuresOnGrid([returnCube]);

            // Remove from partner cubes map after spawning
            this.game.partnerCubes.delete(zoneKey);

            // Add message to log
            eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                text: 'A glowing branch materializes nearby!',
                category: 'treasure',
                priority: 'info',
                timestamp: Date.now()
            });
        }
    }

    /**
     * Spawn treasures on grid at valid floor positions
     */
    public spawnTreasuresOnGrid(treasures: any[]): void {
        const gridManager = this.game.gridManager;
        for (const treasure of treasures) {
            // Try to place treasure in a valid location (max 50 attempts)
            for (let attempts = 0; attempts < 50; attempts++) {
                const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

                // Check if tile is floor and not occupied or blocked
                const tile = gridManager.getTile(x, y);
                const isFloorTile = isFloor(tile);
                const isExit = isTileType(tile, TILE_TYPES.EXIT);

                if (isFloorTile && !isExit) {
                    // Place the treasure
                    gridManager.setTile(x, y, treasure);
                    break; // Successfully placed
                }
            }
        }

        // Add message to log via event
        eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
            text: 'Treasures found scattered throughout the zone!',
            category: 'treasure',
            priority: 'info',
            timestamp: Date.now()
        });
    }
}
