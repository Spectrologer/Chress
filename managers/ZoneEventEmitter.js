import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { logger } from '../core/logger.js';

/**
 * ZoneEventEmitter handles event emission and state finalization after zone transitions
 */
export class ZoneEventEmitter {
    constructor(game) {
        this.game = game;
    }

    /**
     * Emit events and save state after transition
     */
    finalizeTransition(newZoneX, newZoneY) {
        const playerFacade = this.game.playerFacade;
        const dimension = playerFacade.getZoneDimension();

        eventBus.emit(EventTypes.ZONE_CHANGED, {
            x: newZoneX,
            y: newZoneY,
            dimension
        });

        const playerPos = playerFacade.getPosition();
        eventBus.emit(EventTypes.PLAYER_MOVED, {
            x: playerPos.x,
            y: playerPos.y
        });

        this.game.gameStateManager.saveGameState();

        // Clear the one-time transition data
        const transientState = this.game.transientGameState;
        const portData = transientState.getPortTransitionData();
        try {
            logger?.debug?.(`Clearing portTransitionData (was=${JSON.stringify(portData)})`);
        } catch (e) {}
        transientState.clearPortTransitionData();
    }
}
