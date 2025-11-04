// @ts-check
import { eventBus } from '../core/EventBus';
import { EventTypes } from '../core/EventTypes';
import { logger } from '../core/logger';

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} ZoneInfo
 * @property {number} x - Zone X coordinate
 * @property {number} y - Zone Y coordinate
 * @property {number} dimension - Dimension (0=surface, 1=interior, 2=underground)
 * @property {number} depth - Underground depth level
 * @property {string} [portType] - Port type (optional)
 */

/**
 * @typedef {Object} ZoneUpdate
 * @property {number} [x] - Zone X coordinate
 * @property {number} [y] - Zone Y coordinate
 * @property {number} [dimension] - Dimension (0, 1, or 2)
 * @property {number} [depth] - Depth level
 * @property {string} [portType] - Port type (optional)
 */

/**
 * PlayerPositionFacade - Position and zone management for player
 *
 * Handles:
 * - Player position (x, y coordinates)
 * - Movement and walkability
 * - Zone coordinates and transitions
 * - Dimension management (surface, interior, underground)
 * - Underground depth tracking
 *
 * @example
 * const positionFacade = new PlayerPositionFacade(player);
 * positionFacade.setPosition(5, 3);
 * positionFacade.setUndergroundDepth(2);
 */
export class PlayerPositionFacade {
    private player: any;

    /**
     * @param {any} player - The player entity
     */
    constructor(player: any) {
        if (!player) {
            throw new Error('PlayerPositionFacade requires a valid player instance');
        }
        this.player = player;
    }

    // ========================================
    // POSITION OPERATIONS
    // ========================================

    /**
     * Get player position as object
     * @returns {Position} Position coordinates
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
     * @returns {Position}
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
     * @returns {ZoneInfo}
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
            logger.warn(`PlayerPositionFacade: Invalid dimension ${dimension}, must be 0, 1, or 2`);
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
            logger.warn(`PlayerPositionFacade: Invalid depth ${depth}, must be non-negative number`);
            return;
        }

        // Keep both properties in sync
        this.player.undergroundDepth = depth;
        if (!this.player.currentZone) {
            this.player.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        }
        this.player.currentZone.depth = depth;

        logger.debug(`PlayerPositionFacade: Set underground depth to ${depth}`);
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
     * @param {ZoneUpdate} zoneUpdate - Zone properties to update
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
}

export default PlayerPositionFacade;
