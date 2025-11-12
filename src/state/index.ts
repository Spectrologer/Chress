/**
 * State Management System
 *
 * Centralized exports for the entire state management system.
 * Import everything you need from this single entry point.
 */

// Core state store
export { StateStore, store } from './core/StateStore';

// Persistence layer
export { StatePersistence, persistence } from './core/StatePersistence';

// Selectors for reading state
export { StateSelectors } from './core/StateSelectors';

// Actions for writing state
export { StateActions } from './core/StateActions';

// Debugging tools
export { StateDebugger, stateDebugger } from './core/StateDebugger';

/**
 * Quick-start usage:
 *
 * ```typescript
 * import { store, StateActions, StateSelectors, persistence } from './state/index';
 *
 * // Read state
 * const player = StateSelectors.getPlayer();
 * const health = StateSelectors.getPlayerStats().health;
 *
 * // Write state
 * StateActions.movePlayer(5, 10);
 * StateActions.updatePlayerStats({ health: 90 });
 *
 * // Save/Load
 * await persistence.save();
 * await persistence.load();
 *
 * // Debug (Ctrl+Shift+D or programmatically)
 * window.chesseDebugger.toggle();
 * store.debugPrint();
 * ```
 */
