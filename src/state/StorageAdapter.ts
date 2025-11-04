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

import { logger } from '@core/logger';
import { compressionService } from '@services/CompressionService';

interface PayloadData {
    compressed: boolean;
    data: string;
    timestamp: number;
}

interface StorageStats {
    used: number;
    available: number;
    compressed: boolean;
    backend: string;
}

/**
 * Storage adapter that abstracts IndexedDB and localStorage
 */
export class StorageAdapter {
    private dbName: string;
    private storeName: string;
    private localStorageKey: string;
    private db: IDBDatabase | null;
    private useIndexedDB: boolean;
    private compressionEnabled: boolean;

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
     */
    async init(): Promise<boolean> {
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
     */
    private _openIndexedDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;

                // Handle database being closed externally
                db.onclose = () => {
                    logger.warn('StorageAdapter: IndexedDB connection closed unexpectedly');
                    this.db = null;
                    this.useIndexedDB = false;
                };

                // Handle version change from another tab
                db.onversionchange = () => {
                    logger.warn('StorageAdapter: IndexedDB version change detected, closing connection');
                    db.close();
                    this.db = null;
                    this.useIndexedDB = false;
                };

                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    /**
     * Save data to storage
     */
    async save(key: string, data: any): Promise<void> {
        const jsonString = JSON.stringify(data);

        // Compress if enabled
        const dataToStore = this.compressionEnabled
            ? compressionService.compress(jsonString)
            : jsonString;

        const payload: PayloadData = {
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
     */
    async load(key: string): Promise<any | null> {
        let payload: PayloadData | any;

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
            ? compressionService.decompress(payload.data)
            : payload.data;

        try {
            return JSON.parse(dataString as string);
        } catch (error) {
            logger.error('StorageAdapter: Failed to parse data:', error);
            return null;
        }
    }

    /**
     * Check if data exists for a key
     */
    async has(key: string): Promise<boolean> {
        if (this.useIndexedDB) {
            const data = await this._loadFromIndexedDB(key);
            return data !== null;
        } else {
            return localStorage.getItem(key) !== null;
        }
    }

    /**
     * Remove data from storage
     */
    async remove(key: string): Promise<void> {
        if (this.useIndexedDB) {
            return this._removeFromIndexedDB(key);
        } else {
            localStorage.removeItem(key);
        }
    }

    /**
     * Get storage statistics
     */
    async getStats(): Promise<StorageStats> {
        const stats: StorageStats = {
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
                const value = key ? localStorage.getItem(key) : null;
                totalSize += (key?.length || 0) + (value?.length || 0);
            }
            stats.used = totalSize * 2; // Approximate bytes (UTF-16)
            stats.available = 5 * 1024 * 1024; // ~5MB typical limit
        }

        return stats;
    }

    // Private IndexedDB methods

    /**
     * Ensure database is open and reconnect if needed
     */
    private async _ensureDBOpen(): Promise<boolean> {
        // Check if database is open
        if (this.db && !this.db.objectStoreNames) {
            // Database is closed, mark as invalid
            this.db = null;
        }

        if (!this.db) {
            // Try to reconnect
            try {
                this.db = await this._openIndexedDB();
                this.useIndexedDB = true;
                logger.info('StorageAdapter: Reconnected to IndexedDB');
                return true;
            } catch (error) {
                logger.warn('StorageAdapter: Failed to reconnect to IndexedDB:', error);
                this.useIndexedDB = false;
                return false;
            }
        }
        return true;
    }

    private async _saveToIndexedDB(key: string, data: any): Promise<void> {
        // Ensure database is open
        if (!(await this._ensureDBOpen())) {
            throw new Error('IndexedDB not available');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put(data, key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (error) {
                // Handle case where transaction fails due to closed database
                reject(error);
            }
        });
    }

    private async _loadFromIndexedDB(key: string): Promise<any> {
        // Ensure database is open
        if (!(await this._ensureDBOpen())) {
            throw new Error('IndexedDB not available');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            } catch (error) {
                // Handle case where transaction fails due to closed database
                reject(error);
            }
        });
    }

    private async _removeFromIndexedDB(key: string): Promise<void> {
        // Ensure database is open
        if (!(await this._ensureDBOpen())) {
            throw new Error('IndexedDB not available');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (error) {
                // Handle case where transaction fails due to closed database
                reject(error);
            }
        });
    }

    // Private localStorage methods

    private _saveToLocalStorage(key: string, data: any): void {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            // Likely quota exceeded
            logger.error('StorageAdapter: localStorage save failed:', error);
            throw error;
        }
    }

    private _loadFromLocalStorage(key: string): any {
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
