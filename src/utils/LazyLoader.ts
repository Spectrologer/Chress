/**
 * Lazy Loader Utility
 * Provides dynamic import capabilities for code splitting and lazy loading
 */

/**
 * Cache for loaded modules to avoid re-importing
 */
const moduleCache = new Map();

/**
 * Lazy load a module with caching
 * @param {Function} importFn - Dynamic import function () => import('./module.js')
 * @param {string} cacheKey - Unique cache key for the module
 * @returns {Promise<any>} The loaded module
 */
export async function lazyLoad(importFn, cacheKey) {
    if (moduleCache.has(cacheKey)) {
        return moduleCache.get(cacheKey);
    }

    try {
        const module = await importFn();
        moduleCache.set(cacheKey, module);
        return module;
    } catch (error) {
        console.error(`Failed to lazy load module: ${cacheKey}`, error);
        throw error;
    }
}

/**
 * Preload a module in the background without blocking
 * @param {Function} importFn - Dynamic import function
 * @param {string} cacheKey - Unique cache key for the module
 */
export function preloadModule(importFn, cacheKey) {
    if (!moduleCache.has(cacheKey)) {
        // Load in background, don't await
        lazyLoad(importFn, cacheKey).catch(err => {
            console.warn(`Failed to preload module: ${cacheKey}`, err);
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
export function isModuleLoaded(cacheKey) {
    return moduleCache.has(cacheKey);
}

/**
 * Lazy load UI components
 */
export const LazyUI = {
    loadBarterWindow: () => lazyLoad(
        () => import('../ui/BarterWindow.ts'),
        'BarterWindow'
    ),

    loadStatueInfoWindow: () => lazyLoad(
        () => import('../ui/StatueInfoWindow.ts'),
        'StatueInfoWindow'
    ),

    loadMessageLog: () => lazyLoad(
        () => import('../ui/MessageLog.ts'),
        'MessageLog'
    ),

    loadRadialMenu: () => lazyLoad(
        () => import('../ui/RadialInventoryUI.ts'),
        'RadialInventoryUI'
    ),

    loadConfigPanel: () => lazyLoad(
        () => import('../ui/ConfigPanelManager.ts'),
        'ConfigPanelManager'
    ),

    loadRecordsPanel: () => lazyLoad(
        () => import('../ui/RecordsPanelManager.ts'),
        'RecordsPanelManager'
    ),

    loadStatsPanel: () => lazyLoad(
        () => import('../ui/StatsPanelManager.ts'),
        'StatsPanelManager'
    )
};

/**
 * Lazy load editor components (only when needed)
 * Note: Editors are loaded via iframe, not as ES modules
 */
export const LazyEditors = {
    loadZoneEditor: async () => {
        console.log('Zone editor loaded via iframe');
        return { default: null };
    },

    loadCharacterEditor: async () => {
        console.log('Character editor loaded via iframe');
        return { default: null };
    }
};

/**
 * Preload critical modules in the background during idle time
 */
export function preloadCriticalModules() {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Preload commonly used UI components
            preloadModule(() => import('../ui/RadialInventoryUI.ts'), 'RadialInventoryUI');
            preloadModule(() => import('../ui/MessageLog.ts'), 'MessageLog');
        }, { timeout: 2000 });
    } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
            preloadModule(() => import('../ui/RadialInventoryUI.ts'), 'RadialInventoryUI');
            preloadModule(() => import('../ui/MessageLog.ts'), 'MessageLog');
        }, 1000);
    }
}

/**
 * Lazy load heavy utilities only when needed
 */
export const LazyUtils = {
    loadPathfinding: () => lazyLoad(
        () => import('../enemy/EnemyPathfinding.ts'),
        'EnemyPathfinding'
    ),

    loadLineOfSight: () => lazyLoad(
        () => import('../utils/LineOfSightUtils.ts'),
        'LineOfSightUtils'
    )
};
