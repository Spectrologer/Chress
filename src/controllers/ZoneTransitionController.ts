import { logger } from '@core/logger';
import { errorHandler, ErrorSeverity } from '@core/ErrorHandler';

interface GridCoords {
    x: number;
    y: number;
}

/**
 * ZoneTransitionController
 *
 * High-level orchestrator for zone transitions.
 * Coordinates ZoneManager and ZoneTransitionManager to provide a clean API
 * for transitioning between zones, handling ports, and managing pitfalls.
 */
export class ZoneTransitionController {
    private game: any;

    constructor(game: any) {
        this.game = game;
    }

    /**
     * Transitions the player to a new zone.
     * @param newZoneX - Target zone X coordinate
     * @param newZoneY - Target zone Y coordinate
     * @param exitSide - How the player is exiting (top/bottom/left/right/port/teleport)
     * @param exitX - Exit tile X coordinate
     * @param exitY - Exit tile Y coordinate
     */
    transitionToZone(newZoneX: number, newZoneY: number, exitSide: string, exitX: number, exitY: number): void {
        try {
            // Delegate to ZoneManager for the actual transition
            this.game.zoneManager.transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY);
        } catch (error) {
            errorHandler.handle(error, ErrorSeverity.CRITICAL, {
                component: 'ZoneTransitionController',
                action: 'transition to zone',
                newZoneX,
                newZoneY,
                exitSide
            });
            throw error;
        }
    }

    /**
     * Handles port-based transitions (interiors, underground, stairs).
     */
    handlePortTransition(): void {
        try {
            this.game.zoneTransitionManager.handlePortTransition();
        } catch (error) {
            errorHandler.handle(error, ErrorSeverity.CRITICAL, {
                component: 'ZoneTransitionController',
                action: 'handle port transition'
            });
            throw error;
        }
    }

    /**
     * Handles pitfall trap transitions to underground.
     * @param x - Pitfall X coordinate
     * @param y - Pitfall Y coordinate
     */
    handlePitfallTransition(x: number, y: number): void {
        try {
            this.game.zoneTransitionManager.handlePitfallTransition(x, y);
        } catch (error) {
            errorHandler.handle(error, ErrorSeverity.CRITICAL, {
                component: 'ZoneTransitionController',
                action: 'handle pitfall transition'
            });
            throw error;
        }
    }

    /**
     * Checks if a zone transition gesture was detected.
     * @param tapCoords - Tap coordinates {x, y}
     * @param playerPos - Player position {x, y}
     * @returns True if transition was triggered
     */
    checkForZoneTransitionGesture(tapCoords: GridCoords, playerPos: GridCoords): boolean {
        try {
            return this.game.zoneTransitionManager.checkForZoneTransitionGesture(tapCoords, playerPos);
        } catch (error) {
            errorHandler.handle(error, ErrorSeverity.ERROR, {
                component: 'ZoneTransitionController',
                action: 'check zone transition gesture'
            });
            return false;
        }
    }

    /**
     * Checks if a tap is eligible for transition (exit or port).
     * @param gridCoords - Grid coordinates {x, y}
     * @param playerPos - Player position {x, y}
     * @returns True if transition was triggered
     */
    isTransitionEligible(gridCoords: GridCoords, playerPos: GridCoords): boolean {
        try {
            return this.game.zoneTransitionManager.isTransitionEligible(gridCoords, playerPos);
        } catch (error) {
            errorHandler.handle(error, ErrorSeverity.ERROR, {
                component: 'ZoneTransitionController',
                action: 'check transition eligibility'
            });
            return false;
        }
    }

    /**
     * Generates the current zone.
     */
    generateZone(): void {
        try {
            this.game.zoneManager.generateZone();
        } catch (error) {
            errorHandler.handle(error, ErrorSeverity.CRITICAL, {
                component: 'ZoneTransitionController',
                action: 'generate zone'
            });
            throw error;
        }
    }

    /**
     * Saves the current zone state to the zones map.
     */
    saveCurrentZoneState(): void {
        try {
            this.game.zoneManager.saveCurrentZoneState();
        } catch (error) {
            errorHandler.handle(error, ErrorSeverity.ERROR, {
                component: 'ZoneTransitionController',
                action: 'save zone state'
            });
            throw error;
        }
    }

    /**
     * Spawns treasures on the grid for special zones.
     * @param treasures - Array of treasure items to spawn
     */
    spawnTreasuresOnGrid(treasures: any[]): void {
        try {
            this.game.zoneManager.spawnTreasuresOnGrid(treasures);
        } catch (error) {
            errorHandler.handle(error, ErrorSeverity.ERROR, {
                component: 'ZoneTransitionController',
                action: 'spawn treasures on grid'
            });
            throw error;
        }
    }
}
