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
    // Show the overlay immediately (already visible in HTML)
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loadingText = document.querySelector('.loading-text') as HTMLElement;
    const startMenuGrid = document.getElementById('startMenuGrid');

    // Helper to update loading text
    const updateLoadingText = (text: string) => {
        if (loadingText) loadingText.textContent = text;
    };

    // Initialize PWA features (service worker, install prompt) - non-blocking
    initializePWA().catch(err => logger.warn('[PWA] Initialization failed:', err));

    // Preload critical modules in background - non-blocking
    preloadCriticalModules();

    // Register all game content before creating the game (including preloading boards)
    updateLoadingText('Loading game content...');
    await registerAllContent();

    updateLoadingText('Initializing game...');
    const game = new Game();

    // Initialize storage adapter (IndexedDB with compression + localStorage fallback)
    updateLoadingText('Loading save data...');
    await game.storageAdapter.init();

    // Hide loading indicator and show menu
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (startMenuGrid) startMenuGrid.style.display = '';

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
