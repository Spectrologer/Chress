import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { logger } from '../core/logger.js';

/**
 * PlayerFacade - Centralized abstraction layer for player operations
 *
 * Eliminates direct player property access patterns scattered across the codebase.
 * Provides a controlled interface for reading, writing, and managing player state.
 *
 * Benefits:
 * - Encapsulation: All player mutations go through validated methods
 * - Events: Automatic event emission on state changes
 * - Validation: Centralized business rules and constraints
 * - Testability: Player logic can be tested independently
 * - Type Safety: Consistent property handling and normalization
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
    }

    // ========================================
    // POSITION OPERATIONS
    // ========================================

    /**
     * Get player position as object
     * @returns {{x: number, y: number}} Position coordinates
     */
    getPosition() {
        return this.player.getPosition();
    }

    /**
     * Set player position with validation and events
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} emitEvent - Whether to emit PLAYER_MOVED event (default: true)
     */
    setPosition(x, y, emitEvent = true) {
        this.player.setPosition(x, y, emitEvent);
    }

    /**
     * Get X coordinate
     * @returns {number}
     */
    getX() {
        return this.player.x;
    }

    /**
     * Get Y coordinate
     * @returns {number}
     */
    getY() {
        return this.player.y;
    }

    /**
     * Get last position (for interpolation/animation)
     * @returns {{x: number, y: number}}
     */
    getLastPosition() {
        return { x: this.player.lastX, y: this.player.lastY };
    }

    /**
     * Update last position (for animation tracking)
     * @param {number} x - Last X coordinate
     * @param {number} y - Last Y coordinate
     */
    setLastPosition(x, y) {
        this.player.lastX = x;
        this.player.lastY = y;
    }

    /**
     * Check if a tile is walkable from current position
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     * @param {Array<Array>} grid - The game grid
     * @param {number} fromX - Source X coordinate (optional)
     * @param {number} fromY - Source Y coordinate (optional)
     * @returns {boolean}
     */
    isWalkable(x, y, grid, fromX = -1, fromY = -1) {
        return this.player.isWalkable(x, y, grid, fromX, fromY);
    }

    /**
     * Move player to target position
     * @param {number} x - Target X
     * @param {number} y - Target Y
     * @param {Array<Array>} grid - Game grid
     * @param {Function} onZoneTransition - Callback for zone transitions
     */
    move(x, y, grid, onZoneTransition) {
        return this.player.move(x, y, grid, onZoneTransition);
    }

    /**
     * Ensure player is on a valid position
     * @param {Array<Array>} grid - Game grid
     */
    ensureValidPosition(grid) {
        this.player.ensureValidPosition(grid);
    }

    // ========================================
    // ZONE & DIMENSION OPERATIONS
    // ========================================

    /**
     * Get current zone information (returns a copy)
     * @returns {{x: number, y: number, dimension: number, depth: number, portType: string}}
     */
    getCurrentZone() {
        return this.player.getCurrentZone();
    }

    /**
     * Set current zone coordinates
     * @param {number} x - Zone X coordinate
     * @param {number} y - Zone Y coordinate
     */
    setCurrentZone(x, y) {
        this.player.setCurrentZone(x, y);
    }

    /**
     * Get zone dimension (0=surface, 1=interior, 2=underground)
     * @returns {number}
     */
    getZoneDimension() {
        return this.player.currentZone?.dimension ?? 0;
    }

    /**
     * Set zone dimension with validation
     * @param {number} dimension - Dimension value (0, 1, or 2)
     */
    setZoneDimension(dimension) {
        if (![0, 1, 2].includes(dimension)) {
            logger.warn(`PlayerFacade: Invalid dimension ${dimension}, must be 0, 1, or 2`);
            return;
        }
        if (!this.player.currentZone) {
            this.player.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        }
        this.player.currentZone.dimension = dimension;

        // Emit zone changed event
        eventBus.emit(EventTypes.ZONE_CHANGED, this.getCurrentZone());
    }

    /**
     * Get underground depth (atomic with zone depth)
     * @returns {number}
     */
    getUndergroundDepth() {
        return this.player.undergroundDepth ?? 0;
    }

    /**
     * Set underground depth (keeps currentZone.depth in sync)
     * IMPORTANT: This maintains consistency between undergroundDepth and currentZone.depth
     * @param {number} depth - Depth level (0=surface, 1+=underground levels)
     */
    setUndergroundDepth(depth) {
        if (typeof depth !== 'number' || depth < 0) {
            logger.warn(`PlayerFacade: Invalid depth ${depth}, must be non-negative number`);
            return;
        }

        // Keep both properties in sync
        this.player.undergroundDepth = depth;
        if (!this.player.currentZone) {
            this.player.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        }
        this.player.currentZone.depth = depth;

        logger.debug(`PlayerFacade: Set underground depth to ${depth}`);
    }

    /**
     * Get zone port type
     * @returns {string|undefined}
     */
    getPortType() {
        return this.player.currentZone?.portType;
    }

    /**
     * Set zone port type
     * @param {string} portType - Port type (e.g., 'interior', 'underground')
     */
    setPortType(portType) {
        if (!this.player.currentZone) {
            this.player.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        }
        this.player.currentZone.portType = portType;
    }

    /**
     * Atomically update zone state (prevents drift between related properties)
     * @param {Object} zoneUpdate - Zone properties to update
     * @param {number} zoneUpdate.x - Zone X coordinate
     * @param {number} zoneUpdate.y - Zone Y coordinate
     * @param {number} zoneUpdate.dimension - Dimension (0, 1, or 2)
     * @param {number} zoneUpdate.depth - Depth level
     * @param {string} zoneUpdate.portType - Port type (optional)
     */
    updateZoneState(zoneUpdate) {
        const { x, y, dimension, depth, portType } = zoneUpdate;

        if (!this.player.currentZone) {
            this.player.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        }

        // Atomic update - all or nothing
        if (x !== undefined) this.player.currentZone.x = x;
        if (y !== undefined) this.player.currentZone.y = y;
        if (dimension !== undefined) this.player.currentZone.dimension = dimension;
        if (depth !== undefined) {
            this.player.currentZone.depth = depth;
            this.player.undergroundDepth = depth; // Keep in sync
        }
        if (portType !== undefined) this.player.currentZone.portType = portType;

        // Emit zone change event
        eventBus.emit(EventTypes.ZONE_CHANGED, this.getCurrentZone());
    }

    /**
     * Mark a zone as visited
     * @param {string} zoneKey - Zone key string
     */
    markZoneVisited(zoneKey) {
        if (this.player.markZoneVisited) {
            this.player.markZoneVisited(zoneKey);
        }
    }

    /**
     * Trigger zone transition lifecycle
     */
    onZoneTransition() {
        if (this.player.onZoneTransition) {
            this.player.onZoneTransition();
        }
    }

    // ========================================
    // INVENTORY OPERATIONS
    // ========================================

    /**
     * Get inventory (returns a copy to prevent direct mutations)
     * @returns {Array<Object>} Copy of inventory array
     */
    getInventory() {
        return [...(this.player.inventory || [])];
    }

    /**
     * Get inventory reference (use sparingly - prefer getInventory())
     * @returns {Array<Object>}
     * @deprecated Use getInventory() instead for safer access
     */
    getInventoryRef() {
        logger.warn('PlayerFacade.getInventoryRef: Direct inventory reference requested. Consider using getInventory() instead.');
        return this.player.inventory;
    }

    /**
     * Add item to inventory with event emission
     * @param {Object} item - Item to add
     * @returns {boolean} True if added successfully
     */
    addToInventory(item) {
        if (!item) {
            logger.warn('PlayerFacade: Cannot add null/undefined item to inventory');
            return false;
        }

        if (!this.player.inventory) {
            this.player.inventory = [];
        }

        this.player.inventory.push(item);

        // Emit inventory changed event
        eventBus.emit(EventTypes.INVENTORY_CHANGED, {
            action: 'add',
            item,
            inventory: this.getInventory()
        });

        return true;
    }

    /**
     * Remove item from inventory by index
     * @param {number} index - Index to remove
     * @returns {Object|null} Removed item or null
     */
    removeFromInventory(index) {
        if (!this.player.inventory || index < 0 || index >= this.player.inventory.length) {
            logger.warn(`PlayerFacade: Invalid inventory index ${index}`);
            return null;
        }

        const removed = this.player.inventory.splice(index, 1)[0];

        // Emit inventory changed event
        eventBus.emit(EventTypes.INVENTORY_CHANGED, {
            action: 'remove',
            item: removed,
            index,
            inventory: this.getInventory()
        });

        return removed;
    }

    /**
     * Find item in inventory by predicate
     * @param {Function} predicate - Function(item) => boolean
     * @returns {Object|undefined} Found item
     */
    findInInventory(predicate) {
        return this.player.inventory?.find(predicate);
    }

    /**
     * Get inventory count
     * @returns {number}
     */
    getInventoryCount() {
        return this.player.inventory?.length ?? 0;
    }

    /**
     * Clear inventory
     */
    clearInventory() {
        const oldInventory = this.getInventory();
        this.player.inventory = [];

        eventBus.emit(EventTypes.INVENTORY_CHANGED, {
            action: 'clear',
            oldInventory,
            inventory: []
        });
    }

    /**
     * Get radial inventory
     * @returns {Array<Object>}
     */
    getRadialInventory() {
        return [...(this.player.radialInventory || [])];
    }

    /**
     * Set radial inventory
     * @param {Array<Object>} items - Items for radial inventory
     */
    setRadialInventory(items) {
        this.player.radialInventory = items;

        eventBus.emit(EventTypes.RADIAL_INVENTORY_CHANGED, {
            inventory: this.getRadialInventory()
        });
    }

    // ========================================
    // ABILITIES OPERATIONS
    // ========================================

    /**
     * Check if player has an ability
     * @param {string} ability - Ability name
     * @returns {boolean}
     */
    hasAbility(ability) {
        return this.player.abilities?.has(ability) ?? false;
    }

    /**
     * Add ability with event emission
     * @param {string} ability - Ability name
     */
    addAbility(ability) {
        if (!this.player.abilities) {
            this.player.abilities = new Set();
        }

        if (this.player.abilities.has(ability)) {
            logger.debug(`PlayerFacade: Player already has ability '${ability}'`);
            return;
        }

        this.player.abilities.add(ability);

        eventBus.emit(EventTypes.ABILITY_GAINED, {
            ability,
            abilities: Array.from(this.player.abilities)
        });

        logger.debug(`PlayerFacade: Added ability '${ability}'`);
    }

    /**
     * Remove ability
     * @param {string} ability - Ability name
     */
    removeAbility(ability) {
        if (!this.player.abilities?.has(ability)) {
            return;
        }

        this.player.abilities.delete(ability);

        eventBus.emit(EventTypes.ABILITY_LOST, {
            ability,
            abilities: Array.from(this.player.abilities)
        });
    }

    /**
     * Get all abilities
     * @returns {Array<string>}
     */
    getAbilities() {
        return Array.from(this.player.abilities || []);
    }

    // ========================================
    // STATS OPERATIONS
    // ========================================

    /**
     * Get stats object (returns copy to prevent direct mutations)
     * @returns {Object} Copy of stats
     */
    getStats() {
        return this.player.stats ? { ...this.player.stats } : {};
    }

    /**
     * Get stats reference (use sparingly)
     * @returns {Object}
     * @deprecated Use getStats() for safer access
     */
    getStatsRef() {
        logger.warn('PlayerFacade.getStatsRef: Direct stats reference requested.');
        return this.player.stats;
    }

    /**
     * Get health value
     * @returns {number}
     */
    getHealth() {
        return this.player.stats?.health ?? 0;
    }

    /**
     * Get hunger value
     * @returns {number}
     */
    getHunger() {
        return this.player.stats?.hunger ?? 0;
    }

    /**
     * Get thirst value
     * @returns {number}
     */
    getThirst() {
        return this.player.stats?.thirst ?? 0;
    }

    /**
     * Take damage (delegates to PlayerStats)
     * @param {number} amount - Damage amount
     */
    takeDamage(amount) {
        if (this.player.takeDamage) {
            this.player.takeDamage(amount);
        } else if (this.player.stats?.takeDamage) {
            this.player.stats.takeDamage(amount);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Restore health
     * @param {number} amount - Health to restore
     */
    restoreHealth(amount) {
        if (this.player.restoreHealth) {
            this.player.restoreHealth(amount);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Restore hunger
     * @param {number} amount - Hunger to restore
     */
    restoreHunger(amount) {
        if (this.player.restoreHunger) {
            this.player.restoreHunger(amount);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Get points
     * @returns {number}
     */
    getPoints() {
        return this.player.getPoints?.() ?? this.player.points ?? 0;
    }

    /**
     * Add points with event emission
     * @param {number} points - Points to add
     */
    addPoints(points) {
        if (this.player.addPoints) {
            this.player.addPoints(points);
        } else {
            this.player.points = (this.player.points || 0) + points;
        }

        eventBus.emit(EventTypes.POINTS_CHANGED, {
            points: this.getPoints()
        });
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Get spent discoveries
     * @returns {number}
     */
    getSpentDiscoveries() {
        return this.player.getSpentDiscoveries?.() ?? this.player.spentDiscoveries ?? 0;
    }

    /**
     * Set spent discoveries
     * @param {number} count - Number of spent discoveries
     */
    setSpentDiscoveries(count) {
        if (this.player.setSpentDiscoveries) {
            this.player.setSpentDiscoveries(count);
        } else {
            this.player.spentDiscoveries = count;
        }
    }

    /**
     * Update a specific stat property (for settings like musicEnabled)
     * @param {string} statName - Stat property name
     * @param {*} value - New value
     */
    updateStat(statName, value) {
        if (!this.player.stats) {
            this.player.stats = {};
        }

        this.player.stats[statName] = value;

        eventBus.emit(EventTypes.STATS_CHANGED, {
            stat: statName,
            value,
            stats: this.getStats()
        });
    }

    // ========================================
    // ANIMATION & VISUAL STATE
    // ========================================

    /**
     * Start bump animation
     * @param {number} dx - X direction
     * @param {number} dy - Y direction
     */
    startBump(dx, dy) {
        if (this.player.startBump) {
            this.player.startBump(dx, dy);
        }
    }

    /**
     * Start backflip animation
     */
    startBackflip() {
        if (this.player.startBackflip) {
            this.player.startBackflip();
        }
    }

    /**
     * Start attack animation
     */
    startAttackAnimation() {
        if (this.player.startAttackAnimation) {
            this.player.startAttackAnimation();
        }
    }

    /**
     * Start explosion animation
     * @param {number} x - Explosion X
     * @param {number} y - Explosion Y
     */
    startSplodeAnimation(x, y) {
        if (this.player.startSplodeAnimation) {
            this.player.startSplodeAnimation(x, y);
        }
    }

    /**
     * Start smoke animation
     * @param {number} x - Smoke X
     * @param {number} y - Smoke Y
     */
    startSmokeAnimation(x, y) {
        if (this.player.startSmokeAnimation) {
            this.player.startSmokeAnimation(x, y);
        }
    }

    /**
     * Set player action state
     * @param {string} action - Action type
     */
    setAction(action) {
        if (this.player.setAction) {
            this.player.setAction(action);
        }
    }

    /**
     * Get consecutive kills count
     * @returns {number}
     */
    getConsecutiveKills() {
        return this.player.consecutiveKills ?? 0;
    }

    /**
     * Set consecutive kills count
     * @param {number} count - Kill count
     */
    setConsecutiveKills(count) {
        this.player.consecutiveKills = count;
    }

    // ========================================
    // INTERACTION STATE
    // ========================================

    /**
     * Get interact on reach target
     * @returns {Object|null}
     */
    getInteractOnReach() {
        return this.player.interactOnReach;
    }

    /**
     * Set interact on reach target
     * @param {Object} target - Target coordinates
     */
    setInteractOnReach(target) {
        this.player.interactOnReach = target;
    }

    /**
     * Clear interact on reach
     */
    clearInteractOnReach() {
        if (this.player.clearInteractOnReach) {
            this.player.clearInteractOnReach();
        } else {
            this.player.interactOnReach = null;
        }
    }

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
