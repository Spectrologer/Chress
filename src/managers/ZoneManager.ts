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
import { TILE_TYPES } from '@core/constants/index';
import { ZoneTransitionCoordinator } from './ZoneTransitionCoordinator';
import { ZoneTreasureManager } from './ZoneTreasureManager';
import { ZoneEventEmitter } from './ZoneEventEmitter';
import { ZoneGenerationOrchestrator } from './ZoneGenerationOrchestrator';
import { ZonePersistenceManager } from './ZonePersistenceManager';
import type { Coordinates } from '@core/PositionTypes';
import { Position } from '@core/Position';
import type { IGame } from '@core/GameContext';
import type { Game } from '@core/game';
import type { Player } from '@entities/Player';
import type { PlayerFacade } from '@facades/PlayerFacade';
import type { EnemyCollection } from '@facades/EnemyCollection';
import type { GridManager } from './GridManager';
import type { NPCManager } from './NPCManager';
import type { ZoneRepository } from '@repositories/ZoneRepository';
import type { ZoneGenerator } from '@core/ZoneGenerator';
import type { ConnectionManager } from './ConnectionManager';
import type { TransientGameState } from '@state/TransientGameState';
import type { ServiceContainer } from '@core/ServiceContainer';
import type { NPCRenderer } from '@renderers/NPCRenderer';
import type { ZoneTransitionManager } from './ZoneTransitionManager';

interface EnemyData {
    x: number;
    y: number;
    enemyType: string;
    health: number;
    id: string;
}

type PlayerSpawn = Coordinates;

interface ReturnCoords {
    x: number;
    y: number;
    zoneX?: number;
    zoneY?: number;
}

interface ZoneData {
    grid: Array<Array<number | object>>;
    enemies: EnemyData[];
    playerSpawn: PlayerSpawn | null;
    returnToSurface?: ReturnCoords;
    returnToInterior?: ReturnCoords;
}

export interface Treasure {
    x: number;
    y: number;
    type: string;
}

export class ZoneManager {
    private game: IGame;
    private transitionCoordinator: ZoneTransitionCoordinator;
    private treasureManager: ZoneTreasureManager;
    private eventEmitter: ZoneEventEmitter;
    private generationOrchestrator: ZoneGenerationOrchestrator;
    private persistenceManager: ZonePersistenceManager;

    /**
     * Creates a new ZoneManager instance.
     *
     * @param game - The main game instance
     */
    constructor(game: IGame) {
        this.game = game;
        this.transitionCoordinator = new ZoneTransitionCoordinator(game as Game);
        this.treasureManager = new ZoneTreasureManager(game as Game);
        this.eventEmitter = new ZoneEventEmitter(game as Game);
        this.generationOrchestrator = new ZoneGenerationOrchestrator(game as Game, this.transitionCoordinator);
        this.persistenceManager = new ZonePersistenceManager(game as Game);
    }

    /**
     * Executes a complete zone transition sequence.
     *
     * @param newZoneX - Target zone X coordinate
     * @param newZoneY - Target zone Y coordinate
     * @param exitSide - Exit used ('north', 'south', 'east', 'west', 'port', 'pitfall')
     * @param exitX - X coordinate of exit used
     * @param exitY - Y coordinate of exit used
     */
    transitionToZone(newZoneX: number, newZoneY: number, exitSide: string, exitX: number, exitY: number): void {
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
     */
    generateZone(): void {
        this.generationOrchestrator.generateZone();
    }

    /**
     * Spawns treasure items on the grid at specified positions.
     * Delegates to ZoneTreasureManager.
     *
     * @param treasures - Array of treasure definitions
     */
    spawnTreasuresOnGrid(treasures: Treasure[]): void {
        this.treasureManager.spawnTreasuresOnGrid(treasures);
    }

    /**
     * Saves the current zone's state to the zone repository.
     * Delegates to ZonePersistenceManager.
     */
    saveCurrentZoneState(): void {
        this.persistenceManager.saveCurrentZoneState();
    }

    /**
     * Checks if a tap gesture should trigger a zone transition.
     * Delegates to ZoneTransitionManager if available.
     *
     * @param tapCoords - Coordinates of the tap
     * @param playerPos - Current player position
     * @returns True if transition was triggered
     */
    checkForZoneTransitionGesture(tapCoords: Coordinates, playerPos: Coordinates): boolean {
        // This is typically handled by ZoneTransitionManager, but for compatibility
        // we check if the game has a zoneTransitionManager
        const game = this.game as Game;
        const zoneTransitionManager = game.zoneTransitionManager as ZoneTransitionManager | undefined;
        if (zoneTransitionManager && typeof zoneTransitionManager.checkForZoneTransitionGesture === 'function') {
            const tapPos = new Position(tapCoords.x, tapCoords.y);
            const playerPosition = new Position(playerPos.x, playerPos.y);
            return zoneTransitionManager.checkForZoneTransitionGesture(tapPos, playerPosition);
        }
        return false;
    }

    /**
     * Checks if a tile position is eligible for zone transition.
     * Delegates to ZoneTransitionManager if available.
     *
     * @param gridCoords - Coordinates to check
     * @param playerPos - Current player position
     * @returns True if transition is eligible
     */
    isTransitionEligible(gridCoords: Coordinates, playerPos: Coordinates): boolean {
        const game = this.game as Game;
        const zoneTransitionManager = game.zoneTransitionManager as ZoneTransitionManager | undefined;
        if (zoneTransitionManager && typeof zoneTransitionManager.isTransitionEligible === 'function') {
            const gridPosition = new Position(gridCoords.x, gridCoords.y);
            const playerPosition = new Position(playerPos.x, playerPos.y);
            return zoneTransitionManager.isTransitionEligible(gridPosition, playerPosition);
        }
        return false;
    }

    /**
     * Handles port (portal) transitions between dimensions.
     * Delegates to ZoneTransitionManager if available.
     */
    handlePortTransition(): void {
        const game = this.game as Game;
        const zoneTransitionManager = game.zoneTransitionManager as ZoneTransitionManager | undefined;
        if (zoneTransitionManager && typeof zoneTransitionManager.handlePortTransition === 'function') {
            zoneTransitionManager.handlePortTransition();
        }
    }

    /**
     * Handles tapping on an exit tile to trigger zone transition.
     * Delegates to ZoneTransitionManager if available.
     *
     * @param exitX - X coordinate of exit
     * @param exitY - Y coordinate of exit
     */
    handleExitTap(exitX: number, exitY: number): void {
        const game = this.game as Game;
        const zoneTransitionManager = game.zoneTransitionManager as ZoneTransitionManager | undefined;
        if (zoneTransitionManager && typeof zoneTransitionManager.handleExitTap === 'function') {
            zoneTransitionManager.handleExitTap(exitX, exitY);
        }
    }
}
