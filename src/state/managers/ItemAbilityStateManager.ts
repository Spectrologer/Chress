import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { logger } from '@core/logger';
import type { Position } from '@core/Position';

/**
 * ItemAbilityStateManager - Manages item ability state (Horse charge, Bomb placement)
 *
 * Responsibilities:
 * - Horse charge targeting state
 * - Bomb placement mode and positions
 * - Events and validation for item abilities
 */

interface ChargeData {
    [key: string]: any;
}

interface CubeActivationData {
    gridCoords: { x: number; y: number };
    cubeItem: any;
}

interface ItemAbilitySnapshot {
    pendingCharge: ChargeData | null;
    pendingCubeActivation: CubeActivationData | null;
    bombPlacementMode: boolean;
    bombPlacementPositions: Position[];
}

export class ItemAbilityStateManager {
    private _pendingCharge: ChargeData | null;
    private _pendingCubeActivation: CubeActivationData | null;
    private _bombPlacementMode: boolean;
    private _bombPlacementPositions: Position[];

    constructor() {
        this._pendingCharge = null;
        this._pendingCubeActivation = null;
        this._bombPlacementMode = false;
        this._bombPlacementPositions = [];
    }

    // ========================================
    // HORSE CHARGE STATE
    // ========================================

    /**
     * Get pending charge data
     */
    getPendingCharge(): ChargeData | null {
        return this._pendingCharge;
    }

    /**
     * Check if horse charge is pending
     */
    hasPendingCharge(): boolean {
        return this._pendingCharge !== null;
    }

    /**
     * Set pending charge (horse icon targeting)
     */
    setPendingCharge(chargeData: ChargeData): void {
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
    clearPendingCharge(): void {
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
    // CUBE ACTIVATION STATE
    // ========================================

    /**
     * Get pending cube activation data
     */
    getPendingCubeActivation(): CubeActivationData | null {
        return this._pendingCubeActivation;
    }

    /**
     * Check if cube activation is pending
     */
    hasPendingCubeActivation(): boolean {
        return this._pendingCubeActivation !== null;
    }

    /**
     * Set pending cube activation
     */
    setPendingCubeActivation(data: CubeActivationData): void {
        this._pendingCubeActivation = data;
        logger.debug('ItemAbilityStateManager: Pending cube activation set', data);
    }

    /**
     * Clear pending cube activation
     */
    clearPendingCubeActivation(): void {
        if (this._pendingCubeActivation) {
            this._pendingCubeActivation = null;
            logger.debug('ItemAbilityStateManager: Pending cube activation cleared');
        }
    }

    // ========================================
    // BOMB PLACEMENT STATE
    // ========================================

    /**
     * Check if bomb placement mode is active
     */
    isBombPlacementMode(): boolean {
        return this._bombPlacementMode;
    }

    /**
     * Get bomb placement positions
     */
    getBombPlacementPositions(): Position[] {
        return [...this._bombPlacementPositions];
    }

    /**
     * Enter bomb placement mode
     */
    enterBombPlacementMode(): void {
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
    exitBombPlacementMode(): void {
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
     */
    addBombPlacementPosition(position: Position): void {
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
     */
    removeBombPlacementPosition(position: Position): boolean {
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
    clearBombPlacementPositions(): void {
        this._bombPlacementPositions = [];
    }

    /**
     * Check if position has bomb placement marker
     */
    hasBombPlacementAt(position: Position): boolean {
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
    clear(): void {
        this.exitBombPlacementMode();
        this.clearPendingCharge();
        this.clearPendingCubeActivation();
    }

    /**
     * Reset all state
     */
    reset(): void {
        this._pendingCharge = null;
        this._pendingCubeActivation = null;
        this._bombPlacementMode = false;
        this._bombPlacementPositions = [];
    }

    /**
     * Get snapshot for debugging
     */
    getSnapshot(): ItemAbilitySnapshot {
        return {
            pendingCharge: this._pendingCharge,
            pendingCubeActivation: this._pendingCubeActivation,
            bombPlacementMode: this._bombPlacementMode,
            bombPlacementPositions: [...this._bombPlacementPositions]
        };
    }
}

export default ItemAbilityStateManager;
