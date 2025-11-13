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

/**
 * Checks if a saved game exists in storage
 */
async function checkForSavedGame(game: Game): Promise<boolean> {
    try {
        // Check StorageAdapter (IndexedDB) first
        if (game.storageAdapter) {
            const hasInStorage = await game.storageAdapter.has('chesse_game_state');
            if (hasInStorage) return true;
        }

        // Fallback to localStorage check
        return !!(localStorage && localStorage.getItem && localStorage.getItem('chesse_game_state'));
    } catch (e) {
        logger.error('Error checking for saved game:', e);
        return false;
    }
}

/**
 * Moves the continue button above the start button for returning players
 */
function prioritizeContinueButton(menuGrid: HTMLElement): void {
    try {
        const startBtn = menuGrid.querySelector<HTMLElement>('#startButton');
        const continueBtn = menuGrid.querySelector<HTMLElement>('#continueButton');

        if (continueBtn && startBtn) {
            const parent = startBtn.parentNode;
            if (parent && parent.contains(continueBtn) && parent.contains(startBtn)) {
                parent.insertBefore(continueBtn, startBtn);
            }
        }
    } catch (e) {
        logger.error('Error prioritizing continue button:', e);
    }
}

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

    // Check if saved game exists and reorder buttons BEFORE showing menu
    const hasSavedGame = await checkForSavedGame(game);
    if (hasSavedGame && startMenuGrid) {
        prioritizeContinueButton(startMenuGrid);
    }

    // Hide loading indicator and show menu
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (startMenuGrid) startMenuGrid.style.display = '';

    // Fade out the game loading placeholder
    const gameLoadingPlaceholder = document.getElementById('gameLoadingPlaceholder');
    const gameCanvas = document.getElementById('gameCanvas');

    // Keep canvas hidden initially to prevent artifacts during preview rendering
    if (gameCanvas) {
        gameCanvas.style.visibility = 'hidden';
    }

    if (gameLoadingPlaceholder) {
        gameLoadingPlaceholder.classList.add('fade-out');
        // Remove the placeholder after fade animation completes
        setTimeout(() => {
            if (gameLoadingPlaceholder.parentNode) {
                gameLoadingPlaceholder.parentNode.removeChild(gameLoadingPlaceholder);
            }
            // Show canvas after a brief delay to skip initial rendering artifacts
            // Wait for a couple of frames to let the preview rendering stabilize
            setTimeout(() => {
                if (gameCanvas) {
                    gameCanvas.style.visibility = 'visible';
                }
            }, 100);
        }, 800);
    }
    // Also fade out the canvas background image
    if (gameCanvas) {
        setTimeout(() => {
            gameCanvas.style.background = '#FFB5B5';
        }, 800);
    }

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
