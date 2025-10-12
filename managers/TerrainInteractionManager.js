import { TILE_TYPES } from '../core/constants.js';

export class TerrainInteractionManager {
    constructor(game) {
        this.game = game;
    }

    handleChoppableTile(gridCoords, playerPos) {
        const tappedTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        const isAdjacent = Math.abs(gridCoords.x - playerPos.x) <= 1 && Math.abs(gridCoords.y - playerPos.y) <= 1 &&
                           !(gridCoords.x === playerPos.x && gridCoords.y === playerPos.y);
        const hasAxe = this.game.player.inventory.some(item => item.type === 'axe');
        const hasHammer = this.game.player.inventory.some(item => item.type === 'hammer');

        if (!isAdjacent) return false;

        // Handle chopping grass/shrubbery
        if ((tappedTile === TILE_TYPES.GRASS || tappedTile === TILE_TYPES.SHRUBBERY)) {
            if (hasAxe) {
                // Perform chopping action
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.handleEnemyMovements();
                this.game.checkCollisions();
                this.game.checkItemPickup();
                this.game.updatePlayerPosition();
                this.game.updatePlayerStats();
                return true;
            }
        }
        // Handle breaking rocks
        else if (tappedTile === TILE_TYPES.ROCK) {
            if (hasHammer) {
                // Perform breaking action
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.handleEnemyMovements();
                this.game.checkCollisions();
                this.game.checkItemPickup();
                this.game.updatePlayerPosition();
                this.game.updatePlayerStats();
                return true;
            }
        }

        return false;
    }

    forceChoppableAction(gridCoords, playerPos) {
        // For forced interactions when arriving adjacent via pathing
        const tappedTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        const hasAxe = this.game.player.inventory.some(item => item.type === 'axe');
        const hasHammer = this.game.player.inventory.some(item => item.type === 'hammer');

        if ((tappedTile === TILE_TYPES.GRASS || tappedTile === TILE_TYPES.SHRUBBERY)) {
            if (hasAxe) {
                // Perform chopping action - since player is adjacent, move to it and chop
                this.game.handleEnemyMovements(); // Enemies move before player
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.checkCollisions();
                this.game.checkItemPickup(); // Check for items after moving
                this.game.updatePlayerPosition();
                this.game.updatePlayerStats();
            }
        } else if (tappedTile === TILE_TYPES.ROCK) {
            if (hasHammer) {
                // Perform breaking action
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.handleEnemyMovements();
                this.game.checkCollisions();
                this.game.checkItemPickup(); // Check for items after moving
                this.game.updatePlayerPosition();
                this.game.updatePlayerStats();
            }
        }
    }
}
