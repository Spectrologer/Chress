import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { logger } from '../../core/logger.js';

/**
 * ItemAbilityStateManager - Manages item ability state (Horse charge, Bomb placement)
 *
 * Responsibilities:
 * - Horse charge targeting state
 * - Bomb placement mode and positions
 * - Events and validation for item abilities
 */
export class ItemAbilityStateManager {
    constructor() {
        this._reset();
    }

    _reset() {
        // Horse charge state (HORSE_ICON item)
        this._pendingCharge = null;

        // Bomb placement mode (BOMB item)
        this._bombPlacementMode = false;
        this._bombPlacementPositions = [];
    }

    // ========================================
    // HORSE CHARGE STATE
    // ========================================

    /**
     * Get pending charge data
     * @returns {Object|null} Charge data or null
     */
    getPendingCharge() {
        return this._pendingCharge;
    }

    /**
     * Check if horse charge is pending
     * @returns {boolean}
     */
    hasPendingCharge() {
        return this._pendingCharge !== null;
    }

    /**
     * Set pending charge (horse icon targeting)
     * @param {Object} chargeData - Charge selection data
     */
    setPendingCharge(chargeData) {
        this._pendingCharge = chargeData;

        eventBus.emit(EventTypes.CHARGE_STATE_CHANGED, {
            isPending: true,
            data: chargeData
        });

        logger.debug('ItemAbilityStateManager: Pending charge set', chargeData);
    }

    /**
     * Clear pending charge
     */
    clearPendingCharge() {
        if (this._pendingCharge) {
            this._pendingCharge = null;

            eventBus.emit(EventTypes.CHARGE_STATE_CHANGED, {
                isPending: false,
                data: null
            });

            logger.debug('ItemAbilityStateManager: Pending charge cleared');
        }
    }

    // ========================================
    // BOMB PLACEMENT STATE
    // ========================================

    /**
     * Check if bomb placement mode is active
     * @returns {boolean}
     */
    isBombPlacementMode() {
        return this._bombPlacementMode;
    }

    /**
     * Get bomb placement positions
     * @returns {Array} Copy of placement positions
     */
    getBombPlacementPositions() {
        return [...this._bombPlacementPositions];
    }

    /**
     * Enter bomb placement mode
     */
    enterBombPlacementMode() {
        this._bombPlacementMode = true;
        this._bombPlacementPositions = [];

        eventBus.emit(EventTypes.BOMB_PLACEMENT_MODE_CHANGED, {
            active: true,
            positions: []
        });

        logger.debug('ItemAbilityStateManager: Entered bomb placement mode');
    }

    /**
     * Exit bomb placement mode
     */
    exitBombPlacementMode() {
        if (this._bombPlacementMode) {
            this._bombPlacementMode = false;
            const positions = this._bombPlacementPositions;
            this._bombPlacementPositions = [];

            eventBus.emit(EventTypes.BOMB_PLACEMENT_MODE_CHANGED, {
                active: false,
                positions: []
            });

            logger.debug('ItemAbilityStateManager: Exited bomb placement mode', { hadPositions: positions.length });
        }
    }

    /**
     * Add bomb placement position
     * @param {Object} position - Position object with x, y
     */
    addBombPlacementPosition(position) {
        if (!this._bombPlacementMode) {
            logger.warn('ItemAbilityStateManager: Cannot add bomb position - not in placement mode');
            return;
        }

        this._bombPlacementPositions.push(position);

        eventBus.emit(EventTypes.BOMB_PLACEMENT_POSITION_ADDED, {
            position,
            totalPositions: this._bombPlacementPositions.length
        });
    }

    /**
     * Remove bomb placement position
     * @param {Object} position - Position to remove
     * @returns {boolean} True if removed
     */
    removeBombPlacementPosition(position) {
        const index = this._bombPlacementPositions.findIndex(
            p => p.x === position.x && p.y === position.y
        );

        if (index !== -1) {
            this._bombPlacementPositions.splice(index, 1);

            eventBus.emit(EventTypes.BOMB_PLACEMENT_POSITION_REMOVED, {
                position,
                totalPositions: this._bombPlacementPositions.length
            });

            return true;
        }

        return false;
    }

    /**
     * Clear all bomb placement positions
     */
    clearBombPlacementPositions() {
        this._bombPlacementPositions = [];
    }

    /**
     * Check if position has bomb placement marker
     * @param {Object} position - Position to check
     * @returns {boolean}
     */
    hasBombPlacementAt(position) {
        return this._bombPlacementPositions.some(
            p => p.x === position.x && p.y === position.y
        );
    }

    // ========================================
    // UTILITIES
    // ========================================

    /**
     * Clear all item ability state
     */
    clear() {
        this.exitBombPlacementMode();
        this.clearPendingCharge();
    }

    /**
     * Reset all state
     */
    reset() {
        this._reset();
    }

    /**
     * Get snapshot for debugging
     * @returns {Object}
     */
    getSnapshot() {
        return {
            pendingCharge: this._pendingCharge,
            bombPlacementMode: this._bombPlacementMode,
            bombPlacementPositions: [...this._bombPlacementPositions]
        };
    }
}

export default ItemAbilityStateManager;
