// @ts-check
/**
 * StateSubscriptionManager - Manages listener subscriptions
 *
 * Handles subscription and notification of state change listeners.
 * Each listener subscribes to a top-level slice (persistent, session, transient, ui, meta).
 */

/**
 * @typedef {Function} StateListener
 * @param {any} sliceState - The state slice that changed
 * @param {string|null} path - The path that changed (if available)
 * @returns {void}
 */

export class StateSubscriptionManager {
  constructor() {
    /** @type {Map<string, Set<StateListener>>} */
    this.listeners = new Map(); // slice -> Set of callbacks
  }

  /**
   * Subscribe to changes in a specific state slice
   * @param {string} slice - Top-level slice name (e.g., 'persistent', 'ui')
   * @param {StateListener} callback - Called when slice changes
   * @returns {() => void} Unsubscribe function
   */
  subscribe(slice, callback) {
    if (!this.listeners.has(slice)) {
      this.listeners.set(slice, new Set());
    }

    this.listeners.get(slice).add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(slice);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Notify all listeners for a specific slice
   * @param {string} slice - The slice name
   * @param {any} sliceState - The current state of the slice
   * @param {string|null} [path=null] - The changed path
   * @returns {void}
   */
  notifyListeners(slice, sliceState, path = null) {
    const listeners = this.listeners.get(slice);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(sliceState, path);
        } catch (error) {
          console.error(`Error in state listener for ${slice}:`, error);
        }
      });
    }
  }

  /**
   * Notify listeners for multiple slices
   * @param {Set<string>} slices - Set of slice names to notify
   * @param {any} state - The full state object
   * @returns {void}
   */
  notifyMultipleSlices(slices, state) {
    slices.forEach(slice => {
      this.notifyListeners(slice, state[slice]);
    });
  }

  /**
   * Notify all listeners across all slices
   * @param {any} state - The full state object
   * @returns {void}
   */
  notifyAllListeners(state) {
    for (const slice of Object.keys(state)) {
      this.notifyListeners(slice, state[slice]);
    }
  }

  /**
   * Get total number of listeners across all slices
   * @returns {number} Total listener count
   */
  getListenerCount() {
    return Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0);
  }
}
