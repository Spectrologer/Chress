/**
 * CombatFacade - Groups combat-related dependencies
 *
 * Consolidates managers responsible for combat actions including
 * charge attacks, bow shots, and bomb mechanics into a single interface.
 *
 * This facade helps reduce constructor parameter overload in managers
 * that need combat-related functionality.
 */
export class CombatFacade {
    /**
     * @param {Object} combatActionManager - Manages combat actions (charges, bow shots)
     * @param {Object} bombManager - Handles bomb placement and explosions
     */
    constructor(combatActionManager, bombManager) {
        this.combatActionManager = combatActionManager;
        this.bombManager = bombManager;
    }

    // Combat action methods
    isValidBishopSpearCharge(gridCoords, playerPos) {
        return this.combatActionManager.isValidBishopSpearCharge(gridCoords, playerPos);
    }

    isValidHorseIconCharge(gridCoords, playerPos) {
        return this.combatActionManager.isValidHorseIconCharge(gridCoords, playerPos);
    }

    isValidBowShot(gridCoords, playerPos) {
        return this.combatActionManager.isValidBowShot(gridCoords, playerPos);
    }

    isValidRookTowerCharge(gridCoords, playerPos) {
        return this.combatActionManager.isValidRookTowerCharge(gridCoords, playerPos);
    }

    // Bomb methods
    handleBombPlacement(gridCoords) {
        return this.bombManager.handleBombPlacement(gridCoords);
    }

    triggerBombExplosion(gridCoords, playerPos) {
        return this.bombManager.triggerBombExplosion(gridCoords, playerPos);
    }

    tickBombsAndExplode() {
        return this.bombManager.tickBombsAndExplode();
    }
}
