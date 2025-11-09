import { PlayerPositionFacade } from './PlayerPositionFacade';
import { PlayerInventoryFacade } from './PlayerInventoryFacade';
import { PlayerStatsFacade } from './PlayerStatsFacade';
import { logger } from '@core/logger';

/**
 * PlayerFacade - Centralized abstraction layer for player operations
 *
 * Eliminates direct player property access patterns scattered across the codebase.
 * Provides a controlled interface for reading, writing, and managing player state.
 *
 * This facade now composes three specialized facades:
 * - PlayerPositionFacade: Position and zone management
 * - PlayerInventoryFacade: Inventory and abilities
 * - PlayerStatsFacade: Stats, animations, and interactions
 *
 * Benefits:
 * - Encapsulation: All player mutations go through validated methods
 * - Events: Automatic event emission on state changes
 * - Validation: Centralized business rules and constraints
 * - Testability: Player logic can be tested independently
 * - Type Safety: Consistent property handling and normalization
 * - Modularity: Separated concerns with specialized facades
 *
 * Critical patterns this addresses:
 * - 339+ direct player property accesses
 * - Zone/depth coupling issues (currentZone.depth vs undergroundDepth)
 * - Inventory mutations without events
 * - Stats changes without save triggers
 * - Ability additions without notifications
 *
 * @example
 * // Before: game.player.x = 5; game.player.y = 3;
 * // After:  playerFacade.setPosition(5, 3);
 *
 * @example
 * // Before: game.player.inventory.push(item);
 * // After:  playerFacade.addToInventory(item);
 */
export class PlayerFacade {
    private player: any;
    public position: PlayerPositionFacade;
    public inventory: PlayerInventoryFacade;
    public stats: PlayerStatsFacade;

    /**
     * @param {Object} player - The player entity
     */
    constructor(player: any) {
        if (!player) {
            throw new Error('PlayerFacade requires a valid player instance');
        }
        this.player = player;

        // Initialize specialized facades
        this.position = new PlayerPositionFacade(player);
        this.inventory = new PlayerInventoryFacade(player);
        this.stats = new PlayerStatsFacade(player);
    }

    // ========================================
    // POSITION OPERATIONS (delegated to PlayerPositionFacade)
    // ========================================

    /** @returns {{x: number, y: number}} */
    getPosition() { return this.position.getPosition(); }

    /** @param {number} x @param {number} y @param {boolean} emitEvent */
    setPosition(x: number, y: number, emitEvent: boolean = true) { return this.position.setPosition(x, y, emitEvent); }

    /** @returns {number} */
    getX() { return this.position.getX(); }

    /** @returns {number} */
    getY() { return this.position.getY(); }

    /** @returns {{x: number, y: number}} */
    getLastPosition() { return this.position.getLastPosition(); }

    /** @param {number} x @param {number} y */
    setLastPosition(x: number, y: number) { return this.position.setLastPosition(x, y); }

    /** @param {number} x @param {number} y @param {Array} grid @param {number} fromX @param {number} fromY @returns {boolean} */
    isWalkable(x: number, y: number, grid: any[][], fromX: number = -1, fromY: number = -1) { return this.position.isWalkable(x, y, grid, fromX, fromY); }

    /** @param {number} x @param {number} y @param {Array} grid @param {Function} onZoneTransition */
    move(x: number, y: number, grid: any[][], onZoneTransition: () => void) { return this.position.move(x, y, grid, onZoneTransition); }

    /** @param {Array} grid */
    ensureValidPosition(grid: any[][]) { return this.position.ensureValidPosition(grid); }

    // ========================================
    // ZONE & DIMENSION OPERATIONS (delegated to PlayerPositionFacade)
    // ========================================

    /** @returns {{x: number, y: number, dimension: number, depth: number, portType: string}} */
    getCurrentZone() { return this.position.getCurrentZone(); }

    /** @param {number} x @param {number} y */
    setCurrentZone(x: number, y: number) { return this.position.setCurrentZone(x, y); }

    /** @returns {number} */
    getZoneDimension() { return this.position.getZoneDimension(); }

    /** @param {number} dimension */
    setZoneDimension(dimension: number) { return this.position.setZoneDimension(dimension); }

    /** @returns {number} */
    getUndergroundDepth() { return this.position.getUndergroundDepth(); }

    /** @param {number} depth */
    setUndergroundDepth(depth: number) { return this.position.setUndergroundDepth(depth); }

    /** @returns {string|undefined} */
    getPortType() { return this.position.getPortType(); }

    /** @param {string} portType */
    setPortType(portType: string) { return this.position.setPortType(portType); }

    /** @param {Object} zoneUpdate */
    updateZoneState(zoneUpdate: any) { return this.position.updateZoneState(zoneUpdate); }

    /** @param {string} zoneKey */
    markZoneVisited(zoneKey: string) { return this.position.markZoneVisited(zoneKey); }

    /** Trigger zone transition lifecycle */
    onZoneTransition() { return this.position.onZoneTransition(); }

    /** @returns {Set<string>} */
    getVisitedZones() { return this.position.getVisitedZones(); }

    /** @param {number} x @param {number} y @param {number} dimension @returns {boolean} */
    hasVisitedZone(x: number, y: number, dimension: number = 0) { return this.position.hasVisitedZone(x, y, dimension); }

    // ========================================
    // INVENTORY OPERATIONS (delegated to PlayerInventoryFacade)
    // ========================================

    /** @returns {Array<Object>} */
    getInventory() { return this.inventory.getInventory(); }

    /** @deprecated @returns {Array<Object>} */
    getInventoryRef() { return this.inventory.getInventoryRef(); }

    /** @param {Object} item @returns {boolean} */
    addToInventory(item: any) { return this.inventory.addToInventory(item); }

    /** @param {number} index @returns {Object|null} */
    removeFromInventory(index: number) { return this.inventory.removeFromInventory(index); }

    /** @param {Function} predicate @returns {Object|undefined} */
    findInInventory(predicate: (item: any) => boolean) { return this.inventory.findInInventory(predicate); }

    /** @returns {number} */
    getInventoryCount() { return this.inventory.getInventoryCount(); }

    /** Clear inventory */
    clearInventory() { return this.inventory.clearInventory(); }

    /** @returns {Array<Object>} */
    getRadialInventory() { return this.inventory.getRadialInventory(); }

    /** @param {Array<Object>} items */
    setRadialInventory(items: any[]) { return this.inventory.setRadialInventory(items); }

    // ========================================
    // ABILITIES OPERATIONS (delegated to PlayerInventoryFacade)
    // ========================================

    /** @param {string} ability @returns {boolean} */
    hasAbility(ability: string) { return this.inventory.hasAbility(ability); }

    /** @param {string} ability */
    addAbility(ability: string) { return this.inventory.addAbility(ability); }

    /** @param {string} ability */
    removeAbility(ability: string) { return this.inventory.removeAbility(ability); }

    /** @returns {Array<string>} */
    getAbilities() { return this.inventory.getAbilities(); }

    // ========================================
    // STATS OPERATIONS (delegated to PlayerStatsFacade)
    // ========================================

    /** @returns {Object} */
    getStats() { return this.stats.getStats(); }

    /** @deprecated @returns {Object} */
    getStatsRef() { return this.stats.getStatsRef(); }

    /** @returns {number} */
    getHealth() { return this.stats.getHealth(); }

    /** @returns {number} */
    getHunger() { return this.stats.getHunger(); }

    /** @returns {number} */
    getThirst() { return this.stats.getThirst(); }

    /** @param {number} amount */
    takeDamage(amount: number) { return this.stats.takeDamage(amount); }

    /** @param {number} amount */
    restoreHealth(amount: number) { return this.stats.restoreHealth(amount); }

    /** @param {number} amount */
    restoreHunger(amount: number) { return this.stats.restoreHunger(amount); }

    /** @returns {number} */
    getPoints() { return this.stats.getPoints(); }

    /** @param {number} points */
    addPoints(points: number) { return this.stats.addPoints(points); }

    /** @returns {number} */
    getSpentDiscoveries() { return this.stats.getSpentDiscoveries(); }

    /** @param {number} count */
    setSpentDiscoveries(count: number) { return this.stats.setSpentDiscoveries(count); }

    /** @param {string} statName @param {*} value */
    updateStat(statName: string, value: any) { return this.stats.updateStat(statName, value); }

    // ========================================
    // ANIMATION & VISUAL STATE (delegated to PlayerStatsFacade)
    // ========================================

    /** @param {number} dx @param {number} dy */
    startBump(dx: number, dy: number) { return this.stats.startBump(dx, dy); }

    /** Start backflip animation */
    startBackflip() { return this.stats.startBackflip(); }

    /** Start attack animation */
    startAttackAnimation() { return this.stats.startAttackAnimation(); }

    /** @param {number} x @param {number} y */
    startSplodeAnimation(x: number, y: number) { return this.stats.startSplodeAnimation(x, y); }

    /** @param {number} x @param {number} y */
    startSmokeAnimation(x: number, y: number) { return this.stats.startSmokeAnimation(x, y); }

    /** @param {string} action */
    setAction(action: string) { return this.stats.setAction(action); }

    /** @returns {number} */
    getConsecutiveKills() { return this.stats.getConsecutiveKills(); }

    /** @param {number} count */
    setConsecutiveKills(count: number) { return this.stats.setConsecutiveKills(count); }

    // ========================================
    // INTERACTION STATE (delegated to PlayerStatsFacade)
    // ========================================

    /** @returns {Object|null} */
    getInteractOnReach() { return this.stats.getInteractOnReach(); }

    /** @param {Object} target */
    setInteractOnReach(target: any) { return this.stats.setInteractOnReach(target); }

    /** Clear interact on reach */
    clearInteractOnReach() { return this.stats.clearInteractOnReach(); }

    // ========================================
    // PLAYER STATE QUERIES
    // ========================================

    /** @returns {boolean} */
    isDead() { return this.stats.isDead(); }

    /** @returns {Object} */
    getPositionObject() { return this.position.getPositionObject(); }

    // ========================================
    // ANIMATION STATE QUERIES (delegated to PlayerStatsFacade)
    // ========================================

    /** @returns {number} */
    getAttackAnimation() { return this.stats.getAttackAnimation(); }

    /** @returns {number} */
    getActionAnimation() { return this.stats.getActionAnimation(); }

    /** @returns {number} */
    getBumpOffsetX() { return this.stats.getBumpOffsetX(); }

    /** @returns {number} */
    getBumpOffsetY() { return this.stats.getBumpOffsetY(); }

    /** @returns {number} */
    getBackflipAngle() { return this.stats.getBackflipAngle(); }

    /** @returns {number} */
    getBackflipLiftOffsetY() { return this.stats.getBackflipLiftOffsetY(); }

    /** @returns {number} */
    getLiftOffsetY() { return this.stats.getLiftOffsetY(); }

    /** @returns {Array<Object>} */
    getSmokeAnimations() { return this.stats.getSmokeAnimations(); }

    /** @returns {Array<Object>} */
    getSplodeAnimations() { return this.stats.getSplodeAnimations(); }

    /** @returns {Object|null} */
    getPickupHover() { return this.stats.getPickupHover(); }

    /** @param {number} x @param {number} y @param {number} frames */
    addSmokeAnimation(x: number, y: number, frames: number) { return this.stats.addSmokeAnimation(x, y, frames); }

    /** @param {Object} data */
    setPickupHover(data: any) { return this.stats.setPickupHover(data); }

    /** Clear pickup hover */
    clearPickupHover() { return this.stats.clearPickupHover(); }

    /** @param {Object} data */
    setBowShot(data: any) { return this.stats.setBowShot(data); }

    /** Clear bow shot */
    clearBowShot() { return this.stats.clearBowShot(); }

    /** @returns {boolean} */
    hasAnimations() { return this.stats.hasAnimations(); }

    // ========================================
    // RAW ACCESS (Use sparingly)
    // ========================================

    /**
     * Get raw player reference (use only when absolutely necessary)
     * @returns {Object} The underlying player object
     * @deprecated Prefer using facade methods
     */
    getRawPlayer() {
        logger.warn('PlayerFacade.getRawPlayer: Direct player access requested. This bypasses encapsulation.');
        return this.player;
    }
}

export default PlayerFacade;
