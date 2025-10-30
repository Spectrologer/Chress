/**
 * State Persistence Layer
 *
 * Handles saving and loading state with:
 * - Automatic compression (LZ-string)
 * - IndexedDB primary storage with localStorage fallback
 * - Zone pruning to prevent unbounded growth
 * - Backward compatibility with old save format
 * - Chunk-based saving for large states
 */

import { store } from './StateStore.js';
import LZString from 'lz-string';

export class StatePersistence {
  constructor() {
    this.INDEXEDDB_NAME = 'ChressDB';
    this.INDEXEDDB_VERSION = 1;
    this.STORE_NAME = 'gameState';
    this.LOCALSTORAGE_KEY = 'chress_game_state';
    this.LOCALSTORAGE_BACKUP_KEY = 'chress_game_state_backup';

    // Storage limits
    this.MAX_ZONES_TO_KEEP = 100; // Keep only recent/special zones
    this.MAX_MESSAGE_LOG = 50; // Limit message log
    this.COMPRESSION_ENABLED = true;

    this.db = null;
    this.dbReady = false;
    this.dbError = null;

    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB
   */
  async initIndexedDB() {
    if (!window.indexedDB) {
      console.warn('IndexedDB not available, falling back to localStorage');
      this.dbError = 'IndexedDB not supported';
      return;
    }

    try {
      const request = indexedDB.open(this.INDEXEDDB_NAME, this.INDEXEDDB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        this.dbError = request.error;
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.dbReady = true;
        console.log('✅ IndexedDB ready');
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      this.dbError = error;
    }
  }

  /**
   * Wait for IndexedDB to be ready
   */
  async waitForDB(timeout = 5000) {
    const startTime = Date.now();
    while (!this.dbReady && !this.dbError) {
      if (Date.now() - startTime > timeout) {
        throw new Error('IndexedDB initialization timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (this.dbError) {
      throw new Error(`IndexedDB error: ${this.dbError}`);
    }
  }

  /**
   * Save state to storage
   * @param {boolean} useIndexedDB - Prefer IndexedDB over localStorage
   * @returns {Promise<boolean>} Success status
   */
  async save(useIndexedDB = true) {
    try {
      // Get current state
      const state = store.getSnapshot();

      // Prune state to reduce size
      const prunedState = this.pruneState(state.state);

      // Serialize
      const serialized = this.serialize(prunedState);

      // Update metadata
      store.batchSet({
        'meta.lastSaved': Date.now(),
        'meta.saveCount': store.get('meta.saveCount') + 1
      }, 'save_metadata');

      // Try IndexedDB first
      if (useIndexedDB && this.dbReady) {
        try {
          await this.saveToIndexedDB('currentGame', serialized);
          console.log('✅ Saved to IndexedDB');
          return true;
        } catch (error) {
          console.warn('IndexedDB save failed, falling back to localStorage:', error);
        }
      }

      // Fallback to localStorage
      return this.saveToLocalStorage(serialized);
    } catch (error) {
      console.error('Failed to save state:', error);
      return false;
    }
  }

  /**
   * Load state from storage
   * @returns {Promise<boolean>} Success status
   */
  async load() {
    try {
      let serialized = null;

      // Try IndexedDB first
      if (this.dbReady) {
        try {
          serialized = await this.loadFromIndexedDB('currentGame');
          if (serialized) {
            console.log('✅ Loaded from IndexedDB');
          }
        } catch (error) {
          console.warn('IndexedDB load failed, trying localStorage:', error);
        }
      }

      // Fallback to localStorage
      if (!serialized) {
        serialized = this.loadFromLocalStorage();
        if (serialized) {
          console.log('✅ Loaded from localStorage');
        }
      }

      if (!serialized) {
        console.log('No saved state found');
        return false;
      }

      // Deserialize and restore
      const state = this.deserialize(serialized);
      store.restoreSnapshot({ state, timestamp: Date.now() });

      return true;
    } catch (error) {
      console.error('Failed to load state:', error);
      return false;
    }
  }

  /**
   * Check if saved state exists
   */
  async hasSavedState() {
    if (this.dbReady) {
      try {
        const data = await this.loadFromIndexedDB('currentGame');
        if (data) return true;
      } catch (error) {
        // Fallthrough to localStorage check
      }
    }

    return !!localStorage.getItem(this.LOCALSTORAGE_KEY);
  }

  /**
   * Clear all saved state
   */
  async clear() {
    // Clear IndexedDB
    if (this.dbReady) {
      try {
        await this.deleteFromIndexedDB('currentGame');
      } catch (error) {
        console.error('Failed to clear IndexedDB:', error);
      }
    }

    // Clear localStorage
    localStorage.removeItem(this.LOCALSTORAGE_KEY);
    localStorage.removeItem(this.LOCALSTORAGE_BACKUP_KEY);

    console.log('✅ Cleared all saved state');
  }

  /**
   * Prune state to reduce storage size
   */
  pruneState(state) {
    const pruned = { ...state };

    // Prune zones - keep only recent and special zones
    if (pruned.persistent && pruned.persistent.zones) {
      pruned.persistent.zones = this.pruneZones(
        pruned.persistent.zones,
        pruned.persistent.player?.currentZone,
        pruned.persistent.specialZones
      );
    }

    // Limit message log
    if (pruned.persistent && pruned.persistent.messageLog) {
      const log = pruned.persistent.messageLog;
      if (log.length > this.MAX_MESSAGE_LOG) {
        pruned.persistent.messageLog = log.slice(-this.MAX_MESSAGE_LOG);
      }
    }

    // Don't persist transient or UI state
    delete pruned.transient;
    delete pruned.ui;

    return pruned;
  }

  /**
   * Prune zones to keep only recent and special ones
   */
  pruneZones(zones, currentZone, specialZones) {
    // Convert to array with metadata
    const zonesArray = Array.from(zones.entries()).map(([key, zone]) => {
      const isSpecial = specialZones && specialZones.has(key);
      const isCurrent = currentZone && key === `${currentZone.x},${currentZone.y},${currentZone.dimension},${currentZone.depth}`;

      return {
        key,
        zone,
        isSpecial,
        isCurrent,
        timestamp: zone.lastVisited || 0
      };
    });

    // Sort by priority: current > special > recent
    zonesArray.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      if (a.isSpecial && !b.isSpecial) return -1;
      if (b.isSpecial && !a.isSpecial) return 1;
      return b.timestamp - a.timestamp;
    });

    // Keep top N zones
    const keptZones = zonesArray.slice(0, this.MAX_ZONES_TO_KEEP);
    const prunedMap = new Map();

    keptZones.forEach(({ key, zone }) => {
      prunedMap.set(key, zone);
    });

    console.log(`🗜️ Pruned zones: ${zones.size} -> ${prunedMap.size}`);
    return prunedMap;
  }

  /**
   * Serialize state to string
   */
  serialize(state) {
    // Convert Maps and Sets to arrays for JSON serialization
    const prepared = this.prepareForSerialization(state);

    // JSON stringify
    const json = JSON.stringify(prepared);

    // Compress if enabled
    if (this.COMPRESSION_ENABLED && LZString) {
      const compressed = LZString.compressToUTF16(json);
      console.log(`🗜️ Compressed: ${json.length} -> ${compressed.length} (${Math.round((1 - compressed.length / json.length) * 100)}% reduction)`);
      return {
        version: 3,
        compressed: true,
        data: compressed
      };
    }

    return {
      version: 3,
      compressed: false,
      data: json
    };
  }

  /**
   * Deserialize state from string
   */
  deserialize(serialized) {
    // Handle old format (direct object)
    if (!serialized.version) {
      return this.migrateOldFormat(serialized);
    }

    // Decompress if needed
    let json = serialized.data;
    if (serialized.compressed && LZString) {
      json = LZString.decompressFromUTF16(json);
    }

    // Parse JSON
    const parsed = JSON.parse(json);

    // Restore Maps and Sets
    return this.restoreFromSerialization(parsed);
  }

  /**
   * Prepare state for JSON serialization (Maps/Sets -> Arrays)
   */
  prepareForSerialization(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Set) return { __type: 'Set', value: Array.from(obj) };
    if (obj instanceof Map) return { __type: 'Map', value: Array.from(obj.entries()) };
    if (Array.isArray(obj)) return obj.map(item => this.prepareForSerialization(item));

    const prepared = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        prepared[key] = this.prepareForSerialization(obj[key]);
      }
    }
    return prepared;
  }

  /**
   * Restore Maps and Sets from serialized format
   */
  restoreFromSerialization(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj.__type === 'Set') return new Set(obj.value);
    if (obj.__type === 'Map') return new Map(obj.value);
    if (Array.isArray(obj)) return obj.map(item => this.restoreFromSerialization(item));

    const restored = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        restored[key] = this.restoreFromSerialization(obj[key]);
      }
    }
    return restored;
  }

  /**
   * Migrate old save format to new format
   */
  migrateOldFormat(oldState) {
    console.log('📦 Migrating old save format...');

    // Create new state structure
    const newState = store.createInitialState();

    if (oldState.state) {
      const old = oldState.state;

      // Migrate player data
      if (old.player) {
        newState.persistent.player = {
          ...newState.persistent.player,
          ...old.player
        };
      }

      // Migrate zones
      if (old.zones) {
        newState.persistent.zones = Array.isArray(old.zones)
          ? new Map(old.zones)
          : old.zones;
      }

      // Migrate other persistent data
      if (old.defeatedEnemies) {
        newState.persistent.defeatedEnemies = new Set(old.defeatedEnemies);
      }
      if (old.specialZones) {
        newState.persistent.specialZones = new Map(old.specialZones);
      }
      if (old.messageLog) {
        newState.persistent.messageLog = old.messageLog;
      }
      if (old.dialogueState) {
        newState.persistent.dialogueState = new Map(old.dialogueState);
      }
      if (old.currentRegion) {
        newState.persistent.currentRegion = old.currentRegion;
      }

      // Migrate session data
      if (old.grid) {
        newState.session.currentGrid = old.grid;
      }
      if (old.enemies) {
        newState.session.enemies = old.enemies;
      }
      if (old.zoneStateManager) {
        newState.session.zoneGeneration = old.zoneStateManager;
      }

      // Migrate settings from player.stats
      if (old.playerStats) {
        newState.ui.settings = {
          musicEnabled: old.playerStats.musicEnabled ?? true,
          sfxEnabled: old.playerStats.sfxEnabled ?? true,
          autoPathWithEnemies: old.playerStats.autoPathWithEnemies ?? false,
          verboseAnimations: true
        };
      }
    }

    console.log('✅ Migration complete');
    return newState;
  }

  /**
   * Save to IndexedDB
   */
  async saveToIndexedDB(key, data) {
    await this.waitForDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(data, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load from IndexedDB
   */
  async loadFromIndexedDB(key) {
    await this.waitForDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete from IndexedDB
   */
  async deleteFromIndexedDB(key) {
    await this.waitForDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save to localStorage
   */
  saveToLocalStorage(data) {
    try {
      const json = JSON.stringify(data);

      // Check size
      const sizeKB = new Blob([json]).size / 1024;
      console.log(`💾 localStorage save size: ${sizeKB.toFixed(2)} KB`);

      if (sizeKB > 5000) {
        console.warn('⚠️ Save data exceeds 5MB, may fail on some browsers');
      }

      // Create backup of previous save
      const existing = localStorage.getItem(this.LOCALSTORAGE_KEY);
      if (existing) {
        localStorage.setItem(this.LOCALSTORAGE_BACKUP_KEY, existing);
      }

      // Save new data
      localStorage.setItem(this.LOCALSTORAGE_KEY, json);
      console.log('✅ Saved to localStorage');
      return true;
    } catch (error) {
      console.error('localStorage save failed:', error);

      // Try to restore backup if save failed
      const backup = localStorage.getItem(this.LOCALSTORAGE_BACKUP_KEY);
      if (backup) {
        localStorage.setItem(this.LOCALSTORAGE_KEY, backup);
        console.log('⚠️ Restored from backup');
      }

      return false;
    }
  }

  /**
   * Load from localStorage
   */
  loadFromLocalStorage() {
    try {
      const json = localStorage.getItem(this.LOCALSTORAGE_KEY);
      if (!json) return null;

      return JSON.parse(json);
    } catch (error) {
      console.error('localStorage load failed:', error);

      // Try backup
      try {
        const backup = localStorage.getItem(this.LOCALSTORAGE_BACKUP_KEY);
        if (backup) {
          console.log('⚠️ Loading from backup');
          return JSON.parse(backup);
        }
      } catch (backupError) {
        console.error('Backup load also failed:', backupError);
      }

      return null;
    }
  }

  /**
   * Export save data as downloadable file
   */
  async exportSave() {
    const state = store.getSnapshot();
    const serialized = this.serialize(state.state);
    const json = JSON.stringify(serialized, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chress-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import save data from file
   */
  async importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const serialized = JSON.parse(e.target.result);
          const state = this.deserialize(serialized);
          store.restoreSnapshot({ state, timestamp: Date.now() });
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

// Create singleton instance
export const persistence = new StatePersistence();
