import { TILE_TYPES } from '../core/constants.js';
import logger from '../core/logger.js';

export class ItemUsageManager {
    constructor(game) {
        this.game = game;
    }

    useItem(item, targetX, targetY) {
        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(targetX - playerPos.x);
        const dy = Math.abs(targetY - playerPos.y);
        const isAdjacent = dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);

        if (!isAdjacent) {
            this.game.uiManager.showOverlayMessage("You must dig in an adjacent tile!");
            return false;
        }

        // Check if target is floor and not occupied
        if (this.game.grid[targetY][targetX] !== TILE_TYPES.FLOOR) {
            this.game.uiManager.showOverlayMessage("You can only dig on an empty floor tile.");
            return false;
        }

        // Check for enemies at the position
        const enemiesAtPos = this.game.enemies.filter(enemy => enemy.x === targetX && enemy.y === targetY);
        if (enemiesAtPos.length > 0) {
            this.game.uiManager.showOverlayMessage("Cannot dig under an enemy!");
            return false;
        }

        // Place the hole (PORT)
        this.game.grid[targetY][targetX] = TILE_TYPES.PORT;

        // Decrement uses
        item.uses--;
        if (item.uses <= 0) {
            this.game.player.inventory.splice(this.game.player.inventory.indexOf(item), 1);
        }

        // Trigger enemy turns
        this.game.startEnemyTurns();

        return true;
    }

    isItemUsable(itemType) {
        return itemType === 'shovel';
    }
}
