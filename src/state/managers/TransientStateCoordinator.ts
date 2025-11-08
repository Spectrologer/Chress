import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { logger } from '@core/logger';
import { ItemAbilityStateManager } from './ItemAbilityStateManager';
import { InteractionStateManager } from './InteractionStateManager';
import { ZoneStateManager } from './ZoneStateManager';
import { CombatStateManager } from './CombatStateManager';
import type { Position } from '@core/Position';

/**
 * TransientStateCoordinator - Facade that delegates to specialized state managers
 *
 * Maintains backward compatibility with TransientGameState by delegating
 * to specialized managers while preserving the same public API.
 *
 * Architecture:
 * - ItemAbilityStateManager: Horse charge, bomb placement
 * - InteractionStateManager:textbox messages, NPC interactions
 * - ZoneStateManager: Port transitions, pitfall zones
 * - CombatStateManager: Combat flags
 *
 * Benefits of decomposition:
 * - Single Responsibility: Each manager has one clear focus
 * - Smaller Files: ~200 lines vs 564 lines
 * - Better Testing: Can test managers independently
 * - Clearer Dependencies: Easy to see what depends on what
 * - Easier Maintenance: Changes isolated to specific managers
 */

interface ChargeData {
    [key: string]: any;
}

interface TextBoxData {
    message?: string;
}

interface PortTransitionData {
    from: string;
    x?: number;
    y?: number;
}

interface Managers {
    itemAbility: ItemAbilityStateManager;
    interaction: InteractionStateManager;
    zone: ZoneStateManager;
    combat: CombatStateManager;
}

interface TransientSnapshot {
    [key: string]: any;
}

export class TransientStateCoordinator {
    protected _itemAbility: ItemAbilityStateManager;
    protected _interaction: InteractionStateManager;
    protected _zone: ZoneStateManager;
    protected _combat: CombatStateManager;

    constructor() {
        // Initialize specialized managers
        this._itemAbility = new ItemAbilityStateManager();
        this._interaction = new InteractionStateManager();
        this._zone = new ZoneStateManager();
        this._combat = new CombatStateManager();
    }

    // ========================================
    // HORSE CHARGE STATE (ItemAbilityStateManager)
    // ========================================

    getPendingCharge(): ChargeData | null {
        return this._itemAbility.getPendingCharge();
    }

    hasPendingCharge(): boolean {
        return this._itemAbility.hasPendingCharge();
    }

    setPendingCharge(chargeData: ChargeData): void {
        this._itemAbility.setPendingCharge(chargeData);
    }

    clearPendingCharge(): void {
        this._itemAbility.clearPendingCharge();
    }

    // ========================================
    // CUBE ACTIVATION STATE (ItemAbilityStateManager)
    // ========================================

    getPendingCubeActivation(): any {
        return this._itemAbility.getPendingCubeActivation();
    }

    hasPendingCubeActivation(): boolean {
        return this._itemAbility.hasPendingCubeActivation();
    }

    setPendingCubeActivation(data: any): void {
        this._itemAbility.setPendingCubeActivation(data);
    }

    clearPendingCubeActivation(): void {
        this._itemAbility.clearPendingCubeActivation();
    }

    // ========================================
    // BOMB PLACEMENT STATE (ItemAbilityStateManager)
    // ========================================

    isBombPlacementMode(): boolean {
        return this._itemAbility.isBombPlacementMode();
    }

    getBombPlacementPositions(): Position[] {
        return this._itemAbility.getBombPlacementPositions();
    }

    enterBombPlacementMode(): void {
        this._itemAbility.enterBombPlacementMode();
    }

    exitBombPlacementMode(): void {
        this._itemAbility.exitBombPlacementMode();
    }

    addBombPlacementPosition(position: Position): void {
        this._itemAbility.addBombPlacementPosition(position);
    }

    removeBombPlacementPosition(position: Position): boolean {
        return this._itemAbility.removeBombPlacementPosition(position);
    }

    clearBombPlacementPositions(): void {
        this._itemAbility.clearBombPlacementPositions();
    }

    hasBombPlacementAt(position: Position): boolean {
        return this._itemAbility.hasBombPlacementAt(position);
    }

    // ========================================
    //textbox MESSAGE STATE (InteractionStateManager)
    // ========================================

    getDisplayingSignMessage(): TextBoxData | null {
        return this._interaction.getDisplayingSignMessage();
    }

    isDisplayingSignMessage(): boolean {
        return this._interaction.isDisplayingSignMessage();
    }

    setDisplayingSignMessage(signData: TextBoxData): void {
        this._interaction.setDisplayingSignMessage(signData);
    }

    clearDisplayingSignMessage(): void {
        this._interaction.clearDisplayingSignMessage();
    }

    getLastSignMessage(): string | null {
        return this._interaction.getLastSignMessage();
    }

    setLastSignMessage(message: string): void {
        this._interaction.setLastSignMessage(message);
    }

    clearLastSignMessage(): void {
        this._interaction.clearLastSignMessage();
    }

    // ========================================
    // NPC INTERACTION TRACKING (InteractionStateManager)
    // ========================================

    getCurrentNPCPosition(): Position | null {
        return this._interaction.getCurrentNPCPosition();
    }

    setCurrentNPCPosition(position: Position): void {
        this._interaction.setCurrentNPCPosition(position);
    }

    clearCurrentNPCPosition(): void {
        this._interaction.clearCurrentNPCPosition();
    }

    isPlayerAdjacentToNPC(playerPos: Position): boolean {
        return this._interaction.isPlayerAdjacentToNPC(playerPos);
    }

    // ========================================
    // PORT TRANSITION DATA (ZoneStateManager)
    // ========================================

    getPortTransitionData(): PortTransitionData | null {
        return this._zone.getPortTransitionData();
    }

    hasPortTransitionData(): boolean {
        return this._zone.hasPortTransitionData();
    }

    setPortTransitionData(data: PortTransitionData): void {
        this._zone.setPortTransitionData(data);
    }

    clearPortTransitionData(): void {
        this._zone.clearPortTransitionData();
    }

    // ========================================
    // PITFALL ZONE STATE (ZoneStateManager)
    // ========================================

    isInPitfallZone(): boolean {
        return this._zone.isInPitfallZone();
    }

    getPitfallTurnsSurvived(): number {
        return this._zone.getPitfallTurnsSurvived();
    }

    enterPitfallZone(): void {
        this._zone.enterPitfallZone();
    }

    exitPitfallZone(): void {
        this._zone.exitPitfallZone();
    }

    incrementPitfallTurnsSurvived(): number {
        return this._zone.incrementPitfallTurnsSurvived();
    }

    // ========================================
    // REGION TRACKING (ZoneStateManager)
    // ========================================

    getCurrentRegion(): string | null {
        return this._zone.getCurrentRegion();
    }

    setCurrentRegion(region: string): void {
        this._zone.setCurrentRegion(region);
    }

    clearCurrentRegion(): void {
        this._zone.clearCurrentRegion();
    }

    // ========================================
    // COMBAT STATE FLAGS (CombatStateManager)
    // ========================================

    didPlayerJustAttack(): boolean {
        return this._combat.didPlayerJustAttack();
    }

    setPlayerJustAttacked(value: boolean): void {
        this._combat.setPlayerJustAttacked(value);
    }

    clearPlayerJustAttacked(): void {
        this._combat.clearPlayerJustAttacked();
    }

    // ========================================
    // ZONE TRANSITION HELPERS
    // ========================================

    /**
     * Clear all zone-specific transient state
     * Called when transitioning between zones
     */
    clearZoneTransientState(): void {
        logger.debug('TransientStateCoordinator: Clearing zone-specific state');

        this._interaction.clear();
        this._itemAbility.clear();
        this._combat.clear();

        // Keep portTransitionData - it's needed for the transition itself
        // Keep pitfallZone state - it persists across turns
    }

    /**
     * Reset all transient state (game initialization)
     */
    resetAll(): void {
        logger.debug('TransientStateCoordinator: Resetting all state');

        this._itemAbility.reset();
        this._interaction.reset();
        this._zone.reset();
        this._combat.reset();

        eventBus.emit(EventTypes.TRANSIENT_STATE_RESET, {});
    }

    // ========================================
    // DEBUGGING & INSPECTION
    // ========================================

    /**
     * Get snapshot of all transient state for debugging
     */
    getSnapshot(): TransientSnapshot {
        return {
            ...this._itemAbility.getSnapshot(),
            ...this._interaction.getSnapshot(),
            ...this._zone.getSnapshot(),
            ...this._combat.getSnapshot()
        };
    }

    /**
     * Log current state for debugging
     */
    debugLog(): void {
        logger.debug('TransientStateCoordinator snapshot:', this.getSnapshot());
    }

    // ========================================
    // DIRECT MANAGER ACCESS (for advanced usage)
    // ========================================

    /**
     * Get direct access to specialized managers
     * Useful for testing or advanced state management
     */
    get managers(): Managers {
        return {
            itemAbility: this._itemAbility,
            interaction: this._interaction,
            zone: this._zone,
            combat: this._combat
        };
    }
}

export default TransientStateCoordinator;
