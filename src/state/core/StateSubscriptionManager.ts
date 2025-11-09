/**
 * StateSubscriptionManager - Manages listener subscriptions
 *
 * Handles subscription and notification of state change listeners.
 * Each listener subscribes to a top-level slice (persistent, session, transient, ui, meta).
 */

import { logger } from '@core/logger';

export type StateListener = (sliceState: any, path?: string | null) => void;

export class StateSubscriptionManager {
  private listeners: Map<string, Set<StateListener>> = new Map();

  constructor() {
    // listeners initialized above
  }

  /**
   * Subscribe to changes in a specific state slice
   * @param slice - Top-level slice name (e.g., 'persistent', 'ui')
   * @param callback - Called when slice changes
   * @returns Unsubscribe function
   */
  subscribe(slice: string, callback: StateListener): () => void {
    if (!this.listeners.has(slice)) {
      this.listeners.set(slice, new Set());
    }

    this.listeners.get(slice)!.add(callback);

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
   * @param slice - The slice name
   * @param sliceState - The current state of the slice
   * @param path - The changed path
   */
  notifyListeners(slice: string, sliceState: any, path: string | null = null): void {
    const listeners = this.listeners.get(slice);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(sliceState, path);
        } catch (error) {
          logger.error(`Error in state listener for ${slice}:`, error);
        }
      });
    }
  }

  /**
   * Notify listeners for multiple slices
   * @param slices - Set of slice names to notify
   * @param state - The full state object
   */
  notifyMultipleSlices(slices: Set<string>, state: any): void {
    slices.forEach(slice => {
      this.notifyListeners(slice, state[slice]);
    });
  }

  /**
   * Notify all listeners across all slices
   * @param state - The full state object
   */
  notifyAllListeners(state: any): void {
    for (const slice of Object.keys(state)) {
      this.notifyListeners(slice, state[slice]);
    }
  }

  /**
   * Get total number of listeners across all slices
   * @returns Total listener count
   */
  getListenerCount(): number {
    return Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0);
  }
}
