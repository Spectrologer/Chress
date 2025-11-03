import { eventBus } from '../../core/EventBus';
import { EventTypes } from '../../core/EventTypes';
import { logger } from '../../core/logger';

/**
 * ZoneStateManager - Manages zone-specific state (Transitions, Pitfalls)
 *
 * Responsibilities:
 * - Port/zone transition metadata
 * - Pitfall zone state and turn tracking
 * - Zone-specific events and validation
 */

interface PortTransitionData {
    from: string;
    x?: number;
    y?: number;
}

interface ZoneSnapshot {
    portTransitionData: PortTransitionData | null;
    isInPitfallZone: boolean;
    pitfallTurnsSurvived: number;
}

export class ZoneStateManager {
    private _portTransitionData: PortTransitionData | null;
    private _isInPitfallZone: boolean;
    private _pitfallTurnsSurvived: number;

    constructor() {
        this._portTransitionData = null;
        this._isInPitfallZone = false;
        this._pitfallTurnsSurvived = 0;
    }

    // ========================================
    // PORT TRANSITION DATA
    // ========================================

    /**
     * Get port transition metadata
     */
    getPortTransitionData(): PortTransitionData | null {
        return this._portTransitionData;
    }

    /**
     * Check if port transition data exists
     */
    hasPortTransitionData(): boolean {
        return this._portTransitionData !== null;
    }

    /**
     * Set port transition metadata
     */
    setPortTransitionData(data: PortTransitionData): void {
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
    clearPortTransitionData(): void {
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
     */
    isInPitfallZone(): boolean {
        return this._isInPitfallZone;
    }

    /**
     * Get pitfall turns survived
     */
    getPitfallTurnsSurvived(): number {
        return this._pitfallTurnsSurvived;
    }

    /**
     * Enter pitfall zone
     */
    enterPitfallZone(): void {
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
    exitPitfallZone(): void {
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
     */
    incrementPitfallTurnsSurvived(): number {
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
    clearTransitionData(): void {
        this.clearPortTransitionData();
    }

    /**
     * Reset all state
     */
    reset(): void {
        this._portTransitionData = null;
        this._isInPitfallZone = false;
        this._pitfallTurnsSurvived = 0;
    }

    /**
     * Get snapshot for debugging
     */
    getSnapshot(): ZoneSnapshot {
        return {
            portTransitionData: this._portTransitionData,
            isInPitfallZone: this._isInPitfallZone,
            pitfallTurnsSurvived: this._pitfallTurnsSurvived
        };
    }
}

export default ZoneStateManager;
