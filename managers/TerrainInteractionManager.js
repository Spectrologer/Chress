import { TILE_TYPES } from '../core/constants/index.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { TileRegistry } from '../core/TileRegistry.js';
import { isAdjacent } from '../core/utils/DirectionUtils.js';

export class TerrainInteractionManager {
    constructor(game) {
        this.game = game;
    }

    handleChoppableTile(gridCoords, playerPos) {
        const gridManager = this.game.gridManager;
        const tappedTile = gridManager.getTile(gridCoords.x, gridCoords.y);
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const hasAxe = this.game.player.abilities.has('axe');
        const hasHammer = this.game.player.abilities.has('hammer');

        if (!isAdjacent(dx, dy)) return false;

        // Use TileRegistry to check tile properties
        if (TileRegistry.isChoppable(tappedTile)) {
            if (hasAxe) {
                // This will trigger the chop logic inside player.move, which now handles turn ending.
                // The player won't actually move into the tile.
                // We pass a dummy onZoneTransition callback.
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, () => {});
                return true;
            }
        }
        // Handle breaking rocks
        else if (TileRegistry.isBreakable(tappedTile)) {
            if (hasHammer) {
                // Perform breaking action
                // This will trigger the smash logic inside player.move, which now handles turn ending.
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, () => {});
                return true;
            }
        }

        return false;
    }

    forceChoppableAction(gridCoords, playerPos) {
        // For forced interactions when arriving adjacent via pathing
        const gridManager = this.game.gridManager;
        const tappedTile = gridManager.getTile(gridCoords.x, gridCoords.y);
        const hasAxe = this.game.player.abilities.has('axe');
        const hasHammer = this.game.player.abilities.has('hammer');

        // Use TileRegistry to check tile properties
        if (TileRegistry.isChoppable(tappedTile)) {
            if (hasAxe) {
                // Perform chopping action - since player is adjacent, move to it and chop
                this.game.handleEnemyMovements(); // Enemies move before player
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.checkCollisions();
                this.game.checkItemPickup(); // Check for items after moving
                this.game.updatePlayerPosition();
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            }
        } else if (TileRegistry.isBreakable(tappedTile)) {
            if (hasHammer) {
                // Perform breaking action
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.handleEnemyMovements();
                this.game.checkCollisions();
                this.game.checkItemPickup(); // Check for items after moving
                this.game.updatePlayerPosition();
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            }
        }
    }
}
