/**
 * Main entry point for the game
 * This file is only loaded by the browser, not by tests
 */
import { Game } from './core/game';
import { isFloor } from '@utils/TileUtils';
import { TILE_TYPES } from '@core/constants/index';
import { registerAllContent } from '@config/ContentRegistrations';
import { initializePWA } from '@utils/pwa-register';
import { preloadCriticalModules } from '@utils/LazyLoader';
import { logger } from '@core/logger';

// Initialize game when the page loads
window.addEventListener('DOMContentLoaded', async () => {
    // Initialize PWA features (service worker, install prompt)
    initializePWA().catch(err => logger.warn('[PWA] Initialization failed:', err));

    // Preload critical modules in background
    preloadCriticalModules();

    // Register all game content before creating the game (including preloading boards)
    await registerAllContent();

    const game = new Game();

    // Initialize storage adapter (IndexedDB with compression + localStorage fallback)
    await game.storageAdapter.init();

    // Debug: Q spawns aguamelin
    window.addEventListener('keydown', (e) => {
        if (e.key === 'q' || e.key === 'Q') {
            if (game && game.player && game.gridManager) {
                const { x, y } = game.player;
                const gridManager = game.gridManager;
                // Floor only
                if (isFloor(gridManager.getTile(x, y))) {
                    gridManager.setTile(x, y, { type: TILE_TYPES.FOOD, foodType: 'items/consumables/aguamelin.png' });
                    if (game.render) game.render();
                }
            }
        }
    });
});
