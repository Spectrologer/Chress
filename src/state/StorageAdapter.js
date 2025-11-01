/**
 * Storage adapter with IndexedDB (primary) and localStorage (fallback).
 *
 * Features:
 * - Automatic compression using LZ-String (40-60% size reduction)
 * - IndexedDB for unlimited storage (~50% of disk space)
 * - localStorage fallback for compatibility
 * - Async API for non-blocking saves
 * - Backward compatible with existing saves
 *
 * @module StorageAdapter
 */

import { logger } from '../core/logger.ts';

// Simple LZ-String implementation for compression
// Based on: https://pieroxy.net/blog/pages/lz-string/index.html
const LZString = {
    compressToUTF16(input) {
        if (input == null) return "";
        return this._compress(input, 15, string => String.fromCharCode(string + 32)) + " ";
    },

    decompressFromUTF16(compressed) {
        if (compressed == null) return "";
        if (compressed == "") return null;
        return this._decompress(compressed.length, 16384, index => compressed.charCodeAt(index) - 32);
    },

    _compress(uncompressed, bitsPerChar, getCharFromInt) {
        if (uncompressed == null) return "";
        let i, value;
        const context_dictionary = {};
        const context_dictionaryToCreate = {};
        let context_c = "";
        let context_wc = "";
        let context_w = "";
        let context_enlargeIn = 2;
        let context_dictSize = 3;
        let context_numBits = 2;
        const context_data = [];
        let context_data_val = 0;
        let context_data_position = 0;

        for (let ii = 0; ii < uncompressed.length; ii += 1) {
            context_c = uncompressed.charAt(ii);
            if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                context_dictionary[context_c] = context_dictSize++;
                context_dictionaryToCreate[context_c] = true;
            }

            context_wc = context_w + context_c;
            if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                context_w = context_wc;
            } else {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                    if (context_w.charCodeAt(0) < 256) {
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 8; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    } else {
                        value = 1;
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = 0;
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 16; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    delete context_dictionaryToCreate[context_w];
                } else {
                    value = context_dictionary[context_w];
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
                context_dictionary[context_wc] = context_dictSize++;
                context_w = String(context_c);
            }
        }

        if (context_w !== "") {
            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                if (context_w.charCodeAt(0) < 256) {
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                    }
                    value = context_w.charCodeAt(0);
                    for (i = 0; i < 8; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                } else {
                    value = 1;
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | value;
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = 0;
                    }
                    value = context_w.charCodeAt(0);
                    for (i = 0; i < 16; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
                delete context_dictionaryToCreate[context_w];
            } else {
                value = context_dictionary[context_w];
                for (i = 0; i < context_numBits; i++) {
                    context_data_val = (context_data_val << 1) | (value & 1);
                    if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                    } else {
                        context_data_position++;
                    }
                    value = value >> 1;
                }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
            }
        }

        value = 2;
        for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
            } else {
                context_data_position++;
            }
            value = value >> 1;
        }

        while (true) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar - 1) {
                context_data.push(getCharFromInt(context_data_val));
                break;
            }
            else context_data_position++;
        }
        return context_data.join('');
    },

    _decompress(length, resetValue, getNextValue) {
        const dictionary = [];
        let enlargeIn = 4, dictSize = 4, numBits = 3;
        let entry, result, w, c;
        const data = { val: getNextValue(0), position: resetValue, index: 1 };

        for (let i = 0; i < 3; i += 1) {
            dictionary[i] = i;
        }

        let bits = 0, maxpower = Math.pow(2, 2), power = 1;
        while (power != maxpower) {
            const resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
        }

        switch (bits) {
            case 0:
                bits = 0;
                maxpower = Math.pow(2, 8);
                power = 1;
                while (power != maxpower) {
                    const resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                c = String.fromCharCode(bits);
                break;
            case 1:
                bits = 0;
                maxpower = Math.pow(2, 16);
                power = 1;
                while (power != maxpower) {
                    const resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                c = String.fromCharCode(bits);
                break;
            case 2:
                return "";
        }
        dictionary[3] = c;
        w = c;
        result = [c];
        while (true) {
            if (data.index > length) {
                return "";
            }

            bits = 0;
            maxpower = Math.pow(2, numBits);
            power = 1;
            while (power != maxpower) {
                const resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }

            switch (c = bits) {
                case 0:
                    bits = 0;
                    maxpower = Math.pow(2, 8);
                    power = 1;
                    while (power != maxpower) {
                        const resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }

                    dictionary[dictSize++] = String.fromCharCode(bits);
                    c = dictSize - 1;
                    enlargeIn--;
                    break;
                case 1:
                    bits = 0;
                    maxpower = Math.pow(2, 16);
                    power = 1;
                    while (power != maxpower) {
                        const resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    dictionary[dictSize++] = String.fromCharCode(bits);
                    c = dictSize - 1;
                    enlargeIn--;
                    break;
                case 2:
                    return result.join('');
            }

            if (enlargeIn == 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
            }

            if (dictionary[c]) {
                entry = dictionary[c];
            } else {
                if (c === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    return null;
                }
            }
            result.push(entry);

            dictionary[dictSize++] = w + entry.charAt(0);
            enlargeIn--;

            w = entry;

            if (enlargeIn == 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
            }
        }
    }
};

/**
 * Storage adapter that abstracts IndexedDB and localStorage
 */
export class StorageAdapter {
    constructor(dbName = 'ChressGameDB', storeName = 'gameState', localStorageKey = 'chress_game_state') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.localStorageKey = localStorageKey;
        this.db = null;
        this.useIndexedDB = false;
        this.compressionEnabled = true; // Enable compression by default
    }

    /**
     * Initialize the storage adapter
     *
     * @returns {Promise<boolean>} Whether initialization succeeded
     */
    async init() {
        // Try IndexedDB first
        if (typeof indexedDB !== 'undefined') {
            try {
                this.db = await this._openIndexedDB();
                this.useIndexedDB = true;
                logger.info('StorageAdapter: Using IndexedDB');
                return true;
            } catch (error) {
                logger.warn('StorageAdapter: IndexedDB failed, falling back to localStorage:', error);
            }
        }

        // Fall back to localStorage
        if (typeof localStorage !== 'undefined') {
            logger.info('StorageAdapter: Using localStorage');
            return true;
        }

        logger.error('StorageAdapter: No storage available');
        return false;
    }

    /**
     * Open IndexedDB connection
     *
     * @private
     * @returns {Promise<IDBDatabase>} Database instance
     */
    _openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    /**
     * Save data to storage
     *
     * @param {string} key - Storage key
     * @param {*} data - Data to save (will be JSON serialized)
     * @returns {Promise<void>}
     */
    async save(key, data) {
        const jsonString = JSON.stringify(data);

        // Compress if enabled
        const dataToStore = this.compressionEnabled
            ? LZString.compressToUTF16(jsonString)
            : jsonString;

        const payload = {
            compressed: this.compressionEnabled,
            data: dataToStore,
            timestamp: Date.now()
        };

        if (this.useIndexedDB) {
            return this._saveToIndexedDB(key, payload);
        } else {
            return this._saveToLocalStorage(key, payload);
        }
    }

    /**
     * Load data from storage
     *
     * @param {string} key - Storage key
     * @returns {Promise<*|null>} Loaded data or null if not found
     */
    async load(key) {
        let payload;

        if (this.useIndexedDB) {
            payload = await this._loadFromIndexedDB(key);
        } else {
            payload = this._loadFromLocalStorage(key);
        }

        if (!payload) return null;

        // Handle old uncompressed format (backward compatibility)
        if (typeof payload === 'object' && !payload.compressed && !payload.data) {
            return payload; // Old format, return as-is
        }

        // New format
        const dataString = payload.compressed
            ? LZString.decompressFromUTF16(payload.data)
            : payload.data;

        try {
            return JSON.parse(dataString);
        } catch (error) {
            logger.error('StorageAdapter: Failed to parse data:', error);
            return null;
        }
    }

    /**
     * Check if data exists for a key
     *
     * @param {string} key - Storage key
     * @returns {Promise<boolean>} Whether data exists
     */
    async has(key) {
        if (this.useIndexedDB) {
            const data = await this._loadFromIndexedDB(key);
            return data !== null;
        } else {
            return localStorage.getItem(key) !== null;
        }
    }

    /**
     * Remove data from storage
     *
     * @param {string} key - Storage key
     * @returns {Promise<void>}
     */
    async remove(key) {
        if (this.useIndexedDB) {
            return this._removeFromIndexedDB(key);
        } else {
            localStorage.removeItem(key);
        }
    }

    /**
     * Get storage statistics
     *
     * @returns {Promise<{used: number, available: number, compressed: boolean}>}
     */
    async getStats() {
        const stats = {
            used: 0,
            available: 0,
            compressed: this.compressionEnabled,
            backend: this.useIndexedDB ? 'IndexedDB' : 'localStorage'
        };

        if (this.useIndexedDB) {
            // IndexedDB doesn't provide easy size stats
            stats.available = Infinity; // Effectively unlimited
        } else {
            // Estimate localStorage usage
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                totalSize += key.length + (value?.length || 0);
            }
            stats.used = totalSize * 2; // Approximate bytes (UTF-16)
            stats.available = 5 * 1024 * 1024; // ~5MB typical limit
        }

        return stats;
    }

    // Private IndexedDB methods

    async _saveToIndexedDB(key, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(data, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async _loadFromIndexedDB(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async _removeFromIndexedDB(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Private localStorage methods

    _saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            // Likely quota exceeded
            logger.error('StorageAdapter: localStorage save failed:', error);
            throw error;
        }
    }

    _loadFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            logger.error('StorageAdapter: localStorage load failed:', error);
            return null;
        }
    }
}

// Export singleton instance
export const storageAdapter = new StorageAdapter();
