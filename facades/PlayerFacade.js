import { PlayerPositionFacade } from './PlayerPositionFacade.js';
import { PlayerInventoryFacade } from './PlayerInventoryFacade.js';
import { PlayerStatsFacade } from './PlayerStatsFacade.js';
import { logger } from '../core/logger.js';

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
    /**
     * @param {Object} player - The player entity
     */
    constructor(player) {
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
    setPosition(x, y, emitEvent = true) { return this.position.setPosition(x, y, emitEvent); }

    /** @returns {number} */
    getX() { return this.position.getX(); }

    /** @returns {number} */
    getY() { return this.position.getY(); }

    /** @returns {{x: number, y: number}} */
    getLastPosition() { return this.position.getLastPosition(); }

    /** @param {number} x @param {number} y */
    setLastPosition(x, y) { return this.position.setLastPosition(x, y); }

    /** @param {number} x @param {number} y @param {Array} grid @param {number} fromX @param {number} fromY @returns {boolean} */
    isWalkable(x, y, grid, fromX = -1, fromY = -1) { return this.position.isWalkable(x, y, grid, fromX, fromY); }

    /** @param {number} x @param {number} y @param {Array} grid @param {Function} onZoneTransition */
    move(x, y, grid, onZoneTransition) { return this.position.move(x, y, grid, onZoneTransition); }

    /** @param {Array} grid */
    ensureValidPosition(grid) { return this.position.ensureValidPosition(grid); }

    // ========================================
    // ZONE & DIMENSION OPERATIONS (delegated to PlayerPositionFacade)
    // ========================================

    /** @returns {{x: number, y: number, dimension: number, depth: number, portType: string}} */
    getCurrentZone() { return this.position.getCurrentZone(); }

    /** @param {number} x @param {number} y */
    setCurrentZone(x, y) { return this.position.setCurrentZone(x, y); }

    /** @returns {number} */
    getZoneDimension() { return this.position.getZoneDimension(); }

    /** @param {number} dimension */
    setZoneDimension(dimension) { return this.position.setZoneDimension(dimension); }

    /** @returns {number} */
    getUndergroundDepth() { return this.position.getUndergroundDepth(); }

    /** @param {number} depth */
    setUndergroundDepth(depth) { return this.position.setUndergroundDepth(depth); }

    /** @returns {string|undefined} */
    getPortType() { return this.position.getPortType(); }

    /** @param {string} portType */
    setPortType(portType) { return this.position.setPortType(portType); }

    /** @param {Object} zoneUpdate */
    updateZoneState(zoneUpdate) { return this.position.updateZoneState(zoneUpdate); }

    /** @param {string} zoneKey */
    markZoneVisited(zoneKey) { return this.position.markZoneVisited(zoneKey); }

    /** Trigger zone transition lifecycle */
    onZoneTransition() { return this.position.onZoneTransition(); }

    // ========================================
    // INVENTORY OPERATIONS (delegated to PlayerInventoryFacade)
    // ========================================

    /** @returns {Array<Object>} */
    getInventory() { return this.inventory.getInventory(); }

    /** @deprecated @returns {Array<Object>} */
    getInventoryRef() { return this.inventory.getInventoryRef(); }

    /** @param {Object} item @returns {boolean} */
    addToInventory(item) { return this.inventory.addToInventory(item); }

    /** @param {number} index @returns {Object|null} */
    removeFromInventory(index) { return this.inventory.removeFromInventory(index); }

    /** @param {Function} predicate @returns {Object|undefined} */
    findInInventory(predicate) { return this.inventory.findInInventory(predicate); }

    /** @returns {number} */
    getInventoryCount() { return this.inventory.getInventoryCount(); }

    /** Clear inventory */
    clearInventory() { return this.inventory.clearInventory(); }

    /** @returns {Array<Object>} */
    getRadialInventory() { return this.inventory.getRadialInventory(); }

    /** @param {Array<Object>} items */
    setRadialInventory(items) { return this.inventory.setRadialInventory(items); }

    // ========================================
    // ABILITIES OPERATIONS (delegated to PlayerInventoryFacade)
    // ========================================

    /** @param {string} ability @returns {boolean} */
    hasAbility(ability) { return this.inventory.hasAbility(ability); }

    /** @param {string} ability */
    addAbility(ability) { return this.inventory.addAbility(ability); }

    /** @param {string} ability */
    removeAbility(ability) { return this.inventory.removeAbility(ability); }

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
    takeDamage(amount) { return this.stats.takeDamage(amount); }

    /** @param {number} amount */
    restoreHealth(amount) { return this.stats.restoreHealth(amount); }

    /** @param {number} amount */
    restoreHunger(amount) { return this.stats.restoreHunger(amount); }

    /** @returns {number} */
    getPoints() { return this.stats.getPoints(); }

    /** @param {number} points */
    addPoints(points) { return this.stats.addPoints(points); }

    /** @returns {number} */
    getSpentDiscoveries() { return this.stats.getSpentDiscoveries(); }

    /** @param {number} count */
    setSpentDiscoveries(count) { return this.stats.setSpentDiscoveries(count); }

    /** @param {string} statName @param {*} value */
    updateStat(statName, value) { return this.stats.updateStat(statName, value); }

    // ========================================
    // ANIMATION & VISUAL STATE (delegated to PlayerStatsFacade)
    // ========================================

    /** @param {number} dx @param {number} dy */
    startBump(dx, dy) { return this.stats.startBump(dx, dy); }

    /** Start backflip animation */
    startBackflip() { return this.stats.startBackflip(); }

    /** Start attack animation */
    startAttackAnimation() { return this.stats.startAttackAnimation(); }

    /** @param {number} x @param {number} y */
    startSplodeAnimation(x, y) { return this.stats.startSplodeAnimation(x, y); }

    /** @param {number} x @param {number} y */
    startSmokeAnimation(x, y) { return this.stats.startSmokeAnimation(x, y); }

    /** @param {string} action */
    setAction(action) { return this.stats.setAction(action); }

    /** @returns {number} */
    getConsecutiveKills() { return this.stats.getConsecutiveKills(); }

    /** @param {number} count */
    setConsecutiveKills(count) { return this.stats.setConsecutiveKills(count); }

    // ========================================
    // INTERACTION STATE (delegated to PlayerStatsFacade)
    // ========================================

    /** @returns {Object|null} */
    getInteractOnReach() { return this.stats.getInteractOnReach(); }

    /** @param {Object} target */
    setInteractOnReach(target) { return this.stats.setInteractOnReach(target); }

    /** Clear interact on reach */
    clearInteractOnReach() { return this.stats.clearInteractOnReach(); }

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
