/**
 * State Management System
 *
 * Centralized exports for the entire state management system.
 * Import everything you need from this single entry point.
 */

// Core state store
export { StateStore, store } from './core/StateStore.js';

// Persistence layer
export { StatePersistence, persistence } from './core/StatePersistence.js';

// Selectors for reading state
export { StateSelectors } from './core/StateSelectors.js';

// Actions for writing state
export { StateActions } from './core/StateActions.js';

// Debugging tools
export { StateDebugger, stateDebugger } from './core/StateDebugger.js';

/**
 * Quick-start usage:
 *
 * ```javascript
 * import { store, StateActions, StateSelectors, persistence } from './state/index.js';
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
 * window.chressDebugger.toggle();
 * store.debugPrint();
 * ```
 */
