import { ServiceContainer } from './ServiceContainer';
import { AnimationManager } from './DataContracts';
import { GameContext } from './context/GameContextCore';

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

// Note: Game initialization has been moved to src/main.ts
// This allows tests to import Game without triggering DOM initialization
