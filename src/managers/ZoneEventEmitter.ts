import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { logger } from '@core/logger';
import type { Game } from '@core/game';

/**
 * ZoneEventEmitter handles event emission and state finalization after zone transitions
 */
export class ZoneEventEmitter {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Generate region name based on zone coordinates
     * Matches RegionNotification.generateRegionName logic
     */
    private generateRegionName(zoneX: number, zoneY: number): string {
        const distance = Math.max(Math.abs(zoneX), Math.abs(zoneY));
        if (distance <= 2) return 'Home';
        else if (distance <= 8) return 'Woods';
        else if (distance <= 16) return 'Wilds';
        else return 'Frontier';
    }

    /**
     * Emit events and save state after transition
     */
    public finalizeTransition(newZoneX: number, newZoneY: number): void {
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

        // Show region notification for surface zones only when region changes
        if (dimension === 0) {
            const transientState = this.game.transientGameState;
            const newRegion = this.generateRegionName(newZoneX, newZoneY);
            const currentRegion = transientState.getCurrentRegion();

            // Only show notification if entering a new region
            if (currentRegion !== newRegion) {
                eventBus.emit(EventTypes.UI_REGION_NOTIFICATION_SHOW, {
                    x: newZoneX,
                    y: newZoneY
                });
                transientState.setCurrentRegion(newRegion);
            }
        }

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
