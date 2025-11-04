import type { TerrainInteractionManager } from '../managers/TerrainInteractionManager';
import type { ZoneTransitionManager } from '../managers/ZoneTransitionManager';
import type { ItemPickupManager } from '../managers/inventory/ItemPickupManager';
import type { Position } from '../core/Position';

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
    private terrainManager: TerrainInteractionManager;
    private zoneManager: ZoneTransitionManager;
    private itemPickupManager: ItemPickupManager;

    /**
     * @param terrainManager - Manages terrain interactions (chopping, digging, etc)
     * @param zoneManager - Handles zone transitions
     * @param itemPickupManager - Handles item pickup logic
     */
    constructor(terrainManager: TerrainInteractionManager, zoneManager: ZoneTransitionManager, itemPickupManager: ItemPickupManager) {
        this.terrainManager = terrainManager;
        this.zoneManager = zoneManager;
        this.itemPickupManager = itemPickupManager;
    }

    // Terrain interaction methods
    handleChoppableTile(gridCoords: Position, playerPos: Position): boolean {
        return this.terrainManager.handleChoppableTile(gridCoords, playerPos);
    }

    forceChoppableAction(gridCoords: Position, playerPos: Position): void {
        return this.terrainManager.forceChoppableAction(gridCoords, playerPos);
    }

    // Zone transition methods
    checkForZoneTransitionGesture(tapCoords: { x: number; y: number }, playerPos: Position): boolean {
        return this.zoneManager.checkForZoneTransitionGesture(tapCoords, playerPos);
    }

    handleExitTap(exitX: number, exitY: number): void {
        return this.zoneManager.handleExitTap(exitX, exitY);
    }

    // Item pickup methods
    checkItemPickup(): boolean {
        return this.itemPickupManager.checkItemPickup();
    }
}
