import { TILE_TYPES } from '@core/constants/index';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { TileRegistry } from '@core/TileRegistry';
import { isAdjacent } from '@core/utils/DirectionUtils';
import { getTileType } from '@utils/TileUtils';
import type { IGame } from '@core/context';
import type { Position } from '@core/Position';

export class TerrainInteractionManager {
    private game: IGame;

    constructor(game: IGame) {
        this.game = game;
    }

    handleChoppableTile(gridCoords: Position, playerPos: Position): boolean {
        const gridManager = this.game.gridManager;
        if (!gridManager) return false;

        const tappedTile = gridManager.getTile(gridCoords.x, gridCoords.y);
        const tappedTileType = getTileType(tappedTile);
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const hasAxe = this.game.playerFacade?.hasAbility('axe') ?? false;
        const hasHammer = this.game.playerFacade?.hasAbility('hammer') ?? false;

        if (!isAdjacent(dx, dy)) return false;

        const grid = this.game.grid;
        if (!grid) return false;

        // Use TileRegistry to check tile properties
        if (tappedTileType !== null && tappedTileType !== undefined && TileRegistry.isChoppable(tappedTileType)) {
            if (hasAxe) {
                // This will trigger the chop logic inside player.move, which now handles turn ending.
                // The player won't actually move into the tile.
                // We pass a dummy onZoneTransition callback.
                this.game.playerFacade?.move(gridCoords.x, gridCoords.y, grid, () => {});
                return true;
            }
        }
        // Handle breaking rocks
        else if (tappedTileType !== null && tappedTileType !== undefined && TileRegistry.isBreakable(tappedTileType)) {
            if (hasHammer) {
                // Perform breaking action
                // This will trigger the smash logic inside player.move, which now handles turn ending.
                this.game.playerFacade?.move(gridCoords.x, gridCoords.y, grid, () => {});
                return true;
            }
        }

        return false;
    }

    forceChoppableAction(gridCoords: Position, playerPos: Position): void {
        // For forced interactions when arriving adjacent via pathing
        const gridManager = this.game.gridManager;
        if (!gridManager) return;

        const tappedTile = gridManager.getTile(gridCoords.x, gridCoords.y);
        const tappedTileType = getTileType(tappedTile);
        const hasAxe = this.game.playerFacade?.hasAbility('axe') ?? false;
        const hasHammer = this.game.playerFacade?.hasAbility('hammer') ?? false;

        const grid = this.game.grid;
        if (!grid) return;

        // Use TileRegistry to check tile properties
        if (tappedTileType !== null && tappedTileType !== undefined && TileRegistry.isChoppable(tappedTileType)) {
            if (hasAxe) {
                // Perform chopping action - since player is adjacent, move to it and chop
                this.game.handleEnemyMovements?.(); // Enemies move before player
                this.game.playerFacade?.move(gridCoords.x, gridCoords.y, grid, (zoneX: number, zoneY: number, exitSide: string) => {
                    this.game.transitionToZone?.(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.checkCollisions?.();
                this.game.checkItemPickup?.(); // Check for items after moving
                this.game.updatePlayerPosition?.();
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            }
        } else if (tappedTileType !== null && tappedTileType !== undefined && TileRegistry.isBreakable(tappedTileType)) {
            if (hasHammer) {
                // Perform breaking action
                this.game.playerFacade?.move(gridCoords.x, gridCoords.y, grid, (zoneX: number, zoneY: number, exitSide: string) => {
                    this.game.transitionToZone?.(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.handleEnemyMovements?.();
                this.game.checkCollisions?.();
                this.game.checkItemPickup?.(); // Check for items after moving
                this.game.updatePlayerPosition?.();
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            }
        }
    }
}
