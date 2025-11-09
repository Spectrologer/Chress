import type { EventType, EventDataMap } from './EventTypes';
import { logger } from './logger';

/**
 * EventBus - A centralized publish-subscribe event system for decoupling managers
 *
 * Usage:
 *   eventBus.emit(EventTypes.ENEMY_DEFEATED, { enemy, points })
 *   eventBus.on(EventTypes.ENEMY_DEFEATED, handler)
 *   eventBus.off(EventTypes.ENEMY_DEFEATED, handler)
 */

export type EventCallback<T = unknown> = (data: T) => void;
export type UnsubscribeFunction = () => void;

export class EventBus {
  private listeners: Map<string, EventCallback[]>;
  private onceListeners: Map<string, EventCallback[]>;
  private debug: boolean;

  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.debug = false;
  }

  /**
   * Subscribe to an event
   * @param eventName - The name of the event
   * @param callback - The callback function to execute
   * @returns Unsubscribe function
   */
  on<K extends EventType>(
    eventName: K,
    callback: K extends keyof EventDataMap ? EventCallback<EventDataMap[K]> : EventCallback
  ): UnsubscribeFunction;
  on(eventName: string, callback: EventCallback): UnsubscribeFunction;
  on(eventName: string, callback: EventCallback): UnsubscribeFunction {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    this.listeners.get(eventName)!.push(callback);

    if (this.debug) {
      logger.debug(`[EventBus] Subscribed to '${eventName}'`);
    }

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to an event that will only fire once
   * @param eventName - The name of the event
   * @param callback - The callback function to execute
   * @returns Unsubscribe function
   */
  once<K extends EventType>(
    eventName: K,
    callback: K extends keyof EventDataMap ? EventCallback<EventDataMap[K]> : EventCallback
  ): UnsubscribeFunction;
  once(eventName: string, callback: EventCallback): UnsubscribeFunction;
  once(eventName: string, callback: EventCallback): UnsubscribeFunction {
    if (!this.onceListeners.has(eventName)) {
      this.onceListeners.set(eventName, []);
    }

    this.onceListeners.get(eventName)!.push(callback);

    if (this.debug) {
      logger.debug(`[EventBus] Subscribed once to '${eventName}'`);
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
   * @param eventName - The name of the event
   * @param callback - The callback function to remove
   */
  off(eventName: string, callback: EventCallback): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);

        if (this.debug) {
          logger.debug(`[EventBus] Unsubscribed from '${eventName}'`);
        }
      }
    }
  }

  /**
   * Emit an event to all subscribers
   * @param eventName - The name of the event
   * @param data - The data to pass to subscribers
   */
  emit<K extends EventType>(
    eventName: K,
    data: K extends keyof EventDataMap ? EventDataMap[K] : unknown
  ): void;
  emit(eventName: string, data?: unknown): void;
  emit(eventName: string, data?: unknown): void {
    if (this.debug) {
      logger.debug(`[EventBus] Emitting '${eventName}'`, data);
    }

    // Call regular listeners
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`[EventBus] Error in listener for '${eventName}':`, error);
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
          logger.error(`[EventBus] Error in once listener for '${eventName}':`, error);
        }
      });
    }
  }

  /**
   * Clear all listeners for a specific event or all events
   * @param eventName - Optional event name to clear. If not provided, clears all.
   */
  clear(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
      this.onceListeners.delete(eventName);

      if (this.debug) {
        logger.debug(`[EventBus] Cleared all listeners for '${eventName}'`);
      }
    } else {
      this.listeners.clear();
      this.onceListeners.clear();

      if (this.debug) {
        logger.debug(`[EventBus] Cleared all listeners`);
      }
    }
  }

  /**
   * Get the count of listeners for an event
   * @param eventName - The name of the event
   * @returns The number of listeners
   */
  listenerCount(eventName: string): number {
    const regular = this.listeners.get(eventName)?.length || 0;
    const once = this.onceListeners.get(eventName)?.length || 0;
    return regular + once;
  }

  /**
   * Enable or disable debug logging
   * @param enabled - Whether to enable debug mode
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }
}

// Create and export a singleton instance
export const eventBus = new EventBus();

// Wrap with validation in development mode
// Note: Import is done dynamically to avoid circular dependencies
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  import('./EventValidator').then(({ wrapEventBusWithValidation }) => {
    wrapEventBusWithValidation(eventBus);
    logger.debug('[EventBus] Event validation enabled (development mode)');
  }).catch(err => {
    logger.warn('[EventBus] Could not load event validation:', err);
  });
}
