import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { logger } from '../../core/logger.js';

/**
 * ZoneStateManager - Manages zone-specific state (Transitions, Pitfalls)
 *
 * Responsibilities:
 * - Port/zone transition metadata
 * - Pitfall zone state and turn tracking
 * - Zone-specific events and validation
 */
export class ZoneStateManager {
    constructor() {
        this._reset();
    }

    _reset() {
        // Port/zone transition metadata
        this._portTransitionData = null;

        // Pitfall zone state
        this._isInPitfallZone = false;
        this._pitfallTurnsSurvived = 0;
    }

    // ========================================
    // PORT TRANSITION DATA
    // ========================================

    /**
     * Get port transition metadata
     * @returns {Object|null}
     */
    getPortTransitionData() {
        return this._portTransitionData;
    }

    /**
     * Check if port transition data exists
     * @returns {boolean}
     */
    hasPortTransitionData() {
        return this._portTransitionData !== null;
    }

    /**
     * Set port transition metadata
     * @param {Object} data - Transition data { from, x, y }
     */
    setPortTransitionData(data) {
        if (!data || !data.from) {
            logger.warn('ZoneStateManager: Invalid port transition data', data);
            return;
        }

        this._portTransitionData = data;

        eventBus.emit(EventTypes.PORT_TRANSITION_DATA_SET, {
            from: data.from,
            x: data.x,
            y: data.y
        });

        logger.debug('ZoneStateManager: Port transition data set', data);
    }

    /**
     * Clear port transition metadata
     */
    clearPortTransitionData() {
        if (this._portTransitionData) {
            const oldData = this._portTransitionData;
            this._portTransitionData = null;

            eventBus.emit(EventTypes.PORT_TRANSITION_DATA_CLEARED, {
                previousData: oldData
            });

            logger.debug('ZoneStateManager: Port transition data cleared', oldData);
        }
    }

    // ========================================
    // PITFALL ZONE STATE
    // ========================================

    /**
     * Check if player is in pitfall zone
     * @returns {boolean}
     */
    isInPitfallZone() {
        return this._isInPitfallZone;
    }

    /**
     * Get pitfall turns survived
     * @returns {number}
     */
    getPitfallTurnsSurvived() {
        return this._pitfallTurnsSurvived;
    }

    /**
     * Enter pitfall zone
     */
    enterPitfallZone() {
        this._isInPitfallZone = true;
        this._pitfallTurnsSurvived = 0;

        eventBus.emit(EventTypes.PITFALL_ZONE_ENTERED, {
            turnsSurvived: 0
        });

        logger.debug('ZoneStateManager: Entered pitfall zone');
    }

    /**
     * Exit pitfall zone
     */
    exitPitfallZone() {
        if (this._isInPitfallZone) {
            this._isInPitfallZone = false;
            const turnsSurvived = this._pitfallTurnsSurvived;
            this._pitfallTurnsSurvived = 0;

            eventBus.emit(EventTypes.PITFALL_ZONE_EXITED, {
                turnsSurvived
            });

            logger.debug('ZoneStateManager: Exited pitfall zone', { turnsSurvived });
        }
    }

    /**
     * Increment pitfall turns survived
     * @returns {number} New turn count
     */
    incrementPitfallTurnsSurvived() {
        this._pitfallTurnsSurvived++;

        eventBus.emit(EventTypes.PITFALL_TURN_SURVIVED, {
            turnsSurvived: this._pitfallTurnsSurvived
        });

        return this._pitfallTurnsSurvived;
    }

    // ========================================
    // UTILITIES
    // ========================================

    /**
     * Clear transition data (but keep pitfall state)
     */
    clearTransitionData() {
        this.clearPortTransitionData();
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
            portTransitionData: this._portTransitionData,
            isInPitfallZone: this._isInPitfallZone,
            pitfallTurnsSurvived: this._pitfallTurnsSurvived
        };
    }
}

export default ZoneStateManager;
