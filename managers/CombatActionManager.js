import { TILE_TYPES } from '../core/constants/index.js';
import { safeCall } from '../utils/SafeServiceCall.js';

export class CombatActionManager {
    constructor(game) {
        this.game = game;
    }

    /**
     * Finds a usable item of the specified type in player's inventory
     * @param {string} itemType - The type of item to find
     * @param {boolean} includeRadial - Whether to include radial inventory
     * @returns {Object|null} The item if found and usable, null otherwise
     */
    findUsableItem(itemType, includeRadial = false) {
        // Use facade for inventory access
        const inventoryItems = this.game.playerFacade.getInventory();
        const radialItems = includeRadial ? this.game.playerFacade.getRadialInventory() : [];
        const allItems = inventoryItems.concat(radialItems);
        return allItems.find(item => item.type === itemType && item.uses > 0 && !item.disabled) || null;
    }

    isValidBishopSpearCharge(gridCoords, playerPos, includeRadial = false) {
        const bishopSpearItem = this.findUsableItem('bishop_spear', includeRadial);
        if (!bishopSpearItem) return null;

        const enemyCollection = this.game.enemyCollection;
        const enemyAtCoords = enemyCollection.findAt(gridCoords.x, gridCoords.y, true);
        // Use gridManager for grid access
        const targetTile = this.game.gridManager.getTile(gridCoords.x, gridCoords.y);
        // Use playerFacade for walkability check
        const isEmptyTile = !enemyAtCoords && this.game.playerFacade.isWalkable(gridCoords.x, gridCoords.y, this.game.grid, playerPos.x, playerPos.y);

        if (!(enemyAtCoords || isEmptyTile)) return null;

        const dx = gridCoords.x - playerPos.x;
        const dy = gridCoords.y - playerPos.y;

        if (Math.abs(dx) === Math.abs(dy) && Math.abs(dx) > 0 && Math.abs(dx) <= 5) {
            return { type: 'bishop_spear', item: bishopSpearItem, target: gridCoords, enemy: enemyAtCoords, dx, dy };
        }
        return null;
    }

    isValidHorseIconCharge(gridCoords, playerPos, includeRadial = false) {
        const horseIconItem = this.findUsableItem('horse_icon', includeRadial);
        if (!horseIconItem) return null;

        const enemyCollection = this.game.enemyCollection;
        const enemyAtCoords = enemyCollection.findAt(gridCoords.x, gridCoords.y, true);
        // Use gridManager for grid access
        const targetTile = this.game.gridManager.getTile(gridCoords.x, gridCoords.y);
        // Use playerFacade for walkability check
        const isEmptyTile = !enemyAtCoords && this.game.playerFacade.isWalkable(gridCoords.x, gridCoords.y, this.game.grid, playerPos.x, playerPos.y);

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

    isValidBowShot(gridCoords, playerPos, includeRadial = false) {
        const bowItem = this.findUsableItem('bow', includeRadial);
        if (!bowItem) return null;

        const enemyCollection = this.game.enemyCollection;
        const enemyAtCoords = enemyCollection.findAt(gridCoords.x, gridCoords.y, true);
        if (!enemyAtCoords) return null;

        const dx = gridCoords.x - playerPos.x;
        const dy = gridCoords.y - playerPos.y;

        const isOrthogonal = (dx === 0 && Math.abs(dy) > 1) || (dy === 0 && Math.abs(dx) > 1);
        if (!isOrthogonal) return null;

        // Check line of sight (use playerFacade for walkability)
        let isPathClear = true;
        const stepX = Math.sign(dx);
        const stepY = Math.sign(dy);
        let checkX = playerPos.x + stepX;
        let checkY = playerPos.y + stepY;

        while (checkX !== gridCoords.x || checkY !== gridCoords.y) {
            if (!this.game.playerFacade.isWalkable(checkX, checkY, this.game.grid)) {
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
        this.game.transientGameState.clearPendingCharge();
        safeCall(this.game, 'hideOverlayMessage');

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
        this.game.transientGameState.clearPendingCharge();
        this.game.hideOverlayMessage();
    }
}
