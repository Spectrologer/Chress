// @ts-check

/**
 * @typedef {Object} Game
 * @property {any} player
 * @property {any} playerFacade
 * @property {any} gridManager
 * @property {any} enemyCollection
 * @property {any} npcManager
 * @property {any} npcRenderer
 * @property {any} zoneRepository
 * @property {any} zoneGenerator
 * @property {any} connectionManager
 * @property {any} transientGameState
 * @property {any} Enemy
 * @property {Array<Array<any>>} grid
 * @property {Object} zones
 * @property {Array<string>} availableFoodAssets
 * @property {string} [lastExitSide]
 * @property {Set<string>} defeatedEnemies
 * @property {any} [_services]
 * @property {any} [_newGameSpawnPosition]
 * @property {Function} generateZone
 */

/**
 * @typedef {Object} ZoneData
 * @property {Array<Array<any>>} grid - Zone grid
 * @property {Array<EnemyData>} enemies - Enemy list
 * @property {PlayerSpawn|null} playerSpawn - Spawn position
 * @property {ReturnCoords} [returnToSurface] - Surface return coords
 * @property {ReturnCoords} [returnToInterior] - Interior return coords
 */

/**
 * @typedef {Object} EnemyData
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {string} enemyType - Enemy type
 * @property {number} health - Health points
 * @property {string} id - Unique identifier
 */

/**
 * @typedef {Object} PlayerSpawn
 * @property {number} x - Spawn X coordinate
 * @property {number} y - Spawn Y coordinate
 */

/**
 * @typedef {Object} ReturnCoords
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} [zoneX] - Zone X coordinate
 * @property {number} [zoneY] - Zone Y coordinate
 */

/**
 * @typedef {Object} Treasure
 * @property {number} x - Grid X coordinate
 * @property {number} y - Grid Y coordinate
 * @property {string} type - Item type to spawn
 */

/**
 * ZoneManager - Orchestrates zone transitions and world navigation.
 *
 * Responsibilities:
 * 1. Zone Transitions: Moving between adjacent zones
 * 2. Zone Generation: Creating new zones or loading existing ones (delegated)
 * 3. Player Positioning: Placing player at correct entrance/exit
 * 4. State Persistence: Saving/loading zone data (delegated)
 * 5. Special Features: Treasure spawning, port transitions
 *
 * Refactored Architecture:
 * - ZoneTransitionCoordinator: Handles player positioning logic
 * - ZoneTreasureManager: Manages special item spawns
 * - ZoneEventEmitter: Emits events and saves state
 * - ZoneGenerationOrchestrator: Zone generation and loading
 * - ZonePersistenceManager: Zone state saving
 */
import { TILE_TYPES } from '../core/constants/index.js';
import { ZoneTransitionCoordinator } from './ZoneTransitionCoordinator.js';
import { ZoneTreasureManager } from './ZoneTreasureManager.js';
import { ZoneEventEmitter } from './ZoneEventEmitter.js';
import { ZoneGenerationOrchestrator } from './ZoneGenerationOrchestrator.js';
import { ZonePersistenceManager } from './ZonePersistenceManager.js';

export class ZoneManager {
    /**
     * Creates a new ZoneManager instance.
     *
     * @param {Game} game - The main game instance
     */
    constructor(game) {
        /** @type {Game} */
        this.game = game;

        /** @type {ZoneTransitionCoordinator} */
        this.transitionCoordinator = new ZoneTransitionCoordinator(game);

        /** @type {ZoneTreasureManager} */
        this.treasureManager = new ZoneTreasureManager(game);

        /** @type {ZoneEventEmitter} */
        this.eventEmitter = new ZoneEventEmitter(game);

        /** @type {ZoneGenerationOrchestrator} */
        this.generationOrchestrator = new ZoneGenerationOrchestrator(game, this.transitionCoordinator);

        /** @type {ZonePersistenceManager} */
        this.persistenceManager = new ZonePersistenceManager(game);
    }


    /**
     * Executes a complete zone transition sequence.
     *
     * @param {number} newZoneX - Target zone X coordinate
     * @param {number} newZoneY - Target zone Y coordinate
     * @param {string} exitSide - Exit used ('north', 'south', 'east', 'west', 'port', 'pitfall')
     * @param {number} exitX - X coordinate of exit used
     * @param {number} exitY - Y coordinate of exit used
     * @returns {void}
     */
    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        const playerFacade = this.game.playerFacade;
        const gridManager = this.game.gridManager;

        // Step 1: Initialize transition state
        this.transitionCoordinator.initializeTransitionState(exitSide);

        const zoneKey = `${newZoneX},${newZoneY}`;

        // Step 2: Update player's current zone coordinates
        playerFacade.setCurrentZone(newZoneX, newZoneY);

        // Step 3: Apply survival penalties for normal transitions
        if (exitSide !== 'port') {
            playerFacade.onZoneTransition();
        }

        // Step 4: Generate or load the target zone
        this.game.generateZone();

        // Step 5: Position player at appropriate entrance
        this.transitionCoordinator.positionPlayerAfterTransition(exitSide, exitX, exitY);

        // Step 6: Clear blocking tiles at spawn position
        const playerPos = playerFacade.getPosition();
        if (gridManager.isTileType(playerPos.x, playerPos.y, TILE_TYPES.SHRUBBERY)) {
            gridManager.setTile(playerPos.x, playerPos.y, TILE_TYPES.EXIT);
        }

        // Step 7: Validate player position
        this.game.player.ensureValidPosition(this.game.grid);

        // Sync lastX/lastY to prevent visual interpolation glitches
        playerFacade.setLastPosition(playerPos.x, playerPos.y);

        // Step 8: Check for special treasures
        this.treasureManager.handleSpecialZoneTreasures(zoneKey);

        // Step 9: Emit events and persist state
        this.eventEmitter.finalizeTransition(newZoneX, newZoneY);
    }


    /**
     * Generates or loads a zone at the player's current location.
     * Delegates to ZoneGenerationOrchestrator.
     *
     * @returns {void}
     */
    generateZone() {
        this.generationOrchestrator.generateZone();
    }

    /**
     * Spawns treasure items on the grid at specified positions.
     * Delegates to ZoneTreasureManager.
     *
     * @param {Array<Treasure>} treasures - Array of treasure definitions
     * @returns {void}
     */
    spawnTreasuresOnGrid(treasures) {
        this.treasureManager.spawnTreasuresOnGrid(treasures);
    }

    /**
     * Saves the current zone's state to the zone repository.
     * Delegates to ZonePersistenceManager.
     *
     * @returns {void}
     */
    saveCurrentZoneState() {
        this.persistenceManager.saveCurrentZoneState();
    }
}
