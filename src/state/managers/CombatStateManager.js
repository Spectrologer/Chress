import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { logger } from '../../core/logger.js';

/**
 * CombatStateManager - Manages combat-related temporary state
 *
 * Responsibilities:
 * - Player attack state tracking
 * - Combat action flags
 * - Turn-based combat events
 */
export class CombatStateManager {
    constructor() {
        this._reset();
    }

    _reset() {
        // Combat state flags
        this._playerJustAttacked = false;
    }

    // ========================================
    // COMBAT STATE FLAGS
    // ========================================

    /**
     * Check if player just attacked this turn
     * @returns {boolean}
     */
    didPlayerJustAttack() {
        return this._playerJustAttacked;
    }

    /**
     * Set player just attacked flag
     * @param {boolean} value - True if player attacked
     */
    setPlayerJustAttacked(value) {
        this._playerJustAttacked = value;

        if (value) {
            eventBus.emit(EventTypes.PLAYER_ATTACKED, {});
        }
    }

    /**
     * Clear player just attacked flag
     */
    clearPlayerJustAttacked() {
        this._playerJustAttacked = false;
    }

    // ========================================
    // UTILITIES
    // ========================================

    /**
     * Clear all combat state
     */
    clear() {
        this.clearPlayerJustAttacked();
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
            playerJustAttacked: this._playerJustAttacked
        };
    }
}

export default CombatStateManager;
