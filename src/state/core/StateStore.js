// @ts-check
/**
 * Centralized State Store for Chress
 *
 * Single source of truth for all application state.
 * Implements a lightweight state management pattern with:
 * - Clear separation between persistent, session, transient, and UI state
 * - Event-based subscriptions for reactive updates
 * - Immutable state updates
 * - Built-in debugging and time-travel capabilities
 *
 * Refactored into smaller modules for better maintainability:
 * - StateDefinitions: Type definitions and initial state
 * - StateSliceManager: Get/set operations
 * - StateSubscriptionManager: Listener subscriptions
 * - StateHistoryManager: History and debugging
 * - StateEventBridge: EventBus compatibility
 */

import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { createInitialState } from './StateDefinitions.js';
import { StateSliceManager, deepClone } from './StateSliceManager.js';
import { StateSubscriptionManager } from './StateSubscriptionManager.js';
import { StateHistoryManager } from './StateHistoryManager.js';
import { StateEventBridge } from './StateEventBridge.js';

/**
 * State Store class
 */
export class StateStore {
  constructor() {
    /** @type {any} */
    this.state = createInitialState();

    // Initialize sub-managers
    this.sliceManager = new StateSliceManager(this.state);
    this.subscriptionManager = new StateSubscriptionManager();
    this.historyManager = new StateHistoryManager(50, 100);
    this.eventBridge = new StateEventBridge();
  }

  /**
   * Creates the initial state structure
   * @returns {any}
   */
  createInitialState() {
    return createInitialState();
  }

  /**
   * Get state from a specific slice or path
   * @param {string} path - Dot notation path (e.g., 'persistent.player.position')
   * @returns {*} The state value at that path
   */
  get(path) {
    return this.sliceManager.get(path);
  }

  /**
   * Set state at a specific path
   * @param {string} path - Dot notation path
   * @param {*} value - New value
   * @param {string} mutation - Description of the mutation (for debugging)
   */
  set(path, value, mutation = 'setState') {
    // Record mutation for debugging
    this.historyManager.recordMutation(mutation, path, this.get(path), value);

    // Apply the state change
    const { newState, topLevelSlice } = this.sliceManager.set(path, value);

    // Update state references
    this.state = newState;
    this.sliceManager.updateStateReference(newState);

    // Record in history if enabled
    if (this.historyManager.isRecordingHistory) {
      this.historyManager.recordHistory(this.state);
    }

    // Notify listeners
    this.subscriptionManager.notifyListeners(topLevelSlice, this.state[topLevelSlice], path);

    // Emit EventBus event for backward compatibility
    this.eventBridge.emitStateChangeEvent(path, value);
  }

  /**
   * Update multiple paths atomically
   * @param {Object} updates - Object with path -> value mappings
   * @param {string} mutation - Description of the mutation
   */
  batchSet(updates, mutation = 'batchSetState') {
    // Record mutations
    for (const [path, value] of Object.entries(updates)) {
      this.historyManager.recordMutation(mutation, path, this.get(path), value);
    }

    // Apply batch changes
    const { newState, affectedSlices } = this.sliceManager.batchSet(updates);

    // Update state references
    this.state = newState;
    this.sliceManager.updateStateReference(newState);

    // Record in history
    if (this.historyManager.isRecordingHistory) {
      this.historyManager.recordHistory(this.state);
    }

    // Notify all affected slices
    this.subscriptionManager.notifyMultipleSlices(affectedSlices, this.state);

    // Emit events
    this.eventBridge.emitBatchEvents(updates);
  }

  /**
   * Subscribe to changes in a specific state slice
   * @param {string} slice - Top-level slice name (e.g., 'persistent', 'ui')
   * @param {Function} callback - Called when slice changes
   * @returns {() => void} Unsubscribe function
   */
  subscribe(slice, callback) {
    return this.subscriptionManager.subscribe(slice, callback);
  }

  /**
   * Notify all listeners for a specific slice
   * @param {string} slice - The slice name
   * @param {string|null} [path=null] - The changed path
   * @returns {void}
   */
  notifyListeners(slice, path = null) {
    this.subscriptionManager.notifyListeners(slice, this.state[slice], path);
  }

  /**
   * Reset a specific slice to initial state
   * @param {string} slice - The slice to reset
   * @returns {void}
   */
  resetSlice(slice) {
    const initialState = createInitialState();
    this.set(slice, initialState[slice], `reset_${slice}`);
  }

  /**
   * Reset all transient state (e.g., on zone transition)
   */
  resetTransient() {
    this.resetSlice('transient');
    this.eventBridge.emitResetEvent('transient');
  }

  /**
   * Reset all session state (e.g., on game over)
   */
  resetSession() {
    this.resetSlice('session');
    this.resetSlice('transient');
    this.eventBridge.emitResetEvent('session');
  }

  /**
   * Reset entire state (new game)
   */
  reset() {
    this.state = createInitialState();
    this.sliceManager.updateStateReference(this.state);
    this.historyManager.clear();
    this.notifyAllListeners();
    this.eventBridge.emitResetEvent('all');
  }

  /**
   * Notify all listeners across all slices
   */
  notifyAllListeners() {
    this.subscriptionManager.notifyAllListeners(this.state);
  }

  /**
   * Get a snapshot of the current state
   * @returns {{state: any, timestamp: number}}
   */
  getSnapshot() {
    return this.sliceManager.getSnapshot();
  }

  /**
   * Restore state from a snapshot
   * @param {{state: any, timestamp: number}} snapshot - The snapshot to restore
   * @returns {void}
   */
  restoreSnapshot(snapshot) {
    this.state = deepClone(snapshot.state);
    this.sliceManager.updateStateReference(this.state);
    this.notifyAllListeners();
  }

  /**
   * Enable/disable history recording
   * @param {boolean} enabled - Whether to enable history recording
   * @returns {void}
   */
  setHistoryRecording(enabled) {
    this.historyManager.setHistoryRecording(enabled, this.state);
  }

  /**
   * Get mutation history
   * @param {number} [count=10] - Number of recent mutations to return
   * @returns {any[]}
   */
  getMutations(count = 10) {
    return this.historyManager.getMutations(count);
  }

  /**
   * Get state history
   * @param {number} [count=10] - Number of recent history entries to return
   * @returns {any[]}
   */
  getHistory(count = 10) {
    return this.historyManager.getHistory(count);
  }

  /**
   * Deep clone utility
   * @param {any} obj - The object to clone
   * @returns {any} The cloned object
   */
  deepClone(obj) {
    return deepClone(obj);
  }

  /**
   * Debug: Print current state structure
   */
  debugPrint() {
    console.group('🏪 State Store Debug');
    console.log('Persistent State:', this.state.persistent);
    console.log('Session State:', this.state.session);
    console.log('Transient State:', this.state.transient);
    console.log('UI State:', this.state.ui);
    console.log('Meta:', this.state.meta);
    console.log('Recent Mutations:', this.getMutations(5));
    console.groupEnd();
  }

  /**
   * Get state statistics
   * @returns {Object} Statistics about the state store
   */
  getStats() {
    const countNodes = (obj, depth = 0) => {
      if (depth > 10) return { count: 0, memory: 0 };
      if (obj === null || typeof obj !== 'object') return { count: 1, memory: 0 };

      let count = 1;
      let memory = 0;

      if (obj instanceof Set || obj instanceof Map) {
        memory += obj.size * 8;
        count += obj.size;
      } else if (Array.isArray(obj)) {
        count += obj.length;
        obj.forEach(item => {
          const stats = countNodes(item, depth + 1);
          count += stats.count;
          memory += stats.memory;
        });
      } else {
        const keys = Object.keys(obj);
        count += keys.length;
        keys.forEach(key => {
          const stats = countNodes(obj[key], depth + 1);
          count += stats.count;
          memory += stats.memory;
        });
      }

      return { count, memory };
    };

    return {
      persistent: countNodes(this.state.persistent),
      session: countNodes(this.state.session),
      transient: countNodes(this.state.transient),
      ui: countNodes(this.state.ui),
      historySize: this.historyManager.history.length,
      mutationsRecorded: this.historyManager.mutations.length,
      listenerCount: this.subscriptionManager.getListenerCount()
    };
  }
}

// Create singleton instance
export const store = new StateStore();

// Debug access in development
if (typeof window !== 'undefined') {
  /** @type {any} */ (window).chressStore = store;
}
