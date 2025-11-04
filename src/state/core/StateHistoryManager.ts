/**
 * StateHistoryManager - Manages state history and debugging
 *
 * Provides time-travel debugging capabilities by recording state snapshots
 * and mutations over time.
 */

export interface StateSnapshot {
  state: any;
  timestamp: number;
}

export interface StateMutation {
  type: string;
  path: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

import { deepClone } from './StateSliceManager';

export class StateHistoryManager {
  private history: StateSnapshot[] = [];
  private mutations: StateMutation[] = [];
  private maxHistorySize: number;
  private maxMutations: number;
  private isRecordingHistory: boolean = false;

  /**
   * @param maxHistorySize - Maximum snapshots to keep
   * @param maxMutations - Maximum mutations to keep
   */
  constructor(maxHistorySize: number = 50, maxMutations: number = 100) {
    this.maxHistorySize = maxHistorySize;
    this.maxMutations = maxMutations;
  }

  /**
   * Enable/disable history recording
   * @param enabled - Whether to enable history recording
   * @param currentState - Current state to record if enabling
   */
  setHistoryRecording(enabled: boolean, currentState: any = null): void {
    this.isRecordingHistory = enabled;
    if (enabled && this.history.length === 0 && currentState) {
      this.recordHistory(currentState);
    }
  }

  /**
   * Record current state in history
   * @param state - The state to record
   */
  recordHistory(state: any): void {
    this.history.push({
      state: deepClone(state),
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Record a mutation for debugging
   * @param type - The mutation type
   * @param path - The state path
   * @param oldValue - The old value
   * @param newValue - The new value
   */
  recordMutation(type: string, path: string, oldValue: any, newValue: any): void {
    this.mutations.push({
      type,
      path,
      oldValue: deepClone(oldValue),
      newValue: deepClone(newValue),
      timestamp: Date.now()
    });

    if (this.mutations.length > this.maxMutations) {
      this.mutations.shift();
    }
  }

  /**
   * Get mutation history
   * @param count - Number of recent mutations to return
   */
  getMutations(count: number = 10): StateMutation[] {
    return this.mutations.slice(-count);
  }

  /**
   * Get state history
   * @param count - Number of recent history entries to return
   */
  getHistory(count: number = 10): StateSnapshot[] {
    return this.history.slice(-count);
  }

  /**
   * Clear all history and mutations
   */
  clear(): void {
    this.history = [];
    this.mutations = [];
  }

  /**
   * Get statistics about recorded data
   */
  getStats(): { historySize: number; mutationsRecorded: number; isRecording: boolean } {
    return {
      historySize: this.history.length,
      mutationsRecorded: this.mutations.length,
      isRecording: this.isRecordingHistory
    };
  }

  /**
   * Get the history array length
   */
  getHistoryLength(): number {
    return this.history.length;
  }

  /**
   * Get the mutations array length
   */
  getMutationsLength(): number {
    return this.mutations.length;
  }

  /**
   * Get the max history size
   */
  getMaxHistorySize(): number {
    return this.maxHistorySize;
  }

  /**
   * Get the max mutations size
   */
  getMaxMutations(): number {
    return this.maxMutations;
  }

  /**
   * Clear history only
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Clear mutations only
   */
  clearMutations(): void {
    this.mutations = [];
  }

  /**
   * Check if history recording is enabled
   */
  isRecording(): boolean {
    return this.isRecordingHistory;
  }
}
