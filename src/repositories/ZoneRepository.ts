import { createZoneKey } from '../utils/ZoneKeyUtils';

/**
 * ZoneRepository centralizes zone caching logic.
 * Manages storage and retrieval of zone data across all dimensions and depths.
 */
export class ZoneRepository {
    private _zones: Map<string, any>;

    constructor() {
        // Stores generated zones by coordinate key
        // Key format: "x,y,dimension,depth" (depth optional, defaults to 1 for underground)
        this._zones = new Map();
    }

    /**
     * Get a zone by its coordinates
     * @param {number} x - Zone x coordinate
     * @param {number} y - Zone y coordinate
     * @param {number} dimension - Dimension (0=surface, 1=interior, 2=underground)
     * @param {number} depth - Underground depth (default 1)
     * @returns {Object|undefined} Zone data or undefined if not found
     */
    get(x, y, dimension, depth = 1) {
        const key = createZoneKey(x, y, dimension, depth);
        return this._zones.get(key);
    }

    /**
     * Get a zone by its key string
     * @param {string} key - Zone key in format "x,y,dimension,depth"
     * @returns {Object|undefined} Zone data or undefined if not found
     */
    getByKey(key) {
        return this._zones.get(key);
    }

    /**
     * Check if a zone exists
     * @param {number} x - Zone x coordinate
     * @param {number} y - Zone y coordinate
     * @param {number} dimension - Dimension (0=surface, 1=interior, 2=underground)
     * @param {number} depth - Underground depth (default 1)
     * @returns {boolean} True if zone exists
     */
    has(x, y, dimension, depth = 1) {
        const key = createZoneKey(x, y, dimension, depth);
        return this._zones.has(key);
    }

    /**
     * Check if a zone exists by key
     * @param {string} key - Zone key in format "x,y,dimension,depth"
     * @returns {boolean} True if zone exists
     */
    hasByKey(key) {
        return this._zones.has(key);
    }

    /**
     * Store a zone
     * @param {number} x - Zone x coordinate
     * @param {number} y - Zone y coordinate
     * @param {number} dimension - Dimension (0=surface, 1=interior, 2=underground)
     * @param {Object} zoneData - Zone data to store
     * @param {number} depth - Underground depth (default 1)
     */
    set(x, y, dimension, zoneData, depth = 1) {
        const key = createZoneKey(x, y, dimension, depth);
        this._zones.set(key, zoneData);
    }

    /**
     * Store a zone by key
     * @param {string} key - Zone key in format "x,y,dimension,depth"
     * @param {Object} zoneData - Zone data to store
     */
    setByKey(key, zoneData) {
        this._zones.set(key, zoneData);
    }

    /**
     * Delete a zone
     * @param {number} x - Zone x coordinate
     * @param {number} y - Zone y coordinate
     * @param {number} dimension - Dimension (0=surface, 1=interior, 2=underground)
     * @param {number} depth - Underground depth (default 1)
     * @returns {boolean} True if zone was deleted
     */
    delete(x, y, dimension, depth = 1) {
        const key = createZoneKey(x, y, dimension, depth);
        return this._zones.delete(key);
    }

    /**
     * Delete a zone by key
     * @param {string} key - Zone key in format "x,y,dimension,depth"
     * @returns {boolean} True if zone was deleted
     */
    deleteByKey(key) {
        return this._zones.delete(key);
    }

    /**
     * Clear all zones
     */
    clear() {
        this._zones.clear();
    }

    /**
     * Get all zone entries as an array for serialization
     * @returns {Array<[string, Object]>} Array of [key, zoneData] tuples
     */
    entries() {
        return Array.from(this._zones.entries());
    }

    /**
     * Get the number of cached zones
     * @returns {number} Number of zones
     */
    size() {
        return this._zones.size;
    }

    /**
     * Restore zones from a serialized array
     * @param {Array<[string, Object]>} entries - Array of [key, zoneData] tuples
     */
    restore(entries) {
        this._zones = new Map(entries);
    }

    /**
     * Get the internal Map (for compatibility with existing code)
     * @returns {Map<string, Object>} The internal zones Map
     * @deprecated Use the repository methods instead of direct Map access
     */
    getMap() {
        return this._zones;
    }
}
