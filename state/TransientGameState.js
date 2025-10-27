import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { logger } from '../core/logger.js';

/**
 * TransientGameState - Centralized container for temporary game state
 *
 * Eliminates scattered flags and temporary data on the game object.
 * These are "transient" because they are session-specific, not persisted to saves,
 * and represent temporary UI or gameplay states.
 *
 * Before: Flags scattered across game object
 * - game.pendingCharge
 * - game.bombPlacementMode
 * - game.bombPlacementPositions
 * - game.displayingMessageForSign
 * - game.lastSignMessage
 * - game.portTransitionData
 * - game.isInPitfallZone
 * - game.pitfallTurnsSurvived
 * - game.playerJustAttacked
 *
 * After: Centralized state container with validation and events
 *
 * Benefits:
 * - Single Responsibility: All transient state in one place
 * - Encapsulation: Controlled access with validation
 * - Events: Automatic event emission on state changes
 * - Debugging: Easy to inspect all transient state
 * - Testing: Can mock entire transient state
 * - Clear API: Explicit methods vs scattered properties
 */
export class TransientGameState {
    constructor() {
        this._reset();
    }

    /**
     * Reset all transient state to initial values
     * Called on game initialization and zone transitions
     */
    _reset() {
        // Horse charge state (HORSE_ICON item)
        this._pendingCharge = null;

        // Bomb placement mode (BOMB item)
        this._bombPlacementMode = false;
        this._bombPlacementPositions = [];

        // Sign message display state
        this._displayingMessageForSign = null;
        this._lastSignMessage = null;

        // NPC interaction tracking (for distance-based auto-close)
        this._currentNPCPosition = null;

        // Port/zone transition metadata
        this._portTransitionData = null;

        // Pitfall zone state
        this._isInPitfallZone = false;
        this._pitfallTurnsSurvived = 0;

        // Combat state flags
        this._playerJustAttacked = false;
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

        logger.debug('TransientGameState: Pending charge set', chargeData);
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

            logger.debug('TransientGameState: Pending charge cleared');
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

        logger.debug('TransientGameState: Entered bomb placement mode');
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

            logger.debug('TransientGameState: Exited bomb placement mode', { hadPositions: positions.length });
        }
    }

    /**
     * Add bomb placement position
     * @param {Object} position - Position object with x, y
     */
    addBombPlacementPosition(position) {
        if (!this._bombPlacementMode) {
            logger.warn('TransientGameState: Cannot add bomb position - not in placement mode');
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
    // SIGN MESSAGE STATE
    // ========================================

    /**
     * Get currently displaying sign message
     * @returns {Object|null}
     */
    getDisplayingSignMessage() {
        return this._displayingMessageForSign;
    }

    /**
     * Check if a sign message is currently displaying
     * @returns {boolean}
     */
    isDisplayingSignMessage() {
        return this._displayingMessageForSign !== null;
    }

    /**
     * Set displaying sign message
     * @param {Object} signData - Sign data with message
     */
    setDisplayingSignMessage(signData) {
        this._displayingMessageForSign = signData;

        eventBus.emit(EventTypes.SIGN_MESSAGE_DISPLAYED, {
            message: signData?.message
        });
    }

    /**
     * Clear displaying sign message
     */
    clearDisplayingSignMessage() {
        if (this._displayingMessageForSign) {
            this._displayingMessageForSign = null;

            eventBus.emit(EventTypes.SIGN_MESSAGE_CLEARED, {});
        }
    }

    /**
     * Get last sign message (for deduplication)
     * @returns {string|null}
     */
    getLastSignMessage() {
        return this._lastSignMessage;
    }

    /**
     * Set last sign message
     * @param {string} message - Message text
     */
    setLastSignMessage(message) {
        this._lastSignMessage = message;
    }

    /**
     * Clear last sign message
     */
    clearLastSignMessage() {
        this._lastSignMessage = null;
    }

    // ========================================
    // NPC INTERACTION TRACKING
    // ========================================

    /**
     * Get current NPC interaction position
     * @returns {Object|null} NPC position {x, y} or null
     */
    getCurrentNPCPosition() {
        return this._currentNPCPosition;
    }

    /**
     * Set current NPC interaction position
     * @param {Object} position - NPC position {x, y}
     */
    setCurrentNPCPosition(position) {
        if (position && typeof position.x === 'number' && typeof position.y === 'number') {
            this._currentNPCPosition = { x: position.x, y: position.y };
            logger.debug('TransientGameState: NPC position set', position);
        }
    }

    /**
     * Clear current NPC interaction position
     */
    clearCurrentNPCPosition() {
        if (this._currentNPCPosition) {
            logger.debug('TransientGameState: NPC position cleared');
            this._currentNPCPosition = null;
        }
    }

    /**
     * Check if player is still adjacent to current NPC
     * @param {Object} playerPos - Player position {x, y}
     * @returns {boolean} True if still adjacent or no NPC tracked
     */
    isPlayerAdjacentToNPC(playerPos) {
        if (!this._currentNPCPosition) {
            return true; // No NPC tracked, don't close
        }

        const dx = Math.abs(playerPos.x - this._currentNPCPosition.x);
        const dy = Math.abs(playerPos.y - this._currentNPCPosition.y);

        // Use same adjacency check as interactions (includes diagonals)
        return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
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
            logger.warn('TransientGameState: Invalid port transition data', data);
            return;
        }

        this._portTransitionData = data;

        eventBus.emit(EventTypes.PORT_TRANSITION_DATA_SET, {
            from: data.from,
            x: data.x,
            y: data.y
        });

        logger.debug('TransientGameState: Port transition data set', data);
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

            logger.debug('TransientGameState: Port transition data cleared', oldData);
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

        logger.debug('TransientGameState: Entered pitfall zone');
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

            logger.debug('TransientGameState: Exited pitfall zone', { turnsSurvived });
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
    // ZONE TRANSITION HELPERS
    // ========================================

    /**
     * Clear all zone-specific transient state
     * Called when transitioning between zones
     */
    clearZoneTransientState() {
        logger.debug('TransientGameState: Clearing zone-specific state');

        this.clearDisplayingSignMessage();
        this.clearLastSignMessage();
        this.clearCurrentNPCPosition();
        this.exitBombPlacementMode();
        this.clearPendingCharge();
        this.clearPlayerJustAttacked();

        // Keep portTransitionData - it's needed for the transition itself
        // Keep pitfallZone state - it persists across turns
    }

    /**
     * Reset all transient state (game initialization)
     */
    resetAll() {
        logger.debug('TransientGameState: Resetting all state');
        this._reset();

        eventBus.emit(EventTypes.TRANSIENT_STATE_RESET, {});
    }

    // ========================================
    // DEBUGGING & INSPECTION
    // ========================================

    /**
     * Get snapshot of all transient state for debugging
     * @returns {Object}
     */
    getSnapshot() {
        return {
            pendingCharge: this._pendingCharge,
            bombPlacementMode: this._bombPlacementMode,
            bombPlacementPositions: [...this._bombPlacementPositions],
            displayingMessageForSign: this._displayingMessageForSign,
            lastSignMessage: this._lastSignMessage,
            currentNPCPosition: this._currentNPCPosition,
            portTransitionData: this._portTransitionData,
            isInPitfallZone: this._isInPitfallZone,
            pitfallTurnsSurvived: this._pitfallTurnsSurvived,
            playerJustAttacked: this._playerJustAttacked
        };
    }

    /**
     * Log current state for debugging
     */
    debugLog() {
        logger.debug('TransientGameState snapshot:', this.getSnapshot());
    }
}

export default TransientGameState;
