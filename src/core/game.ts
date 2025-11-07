import { TILE_TYPES } from './constants/index';
import { ServiceContainer } from './ServiceContainer';
import { AnimationManager } from './DataContracts';
import { GameContext } from './context/GameContextCore';
import { isFloor } from '@utils/TileUtils';
import { registerAllContent } from '@config/ContentRegistrations';
import { initializePWA } from '@utils/pwa-register';
import { preloadCriticalModules } from '@utils/LazyLoader';

/**
 * Game
 *
 * Main game class that extends GameContext.
 * Initializes all game services and starts the game loop.
 *
 * All game logic methods are inherited from GameContext.
 */
export class Game extends GameContext {
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

// Export type alias for compatibility
export type { GameContext as IGame } from './context/GameContextCore';

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
