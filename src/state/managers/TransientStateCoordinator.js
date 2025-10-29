import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { logger } from '../../core/logger.js';
import { ItemAbilityStateManager } from './ItemAbilityStateManager.js';
import { InteractionStateManager } from './InteractionStateManager.js';
import { ZoneStateManager } from './ZoneStateManager.js';
import { CombatStateManager } from './CombatStateManager.js';

/**
 * TransientStateCoordinator - Facade that delegates to specialized state managers
 *
 * Maintains backward compatibility with TransientGameState by delegating
 * to specialized managers while preserving the same public API.
 *
 * Architecture:
 * - ItemAbilityStateManager: Horse charge, bomb placement
 * - InteractionStateManager: Sign messages, NPC interactions
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
export class TransientStateCoordinator {
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

    getPendingCharge() {
        return this._itemAbility.getPendingCharge();
    }

    hasPendingCharge() {
        return this._itemAbility.hasPendingCharge();
    }

    setPendingCharge(chargeData) {
        this._itemAbility.setPendingCharge(chargeData);
    }

    clearPendingCharge() {
        this._itemAbility.clearPendingCharge();
    }

    // ========================================
    // BOMB PLACEMENT STATE (ItemAbilityStateManager)
    // ========================================

    isBombPlacementMode() {
        return this._itemAbility.isBombPlacementMode();
    }

    getBombPlacementPositions() {
        return this._itemAbility.getBombPlacementPositions();
    }

    enterBombPlacementMode() {
        this._itemAbility.enterBombPlacementMode();
    }

    exitBombPlacementMode() {
        this._itemAbility.exitBombPlacementMode();
    }

    addBombPlacementPosition(position) {
        this._itemAbility.addBombPlacementPosition(position);
    }

    removeBombPlacementPosition(position) {
        return this._itemAbility.removeBombPlacementPosition(position);
    }

    clearBombPlacementPositions() {
        this._itemAbility.clearBombPlacementPositions();
    }

    hasBombPlacementAt(position) {
        return this._itemAbility.hasBombPlacementAt(position);
    }

    // ========================================
    // SIGN MESSAGE STATE (InteractionStateManager)
    // ========================================

    getDisplayingSignMessage() {
        return this._interaction.getDisplayingSignMessage();
    }

    isDisplayingSignMessage() {
        return this._interaction.isDisplayingSignMessage();
    }

    setDisplayingSignMessage(signData) {
        this._interaction.setDisplayingSignMessage(signData);
    }

    clearDisplayingSignMessage() {
        this._interaction.clearDisplayingSignMessage();
    }

    getLastSignMessage() {
        return this._interaction.getLastSignMessage();
    }

    setLastSignMessage(message) {
        this._interaction.setLastSignMessage(message);
    }

    clearLastSignMessage() {
        this._interaction.clearLastSignMessage();
    }

    // ========================================
    // NPC INTERACTION TRACKING (InteractionStateManager)
    // ========================================

    getCurrentNPCPosition() {
        return this._interaction.getCurrentNPCPosition();
    }

    setCurrentNPCPosition(position) {
        this._interaction.setCurrentNPCPosition(position);
    }

    clearCurrentNPCPosition() {
        this._interaction.clearCurrentNPCPosition();
    }

    isPlayerAdjacentToNPC(playerPos) {
        return this._interaction.isPlayerAdjacentToNPC(playerPos);
    }

    // ========================================
    // PORT TRANSITION DATA (ZoneStateManager)
    // ========================================

    getPortTransitionData() {
        return this._zone.getPortTransitionData();
    }

    hasPortTransitionData() {
        return this._zone.hasPortTransitionData();
    }

    setPortTransitionData(data) {
        this._zone.setPortTransitionData(data);
    }

    clearPortTransitionData() {
        this._zone.clearPortTransitionData();
    }

    // ========================================
    // PITFALL ZONE STATE (ZoneStateManager)
    // ========================================

    isInPitfallZone() {
        return this._zone.isInPitfallZone();
    }

    getPitfallTurnsSurvived() {
        return this._zone.getPitfallTurnsSurvived();
    }

    enterPitfallZone() {
        this._zone.enterPitfallZone();
    }

    exitPitfallZone() {
        this._zone.exitPitfallZone();
    }

    incrementPitfallTurnsSurvived() {
        return this._zone.incrementPitfallTurnsSurvived();
    }

    // ========================================
    // COMBAT STATE FLAGS (CombatStateManager)
    // ========================================

    didPlayerJustAttack() {
        return this._combat.didPlayerJustAttack();
    }

    setPlayerJustAttacked(value) {
        this._combat.setPlayerJustAttacked(value);
    }

    clearPlayerJustAttacked() {
        this._combat.clearPlayerJustAttacked();
    }

    // ========================================
    // ZONE TRANSITION HELPERS
    // ========================================

    /**
     * Clear all zone-specific transient state
     * Called when transitioning between zones
     */
    clearZoneTransientState() {
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
    resetAll() {
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
     * @returns {Object}
     */
    getSnapshot() {
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
    debugLog() {
        logger.debug('TransientStateCoordinator snapshot:', this.getSnapshot());
    }

    // ========================================
    // DIRECT MANAGER ACCESS (for advanced usage)
    // ========================================

    /**
     * Get direct access to specialized managers
     * Useful for testing or advanced state management
     */
    get managers() {
        return {
            itemAbility: this._itemAbility,
            interaction: this._interaction,
            zone: this._zone,
            combat: this._combat
        };
    }
}

export default TransientStateCoordinator;
