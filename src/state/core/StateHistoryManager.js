// @ts-check
/**
 * StateHistoryManager - Manages state history and debugging
 *
 * Provides time-travel debugging capabilities by recording state snapshots
 * and mutations over time.
 */

/**
 * @typedef {Object} StateSnapshot
 * @property {any} state
 * @property {number} timestamp
 */

/**
 * @typedef {Object} StateMutation
 * @property {string} type
 * @property {string} path
 * @property {any} oldValue
 * @property {any} newValue
 * @property {number} timestamp
 */

import { deepClone } from './StateSliceManager.js';

export class StateHistoryManager {
  /**
   * @param {number} maxHistorySize - Maximum snapshots to keep
   * @param {number} maxMutations - Maximum mutations to keep
   */
  constructor(maxHistorySize = 50, maxMutations = 100) {
    /** @type {StateSnapshot[]} */
    this.history = [];

    /** @type {StateMutation[]} */
    this.mutations = [];

    /** @type {number} */
    this.maxHistorySize = maxHistorySize;

    /** @type {number} */
    this.maxMutations = maxMutations;

    /** @type {boolean} */
    this.isRecordingHistory = false;
  }

  /**
   * Enable/disable history recording
   * @param {boolean} enabled - Whether to enable history recording
   * @param {any} currentState - Current state to record if enabling
   * @returns {void}
   */
  setHistoryRecording(enabled, currentState = null) {
    this.isRecordingHistory = enabled;
    if (enabled && this.history.length === 0 && currentState) {
      this.recordHistory(currentState);
    }
  }

  /**
   * Record current state in history
   * @param {any} state - The state to record
   * @returns {void}
   */
  recordHistory(state) {
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
   * @param {string} type - The mutation type
   * @param {string} path - The state path
   * @param {any} oldValue - The old value
   * @param {any} newValue - The new value
   * @returns {void}
   */
  recordMutation(type, path, oldValue, newValue) {
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
   * @param {number} [count=10] - Number of recent mutations to return
   * @returns {StateMutation[]}
   */
  getMutations(count = 10) {
    return this.mutations.slice(-count);
  }

  /**
   * Get state history
   * @param {number} [count=10] - Number of recent history entries to return
   * @returns {StateSnapshot[]}
   */
  getHistory(count = 10) {
    return this.history.slice(-count);
  }

  /**
   * Clear all history and mutations
   * @returns {void}
   */
  clear() {
    this.history = [];
    this.mutations = [];
  }

  /**
   * Get statistics about recorded data
   * @returns {{historySize: number, mutationsRecorded: number, isRecording: boolean}}
   */
  getStats() {
    return {
      historySize: this.history.length,
      mutationsRecorded: this.mutations.length,
      isRecording: this.isRecordingHistory
    };
  }
}
