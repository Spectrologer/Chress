import { TILE_TYPES } from './constants.js';
import { ServiceContainer } from './ServiceContainer.js';
import { AnimationManager } from './DataContracts.js';
import { GameContext } from './GameContext.js';
import { isFloor } from '../utils/TileUtils.js';

// Game state - now extends GameContext for better organization
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

        // Consent check on load
        this.audio.initializeConsent();

        // Load and start
        this.gameInitializer.loadAssets();

        // Track last position
        // Prevents accidental radial close
        this.ui.updateLastPlayerPosition(this.player);
    }

    // All methods are inherited from GameContext
}
    
// Initialize game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    // Debug: Q spawns aguamelin
    window.addEventListener('keydown', (e) => {
        if (e.key === 'q' || e.key === 'Q') {
            if (game && game.player && game.zoneManager && game.zoneManager.game && game.zoneManager.game.grid) {
                const { x, y } = game.player;
                const grid = game.zoneManager.game.grid;
                // Floor only
                if (isFloor(grid[y][x])) {
                    grid[y][x] = { type: TILE_TYPES.FOOD, foodType: 'food/aguamelin.png' };
                    if (game.render) game.render();
                }
            }
        }
    });
});
