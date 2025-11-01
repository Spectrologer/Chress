// @ts-check

import { TILE_TYPES } from './constants/index.js';
import { ServiceContainer } from './ServiceContainer.js';
import { AnimationManager } from './DataContracts.ts';
import { GameContext } from './GameContext.js';
import { isFloor } from '../utils/TileUtils.js';
import { registerAllContent } from '../config/ContentRegistrations.js';
import { initializePWA } from '../utils/pwa-register.js';
import { preloadCriticalModules } from '../utils/LazyLoader.js';

/**
 * Game
 *
 * Main game class that extends GameContext.
 * Initializes all game services and starts the game loop.
 *
 * All game logic methods are inherited from GameContext.
 */
class Game extends GameContext {
    constructor() {
        super();

        // Centralized services
        this._services = new ServiceContainer(this).createCoreServices();

        // Backwards-compatible aliases
        // TurnManager owns canonical data
        if (this.turnManager) {
            this.turnQueue = this.turnManager.turnQueue;
            this.occupiedTilesThisTurn = this.turnManager.occupiedTilesThisTurn;
            this.initialEnemyTilesThisTurn = this.turnManager.initialEnemyTilesThisTurn;
        }

        // Animation manager
        this.animationManager = new AnimationManager();

        // Animation scheduler
        // Created by ServiceContainer

        // Consent check on load (disabled - tracking not active)
        // this.audio.initializeConsent();

        // Load and start
        this.gameInitializer.loadAssets();

        // Track last position
        // Prevents accidental radial close
        this.ui.updateLastPlayerPosition(this.player);
    }

    // All methods are inherited from GameContext
}
    
// Initialize game when the page loads
window.addEventListener('DOMContentLoaded', async () => {
    // Initialize PWA features (service worker, install prompt)
    initializePWA().catch(err => console.warn('[PWA] Initialization failed:', err));

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
