import { eventBus } from '../../core/EventBus';
import { EventTypes } from '../../core/EventTypes';
import { logger } from '../../core/logger';

/**
 * CombatStateManager - Manages combat-related temporary state
 *
 * Responsibilities:
 * - Player attack state tracking
 * - Combat action flags
 * - Turn-based combat events
 */

interface CombatSnapshot {
    playerJustAttacked: boolean;
}

export class CombatStateManager {
    private _playerJustAttacked: boolean;

    constructor() {
        this._playerJustAttacked = false;
    }

    // ========================================
    // COMBAT STATE FLAGS
    // ========================================

    /**
     * Check if player just attacked this turn
     */
    didPlayerJustAttack(): boolean {
        return this._playerJustAttacked;
    }

    /**
     * Set player just attacked flag
     */
    setPlayerJustAttacked(value: boolean): void {
        this._playerJustAttacked = value;

        if (value) {
            eventBus.emit(EventTypes.PLAYER_ATTACKED, {});
        }
    }

    /**
     * Clear player just attacked flag
     */
    clearPlayerJustAttacked(): void {
        this._playerJustAttacked = false;
    }

    // ========================================
    // UTILITIES
    // ========================================

    /**
     * Clear all combat state
     */
    clear(): void {
        this.clearPlayerJustAttacked();
    }

    /**
     * Reset all state
     */
    reset(): void {
        this._playerJustAttacked = false;
    }

    /**
     * Get snapshot for debugging
     */
    getSnapshot(): CombatSnapshot {
        return {
            playerJustAttacked: this._playerJustAttacked
        };
    }
}

export default CombatStateManager;
