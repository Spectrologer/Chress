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
    public combatActionManager: any;
    public bombManager: any;

    /**
     * @param {Object} combatActionManager - Manages combat actions (charges, bow shots)
     * @param {Object} bombManager - Handles bomb placement and explosions
     */
    constructor(combatActionManager: any, bombManager: any) {
        this.combatActionManager = combatActionManager;
        this.bombManager = bombManager;
    }

    // Combat action methods
    isValidBishopSpearCharge(gridCoords: any, playerPos: any): boolean {
        return this.combatActionManager.isValidBishopSpearCharge(gridCoords, playerPos);
    }

    isValidHorseIconCharge(gridCoords: any, playerPos: any): boolean {
        return this.combatActionManager.isValidHorseIconCharge(gridCoords, playerPos);
    }

    isValidBowShot(gridCoords: any, playerPos: any): boolean {
        return this.combatActionManager.isValidBowShot(gridCoords, playerPos);
    }

    isValidRookTowerCharge(gridCoords: any, playerPos: any): boolean {
        return this.combatActionManager.isValidRookTowerCharge(gridCoords, playerPos);
    }

    // Bomb methods
    handleBombPlacement(gridCoords: any): void {
        return this.bombManager.handleBombPlacement(gridCoords);
    }

    triggerBombExplosion(gridCoords: any, playerPos: any): void {
        return this.bombManager.triggerBombExplosion(gridCoords, playerPos);
    }

    tickBombsAndExplode(): void {
        return this.bombManager.tickBombsAndExplode();
    }
}
