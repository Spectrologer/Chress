import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { logger } from '../../core/logger.js';

/**
 * InteractionStateManager - Manages world interaction state (Signs, NPCs)
 *
 * Responsibilities:
 * - Sign message display state
 * - NPC interaction position tracking
 * - Distance-based interaction validation
 */
export class InteractionStateManager {
    constructor() {
        this._reset();
    }

    _reset() {
        // Sign message display state
        this._displayingMessageForSign = null;
        this._lastSignMessage = null;

        // NPC interaction tracking (for distance-based auto-close)
        this._currentNPCPosition = null;
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
            logger.debug('InteractionStateManager: NPC position set', position);
        }
    }

    /**
     * Clear current NPC interaction position
     */
    clearCurrentNPCPosition() {
        if (this._currentNPCPosition) {
            logger.debug('InteractionStateManager: NPC position cleared');
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
    // UTILITIES
    // ========================================

    /**
     * Clear all interaction state
     */
    clear() {
        this.clearDisplayingSignMessage();
        this.clearLastSignMessage();
        this.clearCurrentNPCPosition();
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
            displayingMessageForSign: this._displayingMessageForSign,
            lastSignMessage: this._lastSignMessage,
            currentNPCPosition: this._currentNPCPosition
        };
    }
}

export default InteractionStateManager;
