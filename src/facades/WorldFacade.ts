/**
 * WorldFacade - Groups world/zone-related dependencies
 *
 * Consolidates managers responsible for terrain interactions, zone transitions,
 * and item pickups into a single interface.
 *
 * This facade helps reduce constructor parameter overload in managers
 * that need world interaction functionality.
 */
export class WorldFacade {
    /**
     * @param {Object} terrainManager - Manages terrain interactions (chopping, digging, etc)
     * @param {Object} zoneManager - Handles zone transitions
     * @param {Object} itemPickupManager - Handles item pickup logic
     */
    constructor(terrainManager, zoneManager, itemPickupManager) {
        this.terrainManager = terrainManager;
        this.zoneManager = zoneManager;
        this.itemPickupManager = itemPickupManager;
    }

    // Terrain interaction methods
    canChopTree(x, y) {
        return this.terrainManager.canChopTree(x, y);
    }

    chopTree(x, y) {
        return this.terrainManager.chopTree(x, y);
    }

    canDigGround(x, y) {
        return this.terrainManager.canDigGround(x, y);
    }

    digGround(x, y) {
        return this.terrainManager.digGround(x, y);
    }

    // Zone transition methods
    checkForZoneTransitionGesture(tapCoords, playerPos) {
        return this.zoneManager.checkForZoneTransitionGesture(tapCoords, playerPos);
    }

    handleExitTap(exitX, exitY) {
        return this.zoneManager.handleExitTap(exitX, exitY);
    }

    // Item pickup methods
    handleItemPickup(x, y) {
        return this.itemPickupManager.handleItemPickup(x, y);
    }

    canPickupItem(x, y) {
        return this.itemPickupManager.canPickupItem(x, y);
    }
}
