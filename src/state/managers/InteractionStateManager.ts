import { eventBus } from '../../core/EventBus';
import { EventTypes } from '../../core/EventTypes';
import { logger } from '../../core/logger';
import type { Position } from '../../core/Position';

/**
 * InteractionStateManager - Manages world interaction state (Signs, NPCs)
 *
 * Responsibilities:
 * - Sign message display state
 * - NPC interaction position tracking
 * - Distance-based interaction validation
 */

interface SignData {
    message?: string;
}

interface InteractionSnapshot {
    displayingMessageForSign: SignData | null;
    lastSignMessage: string | null;
    currentNPCPosition: Position | null;
}

export class InteractionStateManager {
    private _displayingMessageForSign: SignData | null;
    private _lastSignMessage: string | null;
    private _currentNPCPosition: Position | null;

    constructor() {
        this._displayingMessageForSign = null;
        this._lastSignMessage = null;
        this._currentNPCPosition = null;
    }

    // ========================================
    // SIGN MESSAGE STATE
    // ========================================

    /**
     * Get currently displaying sign message
     */
    getDisplayingSignMessage(): SignData | null {
        return this._displayingMessageForSign;
    }

    /**
     * Check if a sign message is currently displaying
     */
    isDisplayingSignMessage(): boolean {
        return this._displayingMessageForSign !== null;
    }

    /**
     * Set displaying sign message
     */
    setDisplayingSignMessage(signData: SignData): void {
        this._displayingMessageForSign = signData;

        eventBus.emit(EventTypes.SIGN_MESSAGE_DISPLAYED, {
            message: signData?.message
        });
    }

    /**
     * Clear displaying sign message
     */
    clearDisplayingSignMessage(): void {
        if (this._displayingMessageForSign) {
            this._displayingMessageForSign = null;

            eventBus.emit(EventTypes.SIGN_MESSAGE_CLEARED, {});
        }
    }

    /**
     * Get last sign message (for deduplication)
     */
    getLastSignMessage(): string | null {
        return this._lastSignMessage;
    }

    /**
     * Set last sign message
     */
    setLastSignMessage(message: string): void {
        this._lastSignMessage = message;
    }

    /**
     * Clear last sign message
     */
    clearLastSignMessage(): void {
        this._lastSignMessage = null;
    }

    // ========================================
    // NPC INTERACTION TRACKING
    // ========================================

    /**
     * Get current NPC interaction position
     */
    getCurrentNPCPosition(): Position | null {
        return this._currentNPCPosition;
    }

    /**
     * Set current NPC interaction position
     */
    setCurrentNPCPosition(position: Position): void {
        if (position && typeof position.x === 'number' && typeof position.y === 'number') {
            this._currentNPCPosition = { x: position.x, y: position.y };
            logger.debug('InteractionStateManager: NPC position set', position);
        }
    }

    /**
     * Clear current NPC interaction position
     */
    clearCurrentNPCPosition(): void {
        if (this._currentNPCPosition) {
            logger.debug('InteractionStateManager: NPC position cleared');
            this._currentNPCPosition = null;
        }
    }

    /**
     * Check if player is still adjacent to current NPC
     */
    isPlayerAdjacentToNPC(playerPos: Position): boolean {
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
    clear(): void {
        this.clearDisplayingSignMessage();
        this.clearLastSignMessage();
        this.clearCurrentNPCPosition();
    }

    /**
     * Reset all state
     */
    reset(): void {
        this._displayingMessageForSign = null;
        this._lastSignMessage = null;
        this._currentNPCPosition = null;
    }

    /**
     * Get snapshot for debugging
     */
    getSnapshot(): InteractionSnapshot {
        return {
            displayingMessageForSign: this._displayingMessageForSign,
            lastSignMessage: this._lastSignMessage,
            currentNPCPosition: this._currentNPCPosition
        };
    }
}

export default InteractionStateManager;
