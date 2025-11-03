import { TransientStateCoordinator } from './managers/TransientStateCoordinator.js';

/**
 * TransientGameState - Centralized container for temporary game state
 *
 * REFACTORED: Now delegates to specialized state managers via TransientStateCoordinator
 *
 * Original file (564 lines) decomposed into:
 * - ItemAbilityStateManager: Horse charge, bomb placement
 * - InteractionStateManager: Sign messages, NPC interactions
 * - ZoneStateManager: Port transitions, pitfall zones
 * - CombatStateManager: Combat flags
 * - TransientStateCoordinator: Facade maintaining backward compatibility
 *
 * Benefits of decomposition:
 * - Single Responsibility: Each manager has one clear focus
 * - Smaller Files: ~200 lines each vs 564 lines
 * - Better Testing: Can test managers independently
 * - Clearer Dependencies: Easy to see what depends on what
 * - Easier Maintenance: Changes isolated to specific managers
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
export class TransientGameState extends TransientStateCoordinator {
    constructor() {
        super();
    }
}

export default TransientGameState;
