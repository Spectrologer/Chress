import { TILE_TYPES } from '../core/constants.js';

export class BombInteractionManager {
    constructor(game) {
        this.game = game;
    }

    handleBombPlacement(gridCoords) {
        if (!this.game.bombPlacementMode) return false;

        const placed = this.game.bombPlacementPositions.find(p => p.x === gridCoords.x && p.y === gridCoords.y);
        if (!placed) return false;

        // Place timed bomb here
        this.game.grid[placed.y][placed.x] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true };
        const bombIndex = this.game.player.inventory.findIndex(item => item.type === 'bomb');
        if (bombIndex !== -1) {
            const bombItem = this.game.player.inventory[bombIndex];
            // If bombs are stacked, decrement quantity; otherwise remove the slot
            if (typeof bombItem.quantity === 'number' && bombItem.quantity > 1) {
                bombItem.quantity = bombItem.quantity - 1;
            } else {
                this.game.player.inventory.splice(bombIndex, 1);
            }
        }
        this.game.uiManager.updatePlayerStats();
        // Placing bomb counts as an action - increment bomb timers and start enemy turns
        this.game.incrementBombActions();
        this.game.startEnemyTurns();
        // End bomb placement mode after placing
        this.endBombPlacement();
        return true;
    }

    triggerBombExplosion(gridCoords, playerPos) {
        const tapTile = this.game.grid[gridCoords.y][gridCoords.x];
        if (!(tapTile && typeof tapTile === 'object' && tapTile.type === TILE_TYPES.BOMB)) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = dx <= 1 && dy <= 1;
        if (!isAdjacent) return false;

        // Activating bomb counts as an action - increment bomb timers and start enemy turns
        this.game.incrementBombActions();
        this.game.explodeBomb(gridCoords.x, gridCoords.y);
        this.game.startEnemyTurns();
        return true;
    }

    forceBombTrigger(gridCoords) {
        const tapTile = this.game.grid[gridCoords.y][gridCoords.x];
        if (!(tapTile && typeof tapTile === 'object' && tapTile.type === TILE_TYPES.BOMB)) return;

        // Force immediate explosion without action count
        tapTile.actionsSincePlaced = 2;  // Trigger immediate explosion
        this.game.explodeBomb(gridCoords.x, gridCoords.y);
    }

    endBombPlacement() {
        if (!this.game.bombPlacementMode) return;
        this.game.bombPlacementMode = false;
        this.game.bombPlacementPositions = [];
        this.game.hideOverlayMessage();
    }
}
