import logger from '../core/logger.js';

/**
 * ZoneTransitionController
 *
 * High-level orchestrator for zone transitions.
 * Coordinates ZoneManager and ZoneTransitionManager to provide a clean API
 * for transitioning between zones, handling ports, and managing pitfalls.
 */
export class ZoneTransitionController {
    constructor(game) {
        this.game = game;
    }

    /**
     * Transitions the player to a new zone.
     * @param {number} newZoneX - Target zone X coordinate
     * @param {number} newZoneY - Target zone Y coordinate
     * @param {string} exitSide - How the player is exiting (top/bottom/left/right/port/teleport)
     * @param {number} exitX - Exit tile X coordinate
     * @param {number} exitY - Exit tile Y coordinate
     */
    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        try {
            // Delegate to ZoneManager for the actual transition
            this.game.zoneManager.transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY);
        } catch (error) {
            logger.error('Error during zone transition:', error);
            throw error;
        }
    }

    /**
     * Handles port-based transitions (interiors, underground, stairs).
     */
    handlePortTransition() {
        try {
            this.game.zoneTransitionManager.handlePortTransition();
        } catch (error) {
            logger.error('Error handling port transition:', error);
            throw error;
        }
    }

    /**
     * Handles pitfall trap transitions to underground.
     * @param {number} x - Pitfall X coordinate
     * @param {number} y - Pitfall Y coordinate
     */
    handlePitfallTransition(x, y) {
        try {
            this.game.zoneTransitionManager.handlePitfallTransition(x, y);
        } catch (error) {
            logger.error('Error handling pitfall transition:', error);
            throw error;
        }
    }

    /**
     * Checks if a zone transition gesture was detected.
     * @param {Object} tapCoords - Tap coordinates {x, y}
     * @param {Object} playerPos - Player position {x, y}
     * @returns {boolean} True if transition was triggered
     */
    checkForZoneTransitionGesture(tapCoords, playerPos) {
        try {
            return this.game.zoneTransitionManager.checkForZoneTransitionGesture(tapCoords, playerPos);
        } catch (error) {
            logger.error('Error checking zone transition gesture:', error);
            return false;
        }
    }

    /**
     * Checks if a tap is eligible for transition (exit or port).
     * @param {Object} gridCoords - Grid coordinates {x, y}
     * @param {Object} playerPos - Player position {x, y}
     * @returns {boolean} True if transition was triggered
     */
    isTransitionEligible(gridCoords, playerPos) {
        try {
            return this.game.zoneTransitionManager.isTransitionEligible(gridCoords, playerPos);
        } catch (error) {
            logger.error('Error checking transition eligibility:', error);
            return false;
        }
    }

    /**
     * Generates the current zone.
     */
    generateZone() {
        try {
            this.game.zoneManager.generateZone();
        } catch (error) {
            logger.error('Error generating zone:', error);
            throw error;
        }
    }

    /**
     * Saves the current zone state to the zones map.
     */
    saveCurrentZoneState() {
        try {
            this.game.zoneManager.saveCurrentZoneState();
        } catch (error) {
            logger.error('Error saving zone state:', error);
            throw error;
        }
    }

    /**
     * Spawns treasures on the grid for special zones.
     * @param {Array} treasures - Array of treasure items to spawn
     */
    spawnTreasuresOnGrid(treasures) {
        try {
            this.game.zoneManager.spawnTreasuresOnGrid(treasures);
        } catch (error) {
            logger.error('Error spawning treasures:', error);
            throw error;
        }
    }
}
