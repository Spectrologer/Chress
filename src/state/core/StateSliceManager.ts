// @ts-check
/**
 * StateSliceManager - Handles state get/set operations
 *
 * Provides methods for reading and writing state at specific paths,
 * including batch operations and deep cloning utilities.
 */

/**
 * Deep clone utility for state immutability
 * @param {any} obj - The object to clone
 * @returns {any} The cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Set) return new Set(Array.from(obj));
  if (obj instanceof Map) return new Map(Array.from(obj));
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));

  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export class StateSliceManager {
  /**
   * @param {any} state - Reference to the state object
   */
  constructor(state) {
    this.state = state;
  }

  /**
   * Get state from a specific slice or path
   * @param {string} path - Dot notation path (e.g., 'persistent.player.position')
   * @returns {*} The state value at that path
   */
  get(path) {
    if (!path) return this.state;

    const parts = path.split('.');
    let value = this.state;

    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }

    return value;
  }

  /**
   * Set state at a specific path (returns new state object for immutability)
   * @param {string} path - Dot notation path
   * @param {*} value - New value
   * @returns {{newState: any, topLevelSlice: string}} New state and affected slice
   */
  set(path, value) {
    const parts = path.split('.');
    const topLevelSlice = parts[0];

    // Create new state object (immutability)
    const newState = deepClone(this.state);

    // Navigate to the target and set value
    let target = newState;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;

    return { newState, topLevelSlice };
  }

  /**
   * Update multiple paths atomically
   * @param {Object} updates - Object with path -> value mappings
   * @returns {{newState: any, affectedSlices: Set<string>}} New state and affected slices
   */
  batchSet(updates) {
    const newState = deepClone(this.state);
    const affectedSlices = new Set();

    for (const [path, value] of Object.entries(updates)) {
      const parts = path.split('.');
      affectedSlices.add(parts[0]);

      // Navigate and set
      let target = newState;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
    }

    return { newState, affectedSlices };
  }

  /**
   * Get a snapshot of the current state
   * @returns {{state: any, timestamp: number}}
   */
  getSnapshot() {
    return {
      state: deepClone(this.state),
      timestamp: Date.now()
    };
  }

  /**
   * Update internal state reference
   * @param {any} newState - The new state object
   */
  updateStateReference(newState) {
    this.state = newState;
  }
}
