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
 */

import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 * @property {number} lastX
 * @property {number} lastY
 */

/**
 * @typedef {Object} ZoneKey
 * @property {number} x
 * @property {number} y
 * @property {string} dimension
 * @property {number} depth
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} health
 * @property {number} maxHealth
 * @property {number} hunger
 * @property {number} thirst
 * @property {number} points
 * @property {number} consecutiveKills
 * @property {number} spentDiscoveries
 */

/**
 * @typedef {Object} SpawnFlags
 * @property {boolean} axeSpawned
 * @property {boolean} hammerSpawned
 * @property {boolean} spearSpawned
 * @property {boolean} horseIconSpawned
 * @property {boolean} noteSpawned
 * @property {boolean} penneSpawned
 * @property {boolean} squigSpawned
 * @property {boolean} shackSpawned
 * @property {boolean} cisternSpawned
 * @property {boolean} wellSpawned
 * @property {boolean} deadTreeSpawned
 * @property {boolean} warningSignPlaced
 */

/**
 * @typedef {Object} SpawnZones
 * @property {string|null} axeSpawnZone
 * @property {string|null} hammerSpawnZone
 * @property {string|null} spearSpawnZone
 * @property {string|null} horseIconSpawnZone
 * @property {string|null} noteSpawnZone
 */

/**
 * @typedef {Object} GameState
 * @property {PersistentState} persistent
 * @property {SessionState} session
 * @property {TransientState} transient
 * @property {UIState} ui
 * @property {MetaState} meta
 */

/**
 * @typedef {Object} PersistentState
 * @property {Object} player
 * @property {Position} player.position
 * @property {ZoneKey} player.currentZone
 * @property {Set<string>} player.visitedZones
 * @property {any[]} player.inventory
 * @property {any[]} player.radialInventory
 * @property {Set<string>} player.abilities
 * @property {PlayerStats} player.stats
 * @property {number} player.undergroundDepth
 * @property {string|null} player.lastActionType
 * @property {string|null} player.lastActionResult
 * @property {any} player.interactOnReach
 * @property {Map<string, any>} zones
 * @property {Set<string>} defeatedEnemies
 * @property {Map<string, any>} specialZones
 * @property {string[]} messageLog
 * @property {Map<string, any>} dialogueState
 * @property {string} currentRegion
 */

/**
 * @typedef {Object} SessionState
 * @property {boolean} gameStarted
 * @property {Object} zoneGeneration
 * @property {number} zoneGeneration.zoneCounter
 * @property {number} zoneGeneration.enemyCounter
 * @property {SpawnFlags} zoneGeneration.spawnFlags
 * @property {SpawnZones} zoneGeneration.spawnZones
 * @property {any} currentGrid
 * @property {any[]} enemies
 * @property {Set<string>} signSpawnedMessages
 */

/**
 * @typedef {Object} TransientState
 * @property {Object} combat
 * @property {boolean} combat.playerJustAttacked
 * @property {Object} interactions
 * @property {string|null} interactions.signMessage
 * @property {string|null} interactions.lastSignMessage
 * @property {{x: number, y: number}|null} interactions.currentNpcPosition
 * @property {Object} itemAbilities
 * @property {boolean} itemAbilities.pendingCharge
 * @property {boolean} itemAbilities.bombPlacementMode
 * @property {Array<{x: number, y: number}>} itemAbilities.bombPositions
 * @property {Object} zoneTransition
 * @property {boolean} zoneTransition.justEnteredZone
 * @property {string|null} zoneTransition.lastExitSide
 * @property {any} zoneTransition.portTransitionData
 * @property {boolean} zoneTransition.pitfallZoneActive
 * @property {number} zoneTransition.pitfallTurnsRemaining
 * @property {Object} turn
 * @property {boolean} turn.isPlayerTurn
 * @property {boolean} turn.justLeftExitTile
 * @property {any[]} turn.turnQueue
 * @property {Set<string>} turn.occupiedTilesThisTurn
 * @property {Set<string>} turn.initialEnemyTilesThisTurn
 * @property {Object} entrance
 * @property {boolean} entrance.animationInProgress
 * @property {{x: number, y: number}|null} entrance.newGameSpawnPosition
 */

/**
 * @typedef {Object} UIState
 * @property {Object} panels
 * @property {boolean} panels.statsOpen
 * @property {boolean} panels.configOpen
 * @property {boolean} panels.previewMode
 * @property {Object} radialMenu
 * @property {boolean} radialMenu.open
 * @property {any} radialMenu.snapshot
 * @property {Object} input
 * @property {{x: number, y: number}|null} input.lastHighlightedTile
 * @property {boolean} input.shovelMode
 * @property {Object} confirmations
 * @property {any} confirmations.pendingAction
 * @property {Object} settings
 * @property {boolean} settings.musicEnabled
 * @property {boolean} settings.sfxEnabled
 * @property {boolean} settings.autoPathWithEnemies
 * @property {boolean} settings.verboseAnimations
 */

/**
 * @typedef {Object} MetaState
 * @property {number} version
 * @property {number|null} lastSaved
 * @property {number} saveCount
 */

/**
 * @typedef {Object} StateSnapshot
 * @property {GameState} state
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

/**
 * @callback StateListener
 * @param {any} sliceState - The state slice that changed
 * @param {string|null} path - The path that changed (if available)
 * @returns {void}
 */

/**
 * State Store class
 */
export class StateStore {
  constructor() {
    /** @type {GameState} */
    this.state = this.createInitialState();

    /** @type {Map<string, Set<StateListener>>} */
    this.listeners = new Map(); // slice -> Set of callbacks

    /** @type {StateSnapshot[]} */
    this.history = []; // State snapshots for debugging

    /** @type {number} */
    this.maxHistorySize = 50;

    /** @type {boolean} */
    this.isRecordingHistory = false;

    // Track state mutations for debugging
    /** @type {StateMutation[]} */
    this.mutations = [];

    /** @type {number} */
    this.maxMutations = 100;
  }

  /**
   * Creates the initial state structure
   * @returns {GameState}
   */
  createInitialState() {
    return {
      // PERSISTENT STATE - Saved to storage, survives app restarts
      persistent: {
        player: {
          position: { x: 0, y: 0, lastX: 0, lastY: 0 },
          currentZone: { x: 0, y: 0, dimension: 'overworld', depth: 0 },
          visitedZones: new Set(),
          inventory: [],
          radialInventory: [],
          abilities: new Set(),
          stats: {
            health: 100,
            maxHealth: 100,
            hunger: 100,
            thirst: 100,
            points: 0,
            consecutiveKills: 0,
            spentDiscoveries: 0
          },
          undergroundDepth: 0,
          lastActionType: null,
          lastActionResult: null,
          interactOnReach: null
        },
        zones: new Map(), // ZoneRepository data
        defeatedEnemies: new Set(),
        specialZones: new Map(),
        messageLog: [],
        dialogueState: new Map(), // NPC dialogue progression
        currentRegion: 'plains'
      },

      // SESSION STATE - Resets on game over, but persists during session
      session: {
        gameStarted: false,
        zoneGeneration: {
          zoneCounter: 0,
          enemyCounter: 0,
          spawnFlags: {
            axeSpawned: false,
            hammerSpawned: false,
            spearSpawned: false,
            horseIconSpawned: false,
            noteSpawned: false,
            penneSpawned: false,
            squigSpawned: false,
            shackSpawned: false,
            cisternSpawned: false,
            wellSpawned: false,
            deadTreeSpawned: false,
            warningSignPlaced: false
          },
          spawnZones: {
            axeSpawnZone: null,
            hammerSpawnZone: null,
            spearSpawnZone: null,
            horseIconSpawnZone: null,
            noteSpawnZone: null
          }
        },
        currentGrid: null, // Active zone grid
        enemies: [], // Active enemies in current zone
        signSpawnedMessages: new Set()
      },

      // TRANSIENT STATE - Resets on zone transitions or specific actions
      transient: {
        combat: {
          playerJustAttacked: false
        },
        interactions: {
          signMessage: null,
          lastSignMessage: null,
          currentNpcPosition: null
        },
        itemAbilities: {
          pendingCharge: false,
          bombPlacementMode: false,
          bombPositions: []
        },
        zoneTransition: {
          justEnteredZone: false,
          lastExitSide: null,
          portTransitionData: null,
          pitfallZoneActive: false,
          pitfallTurnsRemaining: 0
        },
        turn: {
          isPlayerTurn: true,
          justLeftExitTile: false,
          turnQueue: [],
          occupiedTilesThisTurn: new Set(),
          initialEnemyTilesThisTurn: new Set()
        },
        entrance: {
          animationInProgress: false,
          newGameSpawnPosition: null
        }
      },

      // UI STATE - Never persisted, only affects visual/interaction state
      ui: {
        panels: {
          statsOpen: false,
          configOpen: false,
          previewMode: false
        },
        radialMenu: {
          open: false,
          snapshot: null
        },
        input: {
          lastHighlightedTile: null,
          shovelMode: false
        },
        confirmations: {
          pendingAction: null
        },
        settings: {
          musicEnabled: true,
          sfxEnabled: true,
          autoPathWithEnemies: false,
          verboseAnimations: true
        }
      },

      // METADATA - Store metadata
      meta: {
        version: 3, // State schema version
        lastSaved: null,
        saveCount: 0
      }
    };
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
   * Set state at a specific path
   * @param {string} path - Dot notation path
   * @param {*} value - New value
   * @param {string} mutation - Description of the mutation (for debugging)
   */
  set(path, value, mutation = 'setState') {
    const parts = path.split('.');
    const topLevelSlice = parts[0];

    // Create new state object (immutability)
    const newState = this.deepClone(this.state);

    // Navigate to the target and set value
    let target = newState;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;

    // Record mutation for debugging
    this.recordMutation(mutation, path, this.get(path), value);

    // Update state
    this.state = newState;

    // Record in history if enabled
    if (this.isRecordingHistory) {
      this.recordHistory();
    }

    // Notify listeners
    this.notifyListeners(topLevelSlice, path);

    // Emit EventBus event for backward compatibility
    this.emitStateChangeEvent(path, value);
  }

  /**
   * Update multiple paths atomically
   * @param {Object} updates - Object with path -> value mappings
   * @param {string} mutation - Description of the mutation
   */
  batchSet(updates, mutation = 'batchSetState') {
    const newState = this.deepClone(this.state);
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

      // Record mutation
      this.recordMutation(mutation, path, this.get(path), value);
    }

    // Update state
    this.state = newState;

    // Record in history
    if (this.isRecordingHistory) {
      this.recordHistory();
    }

    // Notify all affected slices
    affectedSlices.forEach(slice => this.notifyListeners(slice));

    // Emit events
    for (const [path, value] of Object.entries(updates)) {
      this.emitStateChangeEvent(path, value);
    }
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
   * @param {string|null} [path=null] - The changed path
   * @returns {void}
   */
  notifyListeners(slice, path = null) {
    const listeners = this.listeners.get(slice);
    if (listeners) {
      const sliceState = this.state[slice];
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
   * Reset a specific slice to initial state
   * @param {string} slice - The slice to reset
   * @returns {void}
   */
  resetSlice(slice) {
    const initialState = this.createInitialState();
    this.set(slice, initialState[slice], `reset_${slice}`);
  }

  /**
   * Reset all transient state (e.g., on zone transition)
   */
  resetTransient() {
    this.resetSlice('transient');
    eventBus.emit(EventTypes.TRANSIENT_STATE_RESET);
  }

  /**
   * Reset all session state (e.g., on game over)
   */
  resetSession() {
    this.resetSlice('session');
    this.resetSlice('transient');
    eventBus.emit(EventTypes.GAME_RESET);
  }

  /**
   * Reset entire state (new game)
   */
  reset() {
    this.state = this.createInitialState();
    this.history = [];
    this.mutations = [];
    this.notifyAllListeners();
    eventBus.emit(EventTypes.GAME_RESET);
  }

  /**
   * Notify all listeners across all slices
   */
  notifyAllListeners() {
    for (const slice of Object.keys(this.state)) {
      this.notifyListeners(slice);
    }
  }

  /**
   * Get a snapshot of the current state
   * @returns {StateSnapshot}
   */
  getSnapshot() {
    return {
      state: this.deepClone(this.state),
      timestamp: Date.now()
    };
  }

  /**
   * Restore state from a snapshot
   * @param {StateSnapshot} snapshot - The snapshot to restore
   * @returns {void}
   */
  restoreSnapshot(snapshot) {
    this.state = this.deepClone(snapshot.state);
    this.notifyAllListeners();
  }

  /**
   * Enable/disable history recording
   * @param {boolean} enabled - Whether to enable history recording
   * @returns {void}
   */
  setHistoryRecording(enabled) {
    this.isRecordingHistory = enabled;
    if (enabled && this.history.length === 0) {
      this.recordHistory();
    }
  }

  /**
   * Record current state in history
   */
  recordHistory() {
    this.history.push(this.getSnapshot());
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
      oldValue: this.deepClone(oldValue),
      newValue: this.deepClone(newValue),
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
   * Deep clone utility
   * @param {any} obj - The object to clone
   * @returns {any} The cloned object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Set) return new Set(Array.from(obj));
    if (obj instanceof Map) return new Map(Array.from(obj));
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));

    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * Emit EventBus events for backward compatibility
   * @param {string} path - The changed path
   * @param {any} value - The new value
   * @returns {void}
   */
  emitStateChangeEvent(path, value) {
    // Map state paths to existing EventTypes
    if (path.startsWith('persistent.player.stats')) {
      eventBus.emit(EventTypes.PLAYER_STATS_CHANGED);
    } else if (path === 'transient.itemAbilities.pendingCharge') {
      eventBus.emit(EventTypes.CHARGE_STATE_CHANGED, value);
    } else if (path === 'transient.itemAbilities.bombPlacementMode') {
      eventBus.emit(EventTypes.BOMB_PLACEMENT_MODE_CHANGED, value);
    } else if (path === 'transient.interactions.signMessage') {
      if (value) {
        eventBus.emit(EventTypes.SIGN_MESSAGE_DISPLAYED, value);
      } else {
        eventBus.emit(EventTypes.SIGN_MESSAGE_CLEARED);
      }
    } else if (path === 'transient.combat.playerJustAttacked') {
      if (value) {
        eventBus.emit(EventTypes.PLAYER_ATTACKED);
      }
    }
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
        memory += obj.size * 8; // Rough estimate
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
      historySize: this.history.length,
      mutationsRecorded: this.mutations.length,
      listenerCount: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0)
    };
  }
}

// Create singleton instance
export const store = new StateStore();

// Debug access in development
if (typeof window !== 'undefined') {
  /** @type {any} */ (window).chressStore = store;
}
