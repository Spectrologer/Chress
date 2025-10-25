/**
 * EventBus - A centralized publish-subscribe event system for decoupling managers
 *
 * Usage:
 *   eventBus.emit('enemy:defeated', { enemy, points })
 *   eventBus.on('enemy:defeated', handler)
 *   eventBus.off('enemy:defeated', handler)
 */
export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.debug = false;
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - The name of the event
   * @param {Function} callback - The callback function to execute
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    this.listeners.get(eventName).push(callback);

    if (this.debug) {
      console.log(`[EventBus] Subscribed to '${eventName}'`);
    }

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to an event that will only fire once
   * @param {string} eventName - The name of the event
   * @param {Function} callback - The callback function to execute
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback) {
    if (!this.onceListeners.has(eventName)) {
      this.onceListeners.set(eventName, []);
    }

    this.onceListeners.get(eventName).push(callback);

    if (this.debug) {
      console.log(`[EventBus] Subscribed once to '${eventName}'`);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.onceListeners.get(eventName);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - The name of the event
   * @param {Function} callback - The callback function to remove
   */
  off(eventName, callback) {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);

        if (this.debug) {
          console.log(`[EventBus] Unsubscribed from '${eventName}'`);
        }
      }
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName - The name of the event
   * @param {*} data - The data to pass to subscribers
   */
  emit(eventName, data) {
    if (this.debug) {
      console.log(`[EventBus] Emitting '${eventName}'`, data);
    }

    // Call regular listeners
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in listener for '${eventName}':`, error);
        }
      });
    }

    // Call once listeners and remove them
    const onceListeners = this.onceListeners.get(eventName);
    if (onceListeners && onceListeners.length > 0) {
      // Copy array to avoid modification during iteration
      const listenersToCall = [...onceListeners];
      this.onceListeners.set(eventName, []);

      listenersToCall.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in once listener for '${eventName}':`, error);
        }
      });
    }
  }

  /**
   * Clear all listeners for a specific event or all events
   * @param {string} [eventName] - Optional event name to clear. If not provided, clears all.
   */
  clear(eventName) {
    if (eventName) {
      this.listeners.delete(eventName);
      this.onceListeners.delete(eventName);

      if (this.debug) {
        console.log(`[EventBus] Cleared all listeners for '${eventName}'`);
      }
    } else {
      this.listeners.clear();
      this.onceListeners.clear();

      if (this.debug) {
        console.log(`[EventBus] Cleared all listeners`);
      }
    }
  }

  /**
   * Get the count of listeners for an event
   * @param {string} eventName - The name of the event
   * @returns {number} The number of listeners
   */
  listenerCount(eventName) {
    const regular = this.listeners.get(eventName)?.length || 0;
    const once = this.onceListeners.get(eventName)?.length || 0;
    return regular + once;
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}

// Create and export a singleton instance
export const eventBus = new EventBus();
