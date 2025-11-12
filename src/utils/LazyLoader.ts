/**
 * Lazy Loader Utility
 * Provides dynamic import capabilities for code splitting and lazy loading
 */

import { logger } from '@core/logger';

/**
 * Cache for loaded modules to avoid re-importing
 */
const moduleCache = new Map();

/**
 * Lazy load a module with caching
 * @param {Function} importFn - Dynamic import function () => import('./module')
 * @param {string} cacheKey - Unique cache key for the module
 * @returns {Promise<any>} The loaded module
 */
export async function lazyLoad(importFn: () => Promise<unknown>, cacheKey: string): Promise<unknown> {
    if (moduleCache.has(cacheKey)) {
        return moduleCache.get(cacheKey);
    }

    try {
        const module = await importFn();
        moduleCache.set(cacheKey, module);
        return module;
    } catch (error) {
        logger.error(`Failed to lazy load module: ${cacheKey}`, error);
        throw error;
    }
}

/**
 * Preload a module in the background without blocking
 * @param {Function} importFn - Dynamic import function
 * @param {string} cacheKey - Unique cache key for the module
 */
export function preloadModule(importFn: () => Promise<unknown>, cacheKey: string): void {
    if (!moduleCache.has(cacheKey)) {
        // Load in background, don't await
        lazyLoad(importFn, cacheKey).catch(err => {
            logger.warn(`Failed to preload module: ${cacheKey}`, err);
        });
    }
}

/**
 * Clear the module cache (useful for testing)
 */
export function clearModuleCache() {
    moduleCache.clear();
}

/**
 * Check if a module is loaded
 * @param {string} cacheKey - Cache key to check
 * @returns {boolean}
 */
export function isModuleLoaded(cacheKey: string): boolean {
    return moduleCache.has(cacheKey);
}

/**
 * Lazy load UI components
 */
export const LazyUI = {
    loadBarterWindow: () => lazyLoad(
        () => import('../ui/BarterWindow'),
        'BarterWindow'
    ),

    loadStatueInfoWindow: () => lazyLoad(
        () => import('../ui/StatueInfoWindow'),
        'StatueInfoWindow'
    ),

    loadMessageLog: () => lazyLoad(
        () => import('../ui/MessageLog'),
        'MessageLog'
    ),

    loadRadialMenu: () => lazyLoad(
        () => import('../ui/RadialInventoryUI'),
        'RadialInventoryUI'
    ),

    loadConfigPanel: () => lazyLoad(
        () => import('../ui/ConfigPanelManager'),
        'ConfigPanelManager'
    ),

    loadRecordsPanel: () => lazyLoad(
        () => import('../ui/RecordsPanelManager'),
        'RecordsPanelManager'
    ),

    loadStatsPanel: () => lazyLoad(
        () => import('../ui/StatsPanelManager'),
        'StatsPanelManager'
    )
};

/**
 * Lazy load editor components (only when needed)
 * Note: Editors are loaded via iframe, not as ES modules
 */
export const LazyEditors = {
    loadBoardEditor: async () => {
        logger.log('board editor loaded via iframe');
        return { default: null };
    },

    loadCharacterEditor: async () => {
        logger.log('Character editor loaded via iframe');
        return { default: null };
    }
};

/**
 * Preload critical modules in the background during idle time
 */
export function preloadCriticalModules(): void {
    if ('requestIdleCallback' in window) {
        (requestIdleCallback as any)(() => {
            // Preload commonly used UI components
            preloadModule(() => import('../ui/RadialInventoryUI'), 'RadialInventoryUI');
            preloadModule(() => import('../ui/MessageLog'), 'MessageLog');
        }, { timeout: 2000 });
    } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
            preloadModule(() => import('../ui/RadialInventoryUI'), 'RadialInventoryUI');
            preloadModule(() => import('../ui/MessageLog'), 'MessageLog');
        }, 1000);
    }
}

/**
 * Lazy load heavy utilities only when needed
 */
export const LazyUtils = {
    loadPathfinding: () => lazyLoad(
        () => import('../enemy/EnemyPathfinding'),
        'EnemyPathfinding'
    ),

    loadLineOfSight: () => lazyLoad(
        () => import('../utils/LineOfSightUtils'),
        'LineOfSightUtils'
    )
};
