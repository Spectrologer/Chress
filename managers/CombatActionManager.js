import { TILE_TYPES } from '../core/constants.js';

export class CombatActionManager {
    constructor(game) {
        this.game = game;
    }

    isValidBishopSpearCharge(gridCoords, playerPos) {
        const bishopSpearItem = this.game.player.inventory.find(item => item.type === 'bishop_spear' && item.uses > 0 && !item.disabled);
        if (!bishopSpearItem) return null;

        const enemyAtCoords = this.game.enemies.find(enemy => enemy.x === gridCoords.x && enemy.y === gridCoords.y);
        const targetTile = this.game.grid[gridCoords.y][gridCoords.x];
        const isEmptyTile = !enemyAtCoords && this.game.player.isWalkable(gridCoords.x, gridCoords.y, this.game.grid, playerPos.x, playerPos.y);

        if (!(enemyAtCoords || isEmptyTile)) return null;

        const dx = gridCoords.x - playerPos.x;
        const dy = gridCoords.y - playerPos.y;

        if (Math.abs(dx) === Math.abs(dy) && Math.abs(dx) > 0 && Math.abs(dx) <= 5) {
            return { type: 'bishop_spear', item: bishopSpearItem, target: gridCoords, enemy: enemyAtCoords, dx, dy };
        }
        return null;
    }

    isValidHorseIconCharge(gridCoords, playerPos) {
        const horseIconItem = this.game.player.inventory.find(item => item.type === 'horse_icon' && item.uses > 0 && !item.disabled);
        if (!horseIconItem) return null;

        const enemyAtCoords = this.game.enemies.find(enemy => enemy.x === gridCoords.x && enemy.y === gridCoords.y);
        const targetTile = this.game.grid[gridCoords.y][gridCoords.x];
        const isEmptyTile = !enemyAtCoords && this.game.player.isWalkable(gridCoords.x, gridCoords.y, this.game.grid, playerPos.x, playerPos.y);

        if (!(enemyAtCoords || isEmptyTile)) return null;

        const dx = gridCoords.x - playerPos.x;
        const dy = gridCoords.y - playerPos.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx + absDy === 3 && absDx >= 1 && absDy >= 1 && absDx !== absDy && Math.max(absDx, absDy) <= 5) {
            return { type: 'horse_icon', item: horseIconItem, target: gridCoords, enemy: enemyAtCoords, dx, dy };
        }
        return null;
    }

    isValidBowShot(gridCoords, playerPos) {
        const bowItem = this.game.player.inventory.find(item => item.type === 'bow' && item.uses > 0 && !item.disabled);
        if (!bowItem) return null;

        const enemyAtCoords = this.game.enemies.find(enemy => enemy.x === gridCoords.x && enemy.y === gridCoords.y);
        if (!enemyAtCoords) return null;

        const dx = gridCoords.x - playerPos.x;
        const dy = gridCoords.y - playerPos.y;

        const isOrthogonal = (dx === 0 && Math.abs(dy) > 1) || (dy === 0 && Math.abs(dx) > 1);
        if (!isOrthogonal) return null;

        // Check line of sight
        let isPathClear = true;
        const stepX = Math.sign(dx);
        const stepY = Math.sign(dy);
        let checkX = playerPos.x + stepX;
        let checkY = playerPos.y + stepY;

        while (checkX !== gridCoords.x || checkY !== gridCoords.y) {
            if (!this.game.player.isWalkable(checkX, checkY, this.game.grid)) {
                isPathClear = false;
                break;
            }
            checkX += stepX;
            checkY += stepY;
        }

        if (isPathClear) {
            return { type: 'bow', item: bowItem, target: gridCoords, enemy: enemyAtCoords };
        }
        return null;
    }

    confirmPendingCharge(chargeDetails) {
        // Capture any transient data needed (e.g. enemy reference for bow) before clearing pending state
        const enemyRef = chargeDetails.enemy;

        // Clear pending state and hide overlay immediately so UI doesn't persist after confirmation
        this.game.pendingCharge = null;
        if (typeof this.game.hideOverlayMessage === 'function') {
            this.game.hideOverlayMessage();
        }

        if (chargeDetails.type === 'bishop_spear') {
            this.game.performBishopSpearCharge(chargeDetails.item, chargeDetails.target.x, chargeDetails.target.y, chargeDetails.enemy, chargeDetails.dx, chargeDetails.dy);
        } else if (chargeDetails.type === 'horse_icon') {
            this.game.performHorseIconCharge(chargeDetails.item, chargeDetails.target.x, chargeDetails.target.y, chargeDetails.enemy, chargeDetails.dx, chargeDetails.dy);
        } else if (chargeDetails.type === 'bow') {
            // Pass the captured enemy reference so performBowShot can operate after pendingCharge is cleared
            this.game.actionManager.performBowShot(chargeDetails.item, chargeDetails.target.x, chargeDetails.target.y, enemyRef);
        }
    }

    cancelPendingCharge() {
        this.game.pendingCharge = null;
        this.game.hideOverlayMessage();
    }
}
